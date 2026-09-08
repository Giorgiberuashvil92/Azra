import { NextResponse } from "next/server";
import { readJsonResponse } from "@/lib/api/read-json-response";

const API_URL = process.env.AZLA_API_URL ?? "http://localhost:4000/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authorization = request.headers.get("authorization");
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        ...(authorization ? { authorization } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await readJsonResponse(response);

    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "AZLA API is not available." },
      { status: 503 },
    );
  }
}
