// middleware.ts

import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("========== MIDDLEWARE ==========");

  console.log("Path:", request.nextUrl.pathname);

  console.log("Cookies:");

  request.cookies.getAll().forEach((cookie) => {
    console.log(`${cookie.name} = ${cookie.value.substring(0, 30)}...`);
  });

  console.log("================================");

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
