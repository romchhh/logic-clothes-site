import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const validUser = process.env.ADMIN_USER;
    const validPass = process.env.ADMIN_PASS;

    if (username === validUser && password === validPass) {
      // Create a simple token (in production, use JWT or similar)
      const token = Buffer.from(`${username}:${password}`).toString("base64");

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set("admin_auth", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { message: "Невірний логін або пароль" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { message: "Помилка сервера" },
      { status: 500 }
    );
  }
}

