export type MoneyValue = string | number | bigint;

export function toMoney(value: MoneyValue): string {
  if (typeof value === 'bigint') {
    return (Number(value) / 100).toFixed(2);
  }

  if (typeof value === 'number') {
    return Number(value).toFixed(2);
  }

  const normalized = value.trim();

  if (!normalized) {
    return '0.00';
  }

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) {
    throw new Error(`Invalid monetary value: ${value}`);
  }

  return numeric.toFixed(2);
}

export function moneyToCents(value: MoneyValue): number {
  return Math.round(Number(toMoney(value)) * 100);
}

export function isNonNegativeMoney(value: MoneyValue): boolean {
  const numeric = Number(toMoney(value));
  return Number.isFinite(numeric) && numeric >= 0;
}

export function normalizeTenantScope(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}
