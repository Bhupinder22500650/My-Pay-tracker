// lib/schemas.ts
// 🔹 Zod validation schemas — single source of truth for all form data.
//    Used by react-hook-form's zodResolver on every screen.

import { z } from "zod";
import { ALL_TAX_CODES } from "./taxEngine";

// ── Auth forms ────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// ── Shift entry form ──────────────────────────────────────────────────────────

export const shiftSchema = z.object({
  company: z
    .string()
    .min(1, "Please select or enter a company name"),
  customCompany: z.string().optional(),
  payRate: z
    .string()
    .min(1, "Pay rate is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Pay rate must be a positive number",
    }),
  hoursWorked: z
    .string()
    .min(1, "Hours worked is required")
    .refine(
      (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0 && parseFloat(v) <= 24,
      { message: "Hours must be between 0 and 24" }
    ),
  taxCode: z.enum(ALL_TAX_CODES as [string, ...string[]], {
    errorMap: () => ({ message: "Please select a tax code" }),
  }),
  incomeBracketKey: z.string().optional(),
  holidayPay: z.boolean().default(false),
});

// ── Settings form ─────────────────────────────────────────────────────────────

export const settingsSchema = z.object({
  userName: z.string().max(100).optional(),
  irdNumber: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d{8,9}$/.test(v.replace(/-/g, "")),
      "IRD number must be 8 or 9 digits"
    ),
  primaryTaxCode: z.string().optional(),
  preferredIncomeBracket: z.string().optional(),
  hapticsEnabled: z.boolean().default(false),
});

export const savingsSchema = z.object({
  goal: z
    .string()
    .refine((v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), {
      message: "Goal must be a positive number",
    }),
  current: z
    .string()
    .refine((v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), {
      message: "Amount must be a positive number",
    }),
});

// ── Infer TypeScript types ────────────────────────────────────────────────────

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ShiftFormData = z.infer<typeof shiftSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
export type SavingsFormData = z.infer<typeof savingsSchema>;
