import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { parseSessionToken } from "../../common/session";
import { PrismaService } from "../../prisma/prisma.service";

type ImportPurchaseInput = {
  supplierName: string;
  supplierTaxId?: string;
  documentNumber: string;
  documentDate?: string;
  warehouseId?: string;
  lines: Array<{
    externalName: string;
    externalSku?: string;
    quantity: number;
    unitCost: number;
    vatRate?: number;
  }>;
};

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(authorization?: string) {
    const session = parseSessionToken(authorization);

    return this.prisma.purchaseDocument.findMany({
      where: { companyId: session.companyId },
      include: {
        warehouse: true,
        lines: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async importDocument(authorization: string | undefined, input: ImportPurchaseInput) {
    const session = parseSessionToken(authorization);

    if (!input.supplierName?.trim() || !input.documentNumber?.trim()) {
      throw new BadRequestException("Supplier and document number are required.");
    }

    if (!Array.isArray(input.lines) || input.lines.length === 0) {
      throw new BadRequestException("At least one line is required.");
    }

    const products = await this.prisma.product.findMany({
      where: { companyId: session.companyId, isPurchasable: true },
    });
    const productsBySku = new Map(
      products
        .filter((product) => product.sku)
        .map((product) => [product.sku?.toLowerCase(), product]),
    );

    const lines = input.lines.map((line) => {
      const product = line.externalSku
        ? productsBySku.get(line.externalSku.toLowerCase())
        : undefined;
      const quantity = Number(line.quantity);
      const unitCost = Number(line.unitCost);
      const vatRate = Number(line.vatRate ?? 18);

      if (!line.externalName?.trim() || quantity <= 0 || unitCost < 0) {
        throw new BadRequestException("Purchase line values are invalid.");
      }

      return {
        externalName: line.externalName.trim(),
        externalSku: line.externalSku?.trim() || null,
        productId: product?.id,
        quantity,
        unitCost,
        vatRate,
        lineTotal: quantity * unitCost,
      };
    });

    const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const vatTotal = lines.reduce(
      (sum, line) => sum + (line.lineTotal * line.vatRate) / 100,
      0,
    );
    const status = lines.every((line) => line.productId)
      ? "ready_to_receive"
      : "needs_mapping";

    return this.prisma.purchaseDocument.create({
      data: {
        companyId: session.companyId,
        warehouseId: input.warehouseId || null,
        supplierName: input.supplierName.trim(),
        supplierTaxId: input.supplierTaxId?.trim() || null,
        documentNumber: input.documentNumber.trim(),
        documentDate: input.documentDate ? new Date(input.documentDate) : new Date(),
        source: "rs_import",
        status,
        total,
        vatTotal,
        lines: { create: lines },
      },
      include: {
        warehouse: true,
        lines: { include: { product: true } },
      },
    });
  }

  async mapLines(
    authorization: string | undefined,
    id: string,
    mappings: Array<{ lineId: string; productId: string }>,
  ) {
    const session = parseSessionToken(authorization);

    const purchase = await this.getPurchase(session.companyId, id);

    for (const mapping of mappings) {
      const product = await this.prisma.product.findFirst({
        where: {
          id: mapping.productId,
          companyId: session.companyId,
          isPurchasable: true,
        },
      });

      if (!product) {
        throw new NotFoundException("Product does not exist.");
      }

      await this.prisma.purchaseLine.updateMany({
        where: { id: mapping.lineId, purchaseId: purchase.id },
        data: { productId: product.id },
      });
    }

    const unmappedCount = await this.prisma.purchaseLine.count({
      where: { purchaseId: purchase.id, productId: null },
    });

    return this.prisma.purchaseDocument.update({
      where: { id: purchase.id },
      data: { status: unmappedCount === 0 ? "ready_to_receive" : "needs_mapping" },
      include: { warehouse: true, lines: { include: { product: true } } },
    });
  }

  async receive(authorization: string | undefined, id: string, warehouseId?: string) {
    const session = parseSessionToken(authorization);
    const purchase = await this.getPurchase(session.companyId, id);
    const targetWarehouseId = warehouseId ?? purchase.warehouseId;

    if (!targetWarehouseId) {
      throw new BadRequestException("Warehouse is required to receive purchase.");
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: targetWarehouseId, companyId: session.companyId },
    });

    if (!warehouse) {
      throw new NotFoundException("Warehouse does not exist.");
    }

    if (purchase.lines.some((line) => !line.productId)) {
      throw new BadRequestException("All purchase lines must be mapped first.");
    }

    return this.prisma.$transaction(async (tx) => {
      for (const line of purchase.lines) {
        const product = line.product;

        if (!product?.tracksInventory || !line.productId) {
          continue;
        }

        await tx.inventoryMovement.create({
          data: {
            companyId: session.companyId,
            productId: line.productId,
            warehouseId: targetWarehouseId,
            purchaseId: purchase.id,
            lineId: line.id,
            type: "purchase_in",
            quantity: line.quantity,
            unitCost: line.unitCost,
            note: `RS import ${purchase.documentNumber}`,
          },
        });
      }

      return tx.purchaseDocument.update({
        where: { id: purchase.id },
        data: { status: "received", warehouseId: targetWarehouseId },
        include: { warehouse: true, lines: { include: { product: true } } },
      });
    });
  }

  private async getPurchase(companyId: string, id: string) {
    const purchase = await this.prisma.purchaseDocument.findFirst({
      where: { id, companyId },
      include: {
        warehouse: true,
        lines: { include: { product: true } },
      },
    });

    if (!purchase) {
      throw new NotFoundException("Purchase does not exist.");
    }

    return purchase;
  }
}
