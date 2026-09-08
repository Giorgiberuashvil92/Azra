import { NextResponse } from "next/server";
import { readJsonResponse } from "@/lib/api/read-json-response";

const API_URL = process.env.AZLA_API_URL ?? "http://localhost:4000/api";

export async function POST(request: Request) {
  return proxyBalance(request, "/integrations/balance/test");
}

async function proxyBalance(request: Request, path: string) {
  try {
    const authorization = request.headers.get("authorization");
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify(await request.json()),
      cache: "no-store",
    });

    return NextResponse.json(await readJsonResponse(response), { status: response.status });
  } catch {
    return NextResponse.json({ message: "AZLA API is not available." }, { status: 503 });
  }
}
