// app/(tabs)/index.tsx
// 🏠 Home Screen — Calendar + Shifts + Updated NZ PAYE 2025 + Holiday Pay

import React, { useMemo, useState } from "react";
import {
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
import { useAppStore } from "../store/appStore";
import { CompanyEntry, DayRecord } from "../types";

//
// 🔵 NZ PAYE TAX BRACKETS 2025 (Primary Income — M, ME)
//
const INCOME_BRACKETS = [
  { key: "0-15600", label: "$0 – $15,600", rate: 10.5 },
  { key: "15601-53500", label: "$15,601 – $53,500", rate: 17.5 },
  { key: "53501-78100", label: "$53,501 – $78,100", rate: 30 },
  { key: "78101-180000", label: "$78,101 – $180,000", rate: 33 },
  { key: "180000+", label: "$180,001+", rate: 39 },
];

//
// 🔵 NZ SECONDARY TAX CODES (Flat rates)
//
const SECONDARY_CODES = [
  { code: "S", rate: 17.5 },
  { code: "SH", rate: 30 },
  { code: "ST", rate: 33 },
  { code: "SA", rate: 39 },
  { code: "SB", rate: 10.5 },
];

const ALL_TAX_CODES = [
  "M",
  "ME",
  "S",
  "SH",
  "ST",
  "SA",
  "SB",
];

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
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setOpen(false)}
            >
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
  const { savedDays, companyOptions, addCompanyOption, deleteCompanyOption, addOrUpdateDayRecord } =
    useAppStore();

  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  // Inputs
  const [selectedCompany, setSelectedCompany] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [payRate, setPayRate] = useState("");
  const [hours, setHours] = useState("");
  const [taxCode, setTaxCode] = useState("M");
  const [incomeKey, setIncomeKey] = useState("15601-53500");
  const [holidayPayEnabled, setHolidayPayEnabled] = useState(false);

  const [manageCompanyOpen, setManageCompanyOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  // List of companies in dropdown
  const companyList: SelectOption[] = [
    ...companyOptions.map((c) => ({ label: c, value: c })),
    { label: "Custom…", value: "__custom" },
  ];

  //
  // DETERMINE TAX RATE BASED ON CODE
  //
  const taxRate = useMemo(() => {
    if (taxCode === "M" || taxCode === "ME") {
      const bracket = INCOME_BRACKETS.find((b) => b.key === incomeKey);
      return bracket?.rate ?? 17.5;
    }
    const sec = SECONDARY_CODES.find((c) => c.code === taxCode);
    return sec?.rate ?? 17.5;
  }, [taxCode, incomeKey]);

  //
  // GET EXISTING DAY RECORD
  //
  const existingDay = savedDays.find((d) => d.date === selectedDate);
  const nextId =
    existingDay && existingDay.companies.length > 0
      ? Math.max(...existingDay.companies.map((c) => c.id)) + 1
      : 1;

  //
  // SAVE ENTRY
  //
  const handleSave = async () => {
    const name = selectedCompany === "__custom" ? customCompany.trim() : selectedCompany;
    if (!name) return Alert.alert("Select company");
    if (!payRate || isNaN(+payRate)) return Alert.alert("Invalid pay rate");
    if (!hours || isNaN(+hours)) return Alert.alert("Invalid hours");

    let gross = +payRate * +hours;

    // 🔵 Add 8% Holiday Pay if enabled
    if (holidayPayEnabled) {
      gross = gross * 1.08;
    }

    const tax = (gross * taxRate) / 100;
    const net = gross - tax;

    const entry: CompanyEntry = {
      id: nextId,
      companyOption: selectedCompany,
      customCompany,
      payRate,
      hoursWorked: hours,
      taxCode,
      incomeBracketKey: incomeKey,
    };

    let newDay: DayRecord;

    if (!existingDay) {
      newDay = {
        date: selectedDate,
        companies: [entry],
        totalGross: gross,
        totalTax: tax,
        totalNet: net,
      };
    } else {
      const all = [...existingDay.companies, entry];

      let totalGross = 0;
      all.forEach((c) => {
        let g = +c.payRate * +c.hoursWorked;
        if (holidayPayEnabled) g *= 1.08;
        totalGross += g;
      });

      const totalTax = (totalGross * taxRate) / 100;
      const totalNet = totalGross - totalTax;

      newDay = {
        ...existingDay,
        companies: all,
        totalGross,
        totalTax,
        totalNet,
      };
    }

    await addOrUpdateDayRecord(newDay);

    // Reset
    setSelectedCompany("");
    setCustomCompany("");
    setPayRate("");
    setHours("");

    Alert.alert("Saved", "Shift saved!");
  };

  //
  // DELETE ENTRY
  //
  const deleteEntry = async (id: number) => {
    if (!existingDay) return;

    const remaining = existingDay.companies.filter((c) => c.id !== id);

    if (remaining.length === 0) {
      const newDays = savedDays.filter((d) => d.date !== selectedDate);
      await useAppStore.getState().setSavedDays(newDays);
      return;
    }

    let totalGross = 0;
    remaining.forEach((c) => {
      let g = +c.payRate * +c.hoursWorked;
      if (holidayPayEnabled) g *= 1.08;
      totalGross += g;
    });

    const totalTax = (totalGross * taxRate) / 100;
    const totalNet = totalGross - totalTax;

    const updated: DayRecord = {
      ...existingDay,
      companies: remaining,
      totalGross,
      totalTax,
      totalNet,
    };

    await addOrUpdateDayRecord(updated);
  };

  //
  // UI
  //
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* ⬆️ Calendar */}
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
              />
            </>
          )}
        </View>

        {/* Pay details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shift Details</Text>

          <Text style={styles.label}>Pay rate ($/hr)</Text>
          <TextInput
            style={styles.input}
            value={payRate}
            keyboardType="numeric"
            onChangeText={setPayRate}
          />

          <Text style={styles.label}>Hours worked</Text>
          <TextInput
            style={styles.input}
            value={hours}
            keyboardType="numeric"
            onChangeText={setHours}
          />

          {/* Holiday Pay */}
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Holiday Pay (8%)</Text>
            <Switch value={holidayPayEnabled} onValueChange={setHolidayPayEnabled} />
          </View>

          {/* Tax Code */}
          <SelectField
            title="Tax code"
            value={taxCode}
            placeholder="Select tax code"
            options={ALL_TAX_CODES.map((c) => ({ label: c, value: c }))}
            onChange={setTaxCode}
          />

          {/* Income bracket only for M / ME */}
          {(taxCode === "M" || taxCode === "ME") && (
            <SelectField
              title="Income bracket"
              value={incomeKey}
              placeholder="Select bracket"
              options={INCOME_BRACKETS.map((b) => ({
                label: `${b.label} (${b.rate}%)`,
                value: b.key,
              }))}
              onChange={setIncomeKey}
            />
          )}

          <Text style={styles.helper}>Tax rate applied: {taxRate}%</Text>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>Save shift</Text>
          </TouchableOpacity>
        </View>

        {/* Day History */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shifts for {selectedDate}</Text>

          {!existingDay ? (
            <Text style={styles.empty}>No entries yet.</Text>
          ) : (
            <>
              {existingDay.companies.map((c) => {
                const g = +c.payRate * +c.hoursWorked;
                const gWithHoliday = holidayPayEnabled ? g * 1.08 : g;
                const t = (gWithHoliday * taxRate) / 100;
                const n = gWithHoliday - t;

                return (
                  <View key={c.id} style={styles.entry}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryTitle}>
                        {c.companyOption === "__custom" ? c.customCompany : c.companyOption}
                      </Text>
                      <Text style={styles.entryLine}>
                        Pay: ${c.payRate}/hr • Hours: {c.hoursWorked}
                      </Text>
                      <Text style={styles.entryLine}>
                        Gross: ${gWithHoliday.toFixed(2)} • Tax: ${t.toFixed(2)}
                      </Text>
                      <Text style={styles.entryLine}>Net: ${n.toFixed(2)}</Text>
                    </View>

                    <TouchableOpacity onPress={() => deleteEntry(c.id)}>
                      <Text style={styles.delete}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              <View style={styles.totalBox}>
                <Text style={styles.totalLine}>Gross: ${existingDay.totalGross.toFixed(2)}</Text>
                <Text style={styles.totalLine}>Tax: ${existingDay.totalTax.toFixed(2)}</Text>
                <Text style={styles.totalNet}>Net: ${existingDay.totalNet.toFixed(2)}</Text>
              </View>
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
                  style={{
                    backgroundColor: "#6B4EFF",
                    justifyContent: "center",
                    paddingHorizontal: 16,
                    borderRadius: 12,
                  }}
                  onPress={() => {
                    addCompanyOption(newCompanyName);
                    setNewCompanyName("");
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
              {companyOptions.length === 0 ? (
                <Text style={styles.empty}>No saved companies.</Text>
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
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },

  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#111827" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10, color: "#111827" },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 6, color: "#374151" },

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

  helper: { fontSize: 12, color: "#6B7280", marginTop: 4 },

  saveBtn: {
    backgroundColor: "#6B4EFF",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: "#6B4EFF",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: { textAlign: "center", color: "#fff", fontWeight: "600", fontSize: 15 },

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
    marginBottom: 6,
  },

  manageBtn: { fontSize: 13, color: "#6B4EFF", fontWeight: "500" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 20,
  },
  modal: { backgroundColor: "#fff", padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  option: { paddingVertical: 10 },
  optionText: { fontSize: 14 },

  closeBtn: {
    marginTop: 12,
    backgroundColor: "#111",
    padding: 10,
    borderRadius: 10,
  },
  closeText: { textAlign: "center", color: "#fff" },
});
