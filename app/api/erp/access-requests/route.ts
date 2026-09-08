import { NextResponse } from "next/server";
import { readJsonResponse } from "@/lib/api/read-json-response";

const API_URL = process.env.AZLA_API_URL ?? "http://localhost:4000/api";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const response = await fetch(`${API_URL}/access-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await readJsonResponse(response);

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "AZLA API is not available." },
      { status: 503 },
    );
  }
}
