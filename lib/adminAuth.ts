import { NextRequest } from "next/server";

export function isAdminAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get("admin_auth");
  if (!authCookie) return false;

  try {
    const decoded = Buffer.from(authCookie.value, "base64").toString();
    const [user, password] = decoded.split(":");
    return (
      user === process.env.ADMIN_USER && password === process.env.ADMIN_PASS
    );
  } catch {
    return false;
  }
}

export function requireAdmin(request: NextRequest): Response | null {
  if (!isAdminAuthenticated(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
