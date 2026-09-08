import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.AZLA_API_URL ?? "http://localhost:4000/api";

export async function GET(request: NextRequest) {
  const response = await fetch(`${API_URL}/retail/sales`, {
    headers: {
      Authorization: request.headers.get("authorization") ?? "",
    },
    cache: "no-store",
  });

  return NextResponse.json(await response.json(), { status: response.status });
}

export async function POST(request: NextRequest) {
  const response = await fetch(`${API_URL}/retail/sales`, {
    method: "POST",
    headers: {
      Authorization: request.headers.get("authorization") ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(await request.json()),
  });

  return NextResponse.json(await response.json(), { status: response.status });
}
