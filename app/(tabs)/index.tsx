// app/(tabs)/index.tsx
// 🏠 Home Screen — Calendar + Shifts + NZ PAYE 2025 (progressive) + Holiday Pay

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../../lib/store";
import { ALL_TAX_CODES, calculateTax, isPrimaryCode } from "../../lib/taxEngine";

// Income bracket labels — for display only when using progressive (M/ME) codes
const INCOME_BRACKETS = [
  { key: "0-15600",    label: "$0 – $15,600",       periodsPerYear: 52 },
  { key: "15601-53500", label: "$15,601 – $53,500",  periodsPerYear: 52 },
  { key: "53501-78100", label: "$53,501 – $78,100",  periodsPerYear: 52 },
  { key: "78101-180000", label: "$78,101 – $180,000", periodsPerYear: 52 },
  { key: "180000+",    label: "$180,001+",            periodsPerYear: 52 },
];

// Map bracket key → approximate weekly periods for annualising (all 52 for weekly workers)
const PERIODS_FOR_BRACKET: Record<string, number> = {
  "0-15600": 52,
  "15601-53500": 52,
  "53501-78100": 52,
  "78101-180000": 52,
  "180000+": 52,
};

//
// SELECT COMPONENT
//
type SelectOption = { label: string; value: string };

function SelectField({
  value,
  placeholder,
  title,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  title: string;
  options: SelectOption[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Text style={styles.label}>{title}</Text>
      <TouchableOpacity style={styles.selectButton} onPress={() => setOpen(true)}>
        <Text style={[styles.selectButtonText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{title}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.option}
                  onPress={() => { onChange(opt.value); setOpen(false); }}
                >
                  <Text style={styles.optionText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

//
// MAIN HOME SCREEN
//
export default function HomeScreen() {
  const {
    savedDays,
    companyOptions,
    addCompanyOption,
    deleteCompanyOption,
    addShift,
    isCloudLoading,
  } = useAppStore();

  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  // Form state
  const [selectedCompany, setSelectedCompany] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [payRate, setPayRate] = useState("");
  const [hours, setHours] = useState("");
  const [taxCode, setTaxCode] = useState("M");
  const [incomeKey, setIncomeKey] = useState("15601-53500");
  const [holidayPayEnabled, setHolidayPayEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [manageCompanyOpen, setManageCompanyOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  const companyList: SelectOption[] = [
    ...companyOptions.map((c) => ({ label: c, value: c })),
    { label: "Custom…", value: "__custom" },
  ];

  // Get existing day record for selected date
  const existingDay = savedDays.find((d) => d.date === selectedDate);

  // Compute preview tax for the form
  const periodsPerYear = PERIODS_FOR_BRACKET[incomeKey] ?? 52;
  const previewTax = useMemo(() => {
    const rate = parseFloat(payRate);
    const hrs = parseFloat(hours);
    if (!rate || !hrs || isNaN(rate) || isNaN(hrs)) return null;
    let gross = rate * hrs;
    if (holidayPayEnabled) gross *= 1.08;
    return calculateTax(gross, taxCode, periodsPerYear);
  }, [payRate, hours, taxCode, holidayPayEnabled, periodsPerYear]);

  // ── SAVE ENTRY ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const name = selectedCompany === "__custom" ? customCompany.trim() : selectedCompany;
    if (!name) return Alert.alert("Missing company", "Please select or enter a company name.");

    const rate = parseFloat(payRate);
    const hrs = parseFloat(hours);
    if (!payRate || isNaN(rate) || rate <= 0)
      return Alert.alert("Invalid pay rate", "Please enter a positive pay rate.");
    if (!hours || isNaN(hrs) || hrs <= 0 || hrs > 24)
      return Alert.alert("Invalid hours", "Hours must be between 0 and 24.");

    try {
      setIsSaving(true);
      await addShift(selectedDate, {
        companyOption: selectedCompany,
        customCompany: customCompany,
        payRate: rate.toString(),
        hoursWorked: hrs.toString(),
        taxCode,
        incomeBracketKey: incomeKey,
        holidayPay: holidayPayEnabled,
      });

      // Automatically remember this company for the future if using a custom one
      if (selectedCompany === "__custom" && customCompany.trim()) {
        await useAppStore.getState().addCompanyOption(customCompany.trim());
      }

      setSelectedCompany("");
      setCustomCompany("");
      setPayRate("");
      setHours("");
      Alert.alert("✅ Saved", "Shift saved to the cloud!");
    } catch {
      Alert.alert("Save failed", "Could not save shift. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── DELETE ENTRY ────────────────────────────────────────────────────────────
  const deleteEntry = async (id: string) => {
    Alert.alert("Delete shift", "Remove this shift?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await useAppStore.getState().deleteShift(id);
          } catch {
            Alert.alert("Error", "Could not delete shift. Try again.");
          }
        },
      },
    ]);
  };

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Calendar */}
        <View style={styles.card}>
          <Text style={styles.title}>Select Day</Text>
          <Calendar
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: "#6B4EFF" },
            }}
            onDayPress={(day) => setSelectedDate(day.dateString)}
          />
        </View>

        {/* Company */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Company</Text>
            <TouchableOpacity onPress={() => setManageCompanyOpen(true)}>
              <Text style={styles.manageBtn}>+ Manage</Text>
            </TouchableOpacity>
          </View>

          <SelectField
            title="Choose company"
            value={selectedCompany}
            placeholder="Select…"
            options={companyList}
            onChange={(v) => {
              setSelectedCompany(v);
              if (v !== "__custom") setCustomCompany("");
            }}
          />

          {selectedCompany === "__custom" && (
            <>
              <Text style={styles.label}>Custom company name</Text>
              <TextInput
                style={styles.input}
                value={customCompany}
                onChangeText={setCustomCompany}
                placeholder="e.g. Countdown Takapuna"
              />
            </>
          )}
        </View>

        {/* Shift Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shift Details</Text>

          <Text style={styles.label}>Pay rate ($/hr)</Text>
          <TextInput
            style={styles.input}
            value={payRate}
            keyboardType="decimal-pad"
            onChangeText={setPayRate}
            placeholder="e.g. 22.50"
          />

          <Text style={styles.label}>Hours worked</Text>
          <TextInput
            style={styles.input}
            value={hours}
            keyboardType="decimal-pad"
            onChangeText={setHours}
            placeholder="e.g. 8"
          />

          {/* Holiday Pay */}
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.label}>Holiday Pay (+8%)</Text>
              <Text style={styles.hint}>Adds 8% to gross pay</Text>
            </View>
            <Switch value={holidayPayEnabled} onValueChange={setHolidayPayEnabled} />
          </View>

          {/* Tax Code — single source from taxEngine */}
          <SelectField
            title="Tax code"
            value={taxCode}
            placeholder="Select tax code"
            options={ALL_TAX_CODES.map((c) => ({ label: c, value: c }))}
            onChange={setTaxCode}
          />

          {/* Income bracket only for primary M/ME codes */}
          {isPrimaryCode(taxCode) && (
            <SelectField
              title="Income bracket (annual)"
              value={incomeKey}
              placeholder="Select bracket"
              options={INCOME_BRACKETS.map((b) => ({
                label: b.label,
                value: b.key,
              }))}
              onChange={setIncomeKey}
            />
          )}

          {/* Live tax preview */}
          {previewTax && (
            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>Pay preview (this shift)</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Gross</Text>
                <Text style={styles.previewValue}>${previewTax.gross.toFixed(2)}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>PAYE + ACC</Text>
                <Text style={styles.previewRed}>-${previewTax.tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.previewRow, { borderTopWidth: 1, borderTopColor: "#E5E7EB", marginTop: 4, paddingTop: 4 }]}>
                <Text style={[styles.previewLabel, { fontWeight: "700" }]}>Take-home</Text>
                <Text style={styles.previewNet}>${previewTax.net.toFixed(2)}</Text>
              </View>
              <Text style={styles.hint}>Effective rate: {(previewTax.effectiveRate * 100).toFixed(1)}%</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveText}>Save shift</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Day History */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shifts for {selectedDate}</Text>

          {!existingDay || existingDay.companies.length === 0 ? (
            <Text style={styles.empty}>No shifts saved for this day.</Text>
          ) : (
            <>
              {existingDay.companies.map((c) => {
                const gross = parseFloat(c.payRate) * parseFloat(c.hoursWorked);
                const grossWithHP = (c as any).holidayPay ? gross * 1.08 : gross;
                const result = calculateTax(grossWithHP, c.taxCode, PERIODS_FOR_BRACKET[c.incomeBracketKey ?? "15601-53500"] ?? 52);

                return (
                  <View key={c.id} style={styles.entry}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryTitle}>
                        {c.companyOption === "__custom" ? c.customCompany : c.companyOption}
                      </Text>
                      <Text style={styles.entryLine}>
                        ${c.payRate}/hr × {c.hoursWorked}h{(c as any).holidayPay ? " + 8% HP" : ""}
                      </Text>
                      <Text style={styles.entryLine}>
                        Gross: ${result.gross.toFixed(2)} · Tax: ${result.tax.toFixed(2)}
                      </Text>
                      <Text style={[styles.entryLine, { color: "#10B981", fontWeight: "600" }]}>
                        Net: ${result.net.toFixed(2)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteEntry(c.id)}>
                      <Text style={styles.delete}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Day totals computed from CompanyEntry — never trust zeroed store values */}
              {(() => {
                const dayTotals = existingDay.companies.reduce(
                  (acc, c) => {
                    const gross = parseFloat(c.payRate) * parseFloat(c.hoursWorked);
                    const grossWithHP = (c as any).holidayPay ? gross * 1.08 : gross;
                    const result = calculateTax(grossWithHP, c.taxCode, PERIODS_FOR_BRACKET[c.incomeBracketKey ?? "15601-53500"] ?? 52);
                    return {
                      gross: acc.gross + result.gross,
                      tax: acc.tax + result.tax,
                      net: acc.net + result.net,
                    };
                  },
                  { gross: 0, tax: 0, net: 0 }
                );
                return (
                  <View style={styles.totalBox}>
                    <Text style={styles.totalLine}>Gross: ${dayTotals.gross.toFixed(2)}</Text>
                    <Text style={styles.totalLine}>Tax: ${dayTotals.tax.toFixed(2)}</Text>
                    <Text style={styles.totalNet}>Net: ${dayTotals.net.toFixed(2)}</Text>
                  </View>
                );
              })()}
            </>
          )}
        </View>
      </ScrollView>

      {/* MANAGE COMPANY MODAL */}
      <Modal visible={manageCompanyOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Manage Companies</Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={styles.label}>Add new company</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Company name"
                  value={newCompanyName}
                  onChangeText={setNewCompanyName}
                />
                <TouchableOpacity
                  style={{ backgroundColor: "#6B4EFF", justifyContent: "center", paddingHorizontal: 16, borderRadius: 12 }}
                  onPress={() => {
                    if (newCompanyName.trim()) {
                      addCompanyOption(newCompanyName.trim());
                      setNewCompanyName("");
                    }
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
              {companyOptions.length === 0 ? (
                <Text style={styles.empty}>No saved companies yet.</Text>
              ) : (
                companyOptions.map((c) => (
                  <View key={c} style={[styles.rowBetween, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }]}>
                    <Text style={styles.optionText}>{c}</Text>
                    <TouchableOpacity onPress={() => deleteCompanyOption(c)}>
                      <Text style={styles.delete}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setManageCompanyOpen(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CLOUD LOADING OVERLAY */}
      {isCloudLoading && (
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(255,255,255,0.7)", justifyContent: "center", alignItems: "center" }]}
          pointerEvents="none"
        >
          <ActivityIndicator size="large" color="#6B4EFF" />
          <Text style={{ marginTop: 12, color: "#6B4EFF", fontWeight: "600" }}>Loading your data…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

//
// STYLES
//
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FA" },
  container: { padding: 16, paddingBottom: 50 },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },

  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#111827" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10, color: "#111827" },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 6, color: "#374151" },
  hint: { fontSize: 11, color: "#9CA3AF", marginBottom: 4 },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 14,
    fontSize: 15,
  },

  selectButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 14,
  },
  selectButtonText: { fontSize: 15, color: "#111827" },
  placeholder: { color: "#9CA3AF" },

  previewBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  previewTitle: { fontSize: 12, fontWeight: "600", color: "#6B7280", marginBottom: 8 },
  previewRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  previewLabel: { fontSize: 13, color: "#374151" },
  previewValue: { fontSize: 13, color: "#111827", fontWeight: "500" },
  previewRed: { fontSize: 13, color: "#EF4444", fontWeight: "500" },
  previewNet: { fontSize: 15, color: "#10B981", fontWeight: "700" },

  saveBtn: {
    backgroundColor: "#6B4EFF",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#6B4EFF",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "600", fontSize: 15 },

  empty: { color: "#6B7280", fontSize: 13, marginTop: 6 },

  entry: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  entryTitle: { fontWeight: "600", marginBottom: 4, fontSize: 15, color: "#111827" },
  entryLine: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  delete: { color: "#EF4444", marginLeft: 8, fontWeight: "500" },

  totalBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  totalLine: { fontSize: 14, color: "#374151", marginBottom: 2 },
  totalNet: { fontSize: 18, fontWeight: "700", color: "#10B981", marginTop: 4 },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  manageBtn: { fontSize: 13, color: "#6B4EFF", fontWeight: "500" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modal: { backgroundColor: "#fff", padding: 20, borderRadius: 16 },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  option: { paddingVertical: 10 },
  optionText: { fontSize: 14, color: "#374151" },
  closeBtn: { marginTop: 12, backgroundColor: "#111", padding: 12, borderRadius: 10, alignItems: "center" },
  closeText: { color: "#fff", fontWeight: "600" },
});
