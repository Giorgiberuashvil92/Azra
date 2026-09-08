import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { parseSessionToken } from "../../common/session";
import { PrismaService } from "../../prisma/prisma.service";

const discountTypes = [
  "percent",
  "amount",
  "fixed_price",
] as const;

const discountScopes = ["all_products", "products", "categories", "cart", "customer"] as const;
const discountStatuses = ["draft", "active", "paused", "expired"] as const;

type DiscountType = (typeof discountTypes)[number];
type DiscountScope = (typeof discountScopes)[number];
type DiscountStatus = (typeof discountStatuses)[number];

export type DiscountInput = {
  name: string;
  type: DiscountType;
  scope?: DiscountScope;
  value?: number | null;
  currency?: string;
  priority?: number;
  stackable?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  minQuantity?: number | null;
  minAmount?: number | null;
  buyQuantity?: number | null;
  getQuantity?: number | null;
  channel?: string;
  status?: DiscountStatus;
  notes?: string | null;
  conditions?: DiscountConditionInput[];
  ruleConfig?: unknown;
  productIds?: string[];
  categoryIds?: string[];
  customerIds?: string[];
};

type DiscountConditionInput = {
  field?: string;
  operator?: string;
  value?: string | number | null;
};

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(authorization?: string) {
    const session = parseSessionToken(authorization);
    return this.prisma.discount.findMany({
      where: { companyId: session.companyId },
      orderBy: [{ status: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
      include: {
        products: { include: { product: { select: { id: true, name: true, sku: true } } } },
        categories: { include: { category: { select: { id: true, name: true, path: true } } } },
        customers: { include: { customer: { select: { id: true, name: true, code: true, taxId: true, personalId: true } } } },
      },
    });
  }

  async findCustomers(authorization?: string) {
    const session = parseSessionToken(authorization);
    return this.prisma.customer.findMany({
      where: { companyId: session.companyId },
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, code: true, taxId: true, personalId: true, source: true },
    });
  }

  async create(authorization: string | undefined, input: DiscountInput) {
    const session = parseSessionToken(authorization);
    const payload = await this.normalizeInput(session.companyId, input);
    if (!payload.data.name || !payload.data.type) {
      throw new BadRequestException("Discount name and type are required.");
    }

    return this.prisma.discount.create({
      data: {
        ...payload.data,
        name: payload.data.name,
        type: payload.data.type,
        companyId: session.companyId,
        products: { create: payload.productIds.map((productId) => ({ productId })) },
        categories: { create: payload.categoryIds.map((categoryId) => ({ categoryId })) },
        customers: { create: payload.customerIds.map((customerId) => ({ customerId })) },
      },
      include: discountInclude,
    });
  }

  async update(authorization: string | undefined, id: string, input: Partial<DiscountInput>) {
    const session = parseSessionToken(authorization);
    const current = await this.prisma.discount.findFirst({
      where: { id, companyId: session.companyId },
      select: { id: true },
    });
    if (!current) throw new NotFoundException("Discount does not exist.");

    const payload = await this.normalizeInput(session.companyId, input, true);

    return this.prisma.$transaction(async (tx) => {
      await tx.discountProduct.deleteMany({ where: { discountId: id } });
      await tx.discountCategory.deleteMany({ where: { discountId: id } });
      await tx.discountCustomer.deleteMany({ where: { discountId: id } });

      return tx.discount.update({
        where: { id },
        data: {
          ...payload.data,
          products: { create: payload.productIds.map((productId) => ({ productId })) },
          categories: { create: payload.categoryIds.map((categoryId) => ({ categoryId })) },
          customers: { create: payload.customerIds.map((customerId) => ({ customerId })) },
        },
        include: discountInclude,
      });
    });
  }

  async delete(authorization: string | undefined, id: string) {
    const session = parseSessionToken(authorization);
    const current = await this.prisma.discount.findFirst({
      where: { id, companyId: session.companyId },
      select: { id: true },
    });
    if (!current) throw new NotFoundException("Discount does not exist.");

    await this.prisma.discount.delete({ where: { id } });
    return { ok: true };
  }

  private async normalizeInput(companyId: string, input: Partial<DiscountInput>, partial = false) {
    const name = input.name?.trim();
    if (!partial && !name) throw new BadRequestException("Discount name is required.");

    const type = input.type;
    if (!partial && !type) throw new BadRequestException("Discount type is required.");
    if (type && !discountTypes.includes(type)) throw new BadRequestException("Discount type is invalid.");

    const scope = input.scope ?? "products";
    if (scope && !discountScopes.includes(scope)) throw new BadRequestException("Discount scope is invalid.");

    const status = input.status ?? "draft";
    if (status && !discountStatuses.includes(status)) throw new BadRequestException("Discount status is invalid.");

    const productIds = uniqueStrings(input.productIds);
    const categoryIds = uniqueStrings(input.categoryIds);
    const customerIds = uniqueStrings(input.customerIds);
    await this.assertReferences(companyId, productIds, categoryIds, customerIds);
    this.assertTargetForScope(scope, productIds, categoryIds, customerIds);

    const startsAt = parseDate(input.startsAt);
    const endsAt = parseDate(input.endsAt);
    if (startsAt && endsAt && startsAt > endsAt) {
      throw new BadRequestException("Discount end date must be after start date.");
    }

    return {
      productIds,
      categoryIds,
      customerIds,
      data: {
        ...(name ? { name } : {}),
        ...(type ? { type } : {}),
        ...(scope ? { scope } : {}),
        value: nullableNumber(input.value),
        currency: input.currency?.trim() || "GEL",
        priority: integerOrDefault(input.priority, 100),
        stackable: Boolean(input.stackable),
        startsAt,
        endsAt,
        minQuantity: nullableNumber(input.minQuantity),
        minAmount: nullableNumber(input.minAmount),
        buyQuantity: nullableInteger(input.buyQuantity),
        getQuantity: nullableInteger(input.getQuantity),
        channel: input.channel?.trim() || "all",
        ...(status ? { status } : {}),
        notes: input.notes?.trim() || null,
        ruleConfig: normalizeRuleConfig(input.ruleConfig, input.conditions),
      },
    };
  }

  private assertTargetForScope(scope: DiscountScope, productIds: string[], categoryIds: string[], customerIds: string[]) {
    if (scope === "products" && productIds.length === 0) {
      throw new BadRequestException("Select at least one product for product discount.");
    }

    if (scope === "categories" && categoryIds.length === 0) {
      throw new BadRequestException("Select at least one category for category discount.");
    }

    if (scope === "customer" && customerIds.length === 0) {
      throw new BadRequestException("Select at least one customer for customer discount.");
    }
  }

  private async assertReferences(companyId: string, productIds: string[], categoryIds: string[], customerIds: string[]) {
    const [productsCount, categoriesCount, customersCount] = await Promise.all([
      productIds.length
        ? this.prisma.product.count({ where: { companyId, id: { in: productIds } } })
        : Promise.resolve(0),
      categoryIds.length
        ? this.prisma.productCategory.count({ where: { companyId, id: { in: categoryIds } } })
        : Promise.resolve(0),
      customerIds.length
        ? this.prisma.customer.count({ where: { companyId, id: { in: customerIds } } })
        : Promise.resolve(0),
    ]);

    if (productsCount !== productIds.length || categoriesCount !== categoryIds.length || customersCount !== customerIds.length) {
      throw new BadRequestException("Discount target does not exist.");
    }
  }
}

const discountInclude = {
  products: { include: { product: { select: { id: true, name: true, sku: true } } } },
  categories: { include: { category: { select: { id: true, name: true, path: true } } } },
  customers: { include: { customer: { select: { id: true, name: true, code: true, taxId: true, personalId: true } } } },
};

function uniqueStrings(values?: string[]) {
  return Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean)));
}

function nullableNumber(value: number | null | undefined) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new BadRequestException("Discount numeric value is invalid.");
  return number;
}

function nullableInteger(value: number | null | undefined) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) throw new BadRequestException("Discount integer value is invalid.");
  return number;
}

function integerOrDefault(value: number | undefined, fallback: number) {
  if (value === undefined || value === null) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) throw new BadRequestException("Discount priority is invalid.");
  return number;
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new BadRequestException("Discount date is invalid.");
  return date;
}

function normalizeRuleConfig(ruleConfig: unknown, conditions?: DiscountConditionInput[]) {
  const cleanConditions = (conditions ?? [])
    .map((condition) => ({
      field: String(condition.field ?? "").trim(),
      operator: String(condition.operator ?? "").trim(),
      value: typeof condition.value === "number" ? condition.value : String(condition.value ?? "").trim(),
    }))
    .filter((condition) => condition.field && condition.operator && String(condition.value).trim());

  if (cleanConditions.length > 0) {
    return { conditions: cleanConditions };
  }

  return ruleConfig ?? undefined;
}
