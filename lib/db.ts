import { Pool, type PoolClient } from "pg";

declare global {
  var __lcPgPool: Pool | undefined;
  var __lcSchemaReady: Promise<void> | undefined;
}

/** Missing tables / first boot before `npm run migrate`. */
export function isDbUnavailableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err ? String((err as { code?: string }).code) : "";
  // 42P01 undefined_table, 42703 undefined_column, 3D000, connection errors
  return (
    code === "42P01" ||
    code === "42703" ||
    code === "3D000" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "57P03" // cannot_connect_now
  );
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (see .env.example)."
    );
  }

  return new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    maxUses: 7500,
  });
}

export function getPool(): Pool {
  if (!global.__lcPgPool) {
    global.__lcPgPool = createPool();
  }
  return global.__lcPgPool;
}

/**
 * Idempotent column patches so a deploy that ships code before `npm run migrate`
 * still works (undefined_column was emptying the catalog / breaking admin stats).
 */
async function ensureSchemaPatches(pool: Pool): Promise<void> {
  await pool.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true
  `);
  await pool.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS price_usd NUMERIC(12, 2)
  `);
  await pool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'pay_after',
      ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS amount_to_pay numeric(12,2) NOT NULL DEFAULT 0
  `);
  await pool.query(`
    ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS color text,
      ADD COLUMN IF NOT EXISTS length_opt text,
      ADD COLUMN IF NOT EXISTS material_opt text,
      ADD COLUMN IF NOT EXISTS size_label text
  `);
  await pool.query(`
    ALTER TABLE product_images
      ADD COLUMN IF NOT EXISTS adjust_json JSONB
  `);
}

export async function ensureDbReady(): Promise<Pool> {
  const pool = getPool();
  if (!global.__lcSchemaReady) {
    global.__lcSchemaReady = ensureSchemaPatches(pool).catch((err) => {
      // Allow retry on next request if DB was briefly unavailable.
      global.__lcSchemaReady = undefined;
      throw err;
    });
  }
  await global.__lcSchemaReady;
  return pool;
}

/** Neon-style tagged template helper on top of node-postgres. */
export const sql = Object.assign(
  async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0];
    for (let i = 0; i < values.length; i++) {
      text += `$${i + 1}` + strings[i + 1];
    }
    const pool = await ensureDbReady();
    const result = await pool.query(text, values);
    return result.rows;
  },
  {
    query: async (strings: TemplateStringsArray, ...values: unknown[]) => {
      let text = strings[0];
      for (let i = 0; i < values.length; i++) {
        text += `$${i + 1}` + strings[i + 1];
      }
      const pool = await ensureDbReady();
      const result = await pool.query(text, values);
      return result.rows;
    },
  }
);

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = await ensureDbReady();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = await ensureDbReady();
  const result = await pool.query(text, params);
  return result.rows as T[];
}
