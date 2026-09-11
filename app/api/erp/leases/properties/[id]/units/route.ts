import { NextResponse } from "next/server";
import { readJsonResponse } from "@/lib/api/read-json-response";

const API_URL = process.env.AZLA_API_URL ?? "http://localhost:4000/api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authorization = request.headers.get("authorization");
    const { id } = await params;
    const response = await fetch(`${API_URL}/leases/properties/${id}/units`, {
      method: "POST",
      headers: { ...(authorization ? { authorization } : {}), "Content-Type": "application/json" },
      body: JSON.stringify(await request.json()),
      cache: "no-store",
    });

    return NextResponse.json(await readJsonResponse(response), { status: response.status });
  } catch {
    return NextResponse.json({ message: "AZLA API is not available." }, { status: 503 });
  }
}
