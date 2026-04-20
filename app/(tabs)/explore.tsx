// app/(tabs)/explore.tsx
// 📊 Explore: summaries + simple visual bars + period filters

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../../lib/appStore";
import { calculateTax } from "../../lib/taxEngine";

type RangeKey = "week" | "month" | "year" | "all";

const RANGE_LABELS: Record<RangeKey, string> = {
  week: "this week",
  month: "this month",
  year: "this year",
  all: "all time",
};

export default function ExploreScreen() {
  const savedDays = useAppStore((s) => s.savedDays);
  const savingsGoal = useAppStore((s) => s.savingsGoal);
  const isCloudLoading = useAppStore((s) => s.isCloudLoading);

  const [range, setRange] = useState<RangeKey>("all");

  // 🔹 Filter days based on selected range
  const filteredDays = useMemo(() => {
    if (savedDays.length === 0) return [];

    if (range === "all") {
      return savedDays;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start = new Date(today);
    let end = new Date(today);

    if (range === "week") {
      // Week starting Monday
      const dow = today.getDay(); // 0 = Sun, 1 = Mon, ...
      const diffToMonday = (dow + 6) % 7; // convert so Mon=0
      start = new Date(today);
      start.setDate(today.getDate() - diffToMonday);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (range === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // last day of month
    } else if (range === "year") {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    }

    return savedDays.filter((day) => {
      // day.date is "YYYY-MM-DD"
      const d = new Date(day.date + "T00:00:00");
      d.setHours(0, 0, 0, 0);
      return d >= start && d <= end;
    });
  }, [savedDays, range]);

  // 🔹 Aggregate stats for the filtered days
  const {
    totalGross,
    totalTax,
    totalNet,
    totalHours,
    avgHourlyNet,
    byCompany,
  } = useMemo(() => {
    let totalGrossAcc = 0;
    let totalTaxAcc = 0;
    let totalNetAcc = 0;
    let totalHoursAcc = 0;
    const companyMap: Record<
      string,
      { gross: number; net: number; hours: number }
    > = {};

    filteredDays.forEach((day) => {
      day.companies.forEach((entry) => {
        const cName =
          entry.companyOption === "__custom"
            ? entry.customCompany
            : entry.companyOption || "Unknown";
        const grossBase = Number(entry.payRate) * Number(entry.hoursWorked || "0");
        const grossWithHP = (entry as any).holidayPay ? grossBase * 1.08 : grossBase;
        const hours = Number(entry.hoursWorked || "0");
        const result = calculateTax(grossWithHP, entry.taxCode, 52);

        totalGrossAcc += result.gross;
        totalTaxAcc += result.tax;
        totalNetAcc += result.net;
        totalHoursAcc += hours;

        if (!companyMap[cName]) {
          companyMap[cName] = { gross: 0, net: 0, hours: 0 };
        }
        companyMap[cName].gross += result.gross;
        companyMap[cName].net += result.net;
        companyMap[cName].hours += hours;
      });
    });

    const avgHourlyNetVal =
      totalHoursAcc > 0 ? totalNetAcc / totalHoursAcc : 0;

    return {
      totalGross: totalGrossAcc,
      totalTax: totalTaxAcc,
      totalNet: totalNetAcc,
      totalHours: totalHoursAcc,
      avgHourlyNet: avgHourlyNetVal,
      byCompany: companyMap,
    };
  }, [filteredDays]);

  const goalValue = Number(savingsGoal.goal || "0");
  const currentValue = Number(savingsGoal.current || "0");
  const goalProgress =
    goalValue > 0 ? Math.min(currentValue / goalValue, 1) : 0;

  const maxNetForChart = useMemo(() => {
    let max = 0;
    Object.values(byCompany).forEach((v) => {
      if (v.net > max) max = v.net;
    });
    return max || 1;
  }, [byCompany]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>
          See your total earnings, tax, and take-home for{" "}
          {RANGE_LABELS[range]}.
        </Text>

        {/* FILTER CHIPS */}
        <View style={styles.filterRow}>
          {(
            [
              ["week", "This week"],
              ["month", "This month"],
              ["year", "This year"],
              ["all", "All time"],
            ] as [RangeKey, string][]
          ).map(([key, label]) => {
            const active = range === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setRange(key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* HIGH-LEVEL SUMMARY */}
        <View style={styles.row}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total gross</Text>
            <Text style={styles.cardValue}>${totalGross.toFixed(2)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total tax</Text>
            <Text style={[styles.cardValue, { color: "#EF4444" }]}>
              -${totalTax.toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.card, { flex: 1.3 }]}>
            <Text style={styles.cardLabel}>Total net</Text>
            <Text style={[styles.cardValue, { color: "#10B981" }]}>
              ${totalNet.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.card, { flex: 0.9 }]}>
            <Text style={styles.cardLabel}>Total hours</Text>
            <Text style={styles.cardValue}>{totalHours.toFixed(2)}h</Text>
            <Text style={styles.cardSubValue}>
              Avg net/hr ${avgHourlyNet.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* SAVINGS GOAL PROGRESS */}
        <View className="fullCard" style={styles.fullCard}>
          <Text style={styles.sectionTitle}>Savings goal</Text>
          {goalValue <= 0 ? (
            <Text style={styles.emptyText}>
              Set your goal and current savings in Settings to see progress.
            </Text>
          ) : (
            <>
              <Text style={styles.goalText}>
                ${currentValue.toFixed(2)} / ${goalValue.toFixed(2)}
              </Text>
              <View style={styles.progressBarOuter}>
                <View
                  style={[
                    styles.progressBarInner,
                    { flex: goalProgress, backgroundColor: "#10B981" },
                  ]}
                />
                <View
                  style={[
                    styles.progressBarInner,
                    { flex: 1 - goalProgress, backgroundColor: "#E5E7EB" },
                  ]}
                />
              </View>
              <Text style={styles.goalCaption}>
                {Math.round(goalProgress * 100)}% of your target saved
              </Text>
            </>
          )}
        </View>

        {/* SIMPLE "BAR CHART" BY COMPANY */}
        <View style={styles.fullCard}>
          <Text style={styles.sectionTitle}>Net income by company</Text>
          {Object.keys(byCompany).length === 0 ? (
            <Text style={styles.emptyText}>
              No data for {RANGE_LABELS[range]}. Save some shifts to see
              company-wise breakdown.
            </Text>
          ) : (
            <>
              {Object.entries(byCompany).map(([name, stats]) => {
                const proportion = stats.net / maxNetForChart;
                return (
                  <View key={name} style={styles.companyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.companyName}>{name}</Text>
                      <Text style={styles.companyCaption}>
                        Net: ${stats.net.toFixed(2)} • Hours:{" "}
                        {stats.hours.toFixed(1)}
                      </Text>
                    </View>
                    <View style={styles.companyBarTrack}>
                      <View
                        style={[
                          styles.companyBarFill,
                          { flex: proportion },
                        ]}
                      />
                      <View
                        style={{
                          flex: 1 - proportion,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </View>

        {/* DAY-BY-DAY MINI LIST */}
        <View style={styles.fullCard}>
          <Text style={styles.sectionTitle}>Day-by-day overview</Text>
          {filteredDays.length === 0 ? (
            <Text style={styles.emptyText}>
              No days in {RANGE_LABELS[range]}. Add shifts on the Home tab.
            </Text>
          ) : (
            filteredDays
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((day) => (
                <View key={day.date} style={styles.dayRow}>
                  <View>
                    <Text style={styles.dayDate}>{day.date}</Text>
                    <Text style={styles.dayCaption}>
                      {day.companies.length} shift
                      {day.companies.length > 1 ? "s" : ""} • Gross $
                      {day.totalGross.toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.dayNet}>
                      ${day.totalNet.toFixed(2)}
                    </Text>
                    <Text style={styles.dayTax}>
                      Tax ${day.totalTax.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))
          )}
        </View>
      </ScrollView>
      {/* LOADING OVERLAY */}
      {isCloudLoading && (
        <View 
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center' }]} 
          pointerEvents="none"
        >
          <ActivityIndicator size="large" color="#6B4EFF" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 4,
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },

  // 🔹 Filter chips
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    backgroundColor: "#6B4EFF",
    borderColor: "#6B4EFF",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  cardSubValue: {
    marginTop: 4,
    fontSize: 11,
    color: "#9CA3AF",
  },
  fullCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#111827",
  },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  goalText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#111827",
  },
  progressBarOuter: {
    flexDirection: "row",
    borderRadius: 999,
    overflow: "hidden",
    height: 12,
    backgroundColor: "#E5E7EB",
  },
  progressBarInner: {
    height: "100%",
  },
  goalCaption: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  companyName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  companyCaption: {
    fontSize: 11,
    color: "#6B7280",
  },
  companyBarTrack: {
    flexDirection: "row",
    width: 120,
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  companyBarFill: {
    backgroundColor: "#6B4EFF",
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dayDate: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  dayCaption: {
    fontSize: 11,
    color: "#6B7280",
  },
  dayNet: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
  },
  dayTax: {
    fontSize: 11,
    color: "#9CA3AF",
  },
});
