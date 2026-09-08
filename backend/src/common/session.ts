import { UnauthorizedException } from "@nestjs/common";

export type SessionContext = {
  companyId: string;
  userId: string;
};

export function parseSessionToken(authorization?: string): SessionContext {
  const token = authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new UnauthorizedException("Missing or invalid token.");
  }

  try {
    const parsed = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (typeof parsed.userId === "string" && typeof parsed.companyId === "string") {
      return parsed;
    }
  } catch {
    throw new UnauthorizedException("Missing or invalid token.");
  }

  throw new UnauthorizedException("Missing or invalid token.");
}
