import { NextResponse } from "next/server";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "MediBridge AI",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    environment: process.env.NODE_ENV || "development",
    firebaseConfigured: isFirebaseConfigured(),
  });
}
