// app/types.ts
// 🔹 Shared types for MyPayTracker

export type ThemeOption = "system" | "light" | "dark";

export type CompanyEntry = {
  id: number;
  companyOption: string; // value from dropdown
  customCompany: string; // if "Custom" or user-typed
  payRate: string;       // hourly rate as string
  hoursWorked: string;   // hours as string
  taxCode: string;       // M, S, SH, etc.
  incomeBracketKey?: string; // key of income bracket
};

export type DayRecord = {
  date: string;          // "YYYY-MM-DD"
  companies: CompanyEntry[];
  totalGross: number;
  totalTax: number;
  totalNet: number;
};

export type SavingsGoalState = {
  goal: string;          // target amount
  current: string;       // current saved
};

export type Settings = {
  userName?: string;
  irdNumber?: string;
  primaryTaxCode?: string;
  preferredIncomeBracket?: string;
  theme?: ThemeOption;
  hapticsEnabled?: boolean;
  dateFormat?: "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd";
};