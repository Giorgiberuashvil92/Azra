import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { parseSessionToken } from "../../common/session";
import { PrismaService } from "../../prisma/prisma.service";

type CreateProductInput = {
  name: string;
  sku?: string;
  barcode?: string;
  category?: string;
  categoryId?: string;
  brand?: string;
  description?: string;
  unit?: string;
  type?: "stocked" | "service" | "expense";
  isPurchasable?: boolean;
  isSellable?: boolean;
  tracksInventory?: boolean;
  tracksLots?: boolean;
  tracksExpiry?: boolean;
  costPrice?: number;
  salePrice?: number;
  currency?: string;
  vatRate?: number;
  discountPercent?: number | null;
  discountAmount?: number | null;
  discountName?: string;
  minStock?: number;
  reorderPoint?: number;
  supplierSku?: string;
  rsName?: string;
  defaultWarehouseId?: string;
};

type UpdateProductInput = Partial<CreateProductInput> & {
  status?: string;
};

type CreateCategoryInput = {
  name: string;
  parentId?: string | null;
};

type UpdateCategoryInput = {
  name: string;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(authorization?: string) {
    const session = parseSessionToken(authorization);
    await this.syncLegacyCategories(session.companyId);

    const products = await this.prisma.product.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "desc" },
      include: {
        categoryRef: true,
        movements: {
          select: {
            quantity: true,
            warehouseId: true,
            warehouse: { select: { name: true, externalUid: true } },
          },
        },
      },
    });

    return products.map((product) => this.serializeProduct(product));
  }

  async findOne(authorization: string | undefined, id: string) {
    const session = parseSessionToken(authorization);
    const product = await this.prisma.product.findFirst({
      where: { id, companyId: session.companyId },
      include: {
        categoryRef: true,
        movements: {
          select: {
            quantity: true,
            warehouseId: true,
            warehouse: { select: { name: true, externalUid: true } },
          },
        },
      },
    });

    if (!product) throw new NotFoundException("Product does not exist.");
    return this.serializeProduct(product);
  }

  async findCategories(authorization?: string) {
    const session = parseSessionToken(authorization);
    await this.syncLegacyCategories(session.companyId);

    return this.prisma.productCategory.findMany({
      where: { companyId: session.companyId },
      orderBy: [{ level: "asc" }, { path: "asc" }],
    });
  }

  async createCategory(authorization: string | undefined, input: CreateCategoryInput) {
    const session = parseSessionToken(authorization);
    const name = input.name?.trim();
    if (!name) throw new BadRequestException("Category name is required.");

    let parent: { id: string; path: string; level: number } | null = null;
    if (input.parentId) {
      parent = await this.prisma.productCategory.findFirst({
        where: {
          id: input.parentId,
          companyId: session.companyId,
        },
        select: {
          id: true,
          path: true,
          level: true,
        },
      });

      if (!parent) throw new NotFoundException("Parent category does not exist.");
    }

    const path = parent ? `${parent.path} / ${name}` : name;
    return this.prisma.productCategory.upsert({
      where: {
        companyId_path: {
          companyId: session.companyId,
          path,
        },
      },
      create: {
        companyId: session.companyId,
        parentId: parent?.id ?? null,
        name,
        path,
        level: (parent?.level ?? 0) + 1,
      },
      update: {
        parentId: parent?.id ?? null,
        name,
        level: (parent?.level ?? 0) + 1,
        status: "active",
      },
    });
  }

  async updateCategory(authorization: string | undefined, id: string, input: UpdateCategoryInput) {
    const session = parseSessionToken(authorization);
    const name = input.name?.trim();
    if (!name) throw new BadRequestException("Category name is required.");

    const current = await this.prisma.productCategory.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!current) throw new NotFoundException("Product category does not exist.");

    const parent = current.parentId
      ? await this.prisma.productCategory.findFirst({
          where: { id: current.parentId, companyId: session.companyId },
          select: { path: true, level: true },
        })
      : null;
    const nextPath = parent ? `${parent.path} / ${name}` : name;
    const previousPath = current.path;

    const category = await this.prisma.productCategory.update({
      where: { id },
      data: {
        name,
        path: nextPath,
        level: (parent?.level ?? 0) + 1,
      },
    });

    const descendants = await this.prisma.productCategory.findMany({
      where: {
        companyId: session.companyId,
        path: { startsWith: `${previousPath} / ` },
      },
      orderBy: { level: "asc" },
    });

    for (const descendant of descendants) {
      const suffix = descendant.path.slice(previousPath.length);
      const path = `${nextPath}${suffix}`;
      await this.prisma.productCategory.update({
        where: { id: descendant.id },
        data: { path, level: path.split(" / ").length },
      });
    }

    return category;
  }

  async deleteCategory(authorization: string | undefined, id: string) {
    const session = parseSessionToken(authorization);
    const category = await this.prisma.productCategory.findFirst({
      where: { id, companyId: session.companyId },
      select: { id: true },
    });
    if (!category) throw new NotFoundException("Product category does not exist.");

    const [childrenCount, productsCount] = await Promise.all([
      this.prisma.productCategory.count({
        where: {
          companyId: session.companyId,
          parentId: id,
        },
      }),
      this.prisma.product.count({
        where: {
          companyId: session.companyId,
          categoryId: id,
        },
      }),
    ]);

    const blockers: string[] = [];
    if (childrenCount > 0) blockers.push(`${childrenCount} ქვე კატეგორია`);
    if (productsCount > 0) blockers.push(`${productsCount} პროდუქტი`);

    if (blockers.length > 0) {
      throw new BadRequestException(
        `კატეგორია ვერ წაიშლება, რადგან მიბმულია: ${blockers.join(", ")}. ჯერ გადაიტანე ან წაშალე დაკავშირებული ჩანაწერები.`,
      );
    }

    await this.prisma.productCategory.delete({ where: { id } });
    return { ok: true };
  }

  async create(authorization: string | undefined, input: CreateProductInput) {
    const session = parseSessionToken(authorization);

    if (!input.name?.trim()) {
      throw new BadRequestException("Product name is required.");
    }

    if (input.type && !["stocked", "service", "expense"].includes(input.type)) {
      throw new BadRequestException("Product type is invalid.");
    }

    for (const [field, value] of Object.entries({
      costPrice: input.costPrice,
      salePrice: input.salePrice,
      vatRate: input.vatRate,
      discountPercent: input.discountPercent ?? undefined,
      discountAmount: input.discountAmount ?? undefined,
      minStock: input.minStock,
      reorderPoint: input.reorderPoint,
    })) {
      if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
        throw new BadRequestException(`${field} must be zero or greater.`);
      }
    }

    if (input.defaultWarehouseId) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: {
          id: input.defaultWarehouseId,
          companyId: session.companyId,
        },
      });

      if (!warehouse) {
        throw new NotFoundException("Default warehouse does not exist.");
      }
    }

    if (input.categoryId) {
      const category = await this.prisma.productCategory.findFirst({
        where: {
          id: input.categoryId,
          companyId: session.companyId,
        },
      });

      if (!category) {
        throw new NotFoundException("Product category does not exist.");
      }
    }

    return this.prisma.product.create({
      data: {
        companyId: session.companyId,
        name: input.name.trim(),
        sku: input.sku?.trim() || null,
        barcode: input.barcode?.trim() || null,
        category: input.category?.trim() || null,
        categoryId: input.categoryId?.trim() || null,
        brand: input.brand?.trim() || null,
        description: input.description?.trim() || null,
        unit: input.unit?.trim() || "ცალი",
        type: input.type ?? "stocked",
        isPurchasable: input.isPurchasable ?? true,
        isSellable: input.isSellable ?? true,
        tracksInventory: input.tracksInventory ?? true,
        tracksLots: input.tracksLots ?? false,
        tracksExpiry: input.tracksExpiry ?? false,
        costPrice: input.costPrice ?? 0,
        salePrice: input.salePrice ?? 0,
        currency: input.currency?.trim() || "GEL",
        vatRate: input.vatRate ?? 18,
        minStock: input.minStock ?? 0,
        reorderPoint: input.reorderPoint ?? 0,
        supplierSku: input.supplierSku?.trim() || null,
        rsName: input.rsName?.trim() || null,
        defaultWarehouseId: input.defaultWarehouseId?.trim() || null,
      },
    });
  }

  async update(authorization: string | undefined, id: string, input: UpdateProductInput) {
    const session = parseSessionToken(authorization);
    await this.ensureProduct(session.companyId, id);
    await this.validateProductInput(session.companyId, input);

    return this.prisma.product.update({
      where: { id },
      data: this.productData(input),
    });
  }

  async delete(authorization: string | undefined, id: string) {
    const session = parseSessionToken(authorization);
    await this.ensureProduct(session.companyId, id);
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  private async ensureProduct(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, companyId }, select: { id: true } });
    if (!product) throw new NotFoundException("Product does not exist.");
  }

  private async validateProductInput(companyId: string, input: UpdateProductInput) {
    if (input.name !== undefined && !input.name?.trim()) {
      throw new BadRequestException("Product name is required.");
    }

    if (input.type && !["stocked", "service", "expense"].includes(input.type)) {
      throw new BadRequestException("Product type is invalid.");
    }

    for (const [field, value] of Object.entries({
      costPrice: input.costPrice,
      salePrice: input.salePrice,
      vatRate: input.vatRate,
      minStock: input.minStock,
      reorderPoint: input.reorderPoint,
    })) {
      if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
        throw new BadRequestException(`${field} must be zero or greater.`);
      }
    }

    if (input.defaultWarehouseId) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: {
          id: input.defaultWarehouseId,
          companyId,
        },
      });

      if (!warehouse) {
        throw new NotFoundException("Default warehouse does not exist.");
      }
    }

    if (input.categoryId) {
      const category = await this.prisma.productCategory.findFirst({
        where: {
          id: input.categoryId,
          companyId,
        },
      });

      if (!category) {
        throw new NotFoundException("Product category does not exist.");
      }
    }
  }

  private productData(input: UpdateProductInput) {
    return {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.sku !== undefined ? { sku: input.sku?.trim() || null } : {}),
      ...(input.barcode !== undefined ? { barcode: input.barcode?.trim() || null } : {}),
      ...(input.category !== undefined ? { category: input.category?.trim() || null } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId?.trim() || null } : {}),
      ...(input.brand !== undefined ? { brand: input.brand?.trim() || null } : {}),
      ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
      ...(input.unit !== undefined ? { unit: input.unit?.trim() || "ცალი" } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.isPurchasable !== undefined ? { isPurchasable: input.isPurchasable } : {}),
      ...(input.isSellable !== undefined ? { isSellable: input.isSellable } : {}),
      ...(input.tracksInventory !== undefined ? { tracksInventory: input.tracksInventory } : {}),
      ...(input.tracksLots !== undefined ? { tracksLots: input.tracksLots } : {}),
      ...(input.tracksExpiry !== undefined ? { tracksExpiry: input.tracksExpiry } : {}),
      ...(input.costPrice !== undefined ? { costPrice: input.costPrice } : {}),
      ...(input.salePrice !== undefined ? { salePrice: input.salePrice } : {}),
      ...(input.currency !== undefined ? { currency: input.currency?.trim() || "GEL" } : {}),
      ...(input.vatRate !== undefined ? { vatRate: input.vatRate } : {}),
      ...(input.discountPercent !== undefined ? { discountPercent: input.discountPercent } : {}),
      ...(input.discountAmount !== undefined ? { discountAmount: input.discountAmount } : {}),
      ...(input.discountName !== undefined ? { discountName: input.discountName?.trim() || null } : {}),
      ...(input.minStock !== undefined ? { minStock: input.minStock } : {}),
      ...(input.reorderPoint !== undefined ? { reorderPoint: input.reorderPoint } : {}),
      ...(input.supplierSku !== undefined ? { supplierSku: input.supplierSku?.trim() || null } : {}),
      ...(input.rsName !== undefined ? { rsName: input.rsName?.trim() || null } : {}),
      ...(input.defaultWarehouseId !== undefined ? { defaultWarehouseId: input.defaultWarehouseId?.trim() || null } : {}),
      ...(input.status !== undefined ? { status: input.status?.trim() || "active" } : {}),
    };
  }

  private serializeProduct<T extends {
    category: string | null;
    categoryRef: { path: string } | null;
    externalData: unknown;
    movements: { quantity: unknown }[];
  }>(product: T) {
    const externalData = asRecord(product.externalData);
    const stockBreakdown = Array.isArray(externalData.stockBreakdown)
      ? externalData.stockBreakdown
      : [];
    const movementQuantity = product.movements.reduce((sum, movement) => sum + Number(movement.quantity), 0);

    return {
      ...product,
      categoryPath: product.categoryRef?.path ?? product.category,
      stockQuantity: Number(externalData.stockQuantity ?? movementQuantity),
      reservedQuantity: Number(externalData.reservedQuantity ?? 0),
      seriesCount: Number(externalData.seriesCount ?? 0),
      nearestExpiryDate: typeof externalData.nearestExpiryDate === "string" ? externalData.nearestExpiryDate : null,
      discountCondition: typeof externalData.discountCondition === "string" ? externalData.discountCondition : null,
      discountSchedule: typeof externalData.discountSchedule === "string" ? externalData.discountSchedule : null,
      stockBreakdown,
      warehouseCount: new Set(
        stockBreakdown
          .map((line) => (asRecord(line).warehouseUid as string | undefined)?.toLowerCase())
          .filter(Boolean),
      ).size,
      categoryRef: product.categoryRef,
      movements: undefined,
    };
  }

  private async syncLegacyCategories(companyId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        companyId,
        categoryId: null,
        category: { not: null },
      },
      select: {
        id: true,
        category: true,
      },
      take: 500,
    });

    for (const product of products) {
      if (!product.category) continue;
      const categoryId = await this.upsertCategoryPath(companyId, product.category, "legacy");
      if (!categoryId) continue;
      await this.prisma.product.update({
        where: { id: product.id },
        data: { categoryId },
      });
    }
  }

  private async upsertCategoryPath(companyId: string, categoryPath: string, source: string) {
    const names = categoryPath
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
    if (names.length === 0) return null;

    let parentId: string | null = null;
    const parts: string[] = [];
    for (const [index, name] of names.entries()) {
      parts.push(name);
      const path = parts.join(" / ");
      const category: { id: string } = await this.prisma.productCategory.upsert({
        where: {
          companyId_path: {
            companyId,
            path,
          },
        },
        create: {
          companyId,
          parentId,
          name,
          path,
          level: index + 1,
          source,
        },
        update: {
          parentId,
          name,
          level: index + 1,
          status: "active",
        },
      });
      parentId = category.id;
    }

    return parentId;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}
