// lib/api/shifts.ts
// 🔹 Data access layer — all Supabase shift queries live here.
// Nothing outside this file should know about table names or column names.

import { supabase } from "../supabase";
import { CompanyEntry, DayRecord } from "../types";
import { calculateDayTotals } from "../payCalculations";

export type ShiftInsert = Omit<CompanyEntry, "id"> & { holidayPay?: boolean };

/** Fetch all shifts for the current user and group them by date. */
export async function fetchShifts(userId: string): Promise<DayRecord[]> {
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (error) throw error;
  if (!data) return [];

  const groups: Record<string, CompanyEntry[]> = {};
  for (const s of data) {
    if (!groups[s.date]) groups[s.date] = [];
    groups[s.date].push({
      id: s.id,
      companyOption: s.company_option,
      customCompany: s.custom_company || "",
      payRate: s.pay_rate.toString(),
      hoursWorked: s.hours_worked.toString(),
      taxCode: s.tax_code,
      incomeBracketKey: s.income_bracket_key || undefined,
      // holidayPay is an extension field — not in the base type, stored as any
      ...(s.holiday_pay !== undefined ? { holidayPay: s.holiday_pay } : {}),
    } as CompanyEntry & { holidayPay: boolean });
  }

  return Object.keys(groups).map((date) => {
    const companies = groups[date];
    const totals = calculateDayTotals(companies);
    return {
      date,
      companies,
      totalGross: totals.gross,
      totalTax: totals.tax,
      totalNet: totals.net,
    };
  });
}

/** Insert a new shift row. */
export async function createShift(
  userId: string,
  date: string,
  entry: ShiftInsert
): Promise<void> {
  const { error } = await supabase.from("shifts").insert({
    user_id: userId,
    date,
    company_option: entry.companyOption,
    custom_company: entry.customCompany,
    pay_rate: parseFloat(entry.payRate),
    hours_worked: parseFloat(entry.hoursWorked),
    tax_code: entry.taxCode,
    income_bracket_key: entry.incomeBracketKey ?? null,
    holiday_pay: entry.holidayPay ?? false,
  });
  if (error) throw error;
}

/** Delete a shift by id. */
export async function removeShift(id: string): Promise<void> {
  const { error } = await supabase.from("shifts").delete().eq("id", id);
  if (error) throw error;
}

/** Delete all shifts for a user (used by clearAllData). */
export async function removeAllShifts(userId: string): Promise<void> {
  const { error } = await supabase
    .from("shifts")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}
