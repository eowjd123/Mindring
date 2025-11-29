// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    return NextResponse.json({ 
      authenticated: true,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
      }
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

