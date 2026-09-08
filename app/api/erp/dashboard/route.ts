import { NextResponse } from "next/server";
import { readJsonResponse } from "@/lib/api/read-json-response";

const API_URL = process.env.AZLA_API_URL ?? "http://localhost:4000/api";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  try {
    const response = await fetch(`${API_URL}/dashboard`, {
      headers: authorization ? { authorization } : undefined,
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
