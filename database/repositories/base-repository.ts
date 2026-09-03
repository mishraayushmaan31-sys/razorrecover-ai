import type { Prisma, PrismaClient } from '@prisma/client';

export abstract class BaseRepository<T, TCreate, TUpdate> {
  constructor(protected readonly prisma: PrismaClient) {}

  protected normalizeFilters<TFilter extends Record<string, unknown>>(filters: TFilter) {
    return Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      ),
    );
  }

  protected async runTx<R>(fn: (tx: Prisma.TransactionClient) => Promise<R>): Promise<R> {
    return this.prisma.$transaction(fn);
  }

  protected buildIdempotencyValue(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    return value.trim();
  }

  abstract findById(id: string): Promise<T | null>;
  abstract findMany(filters?: Record<string, unknown>): Promise<T[]>;
  abstract create(input: TCreate): Promise<T>;
  abstract update(id: string, input: TUpdate): Promise<T>;
  abstract remove(id: string): Promise<T | null>;
}
