import { BadRequestException, Injectable } from "@nestjs/common";
import { Buffer } from "node:buffer";
import { parseSessionToken } from "../../common/session";
import { PrismaService } from "../../prisma/prisma.service";

export type BalanceImportRequest = {
  publicationId?: string;
  username?: string;
  password?: string;
  authorization?: string;
  itemsUrl?: string;
  limit?: number;
};

type BalanceProductPreview = {
  externalUid: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  brand: string | null;
  description: string | null;
  manufacturer: string | null;
  countryOfOrigin: string | null;
  supplierSku: string | null;
  rsName: string | null;
  unit: string;
  type: "stocked" | "service" | "expense";
  salePrice: number;
  vatRate: number;
  discountPercent: number | null;
  discountAmount: number | null;
  discountName: string | null;
  discountCondition: string | null;
  discountSchedule: string | null;
  stockQuantity: number;
  reservedQuantity: number;
  seriesCount: number;
  nearestExpiryDate: string | null;
  stockBreakdown: {
    warehouseUid: string;
    warehouseName: string | null;
    quantity: number;
    reserve: number;
    seriesUid: string | null;
    seriesName: string | null;
    expiryDate: string | null;
  }[];
  requestData: {
    item: Record<string, unknown>;
    prices: Record<string, unknown>[];
    stocks: Record<string, unknown>[];
    discounts: Record<string, unknown>[];
    itemSeries: Record<string, unknown>[];
  };
  action: "create" | "update" | "conflict" | "skip";
  reason?: string;
};

const NULL_BALANCE_UID = "00000000-0000-0000-0000-000000000000";
const GUID_RE = /^[0-9a-f-]{36}$/i;
const BALANCE_TIMEOUT_MS = 90_000;
const BALANCE_RETRIES = 3;
const BALANCE_SERIES_BATCH_SIZE = 12;

@Injectable()
export class BalanceIntegrationService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(authorization: string | undefined) {
    const session = parseSessionToken(authorization);
    const integration = await this.prisma.integration.findUnique({
      where: {
        companyId_key: {
          companyId: session.companyId,
          key: "balance",
        },
      },
    });
    const config = normalizeConfig(integration?.config);

    return {
      ok: true,
      status: integration?.status ?? "inactive",
      publicationId: config.publicationId ?? "",
      username: config.username ?? "",
      itemsUrl: config.itemsUrl ?? "",
      hasPassword: Boolean(config.password),
      hasAuthorization: Boolean(config.authorization),
      lastUsedAt: config.lastUsedAt ?? null,
    };
  }

  async testConnection(authorization: string | undefined, input: BalanceImportRequest) {
    const session = parseSessionToken(authorization);
    const request = await this.resolveAndSaveSettings(session.companyId, input);
    const data = await this.fetchBalanceResource(request, "Items", "o");
    const rows = rowsFromBalance(data);

    return {
      ok: true,
      message: "Balance კავშირი მუშაობს.",
      totalRows: rows.length,
      productRows: rows.filter((row) => !isGroupRow(row)).length,
      groupRows: rows.filter(isGroupRow).length,
    };
  }

  async previewProducts(authorization: string | undefined, input: BalanceImportRequest) {
    const session = parseSessionToken(authorization);
    const request = await this.resolveAndSaveSettings(session.companyId, input);
    const balance = await this.fetchBalanceSnapshot(request);
    const preview = await this.buildProductsPreview(session.companyId, balance, request.limit);

    return {
      ok: true,
      source: "balance",
      complete: balance.complete,
      warnings: balance.warnings,
      totals: summarizePreview(preview),
      diagnostics: balance.diagnostics,
      products: preview,
    };
  }

  async importProducts(authorization: string | undefined, input: BalanceImportRequest) {
    const session = parseSessionToken(authorization);
    const request = await this.resolveAndSaveSettings(session.companyId, input);
    const balance = await this.fetchBalanceSnapshot(request);
    if (!balance.complete) {
      throw new BadRequestException(`Balance preview არასრულია: ${balance.warnings.join(" ")}`);
    }
    const preview = await this.buildProductsPreview(session.companyId, balance, request.limit);
    const importable = preview.filter((row) => row.action === "create" || row.action === "update");

    const batch = await this.prisma.importBatch.create({
      data: {
        companyId: session.companyId,
        provider: "balance",
        entityType: "product",
        status: "running",
        totals: summarizePreview(preview),
        metadata: {
          publicationId: input.publicationId?.trim() || null,
          rows: balance.items.length,
        },
      },
    });

    let created = 0;
    let updated = 0;
    let warehousesCreated = 0;
    let warehousesUpdated = 0;
    let stockMovementsCreated = 0;
    let discountsCreated = 0;
    let discountsUpdated = 0;
    const errors: string[] = [];
    const warehouseByUid = await this.upsertBalanceWarehouses(session.companyId, balance.warehouses, batch.id);
    warehousesCreated = warehouseByUid.created;
    warehousesUpdated = warehouseByUid.updated;
    const productByExternalUid = new Map<string, string>();

    for (const item of importable) {
      try {
        const existingReference = await this.prisma.externalReference.findUnique({
          where: {
            companyId_provider_entityType_externalUid: {
              companyId: session.companyId,
              provider: "balance",
              entityType: "product",
              externalUid: item.externalUid,
            },
          },
        });

        const data = {
          companyId: session.companyId,
          name: item.name,
          sku: item.sku,
          barcode: item.barcode,
          category: item.category,
          categoryId: item.category ? await this.upsertProductCategoryPath(session.companyId, item.category, "balance") : null,
          brand: item.brand,
          description: item.description,
          unit: item.unit,
          type: item.type,
          supplierSku: item.supplierSku,
          rsName: item.rsName,
          tracksLots: item.seriesCount > 0,
          tracksExpiry: Boolean(item.nearestExpiryDate),
          salePrice: item.salePrice,
          vatRate: item.vatRate,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          discountName: item.discountName,
          source: "balance",
          importBatchId: batch.id,
          externalUid: item.externalUid,
          externalData: jsonValue(item),
          lastImportedAt: new Date(),
          syncStatus: "imported",
        };

        const product = existingReference
          ? await this.prisma.product.update({
              where: { id: existingReference.entityId },
              data,
            })
          : await this.prisma.product.create({ data });

        if (existingReference) updated++;
        else created++;
        productByExternalUid.set(item.externalUid.toLowerCase(), product.id);

        await this.prisma.externalReference.upsert({
          where: {
            companyId_provider_entityType_externalUid: {
              companyId: session.companyId,
              provider: "balance",
              entityType: "product",
              externalUid: item.externalUid,
            },
          },
          create: {
            companyId: session.companyId,
            provider: "balance",
            entityType: "product",
            entityId: product.id,
            externalUid: item.externalUid,
            externalCode: item.sku,
            metadata: jsonValue(item),
          },
          update: {
            entityId: product.id,
            externalCode: item.sku,
            metadata: jsonValue(item),
          },
        });

        stockMovementsCreated += await this.replaceBalanceOpeningStock(
          session.companyId,
          product.id,
          item,
          warehouseByUid.byExternalUid,
        );
      } catch (error) {
        errors.push(`${item.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    try {
      const syncedDiscounts = await this.upsertBalanceDiscounts(
        session.companyId,
        balance,
        batch.id,
        productByExternalUid,
      );
      discountsCreated = syncedDiscounts.created;
      discountsUpdated = syncedDiscounts.updated;
    } catch (error) {
      errors.push(`Balance discounts: ${error instanceof Error ? error.message : String(error)}`);
    }

    const status = errors.length ? "completed_with_errors" : "completed";
    await this.prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status,
        totals: {
          ...summarizePreview(preview),
          created,
          updated,
          warehousesCreated,
          warehousesUpdated,
          stockMovementsCreated,
          discountsCreated,
          discountsUpdated,
          errors: errors.length,
        },
      },
    });

    return {
      ok: errors.length === 0,
      batchId: batch.id,
      created,
      updated,
      warehousesCreated,
      warehousesUpdated,
      stockMovementsCreated,
      discountsCreated,
      discountsUpdated,
      skipped: preview.filter((row) => row.action === "skip").length,
      conflicts: preview.filter((row) => row.action === "conflict").length,
      errors,
    };
  }

  private async resolveAndSaveSettings(companyId: string, input: BalanceImportRequest): Promise<BalanceImportRequest> {
    const existing = await this.prisma.integration.findUnique({
      where: {
        companyId_key: {
          companyId,
          key: "balance",
        },
      },
    });
    const previous = normalizeConfig(existing?.config);
    const next: BalanceImportRequest = {
      publicationId: valueOrPrevious(input.publicationId, previous.publicationId),
      username: valueOrPrevious(input.username, previous.username),
      password: valueOrPrevious(input.password, previous.password),
      authorization: valueOrPrevious(input.authorization, previous.authorization),
      itemsUrl: valueOrPrevious(input.itemsUrl, previous.itemsUrl),
      limit: input.limit,
    };

    await this.prisma.integration.upsert({
      where: {
        companyId_key: {
          companyId,
          key: "balance",
        },
      },
      create: {
        companyId,
        key: "balance",
        name: "Balance",
        status: "connected",
        config: jsonValue({
          ...next,
          lastUsedAt: new Date().toISOString(),
        }),
      },
      update: {
        status: "connected",
        config: jsonValue({
          ...previous,
          ...next,
          lastUsedAt: new Date().toISOString(),
        }),
      },
    });

    return next;
  }

  private async upsertBalanceWarehouses(companyId: string, rows: Record<string, unknown>[], batchId: string) {
    const byExternalUid = new Map<string, string>();
    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const externalUid = readString(row, "uid", "UID", "Ref", "UUID", "Uuid", "Id");
      const name = readString(row, "Name", "FullName", "Description");
      if (!externalUid || !name) continue;

      const existingReference = await this.prisma.externalReference.findUnique({
        where: {
          companyId_provider_entityType_externalUid: {
            companyId,
            provider: "balance",
            entityType: "warehouse",
            externalUid,
          },
        },
      });

      const code = readString(row, "Code", "code", "ExtCode") || null;
      const data = {
        companyId,
        name,
        code,
        address: readString(row, "Address", "address", "Adress", "adress") || null,
        source: "balance",
        externalUid,
        externalData: jsonValue({ ...row, importBatchId: batchId }),
        status: readBoolean(row, "IsDeleted", "isDeleted") ? "inactive" : "active",
      };

      const warehouse = existingReference
        ? await this.prisma.warehouse.update({ where: { id: existingReference.entityId }, data })
        : await this.prisma.warehouse.create({ data });

      if (existingReference) updated++;
      else created++;
      byExternalUid.set(externalUid.toLowerCase(), warehouse.id);

      await this.prisma.externalReference.upsert({
        where: {
          companyId_provider_entityType_externalUid: {
            companyId,
            provider: "balance",
            entityType: "warehouse",
            externalUid,
          },
        },
        create: {
          companyId,
          provider: "balance",
          entityType: "warehouse",
          entityId: warehouse.id,
          externalUid,
          externalCode: code,
          metadata: jsonValue(row),
        },
        update: {
          entityId: warehouse.id,
          externalCode: code,
          metadata: jsonValue(row),
        },
      });
    }

    return { byExternalUid, created, updated };
  }

  private async replaceBalanceOpeningStock(
    companyId: string,
    productId: string,
    item: BalanceProductPreview,
    warehouseByExternalUid: Map<string, string>,
  ) {
    await this.prisma.inventoryMovement.deleteMany({
      where: {
        companyId,
        productId,
        type: "adjustment",
        note: { startsWith: "Balance opening stock:" },
      },
    });

    let created = 0;
    for (const line of item.stockBreakdown) {
      if (!line.warehouseUid || line.quantity === 0) continue;
      const warehouseId = warehouseByExternalUid.get(line.warehouseUid.toLowerCase());
      if (!warehouseId) continue;

      await this.prisma.inventoryMovement.create({
        data: {
          companyId,
          productId,
          warehouseId,
          type: "adjustment",
          quantity: line.quantity,
          unitCost: 0,
          note: `Balance opening stock: warehouse=${line.warehouseUid}; series=${line.seriesUid ?? ""}; reserve=${line.reserve}`,
        },
      });
      created++;
    }

    return created;
  }

  private async upsertBalanceDiscounts(
    companyId: string,
    balance: BalanceSnapshot,
    batchId: string,
    productByExternalUid: Map<string, string>,
  ) {
    const groupLeafUids = buildLeafItemUidsByGroupUid(balance.items);
    let created = 0;
    let updated = 0;

    for (const row of balance.discounts) {
      if (!discountRuleIsActive(row)) continue;

      const parsed = mapBalanceDiscountRule(row, balance.items, groupLeafUids, productByExternalUid);
      if (!parsed) continue;

      const existingReference = await this.prisma.externalReference.findUnique({
        where: {
          companyId_provider_entityType_externalUid: {
            companyId,
            provider: "balance",
            entityType: "discount",
            externalUid: parsed.externalUid,
          },
        },
      });

      const data = {
        companyId,
        name: parsed.name,
        type: parsed.type,
        scope: parsed.scope,
        value: parsed.value,
        currency: parsed.currency,
        priority: parsed.priority,
        stackable: parsed.stackable,
        startsAt: parsed.startsAt,
        endsAt: parsed.endsAt,
        minQuantity: parsed.minQuantity,
        minAmount: parsed.minAmount,
        channel: parsed.channel,
        status: "active" as const,
        notes: parsed.notes,
        ruleConfig: jsonValue({
          source: "balance",
          externalUid: parsed.externalUid,
          importBatchId: batchId,
          conditions: parsed.conditions,
          raw: row,
        }),
      };
      const customerIds = await Promise.all(
        parsed.customerIds.map((code) => this.upsertBalanceCustomer(companyId, code, row, batchId)),
      );

      const discount = await this.prisma.$transaction(async (tx) => {
        const current = existingReference
          ? await tx.discount.update({ where: { id: existingReference.entityId }, data })
          : await tx.discount.create({ data });

        await tx.discountProduct.deleteMany({ where: { discountId: current.id } });
        await tx.discountCategory.deleteMany({ where: { discountId: current.id } });
        await tx.discountCustomer.deleteMany({ where: { discountId: current.id } });

        if (parsed.productIds.length > 0) {
          await tx.discountProduct.createMany({
            data: parsed.productIds.map((productId) => ({ discountId: current.id, productId })),
            skipDuplicates: true,
          });
        }

        if (customerIds.length > 0) {
          await tx.discountCustomer.createMany({
            data: customerIds.map((customerId) => ({ discountId: current.id, customerId })),
            skipDuplicates: true,
          });
        }

        return current;
      });

      if (existingReference) updated++;
      else created++;

      await this.prisma.externalReference.upsert({
        where: {
          companyId_provider_entityType_externalUid: {
            companyId,
            provider: "balance",
            entityType: "discount",
            externalUid: parsed.externalUid,
          },
        },
        create: {
          companyId,
          provider: "balance",
          entityType: "discount",
          entityId: discount.id,
          externalUid: parsed.externalUid,
          externalCode: parsed.code,
          metadata: jsonValue(row),
        },
        update: {
          entityId: discount.id,
          externalCode: parsed.code,
          metadata: jsonValue(row),
        },
      });
    }

    return { created, updated };
  }

  private async upsertBalanceCustomer(companyId: string, code: string, row: Record<string, unknown>, batchId: string) {
    const name = readString(row, "CustomerName", "ClientName", "PartnerName") || `Balance customer ${code}`;
    const isPersonalId = /^\d{11}$/.test(code);
    const data = {
      companyId,
      name,
      code,
      taxId: isPersonalId ? null : code,
      personalId: isPersonalId ? code : null,
      source: "balance",
      externalUid: code,
      externalData: jsonValue({ importBatchId: batchId, discount: row }),
      status: "active",
    };

    const customer = await this.prisma.customer.upsert({
      where: { companyId_code: { companyId, code } },
      create: data,
      update: data,
    });

    await this.prisma.externalReference.upsert({
      where: {
        companyId_provider_entityType_externalUid: {
          companyId,
          provider: "balance",
          entityType: "customer",
          externalUid: code,
        },
      },
      create: {
        companyId,
        provider: "balance",
        entityType: "customer",
        entityId: customer.id,
        externalUid: code,
        externalCode: code,
        metadata: jsonValue(row),
      },
      update: {
        entityId: customer.id,
        externalCode: code,
        metadata: jsonValue(row),
      },
    });

    return customer.id;
  }

  private async upsertProductCategoryPath(companyId: string, categoryPath: string, source: string) {
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
      const categoryRow: { id: string } = await this.prisma.productCategory.upsert({
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
          source,
          status: "active",
        },
      });
      parentId = categoryRow.id;
    }

    return parentId;
  }

  private async buildProductsPreview(
    companyId: string,
    balance: BalanceSnapshot,
    limit = 200,
  ): Promise<BalanceProductPreview[]> {
    const warehouseNames = buildWarehouseNameByUid(balance.warehouses);
    const seriesByUid = buildSeriesByUid(balance.itemSeries);
    const stockByItemUid = aggregateStocksByItemUid(balance.stocks, warehouseNames, seriesByUid);
    const priceByUid = buildPriceByUid(balance.prices);
    const taxationByUid = buildTaxationByUid(balance.prices);
    const discountByUid = buildDiscountByItemUid(balance.discounts, balance.items);
    const requestDataByItemUid = buildRequestDataByItemUid(balance);

    const products = balance.items
      .filter((row) => !isGroupRow(row))
      .map((row) =>
        mapBalanceProduct(
          row,
          balance.items,
          priceByUid,
          taxationByUid,
          stockByItemUid,
          discountByUid.byItemUid,
          discountByUid.unconditional,
          requestDataByItemUid,
        ),
      )
      .filter((row): row is BalanceProductPreview => row !== null)
      .slice(0, Math.max(1, Math.min(Number(limit) || 200, 1000)));

    const existingProducts = await this.prisma.product.findMany({
      where: { companyId },
      select: { id: true, sku: true, barcode: true, externalUid: true },
    });
    const references = await this.prisma.externalReference.findMany({
      where: { companyId, provider: "balance", entityType: "product" },
      select: { externalUid: true },
    });

    const byExternalUid = new Set([
      ...existingProducts.map((product) => product.externalUid?.toLowerCase()).filter(Boolean),
      ...references.map((reference) => reference.externalUid.toLowerCase()),
    ]);
    const bySku = new Set(existingProducts.map((product) => product.sku?.trim().toLowerCase()).filter(Boolean));
    const byBarcode = new Set(existingProducts.map((product) => product.barcode?.trim().toLowerCase()).filter(Boolean));

    return products.map((product) => {
      if (byExternalUid.has(product.externalUid.toLowerCase())) {
        return { ...product, action: "update" };
      }

      if (product.sku && bySku.has(product.sku.toLowerCase())) {
        return {
          ...product,
          action: "conflict",
          reason: "ამ SKU-ით პროდუქტი უკვე არსებობს და Balance GUID ჯერ მიბმული არ არის.",
        };
      }

      if (product.barcode && byBarcode.has(product.barcode.toLowerCase())) {
        return {
          ...product,
          action: "conflict",
          reason: "ამ შტრიხკოდით პროდუქტი უკვე არსებობს და Balance GUID ჯერ მიბმული არ არის.",
        };
      }

      return { ...product, action: "create" };
    });
  }

  private async fetchBalanceSnapshot(input: BalanceImportRequest): Promise<BalanceSnapshot> {
    const [items, prices, warehouses, stocks, discounts, itemSeriesFullList] = await Promise.all([
      this.fetchBalanceResource(input, "Items", "o").then(okResult).catch(errorResult),
      this.fetchBalancePrices(input).then(okResult).catch(errorResult),
      this.fetchBalanceResource(input, "Warehouses", "a").then(okResult).catch(errorResult),
      this.fetchBalanceStocks(input).then(okResult).catch(errorResult),
      this.fetchBalanceResource(input, "Discounts", "a").then(okResult).catch(errorResult),
      this.fetchBalanceResource(input, "ItemsSeries", "a").then(okResult).catch(errorResult),
    ]);
    const itemRows = rowsFromBalanceOrThrow(items, "Items");
    const itemSeries = await this.resolveItemSeries(input, itemRows, itemSeriesFullList);
    const diagnostics = {
      items: diagnosticFor(items),
      prices: diagnosticFor(prices),
      warehouses: diagnosticFor(warehouses),
      stocks: diagnosticFor(stocks),
      discounts: diagnosticFor(discounts),
      itemSeries: diagnosticFor(itemSeries),
    };
    const warnings = snapshotWarnings(diagnostics);

    return {
      items: itemRows,
      prices: rowsFromBalanceResult(prices),
      warehouses: rowsFromBalanceResult(warehouses),
      stocks: rowsFromBalanceResult(stocks),
      discounts: rowsFromBalanceResult(discounts),
      itemSeries: rowsFromBalanceResult(itemSeries),
      diagnostics,
      warnings,
      complete: warnings.length === 0,
    };
  }

  private fetchBalancePrices(input: BalanceImportRequest) {
    const url = balanceResourceUrl(input, "Prices", "a");
    const priceUrl = new URL(url);
    priceUrl.searchParams.set("uid", BALANCE_EXCHANGE_UID);
    return this.fetchJson(priceUrl.toString(), input);
  }

  private async fetchBalanceStocks(input: BalanceImportRequest) {
    const url = balanceResourceUrl(input, "Stocks", "a");
    const stockUrl = new URL(url);
    stockUrl.searchParams.set("uid", BALANCE_EXCHANGE_UID);
    stockUrl.searchParams.set("StartingPeriod", "");
    stockUrl.searchParams.set("EndingPeriod", "");
    stockUrl.searchParams.set("Source", "");
    stockUrl.searchParams.set("Total", "false");
    try {
      return await this.fetchJson(stockUrl.toString(), input);
    } catch {
      const fallbackUrl = new URL(url);
      fallbackUrl.searchParams.set("uid", BALANCE_EXCHANGE_UID);
      fallbackUrl.searchParams.set("Total", "false");
      return this.fetchJson(fallbackUrl.toString(), input);
    }
  }

  private async resolveItemSeries(
    input: BalanceImportRequest,
    itemRows: Record<string, unknown>[],
    fullListResult: BalanceFetchResult,
  ): Promise<BalanceFetchResult> {
    const fullListRows = rowsFromBalanceResult(fullListResult);
    if (fullListRows.length > 0) return fullListResult;

    const itemUids = itemRows
      .filter((row) => !isGroupRow(row))
      .map((row) => readString(row, "uid", "UID", "Ref", "UUID", "Uuid", "Id"))
      .filter((uid) => GUID_RE.test(uid))
      .slice(0, Math.max(1, Math.min(Number(input.limit) || 200, 300)));

    if (itemUids.length === 0) return fullListResult;

    const rows: Record<string, unknown>[] = [];
    for (const batch of chunk(itemUids, BALANCE_SERIES_BATCH_SIZE)) {
      const settled = await Promise.allSettled(batch.map((uid) => this.fetchBalanceItemsSeriesForItem(input, uid)));
      rows.push(...settled.flatMap((result) => (result.status === "fulfilled" ? rowsFromBalance(result.value) : [])));
    }
    if (rows.length > 0) return { ok: true, data: rows };
    return fullListResult;
  }

  private fetchBalanceItemsSeriesForItem(input: BalanceImportRequest, itemUid: string) {
    const url = balanceResourceUrl(input, "ItemsSeries", "a");
    const seriesUrl = new URL(url);
    seriesUrl.searchParams.set("Item", itemUid);
    return this.fetchJson(seriesUrl.toString(), input);
  }

  private fetchBalanceResource(input: BalanceImportRequest, resource: string, mode: "a" | "o") {
    const url =
      resource === "Items" && input.itemsUrl?.trim()
        ? input.itemsUrl.trim()
        : balanceResourceUrl(input, resource, mode);
    return this.fetchJson(url, input);
  }

  private async fetchJson(url: string, input: BalanceImportRequest) {
    let lastError: unknown;

    for (let attempt = 0; attempt < BALANCE_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), BALANCE_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            Authorization: balanceAuthorization(input),
          },
          signal: controller.signal,
        });

        const text = await response.text();
        if (!response.ok) {
          const retryable = [408, 429, 500, 502, 503, 504].includes(response.status);
          if (retryable && attempt < BALANCE_RETRIES - 1) {
            lastError = new Error(`HTTP ${response.status}`);
            await sleep(retryDelayMs(attempt));
            continue;
          }

          throw new BadRequestException(
            `Balance-თან კავშირი ვერ შედგა (${response.status}). შეამოწმე კოდი და ავტორიზაცია.`,
          );
        }

        try {
          return JSON.parse(text);
        } catch {
          throw new BadRequestException("Balance-მა JSON-ის ნაცვლად სხვა ფორმატის პასუხი დააბრუნა.");
        }
      } catch (error) {
        lastError = error;
        if (error instanceof BadRequestException || attempt >= BALANCE_RETRIES - 1) throw error;
        await sleep(retryDelayMs(attempt));
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}

type BalanceSnapshot = {
  items: Record<string, unknown>[];
  prices: Record<string, unknown>[];
  warehouses: Record<string, unknown>[];
  stocks: Record<string, unknown>[];
  discounts: Record<string, unknown>[];
  itemSeries: Record<string, unknown>[];
  diagnostics: Record<string, BalanceEndpointDiagnostic>;
  warnings: string[];
  complete: boolean;
};

type BalanceFetchResult = { ok: true; data: unknown } | { ok: false; error: string };

type BalanceEndpointDiagnostic = {
  ok: boolean;
  rows: number;
  error?: string;
};

const BALANCE_EXCHANGE_UID = "b067980d-7eb5-11ec-80d2-000c29409daa";

function balanceResourceUrl(input: BalanceImportRequest, resource: string, mode: "a" | "o") {
  const publicationId = resolvePublicationId(input.publicationId);
  if (!publicationId) {
    throw new BadRequestException("Balance publication/company code აუცილებელია.");
  }
  return `https://cloud.balance.ge/sm/${mode}/Balance/${publicationId}/hs/Exchange/${resource}`;
}

function resolvePublicationId(raw?: string) {
  const value = raw?.trim();
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    const match = /\/Balance\/([^/]+)\/hs\/Exchange\//i.exec(value);
    return match?.[1] ?? "";
  }

  return value;
}

function balanceAuthorization(input: BalanceImportRequest) {
  if (input.authorization?.trim()) return input.authorization.trim();
  if (!input.username?.trim() || !input.password?.trim()) {
    throw new BadRequestException("Balance username და password აუცილებელია.");
  }

  return `Basic ${Buffer.from(`${input.username.trim()}:${input.password}`).toString("base64")}`;
}

function rowsFromBalance(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (!data || typeof data !== "object") return [];
  const object = data as Record<string, unknown>;

  for (const key of ["Items", "value", "Value", "Source", "data", "Data", "Rows", "rows", "Records", "records"]) {
    if (Array.isArray(object[key])) return object[key] as Record<string, unknown>[];
  }

  return [];
}

function okResult(data: unknown): BalanceFetchResult {
  return { ok: true, data };
}

function errorResult(error: unknown): BalanceFetchResult {
  return {
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  };
}

function rowsFromBalanceResult(result: BalanceFetchResult) {
  return result.ok ? rowsFromBalance(result.data) : [];
}

function rowsFromBalanceOrThrow(result: BalanceFetchResult, name: string) {
  if (result.ok) return rowsFromBalance(result.data);
  throw new BadRequestException(`${name} ვერ ჩაიტვირთა Balance-იდან: ${result.error}`);
}

function diagnosticFor(result: BalanceFetchResult): BalanceEndpointDiagnostic {
  if (!result.ok) {
    return { ok: false, rows: 0, error: result.error };
  }

  return { ok: true, rows: rowsFromBalance(result.data).length };
}

function snapshotWarnings(diagnostics: Record<string, BalanceEndpointDiagnostic>) {
  const required = [
    ["prices", "ფასები ვერ ჩაიტვირთა"],
    ["warehouses", "საწყობები ვერ ჩაიტვირთა"],
    ["stocks", "ნაშთები ვერ ჩაიტვირთა"],
  ] as const;

  return required
    .filter(([key]) => !diagnostics[key]?.ok || diagnostics[key].rows === 0)
    .map(([, message]) => message);
}

function mapBalanceProduct(
  row: Record<string, unknown>,
  allRows: Record<string, unknown>[],
  priceByUid: Map<string, number>,
  taxationByUid: Map<string, string>,
  stockByItemUid: Map<string, StockAggregate>,
  discountByUid: Map<string, BalanceDiscount>,
  unconditionalDiscount?: BalanceDiscount,
  requestDataByItemUid?: Map<string, BalanceProductPreview["requestData"]>,
): BalanceProductPreview | null {
  const externalUid = readString(row, "uid", "UID", "Ref", "UUID", "Uuid", "Id");
  const name = readString(row, "Name", "FullName", "Description");

  if (!externalUid || !GUID_RE.test(externalUid) || !name) return null;

  const stock = stockByItemUid.get(externalUid.toLowerCase());
  const discount = discountByUid.get(externalUid.toLowerCase()) ?? unconditionalDiscount;
  const expiryDates = (stock?.lines ?? []).map((line) => line.expiryDate).filter(Boolean).sort();

  return {
    externalUid,
    name,
    sku: readString(row, "Code", "InternalArticle", "SKU", "sku") || null,
    barcode: readString(row, "BarCode", "Barcode", "barcode", "EAN") || null,
    category: categoryNameFor(row, allRows),
    brand: readString(row, "Brand", "ProductNameBrand", "Trademark", "Mark") || null,
    description: readString(row, "Description", "FullName", "Comment", "Comments") || null,
    manufacturer: readString(row, "Manufacturer", "Producer") || null,
    countryOfOrigin: readString(row, "CountryOfOrigin", "Country", "OriginCountry") || null,
    supplierSku: readString(row, "SupplierSku", "SupplierSKU", "VendorCode", "Article", "ExtCode") || null,
    rsName: readString(row, "RsName", "RSName", "FullName", "Name") || null,
    unit: readString(row, "Unit", "BaseUnit", "UnitOfMeasure") || "ცალი",
    type: balanceProductType(row, stock),
    salePrice: priceByUid.get(externalUid.toLowerCase()) ?? readNumber(row, "Price", "SalePrice", "RetailPrice") ?? 0,
    vatRate: taxationToVatRate(taxationByUid.get(externalUid.toLowerCase()) ?? readString(row, "Taxation", "VATRate", "VatRate")),
    discountPercent: discount?.percent ?? null,
    discountAmount: discount?.amount ?? null,
    discountName: discount?.name ?? null,
    discountCondition: discount?.condition ?? null,
    discountSchedule: discount?.schedule ?? null,
    stockQuantity: stock?.quantity ?? 0,
    reservedQuantity: stock?.reserve ?? 0,
    seriesCount: stock?.seriesUids.size ?? 0,
    nearestExpiryDate: expiryDates[0] ?? null,
    stockBreakdown: stock?.lines ?? [],
    requestData: requestDataByItemUid?.get(externalUid.toLowerCase()) ?? {
      item: row,
      prices: [],
      stocks: [],
      discounts: [],
      itemSeries: [],
    },
    action: "create",
  };
}

function balanceProductType(row: Record<string, unknown>, stock?: StockAggregate): "stocked" | "service" | "expense" {
  const type = readString(row, "Type", "type", "ItemType", "NomenclatureType").toLowerCase();
  const isService = String(row.IsService ?? row.isService ?? "").toLowerCase();
  if (isService === "true" || isService === "1" || type.includes("service") || type.includes("სერვ")) {
    return "service";
  }
  const isExpense = String(row.IsExpense ?? row.isExpense ?? "").toLowerCase();
  if (isExpense === "true" || isExpense === "1" || type.includes("expense") || type.includes("ხარჯ")) {
    return "expense";
  }
  if (stock && stock.lines.length > 0) return "stocked";
  return "stocked";
}

function isGroupRow(row: Record<string, unknown>) {
  const isGroup = String(row.IsGroup ?? row.isGroup ?? "").toLowerCase();
  const isFolder = String(row.IsFolder ?? row.isFolder ?? row.Folder ?? "").toLowerCase();
  const type = readString(row, "Type", "type", "ItemType").toLowerCase();

  return (
    isGroup === "true" ||
    isGroup === "1" ||
    isFolder === "true" ||
    isFolder === "1" ||
    type.includes("group") ||
    type.includes("folder")
  );
}

function categoryNameFor(row: Record<string, unknown>, allRows: Record<string, unknown>[]) {
  const groupUid = readString(row, "Group", "group", "GroupRef");
  if (!groupUid || groupUid === NULL_BALANCE_UID) return null;

  const byUid = new Map<string, Record<string, unknown>>();
  for (const candidate of allRows) {
    const uid = readString(candidate, "uid", "UID", "Ref", "UUID", "Uuid", "Id");
    if (uid) byUid.set(uid.toLowerCase(), candidate);
  }

  const parts: string[] = [];
  const seen = new Set<string>();
  let currentUid = groupUid;
  for (let depth = 0; depth < 20; depth++) {
    if (!currentUid || currentUid === NULL_BALANCE_UID) break;
    const key = currentUid.toLowerCase();
    if (seen.has(key)) break;
    seen.add(key);
    const group = byUid.get(key);
    if (!group) break;
    const name = readString(group, "Name", "FullName", "Description");
    if (name) parts.unshift(name);
    currentUid = readString(group, "Group", "group", "GroupRef");
  }

  return parts.length ? parts.join(" / ") : null;
}

function taxationToVatRate(raw: string) {
  const normalized = raw.toLowerCase();
  if (normalized.includes("18") || normalized.includes("დღგ")) return 18;
  if (normalized.includes("0")) return 0;
  const numeric = Number(raw.replace(",", "."));
  return Number.isFinite(numeric) ? numeric : 18;
}

function readString(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && value !== "") return String(value).trim();
  }
  return "";
}

function readNumber(row: Record<string, unknown>, ...keys: string[]) {
  const raw = readString(row, ...keys);
  if (!raw) return undefined;
  const value = Number(raw.replace(/\s|\u00a0/g, "").replace(",", "."));
  return Number.isFinite(value) ? value : undefined;
}

function readInteger(row: Record<string, unknown>, ...keys: string[]) {
  const value = readNumber(row, ...keys);
  return value !== undefined && Number.isInteger(value) ? value : undefined;
}

function readBoolean(row: Record<string, unknown>, ...keys: string[]) {
  const raw = readString(row, ...keys).toLowerCase();
  if (!raw) return undefined;
  if (["true", "1", "yes", "კი"].includes(raw)) return true;
  if (["false", "0", "no", "არა"].includes(raw)) return false;
  return undefined;
}

function buildPriceByUid(rows: Record<string, unknown>[]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const uid = readString(row, "Item", "Source", "uid", "UID", "Ref", "UUID", "Uuid");
    const price = readNumber(row, "Price", "price", "Value", "Cost", "UnitPrice");
    if (uid && price !== undefined) map.set(uid.toLowerCase(), price);
  }
  return map;
}

function buildRequestDataByItemUid(balance: BalanceSnapshot) {
  const map = new Map<string, BalanceProductPreview["requestData"]>();
  const ensure = (uid: string, item?: Record<string, unknown>) => {
    const key = uid.toLowerCase();
    const current =
      map.get(key) ??
      ({
        item: item ?? {},
        prices: [],
        stocks: [],
        discounts: [],
        itemSeries: [],
      } satisfies BalanceProductPreview["requestData"]);
    if (item && Object.keys(current.item).length === 0) current.item = item;
    map.set(key, current);
    return current;
  };

  for (const row of balance.items) {
    const uid = readString(row, "uid", "UID", "Ref", "UUID", "Uuid", "Id");
    if (uid && GUID_RE.test(uid)) ensure(uid, row);
  }

  for (const row of balance.prices) {
    const uid = readString(row, "Item", "Source", "uid", "UID", "Ref", "UUID", "Uuid");
    if (uid) ensure(uid).prices.push(row);
  }

  for (const row of balance.stocks) {
    const uid = readString(row, "Item", "item");
    if (uid) ensure(uid).stocks.push(row);
  }

  for (const row of balance.itemSeries) {
    const itemUid = readString(row, "Item", "item", "Owner", "Nomenclature", "NomenclatureRef");
    if (itemUid) ensure(itemUid).itemSeries.push(row);
  }

  const discountLeafUids = buildLeafItemUidsByGroupUid(balance.items);
  for (const row of balance.discounts) {
    const directItem = readString(row, "Item", "item", "NomenclatureRef", "ProductRef");
    const items = Array.isArray(row.Items) ? row.Items : Array.isArray(row.items) ? row.items : [];
    const targetUids = [
      directItem,
      ...items
        .map((item) => (item && typeof item === "object" ? readString(item as Record<string, unknown>, "Item", "item") : ""))
        .filter(Boolean),
    ].filter((uid) => GUID_RE.test(uid));

    for (const uid of targetUids) {
      const leafUids = discountLeafUids.get(uid.toLowerCase());
      for (const effectiveUid of leafUids?.length ? leafUids : [uid]) {
        ensure(effectiveUid).discounts.push(row);
      }
    }
  }

  return map;
}

function buildTaxationByUid(rows: Record<string, unknown>[]) {
  const map = new Map<string, string>();
  for (const row of rows) {
    const uid = readString(row, "Item", "Source", "uid", "UID", "Ref", "UUID", "Uuid");
    const taxation = readString(row, "VATRate", "VatRate", "TaxRate", "Taxation", "taxation", "VAT");
    if (uid && taxation) map.set(uid.toLowerCase(), taxation);
  }
  return map;
}

type BalanceDiscount = {
  name: string | null;
  percent: number | null;
  amount: number | null;
  condition: string | null;
  schedule: string | null;
};

type BalanceDiscountRule = {
  externalUid: string;
  code: string | null;
  name: string;
  type: "percent" | "amount" | "fixed_price";
  scope: "all_products" | "products" | "categories" | "cart" | "customer";
  value: number | null;
  currency: string;
  priority: number;
  stackable: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  minQuantity: number | null;
  minAmount: number | null;
  channel: string;
  notes: string | null;
  productIds: string[];
  customerIds: string[];
  conditions: { field: string; operator: string; value: string | number }[];
};

function mapBalanceDiscountRule(
  row: Record<string, unknown>,
  catalogRows: Record<string, unknown>[],
  groupLeafUids: Map<string, string[]>,
  productByExternalUid: Map<string, string>,
): BalanceDiscountRule | null {
  const code = readString(row, "Code", "code", "DiscountCode") || null;
  const externalUid =
    readString(row, "uid", "UID", "Ref", "UUID", "Uuid", "Id") ||
    code ||
    readString(row, "Name", "Description", "DiscountName");
  if (!externalUid) return null;

  const percent = readNumber(row, "Percentage", "Percent", "DiscountPercent", "discountPercent");
  const balanceCondition = readString(row, "DiscountCondition", "discountCondition");
  const amountCondition = balanceCondition.includes("თანხ");
  const amount = amountCondition ? undefined : readNumber(row, "DiscountAmount", "Amount", "Sum", "FixedDiscount");
  const fixedPrice = readNumber(row, "FixedPrice", "NewPrice", "PriceAfterDiscount");
  const specialPrice = readString(row, "SpecialPrice", "SpecialPriceRef", "PriceType");
  const type = percent !== undefined ? "percent" : fixedPrice !== undefined || specialPrice ? "fixed_price" : "amount";
  const value = percent ?? fixedPrice ?? amount ?? null;
  if (value === null && !specialPrice) return null;

  const targetUids = balanceDiscountTargetUids(row);
  const productIds = Array.from(
    new Set(
      targetUids.flatMap((uid) => {
        const leafUids = groupLeafUids.get(uid.toLowerCase());
        const effectiveUids = leafUids?.length ? leafUids : [uid];
        return effectiveUids
          .map((effectiveUid) => productByExternalUid.get(effectiveUid.toLowerCase()))
          .filter((productId): productId is string => Boolean(productId));
      }),
    ),
  );
  const condition = balanceCondition;
  const nameText = readString(row, "Name", "Description", "DiscountName");
  const customer =
    readString(row, "Customer", "CustomerRef", "Client", "ClientRef", "Partner", "PartnerRef") ||
    (nameText.includes("მყიდველ") ? readString(row, "Comments", "Comment") : "");
  const minAmount = readNumber(row, "MinAmount", "MinimumAmount", "MinSum", "ThresholdAmount") ?? (amountCondition ? readNumber(row, "Amount") : undefined);
  const minQuantity = readNumber(row, "MinQuantity", "MinimumQuantity", "QuantityFrom");
  const scope = balanceDiscountScope(row, targetUids, productIds, customer, minAmount);
  const conditionCandidates: Array<{ field: string; operator: string; value: string | number } | null> = [
    condition && !discountAppliesUnconditionally(row) ? { field: "balance_condition", operator: "contains", value: condition } : null,
    customer ? { field: "customer", operator: "equals", value: customer } : null,
    specialPrice ? { field: "balance_special_price", operator: "equals", value: specialPrice } : null,
    minAmount !== undefined ? { field: "cart_total", operator: "gte", value: minAmount } : null,
    minQuantity !== undefined ? { field: "quantity", operator: "gte", value: minQuantity } : null,
    discountScheduleText(row) ? { field: "schedule", operator: "contains", value: discountScheduleText(row) } : null,
  ];
  const conditions = conditionCandidates.filter((item): item is { field: string; operator: string; value: string | number } => Boolean(item));
  const customerIds = customer ? [customer] : [];

  return {
    externalUid,
    code,
    name: uniqueBalanceDiscountName(readString(row, "Name", "Description", "DiscountName") || code || externalUid, externalUid),
    type,
    scope,
    value,
    currency: readString(row, "Currency", "currency") || "GEL",
    priority: readInteger(row, "Priority", "priority") ?? 100,
    stackable: readBoolean(row, "Stackable", "CanBeCombined", "stackable") ?? false,
    startsAt: parseBalanceDate(readString(row, "StartDate", "startDate")),
    endsAt: parseBalanceDate(readString(row, "EndDate", "endDate")),
    minQuantity: minQuantity ?? null,
    minAmount: minAmount ?? null,
    channel: readString(row, "Channel", "SalesChannel", "channel") || "all",
    notes: condition || discountScheduleText(row) || null,
    productIds,
    customerIds,
    conditions,
  };
}

function balanceDiscountTargetUids(row: Record<string, unknown>) {
  const directItem = readString(row, "Item", "item", "NomenclatureRef", "ProductRef");
  const items = Array.isArray(row.Items) ? row.Items : Array.isArray(row.items) ? row.items : [];
  return [
    directItem,
    ...items
      .map((item) => (item && typeof item === "object" ? readString(item as Record<string, unknown>, "Item", "item", "uid", "UID", "Ref") : ""))
      .filter(Boolean),
  ].filter((uid) => GUID_RE.test(uid));
}

function balanceDiscountScope(
  row: Record<string, unknown>,
  targetUids: string[],
  productIds: string[],
  customer: string,
  minAmount?: number,
): BalanceDiscountRule["scope"] {
  const rawScope = readString(row, "Scope", "DiscountScope", "Type", "RuleType").toLowerCase();
  if (customer || rawScope.includes("customer") || rawScope.includes("client") || rawScope.includes("partner")) return "customer";
  if (minAmount !== undefined || rawScope.includes("cart") || rawScope.includes("sum") || rawScope.includes("amount")) return "cart";
  if (targetUids.length > 0 || productIds.length > 0) return "products";
  return "all_products";
}

function uniqueBalanceDiscountName(name: string, externalUid: string) {
  return `Balance: ${name}`.slice(0, 180) || `Balance: ${externalUid}`;
}

function buildDiscountByItemUid(rows: Record<string, unknown>[], catalogRows: Record<string, unknown>[]) {
  const map = new Map<string, BalanceDiscount>();
  let unconditional: BalanceDiscount | undefined;
  const groupLeafUids = buildLeafItemUidsByGroupUid(catalogRows);

  for (const row of rows) {
    if (!discountRuleIsActive(row)) continue;

    const directItem = readString(row, "Item", "item", "NomenclatureRef", "ProductRef");
    const items = Array.isArray(row.Items) ? row.Items : Array.isArray(row.items) ? row.items : [];
    const targetUids = [
      directItem,
      ...items
        .map((item) => (item && typeof item === "object" ? readString(item as Record<string, unknown>, "Item", "item") : ""))
        .filter(Boolean),
    ].filter((uid) => GUID_RE.test(uid));

    const percent = readNumber(row, "Percentage", "Percent", "DiscountPercent", "discountPercent");
    const amount = readNumber(row, "DiscountAmount", "Amount", "Sum", "FixedDiscount");
    const name = readString(row, "Name", "Description", "DiscountName", "Code") || null;
    const entry = {
      name,
      percent: percent ?? null,
      amount: amount ?? null,
      condition: readString(row, "DiscountCondition", "discountCondition") || null,
      schedule: discountScheduleText(row) || null,
    };

    if (targetUids.length === 0 && items.length === 0 && discountAppliesUnconditionally(row)) {
      unconditional = preferHigherDiscount(unconditional, entry);
      continue;
    }

    for (const uid of targetUids) {
      const leafUids = groupLeafUids.get(uid.toLowerCase());
      const effectiveUids = leafUids?.length ? leafUids : [uid];
      for (const effectiveUid of effectiveUids) {
        const key = effectiveUid.toLowerCase();
        map.set(key, preferHigherDiscount(map.get(key), entry));
      }
    }
  }

  return { byItemUid: map, unconditional };
}

function discountRuleIsActive(row: Record<string, unknown>) {
  const flag = String(row.IsActive ?? row.isActive ?? "true").trim().toLowerCase();
  if (!["true", "1", "yes"].includes(flag)) return false;

  const start = readString(row, "StartDate", "startDate");
  const end = readString(row, "EndDate", "endDate");
  if (!start && !end) return true;

  const now = new Date();
  const startDate = parseBalanceDate(start);
  const endDate = parseBalanceDate(end);

  if (startDate && now < startDate) return false;
  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
    if (now > endDate) return false;
  }
  return true;
}

function discountAppliesUnconditionally(row: Record<string, unknown>) {
  const condition = readString(row, "DiscountCondition", "discountCondition").toLowerCase();
  return !condition || condition === "უპირობოდ";
}

function discountScheduleText(row: Record<string, unknown>) {
  const raw = row.Schedule ?? row.schedule ?? row.ScheduleDescription;
  const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return rows
    .map((value) => {
      if (!value || typeof value !== "object") return String(value);
      const record = value as Record<string, unknown>;
      const weekDay = readString(record, "WeekDay", "weekDay");
      const start = readString(record, "StartPeriod", "startPeriod");
      const end = readString(record, "EndPeriod", "endPeriod");
      return [weekDay || "დღე", start || end ? `${start || "00:00:00"}-${end || "23:59:59"}` : ""]
        .filter(Boolean)
        .join(" · ");
    })
    .filter(Boolean)
    .join("; ");
}

function preferHigherDiscount(previous: BalanceDiscount | undefined, next: BalanceDiscount) {
  if (!previous) return next;
  const previousPercent = previous.percent ?? 0;
  const nextPercent = next.percent ?? 0;
  return nextPercent >= previousPercent ? next : previous;
}

function buildLeafItemUidsByGroupUid(rows: Record<string, unknown>[]) {
  const byUid = new Map<string, Record<string, unknown>>();
  const out = new Map<string, string[]>();
  for (const row of rows) {
    const uid = readString(row, "uid", "UID", "Ref", "UUID", "Uuid", "Id");
    if (uid) byUid.set(uid.toLowerCase(), row);
  }

  for (const row of rows) {
    if (isGroupRow(row)) continue;
    const leafUid = readString(row, "uid", "UID", "Ref", "UUID", "Uuid", "Id");
    if (!leafUid) continue;
    let groupUid = readString(row, "Group", "group", "GroupRef");
    const seen = new Set<string>();
    for (let depth = 0; depth < 50; depth++) {
      if (!groupUid || groupUid === NULL_BALANCE_UID) break;
      const key = groupUid.toLowerCase();
      if (seen.has(key)) break;
      seen.add(key);
      const current = out.get(key) ?? [];
      current.push(leafUid);
      out.set(key, current);
      const parent = byUid.get(key);
      groupUid = parent ? readString(parent, "Group", "group", "GroupRef") : "";
    }
  }

  return out;
}

function parseBalanceDate(value: string) {
  if (!value) return null;
  const dmy = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value.trim());
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildWarehouseNameByUid(rows: Record<string, unknown>[]) {
  const map = new Map<string, string>();
  for (const row of rows) {
    const uid = readString(row, "uid", "UID", "Ref", "UUID", "Uuid", "Id");
    const name = readString(row, "Name", "FullName", "Description");
    if (uid && name) map.set(uid.toLowerCase(), name);
  }
  return map;
}

type StockAggregate = {
  quantity: number;
  reserve: number;
  seriesUids: Set<string>;
  lines: BalanceProductPreview["stockBreakdown"];
};

type SeriesInfo = {
  name: string | null;
  expiryDate: string | null;
};

function buildSeriesByUid(rows: Record<string, unknown>[]) {
  const map = new Map<string, SeriesInfo>();
  for (const row of rows) {
    const uid = readString(row, "uid", "UID", "Ref", "UUID", "Uuid", "Id");
    if (!uid) continue;
    map.set(uid.toLowerCase(), {
      name: readString(row, "Name", "SeriesNumber", "SerialNumber", "Number") || null,
      expiryDate: readString(row, "ValidUntil", "ValidTo", "ExpiryDate", "Expiry") || null,
    });
  }
  return map;
}

function aggregateStocksByItemUid(
  rows: Record<string, unknown>[],
  warehouseNames: Map<string, string>,
  seriesByUid: Map<string, SeriesInfo>,
) {
  const map = new Map<string, StockAggregate>();
  for (const row of rows) {
    const itemUid = readString(row, "Item", "item");
    if (!itemUid) continue;

    const warehouseUid = readString(row, "Warehouse", "warehouse", "Storage", "Store");
    const quantity = readNumber(row, "Quantity", "quantity", "Qty", "Balance", "Amount", "Rest") ?? 0;
    const reserve = readNumber(row, "Reserve", "reserve", "Reserved", "ReservedQuantity", "ReserveQuantity") ?? 0;
    const current = map.get(itemUid.toLowerCase()) ?? { quantity: 0, reserve: 0, seriesUids: new Set<string>(), lines: [] };
    const seriesUid = readString(row, "Series", "series", "ItemSeries", "Batch", "Lot");
    const series = seriesUid ? seriesByUid.get(seriesUid.toLowerCase()) : undefined;

    current.quantity += quantity;
    current.reserve += reserve;
    if (seriesUid) current.seriesUids.add(seriesUid.toLowerCase());
    current.lines.push({
      warehouseUid,
      warehouseName: warehouseUid ? warehouseNames.get(warehouseUid.toLowerCase()) ?? null : null,
      quantity,
      reserve,
      seriesUid: seriesUid || null,
      seriesName: series?.name ?? (readString(row, "SeriesNumber", "SerialNumber", "LotNumber") || null),
      expiryDate: series?.expiryDate ?? (readString(row, "ValidUntil", "ValidTo", "ExpiryDate", "Expiry") || null),
    });
    map.set(itemUid.toLowerCase(), current);
  }
  return map;
}

function summarizePreview(preview: BalanceProductPreview[]) {
  return {
    total: preview.length,
    create: preview.filter((row) => row.action === "create").length,
    update: preview.filter((row) => row.action === "update").length,
    conflicts: preview.filter((row) => row.action === "conflict").length,
    skipped: preview.filter((row) => row.action === "skip").length,
  };
}

function jsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(attempt: number) {
  return 450 * (attempt + 1) + Math.floor(Math.random() * 250);
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function normalizeConfig(value: unknown): BalanceImportRequest & { lastUsedAt?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    publicationId: typeof record.publicationId === "string" ? record.publicationId : undefined,
    username: typeof record.username === "string" ? record.username : undefined,
    password: typeof record.password === "string" ? record.password : undefined,
    authorization: typeof record.authorization === "string" ? record.authorization : undefined,
    itemsUrl: typeof record.itemsUrl === "string" ? record.itemsUrl : undefined,
    lastUsedAt: typeof record.lastUsedAt === "string" ? record.lastUsedAt : undefined,
  };
}

function valueOrPrevious(next?: string, previous?: string) {
  const trimmed = next?.trim();
  if (trimmed && trimmed !== "••••••••") return trimmed;
  return previous;
}
