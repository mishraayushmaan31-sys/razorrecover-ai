import type { Merchant, Prisma } from '@prisma/client';
import { BaseRepository } from './base-repository.js';

export type MerchantCreateInput = Prisma.MerchantCreateInput;
export type MerchantUpdateInput = Prisma.MerchantUpdateInput;
export type MerchantFilterInput = Prisma.MerchantWhereInput;

export class MerchantRepository extends BaseRepository<
  Merchant,
  MerchantCreateInput,
  MerchantUpdateInput
> {
  async findById(id: string): Promise<Merchant | null> {
    return this.prisma.merchant.findUnique({
      where: { id, isDeleted: false },
    });
  }

  async findMany(filters: Record<string, unknown> = {}): Promise<Merchant[]> {
    const where = this.normalizeFilters(filters as MerchantFilterInput);
    return this.prisma.merchant.findMany({
      where: {
        ...where,
        isDeleted: false,
      },
    });
  }

  async create(input: MerchantCreateInput): Promise<Merchant> {
    return this.prisma.merchant.create({ data: input });
  }

  async update(id: string, input: MerchantUpdateInput): Promise<Merchant> {
    return this.prisma.merchant.update({
      where: { id },
      data: input,
    });
  }

  async remove(id: string): Promise<Merchant | null> {
    return this.prisma.merchant.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
