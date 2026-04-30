// lib/taxEngine.ts
// 🇳🇿 New Zealand PAYE Tax Engine — 2024/25 tax year
// Reference: https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals/tax-rates-for-individuals

// ─── Progressive brackets (annual) ───────────────────────────────────────────
const PROGRESSIVE_BRACKETS = [
  { upTo: 15_600,  rate: 0.105 },
  { upTo: 53_500,  rate: 0.175 },
  { upTo: 78_100,  rate: 0.30  },
  { upTo: 180_000, rate: 0.33  },
  { upTo: Infinity, rate: 0.39  },
];

// ACC Earner Levy 2024/25 — applied on top of income tax for M/ME codes
const ACC_LEVY_RATE = 0.0153; // 1.53 cents per dollar up to max earnings
const ACC_MAX_EARNINGS = 142_283; // 2024/25 maximum liable earnings

// ─── Secondary / flat-rate codes ─────────────────────────────────────────────
const SECONDARY_RATES: Record<string, number> = {
  SB:  0.105,
  S:   0.175,
  SH:  0.30,
  ST:  0.33,
  SA:  0.39,
  SL:  0.175, // Student-loan variant of S
  ME:  0.105, // handled specially with rebate — simplified here as primary
};

export const PERIODS_FOR_BRACKET: Record<string, number> = {
  "0-15600": 52,
  "15601-53500": 52,
  "53501-78100": 52,
  "78101-180000": 52,
  "180000+": 52,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calculate the progressive PAYE on a given annual income for primary codes.
 * Returns the tax owing for the full year.
 */
function calcAnnualPAYE(annualIncome: number): number {
  let tax = 0;
  let prev = 0;
  for (const bracket of PROGRESSIVE_BRACKETS) {
    if (annualIncome <= prev) break;
    const taxable = Math.min(annualIncome, bracket.upTo) - prev;
    tax += taxable * bracket.rate;
    prev = bracket.upTo;
  }
  return tax;
}

/**
 * Calculate ACC levy on a pay-period gross (pro-rated from annual).
 */
function calcACCForPeriod(periodGross: number, periodsPerYear: number): number {
  const annualEquivalent = periodGross * periodsPerYear;
  const liableAnnual = Math.min(annualEquivalent, ACC_MAX_EARNINGS);
  const annualLevy = liableAnnual * ACC_LEVY_RATE;
  return annualLevy / periodsPerYear;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type TaxResult = {
  gross: number;    // before tax
  tax: number;      // PAYE + ACC
  net: number;      // take-home
  effectiveRate: number; // as fraction, e.g. 0.217 = 21.7%
};

/**
 * Calculate PAYE tax for a single pay period.
 *
 * @param grossPeriod   - gross pay for this pay period (after any holiday-pay uplift)
 * @param taxCode       - NZ tax code string: M, ME, S, SH, ST, SA, SB, SL
 * @param periodsPerYear - how many pay periods in a year (52 = weekly, 26 = fortnightly, 12 = monthly)
 *                         defaults to 52 (weekly) — most shift workers are paid weekly
 * @returns TaxResult
 */
export function calculateTax(
  grossPeriod: number,
  taxCode: string,
  periodsPerYear = 52
): TaxResult {
  if (grossPeriod <= 0 || isNaN(grossPeriod)) {
    return { gross: 0, tax: 0, net: 0, effectiveRate: 0 };
  }

  const code = taxCode?.toUpperCase() ?? "M";

  let tax: number;

  if (code === "M" || code === "ME") {
    // Progressive: annualise → calculate annual PAYE → divide back
    const annualEquiv = grossPeriod * periodsPerYear;
    const annualTax = calcAnnualPAYE(annualEquiv);
    const periodTax = annualTax / periodsPerYear;
    const accLevy = calcACCForPeriod(grossPeriod, periodsPerYear);
    tax = periodTax + accLevy;
  } else if (code in SECONDARY_RATES) {
    // Flat secondary rate — no ACC on secondary income
    tax = grossPeriod * SECONDARY_RATES[code];
  } else {
    // Unknown — fall back to M calculation
    const annualEquiv = grossPeriod * periodsPerYear;
    const annualTax = calcAnnualPAYE(annualEquiv);
    tax = annualTax / periodsPerYear;
  }

  // Clamp — tax can't exceed gross
  tax = Math.min(tax, grossPeriod);
  const net = grossPeriod - tax;

  return {
    gross: grossPeriod,
    tax,
    net,
    effectiveRate: tax / grossPeriod,
  };
}

/**
 * Helper to get a human-readable effective rate string.
 * e.g. 0.217 → "21.7%"
 */
export function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Unified tax code list — single source of truth for the whole app.
 */
export const ALL_TAX_CODES = ["M", "ME", "S", "SB", "SH", "ST", "SA", "SL"] as const;
export type TaxCode = (typeof ALL_TAX_CODES)[number];

/**
 * Returns true if the tax code is a primary (progressive) code.
 */
export function isPrimaryCode(code: string): boolean {
  return code === "M" || code === "ME";
}
