import { NextResponse } from "next/server";
import { readJsonResponse } from "@/lib/api/read-json-response";

const API_URL = process.env.AZLA_API_URL ?? "http://localhost:4000/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxy(request, "GET", `/leases/assets/${id}`);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxy(request, "PATCH", `/leases/assets/${id}`);
}

async function proxy(request: Request, method: "GET" | "PATCH", path: string) {
  try {
    const authorization = request.headers.get("authorization");
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(authorization ? { authorization } : {}),
        ...(method === "PATCH" ? { "Content-Type": "application/json" } : {}),
      },
      body: method === "PATCH" ? JSON.stringify(await request.json()) : undefined,
      cache: "no-store",
    });

    return NextResponse.json(await readJsonResponse(response), { status: response.status });
  } catch {
    return NextResponse.json({ message: "AZLA API is not available." }, { status: 503 });
  }
}
