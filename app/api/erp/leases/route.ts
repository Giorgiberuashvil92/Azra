import { NextResponse } from "next/server";
import { readJsonResponse } from "@/lib/api/read-json-response";

const API_URL = process.env.AZLA_API_URL ?? "http://localhost:4000/api";

export async function GET(request: Request) {
  return proxy(request, "GET", "/leases");
}

async function proxy(request: Request, method: "GET", path: string) {
  try {
    const authorization = request.headers.get("authorization");
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: authorization ? { authorization } : {},
      cache: "no-store",
    });

    return NextResponse.json(await readJsonResponse(response), { status: response.status });
  } catch {
    return NextResponse.json({ message: "AZLA API is not available." }, { status: 503 });
  }
}
