import type { MoneyValue } from "../types/restaurant";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function parseMoney(value: MoneyValue): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toMinorUnits(value: MoneyValue): number {
  return Math.round(parseMoney(value) * 100);
}

export function formatMoney(value: MoneyValue): string {
  return currencyFormatter.format(parseMoney(value));
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

export function titleCaseStatus(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function shortId(value: string, length = 8): string {
  return value.length <= length ? value : value.slice(0, length);
}
