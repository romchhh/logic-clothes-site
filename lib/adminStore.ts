/**
 * Store facade — Postgres via lib/sql.ts (same exports as the old JSON store).
 */
export type { StoredOrder } from "@/lib/sql";
export {
  formatPriceLabel,
  slugifyId,
  sqlAppendOrder as appendOrder,
  sqlDeleteOrder as deleteOrder,
  sqlDeleteProduct as deleteProduct,
  sqlDuplicateProduct as duplicateProduct,
  sqlGetAllOrders as readOrders,
  sqlGetAllProducts as readProducts,
  sqlGetOrder as getOrderById,
  sqlGetProduct as getProductById,
  sqlReorderProducts as reorderProducts,
  sqlSyncColorVariants as syncColorVariants,
  sqlUpdateOrder as updateOrder,
  sqlUpsertProduct as upsertProduct,
} from "@/lib/sql";
