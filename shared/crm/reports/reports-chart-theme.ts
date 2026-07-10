import type { ApexOptions } from "apexcharts";
import { DASHBOARD_COLORS } from "@/shared/crm/reports/reports-utils";

export type ReportsChartTheme = {
  isDark: boolean;
  foreColor: string;
  borderColor: string;
  purple: string;
  teal: string;
  yellow: string;
  green: string;
  muted: string;
};

export function detectDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function getReportsChartTheme(isDark: boolean): ReportsChartTheme {
  return {
    isDark,
    foreColor: isDark ? "#8b909a" : "#536485",
    borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(17,24,39,0.06)",
    purple: DASHBOARD_COLORS.purple,
    teal: DASHBOARD_COLORS.teal,
    yellow: DASHBOARD_COLORS.yellow,
    green: DASHBOARD_COLORS.green,
    muted: DASHBOARD_COLORS.muted,
  };
}

export function baseChartOptions(
  theme: ReportsChartTheme,
  height: number
): ApexOptions {
  return {
    chart: {
      height,
      fontFamily: "Inter, system-ui, sans-serif",
      background: "transparent",
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 500,
      },
    },
    theme: { mode: theme.isDark ? "dark" : "light" },
    grid: {
      borderColor: theme.borderColor,
      strokeDashArray: 3,
      padding: { left: 4, right: 8, top: 0, bottom: 0 },
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      labels: { colors: theme.foreColor },
      fontSize: "11px",
      fontWeight: 500,
      markers: { size: 5, strokeWidth: 0 },
    },
    tooltip: {
      theme: theme.isDark ? "dark" : "light",
      style: { fontSize: "12px" },
    },
    xaxis: {
      labels: {
        style: { colors: theme.foreColor, fontSize: "10px" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: theme.foreColor, fontSize: "10px" },
      },
    },
  };
}
