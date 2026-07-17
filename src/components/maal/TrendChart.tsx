import React from "react";
import { useTx } from "@/lib/tx-store";
import { formatETB } from "@/lib/format";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export type TrendInterval = "daily" | "weekly" | "monthly" | "yearly";

interface ChartItem {
  key: string;
  label: string;
  income: number;
  expense: number;
  timeStart?: number; // Used for weekly grouping range
  timeEnd?: number;   // Used for weekly grouping range
}

interface TrendChartProps {
  interval?: TrendInterval;
}

export function TrendChart({ interval = "monthly" }: TrendChartProps) {
  const { transactions } = useTx();

  // Helper to generate the last 7 calendar days
  const getLast7Days = (): ChartItem[] => {
    const items: ChartItem[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const label = d.toLocaleDateString("default", { weekday: "short" }) + " " + d.getDate();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      items.push({ key, label, income: 0, expense: 0 });
    }
    return items;
  };

  // Helper to generate the last 6 calendar weeks (starting on Monday)
  const getLast6Weeks = (): ChartItem[] => {
    const items: ChartItem[] = [];
    const now = new Date();
    const day = now.getDay();
    // Monday of the current week
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const currentMonday = new Date(now.getFullYear(), now.getMonth(), diff);
    currentMonday.setHours(0, 0, 0, 0);

    for (let i = 5; i >= 0; i--) {
      const wStart = new Date(currentMonday);
      wStart.setDate(currentMonday.getDate() - i * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 7);

      const label = wStart.toLocaleDateString("default", { month: "short", day: "numeric" });
      const key = `wk-${wStart.getTime()}`;
      items.push({
        key,
        label,
        income: 0,
        expense: 0,
        timeStart: wStart.getTime(),
        timeEnd: wEnd.getTime(),
      });
    }
    return items;
  };

  // Helper to generate the last 6 calendar months
  const getLast6Months = (): ChartItem[] => {
    const items: ChartItem[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short" }) + " '" + d.getFullYear().toString().slice(-2);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      items.push({ key, label, income: 0, expense: 0 });
    }
    return items;
  };

  // Helper to generate the last 5 calendar years
  const getLast5Years = (): ChartItem[] => {
    const items: ChartItem[] = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i;
      items.push({
        key: String(year),
        label: String(year),
        income: 0,
        expense: 0,
      });
    }
    return items;
  };

  // Populate income and expenses per interval
  const chartData = React.useMemo(() => {
    let items: ChartItem[] = [];
    if (interval === "daily") {
      items = getLast7Days();
    } else if (interval === "weekly") {
      items = getLast6Weeks();
    } else if (interval === "yearly") {
      items = getLast5Years();
    } else {
      items = getLast6Months();
    }

    transactions.forEach((t) => {
      if (t.type !== "income" && t.type !== "expense") return; // skip transfers
      const d = new Date(t.timestamp);
      if (isNaN(d.getTime())) return;

      let targetItem: ChartItem | undefined;

      if (interval === "daily") {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        targetItem = items.find((m) => m.key === key);
      } else if (interval === "weekly") {
        const txTime = d.getTime();
        targetItem = items.find((m) => m.timeStart !== undefined && m.timeEnd !== undefined && txTime >= m.timeStart && txTime < m.timeEnd);
      } else if (interval === "yearly") {
        const key = String(d.getFullYear());
        targetItem = items.find((m) => m.key === key);
      } else {
        // monthly
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        targetItem = items.find((m) => m.key === key);
      }

      if (targetItem) {
        if (t.type === "income") {
          targetItem.income += t.amount;
        } else if (t.type === "expense") {
          targetItem.expense += t.amount;
        }
      }
    });
    return items;
  }, [transactions, interval]);

  // Custom Tooltip component matching BirrTu brutalist design system
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const incomeVal = payload[0]?.value || 0;
      const expenseVal = payload[1]?.value || 0;
      const netSavings = incomeVal - expenseVal;
      return (
        <div
          className="rounded-[10px] p-3 shadow-hard-sm text-xs"
          style={{
            background: "var(--bg-surface-raised)",
            border: "2px solid var(--border-strong)",
            color: "var(--text-primary)",
          }}
        >
          <p className="font-bold mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            {label}
          </p>
          <div className="space-y-1">
            <p className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--income-positive)" }} />
              <span style={{ color: "var(--text-secondary)" }}>Income:</span>{" "}
              <span className="font-semibold tabular" style={{ color: "var(--income-positive)" }}>
                {formatETB(incomeVal)} ETB
              </span>
            </p>
            <p className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "var(--expense-negative)" }} />
              <span style={{ color: "var(--text-secondary)" }}>Expense:</span>{" "}
              <span className="font-semibold tabular" style={{ color: "var(--expense-negative)" }}>
                {formatETB(expenseVal)} ETB
              </span>
            </p>
            <div className="pt-1.5 border-t border-[var(--border-subtle)] mt-1.5">
              <p className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: netSavings >= 0 ? "var(--income-positive)" : "var(--expense-negative)" }} />
                <span style={{ color: "var(--text-secondary)" }}>Net Savings:</span>{" "}
                <span
                  className="font-semibold tabular"
                  style={{ color: netSavings >= 0 ? "var(--income-positive)" : "var(--expense-negative)" }}
                >
                  {netSavings < 0 ? "−" : ""}
                  {formatETB(Math.abs(netSavings))} ETB
                </span>
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64 md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 5, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-subtle)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke="var(--text-secondary)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "var(--border-strong)" }}
            style={{ fontFamily: "var(--font-display)" }}
          />
          <YAxis
            stroke="var(--text-secondary)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
              return value;
            }}
            style={{ fontFamily: "var(--font-display)" }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-surface-sunken)", opacity: 0.5 }} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="rect"
            iconSize={10}
            formatter={(value) => (
              <span
                style={{
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                {value === "income" ? "Revenue" : "Expenses"}
              </span>
            )}
          />
          <Bar
            dataKey="income"
            name="income"
            fill="var(--income-positive)"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
          <Bar
            dataKey="expense"
            name="expense"
            fill="var(--expense-negative)"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
