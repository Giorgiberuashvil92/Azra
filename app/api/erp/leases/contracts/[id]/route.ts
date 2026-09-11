import { NextResponse } from "next/server";
import { readJsonResponse } from "@/lib/api/read-json-response";

const API_URL = process.env.AZLA_API_URL ?? "http://localhost:4000/api";

export async function GET(request: Request, { params }: RouteContext<"/api/erp/leases/contracts/[id]">) {
  try {
    const { id } = await params;
    const authorization = request.headers.get("authorization");
    const response = await fetch(`${API_URL}/leases/contracts/${id}`, {
      headers: authorization ? { authorization } : {},
      cache: "no-store",
    });

    return NextResponse.json(await readJsonResponse(response), { status: response.status });
  } catch {
    return NextResponse.json({ message: "AZLA API is not available." }, { status: 503 });
  }
}
