import { NextResponse } from "next/server";
import { readJsonResponse } from "@/lib/api/read-json-response";

const API_URL = process.env.AZLA_API_URL ?? "http://localhost:4000/api";

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/companies`, {
      cache: "no-store",
    });
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
