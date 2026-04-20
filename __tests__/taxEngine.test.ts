// __tests__/taxEngine.test.ts
// 🧪 Unit tests for the NZ PAYE tax engine.
//    Reference values verified against IRD's PAYE calculator.
//    Run: npm test

import { calculateTax, isPrimaryCode, ALL_TAX_CODES } from "../lib/taxEngine";

// ─── Helper ───────────────────────────────────────────────────────────────────
// Round to 2 decimal places to match IRD's rounding behaviour
const r = (n: number) => Math.round(n * 100) / 100;

// ─── isPrimaryCode ────────────────────────────────────────────────────────────
describe("isPrimaryCode", () => {
  it("returns true for M", () => expect(isPrimaryCode("M")).toBe(true));
  it("returns true for ME", () => expect(isPrimaryCode("ME")).toBe(true));
  it("returns false for S", () => expect(isPrimaryCode("S")).toBe(false));
  it("returns false for SH", () => expect(isPrimaryCode("SH")).toBe(false));
  it("returns false for empty string", () => expect(isPrimaryCode("")).toBe(false));
});

// ─── ALL_TAX_CODES ────────────────────────────────────────────────────────────
describe("ALL_TAX_CODES", () => {
  it("contains M", () => expect(ALL_TAX_CODES).toContain("M"));
  it("contains ME", () => expect(ALL_TAX_CODES).toContain("ME"));
  it("contains S", () => expect(ALL_TAX_CODES).toContain("S"));
  it("contains SA", () => expect(ALL_TAX_CODES).toContain("SA"));
  it("has no duplicates", () => {
    const unique = new Set(ALL_TAX_CODES);
    expect(unique.size).toBe(ALL_TAX_CODES.length);
  });
});

// ─── calculateTax — edge cases ────────────────────────────────────────────────
describe("calculateTax — edge cases", () => {
  it("returns zero for zero gross", () => {
    const result = calculateTax(0, "M");
    expect(result.gross).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.net).toBe(0);
  });

  it("returns zero for negative gross", () => {
    const result = calculateTax(-100, "M");
    expect(result.gross).toBe(0);
    expect(result.net).toBe(0);
  });

  it("tax never exceeds gross", () => {
    const result = calculateTax(1, "SA"); // 39% flat on $1
    expect(result.tax).toBeLessThanOrEqual(result.gross);
  });

  it("net = gross - tax always", () => {
    const cases = [
      calculateTax(500, "M"),
      calculateTax(1000, "S"),
      calculateTax(300, "SH"),
    ];
    for (const c of cases) {
      expect(r(c.net)).toBe(r(c.gross - c.tax));
    }
  });

  it("effective rate is a fraction between 0 and 1", () => {
    const result = calculateTax(800, "M");
    expect(result.effectiveRate).toBeGreaterThan(0);
    expect(result.effectiveRate).toBeLessThan(1);
  });
});

// ─── calculateTax — secondary flat codes ─────────────────────────────────────
describe("calculateTax — secondary codes (flat rates)", () => {
  // SB: 10.5% flat
  it("SB: $500 gross → ~$52.50 tax", () => {
    const res = calculateTax(500, "SB");
    expect(r(res.tax)).toBe(r(500 * 0.105));
    expect(r(res.net)).toBe(r(500 - 500 * 0.105));
  });

  // S: 17.5% flat
  it("S: $600 gross → $105 tax", () => {
    const res = calculateTax(600, "S");
    expect(r(res.tax)).toBe(r(600 * 0.175));
  });

  // SH: 30% flat
  it("SH: $800 gross → $240 tax", () => {
    const res = calculateTax(800, "SH");
    expect(r(res.tax)).toBe(r(800 * 0.30));
  });

  // ST: 33% flat
  it("ST: $1000 gross → $330 tax", () => {
    const res = calculateTax(1000, "ST");
    expect(r(res.tax)).toBe(r(1000 * 0.33));
  });

  // SA: 39% flat
  it("SA: $1000 gross → $390 tax", () => {
    const res = calculateTax(1000, "SA");
    expect(r(res.tax)).toBe(r(1000 * 0.39));
  });
});

// ─── calculateTax — M code progressive ───────────────────────────────────────
describe("calculateTax — M code (progressive + ACC)", () => {
  // A worker earning $300/week = $15,600/year → 10.5% bracket only
  it("$300/week ($15,600 annual) is entirely in the 10.5% bracket", () => {
    const res = calculateTax(300, "M", 52);
    // Annual PAYE: $15,600 * 10.5% = $1,638 → per week: $31.50
    // ACC: min($15,600, $142,283) * 1.53% / 52 = $4.59
    const expectedPAYE = (15600 * 0.105) / 52;
    const expectedACC = (Math.min(15600, 142283) * 0.0153) / 52;
    expect(r(res.tax)).toBe(r(expectedPAYE + expectedACC));
    expect(res.gross).toBe(300);
  });

  // A worker earning $1,028.85/week ≈ $53,500/year — top of 17.5% bracket
  it("$1028.85/week ($53,500 annual) — first $15,600 at 10.5%, rest at 17.5%", () => {
    const weekly = 53500 / 52;
    const res = calculateTax(weekly, "M", 52);
    // Annual PAYE: (15600*0.105) + (53500-15600)*0.175 = 1638 + 6632.5 = 8270.5
    const annualPAYE = 15600 * 0.105 + (53500 - 15600) * 0.175;
    const expectedPAYE = annualPAYE / 52;
    const expectedACC = (Math.min(53500, 142283) * 0.0153) / 52;
    expect(r(res.tax)).toBe(r(expectedPAYE + expectedACC));
  });

  // Higher earner: $2000/week ≈ $104k annual — spans 4 brackets
  it("$2000/week ($104k annual) spans 4 progressive brackets", () => {
    const annual = 2000 * 52; // $104,000
    const res = calculateTax(2000, "M", 52);
    // Annual PAYE: 15600*0.105 + (53500-15600)*0.175 + (78100-53500)*0.30 + (104000-78100)*0.33
    const annualPAYE =
      15600 * 0.105 +
      (53500 - 15600) * 0.175 +
      (78100 - 53500) * 0.3 +
      (annual - 78100) * 0.33;
    const expectedPAYE = annualPAYE / 52;
    const expectedACC = (Math.min(annual, 142283) * 0.0153) / 52;
    expect(r(res.tax)).toBe(r(expectedPAYE + expectedACC));
  });

  it("net is always lower than gross for positive earners", () => {
    for (const weekly of [100, 300, 500, 1000, 2000, 5000]) {
      const res = calculateTax(weekly, "M");
      expect(res.net).toBeLessThan(res.gross);
    }
  });

  it("progressive tax means effective rate increases with income", () => {
    const low = calculateTax(300, "M");
    const high = calculateTax(3000, "M");
    expect(high.effectiveRate).toBeGreaterThan(low.effectiveRate);
  });
});

// ─── calculateTax — holiday pay ───────────────────────────────────────────────
describe("calculateTax — holiday pay uplift", () => {
  it("taxing 8% holiday pay gives higher gross than taxing without", () => {
    const base = 8 * 25; // 8 hours at $25/hr = $200
    const withHP = base * 1.08;
    const noHP = calculateTax(base, "M");
    const withHPResult = calculateTax(withHP, "M");
    expect(withHPResult.gross).toBeGreaterThan(noHP.gross);
    expect(withHPResult.net).toBeGreaterThan(noHP.net);
  });
});
