import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { parseSessionToken } from "../../common/session";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSaleDto } from "./dto/create-sale.dto";

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(authorization?: string) {
    const session = parseSessionToken(authorization);
    const db = this.prisma as PrismaService & { sale: any };
    const sales = await db.sale.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { lines: true },
    });

    return sales.map((sale: any) => ({
      ...sale,
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      discountPercent: Number(sale.discountPercent),
      total: Number(sale.total),
      lines: sale.lines.map((line: any) => ({
        ...line,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        lineTotal: Number(line.lineTotal),
      })),
    }));
  }

  async create(authorization: string | undefined, input: CreateSaleDto) {
    const session = parseSessionToken(authorization);

    if (!input.items?.length) {
      throw new BadRequestException("Cart is empty.");
    }

    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: {
        companyId: session.companyId,
        id: { in: productIds },
        status: "active",
        isSellable: true,
      },
      include: { movements: { select: { quantity: true } } },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException("One or more products do not exist.");
    }

    const warehouse = input.warehouseId
      ? await this.prisma.warehouse.findFirst({ where: { id: input.warehouseId, companyId: session.companyId } })
      : await this.prisma.warehouse.findFirst({ where: { companyId: session.companyId, status: "active" }, orderBy: { createdAt: "asc" } });

    if (!warehouse) {
      throw new BadRequestException("Warehouse is required before completing a sale.");
    }

    const lineInputs = input.items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) throw new NotFoundException("Product does not exist.");

      const stock = product.movements.reduce((sum, movement) => sum + Number(movement.quantity), 0);
      if (product.tracksInventory && stock < item.quantity) {
        throw new BadRequestException(`${product.name}: მარაგი არ არის საკმარისი.`);
      }

      const unitPrice = Number(product.salePrice);
      return {
        product,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      };
    });

    const subtotal = lineInputs.reduce((sum, line) => sum + line.lineTotal, 0);
    const discountPercent = input.discountPercent ?? 0;
    const discount = subtotal * (discountPercent / 100);
    const total = subtotal - discount;
    const todayPrefix = new Date().toISOString().slice(0, 10).replaceAll("-", "");

    return this.prisma.$transaction(async (tx) => {
      const db = tx as typeof tx & { sale: any };
      const todaysSales = await db.sale.count({
        where: {
          companyId: session.companyId,
          receiptNumber: { startsWith: `AZ-${todayPrefix}-` },
        },
      });
      const receiptNumber = `AZ-${todayPrefix}-${String(todaysSales + 1).padStart(5, "0")}`;

      const sale = await db.sale.create({
        data: {
          companyId: session.companyId,
          warehouseId: warehouse.id,
          receiptNumber,
          paymentMethod: input.paymentMethod,
          cashierId: session.userId,
          subtotal,
          discount,
          discountPercent,
          total,
          lines: {
            create: lineInputs.map((line) => ({
              productId: line.product.id,
              name: line.product.name,
              barcode: line.product.barcode,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal: line.lineTotal,
            })),
          },
        },
        include: { lines: true },
      });

      await Promise.all(
        lineInputs
          .filter((line) => line.product.tracksInventory)
          .map((line) =>
            tx.inventoryMovement.create({
              data: {
                companyId: session.companyId,
                productId: line.product.id,
                warehouseId: warehouse.id,
                type: "sale_out",
                quantity: -line.quantity,
                unitCost: line.product.costPrice,
                note: `Sale ${receiptNumber}`,
              },
            }),
          ),
      );

      return {
        ...sale,
        subtotal: Number(sale.subtotal),
        discount: Number(sale.discount),
        discountPercent: Number(sale.discountPercent),
        total: Number(sale.total),
        lines: sale.lines.map((line: any) => ({
          ...line,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          lineTotal: Number(line.lineTotal),
        })),
      };
    });
  }
}
