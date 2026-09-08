import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Response } from "express";

type ErrorBody = {
  code: string;
  details?: unknown;
  message: string;
  statusCode: number;
  traceId: string;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const traceId = randomUUID();
    const error = this.toErrorBody(exception, traceId);

    if (error.statusCode >= 500) {
      this.logger.error(error.message, exception instanceof Error ? exception.stack : undefined);
    }

    response.status(error.statusCode).json(error);
  }

  private toErrorBody(exception: unknown, traceId: string): ErrorBody {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === "object" && response && "message" in response
          ? response.message
          : exception.message;

      return {
        code: this.httpCode(statusCode),
        details: typeof response === "object" ? response : undefined,
        message: Array.isArray(message) ? message.join(", ") : String(message),
        statusCode,
        traceId,
      };
    }

    const prismaCode = this.getStringProperty(exception, "code");

    if (prismaCode === "P2002") {
      return {
        code: "UNIQUE_CONSTRAINT_FAILED",
        details: this.getProperty(exception, "meta"),
        message: "ასეთი უნიკალური მნიშვნელობა უკვე არსებობს.",
        statusCode: HttpStatus.CONFLICT,
        traceId,
      };
    }

    if (prismaCode === "P2003") {
      return {
        code: "INVALID_REFERENCE",
        details: this.getProperty(exception, "meta"),
        message: "მითითებული დაკავშირებული ჩანაწერი ვერ მოიძებნა.",
        statusCode: HttpStatus.BAD_REQUEST,
        traceId,
      };
    }

    if (prismaCode === "P2025") {
      return {
        code: "RECORD_NOT_FOUND",
        details: this.getProperty(exception, "meta"),
        message: "ჩანაწერი ვერ მოიძებნა.",
        statusCode: HttpStatus.NOT_FOUND,
        traceId,
      };
    }

    if (["P1000", "P1001", "P1002", "P1010"].includes(prismaCode ?? "")) {
      return {
        code: "DATABASE_UNAVAILABLE",
        details: { prismaCode },
        message: "ბაზასთან დაკავშირება ვერ მოხერხდა.",
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        traceId,
      };
    }

    return {
      code: "INTERNAL_ERROR",
      message: exception instanceof Error ? exception.message : "Internal server error",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      traceId,
    };
  }

  private httpCode(statusCode: number) {
    if (statusCode === 400) return "BAD_REQUEST";
    if (statusCode === 401) return "UNAUTHORIZED";
    if (statusCode === 403) return "FORBIDDEN";
    if (statusCode === 404) return "NOT_FOUND";
    if (statusCode === 409) return "CONFLICT";
    if (statusCode === 503) return "SERVICE_UNAVAILABLE";
    return "HTTP_ERROR";
  }

  private getProperty(error: unknown, key: string) {
    return error && typeof error === "object" && key in error
      ? error[key as keyof typeof error]
      : undefined;
  }

  private getStringProperty(error: unknown, key: string) {
    const value = this.getProperty(error, key);
    return typeof value === "string" ? value : undefined;
  }
}
