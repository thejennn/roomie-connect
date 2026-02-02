import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a VND amount for display.
 * Examples:
 *  formatCurrency(5000000) -> "5.000.000₫"
 *  formatCurrency(125000)  -> "125.000₫"
 */
export function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return "";
  try {
    return value.toLocaleString("vi-VN") + "₫";
  } catch {
    return String(value) + "₫";
  }
}

