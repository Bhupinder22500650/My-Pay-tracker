import { calculateTax, PERIODS_FOR_BRACKET } from "./taxEngine";
import { CompanyEntry } from "./types";

export interface PayResult {
  gross: number;
  tax: number;
  net: number;
  effectiveRate: number;
}

/**
 * Calculates the gross, tax, and net pay for a single shift entry.
 */
export function calculateShiftPay(entry: CompanyEntry & { holidayPay?: boolean }): PayResult {
  const rate = parseFloat(entry.payRate) || 0;
  const hours = parseFloat(entry.hoursWorked) || 0;
  const baseGross = rate * hours;
  const grossWithHolidayPay = entry.holidayPay ? baseGross * 1.08 : baseGross;

  const periodsPerYear = PERIODS_FOR_BRACKET[entry.incomeBracketKey ?? "15601-53500"] ?? 52;
  const taxResult = calculateTax(grossWithHolidayPay, entry.taxCode, periodsPerYear);

  return {
    gross: taxResult.gross,
    tax: taxResult.tax,
    net: taxResult.net,
    effectiveRate: taxResult.effectiveRate,
  };
}

/**
 * Calculates the total gross, tax, and net pay for an array of shift entries.
 */
export function calculateDayTotals(companies: (CompanyEntry & { holidayPay?: boolean })[]): PayResult {
  const totals = companies.reduce(
    (acc, entry) => {
      const result = calculateShiftPay(entry);
      return {
        gross: acc.gross + result.gross,
        tax: acc.tax + result.tax,
        net: acc.net + result.net,
      };
    },
    { gross: 0, tax: 0, net: 0 }
  );
  
  return {
    ...totals,
    effectiveRate: totals.gross > 0 ? totals.tax / totals.gross : 0,
  };
}
