import { NextResponse } from "next/server";

const API_URL = process.env.AZLA_API_URL ?? "http://localhost:4000/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  try {
    const response = await fetch(`${API_URL}/access-requests/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await response.json();

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "AZLA API is not available." },
      { status: 503 },
    );
  }
}
