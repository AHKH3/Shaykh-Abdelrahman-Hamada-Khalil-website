import { NextResponse } from "next/server";

/**
 * Health check endpoint used by the Electron app
 * to detect when the Next.js server is ready.
 */
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
