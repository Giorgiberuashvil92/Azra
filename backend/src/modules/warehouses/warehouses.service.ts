import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { parseSessionToken } from "../../common/session";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(authorization?: string) {
    const session = parseSessionToken(authorization);

    const warehouses = await this.prisma.warehouse.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "desc" },
    });

    return warehouses.map((warehouse) => {
      return serializeWarehouse(warehouse);
    });
  }

  async findOne(authorization: string | undefined, id: string) {
    const session = parseSessionToken(authorization);
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, companyId: session.companyId },
    });

    if (!warehouse) {
      throw new NotFoundException("Warehouse does not exist.");
    }

    return serializeWarehouse(warehouse);
  }

  create(authorization: string | undefined, input: {
    name: string;
    code?: string;
    address?: string;
  }) {
    const session = parseSessionToken(authorization);

    if (!input.name?.trim()) {
      throw new BadRequestException("Warehouse name is required.");
    }

    return this.prisma.warehouse.create({
      data: {
        companyId: session.companyId,
        name: input.name.trim(),
        code: input.code?.trim() || null,
        address: input.address?.trim() || null,
      },
    });
  }

  async update(authorization: string | undefined, id: string, input: {
    name?: string;
    code?: string;
    address?: string;
    status?: string;
  }) {
    const session = parseSessionToken(authorization);
    const current = await this.prisma.warehouse.findFirst({
      where: { id, companyId: session.companyId },
      select: { id: true },
    });

    if (!current) {
      throw new NotFoundException("Warehouse does not exist.");
    }

    if (!input.name?.trim()) {
      throw new BadRequestException("Warehouse name is required.");
    }

    if (input.status && !["active", "inactive"].includes(input.status)) {
      throw new BadRequestException("Warehouse status is invalid.");
    }

    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: {
        name: input.name.trim(),
        code: input.code?.trim() || null,
        address: input.address?.trim() || null,
        status: input.status ?? "active",
      },
    });

    return serializeWarehouse(warehouse);
  }
}

function serializeWarehouse(warehouse: {
  address: string | null;
  code: string | null;
  externalData: unknown;
  status: string;
}) {
  const externalData = asRecord(warehouse.externalData);
  return {
    ...warehouse,
    code: warehouse.code ?? readExternalString(externalData, "Code", "code", "ExtCode"),
    address: warehouse.address ?? readExternalString(externalData, "Address", "address", "Adress", "adress"),
    status: readExternalBoolean(externalData, "IsDeleted", "isDeleted") ? "inactive" : warehouse.status,
  };
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function readExternalString(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && value !== "") return String(value).trim();
  }
  return null;
}

function readExternalBoolean(row: Record<string, unknown>, ...keys: string[]) {
  const value = readExternalString(row, ...keys)?.toLowerCase();
  if (!value) return false;
  return ["true", "1", "yes", "კი"].includes(value);
}
