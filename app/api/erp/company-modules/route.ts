import {
  disableCompanyModule,
  enableCompanyModule,
  getCompanyModuleState,
} from "@/lib/erp/company-module-store";
import { moduleRegistry, type ModuleKey } from "@/lib/erp/module-registry";
import { NextResponse } from "next/server";
import { readJsonResponse } from "@/lib/api/read-json-response";

const moduleKeys = new Set(moduleRegistry.map((module) => module.key));
const apiBaseUrl = process.env.AZLA_API_URL ?? "http://localhost:4000/api";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");

  try {
    const response = await fetch(`${apiBaseUrl}/company-modules`, {
      headers: authorization ? { authorization } : undefined,
      cache: "no-store",
    });

    if (response.ok) {
      return NextResponse.json(await readJsonResponse(response));
    }
  } catch {
    // Keep local fallback available while the NestJS API is not running.
  }

  return NextResponse.json({ company: getCompanyModuleState() });
}

export async function PATCH(request: Request) {
  const authorization = request.headers.get("authorization");
  const body = (await request.json()) as {
    moduleKey?: ModuleKey;
    enabled?: boolean;
  };

  if (!body.moduleKey || !moduleKeys.has(body.moduleKey)) {
    return NextResponse.json(
      { error: "INVALID_MODULE_KEY" },
      { status: 400 },
    );
  }

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { error: "INVALID_ENABLED_VALUE" },
      { status: 400 },
    );
  }

  if (body.enabled) {
    try {
      const response = await fetch(`${apiBaseUrl}/company-modules`, {
        method: "PATCH",
        headers: {
          ...(authorization ? { authorization } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return NextResponse.json(await readJsonResponse(response));
      }
    } catch {
      // Keep local fallback available while the NestJS API is not running.
    }

    return NextResponse.json({
      company: enableCompanyModule(body.moduleKey),
    });
  }

  try {
    const response = await fetch(`${apiBaseUrl}/company-modules`, {
      method: "PATCH",
      headers: {
        ...(authorization ? { authorization } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return NextResponse.json(await readJsonResponse(response));
    }

    if (response.status === 409) {
      return NextResponse.json(await readJsonResponse(response), { status: 409 });
    }
  } catch {
    // Keep local fallback available while the NestJS API is not running.
  }

  const result = disableCompanyModule(body.moduleKey);

  if (result.error) {
    return NextResponse.json(result, { status: 409 });
  }

  return NextResponse.json(result);
}
