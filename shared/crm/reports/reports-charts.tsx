"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import type {
  MetricCardData,
  ReportsSnapshot,
} from "@/shared/crm/reports/reports-utils";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ponytail: fixed chart height. Measuring the container's clientHeight and
// feeding it back to ApexCharts caused an unbounded ResizeObserver growth loop
// (SVG renders slightly taller than requested → container grows → repeat).
// items-stretch/h-full already equalize column heights via CSS.

function sparkOptions(color: string): ApexOptions {
  return {
    colors: [color],
    chart: {
      type: "line",
      height: 40,
      width: 100,
      sparkline: { enabled: true },
    },
    stroke: {
      show: true,
      curve: "smooth",
      width: 1.5,
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.9,
        opacityTo: 0.9,
        stops: [0, 98],
      },
    },
    yaxis: {
      min: 0,
      show: false,
    },
    xaxis: {
      axisBorder: { show: false },
    },
    tooltip: { enabled: false },
  };
}

export function MetricSparkline({
  card,
  chartId,
}: {
  card: MetricCardData;
  chartId: string;
}) {
  const options = useMemo(
    () => sparkOptions(card.sparkColor),
    [card.sparkColor]
  );

  return (
    <div id={chartId}>
      <ApexChart
        type="line"
        height={40}
        width={100}
        options={options}
        series={[{ name: "Value", data: card.sparkline }]}
      />
    </div>
  );
}

export function TargetRadialChart({ percent }: { percent: number }) {
  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        height: 127,
        width: 100,
        type: "radialBar",
      },
      colors: ["rgba(255,255,255,0.9)"],
      plotOptions: {
        radialBar: {
          hollow: {
            margin: 0,
            size: "55%",
            background: "#fff",
          },
          dataLabels: {
            name: { show: false },
            value: {
              show: true,
              offsetY: 5,
              color: "#4b9bfa",
              fontSize: "0.875rem",
              fontWeight: 600,
              formatter: () => `${percent}%`,
            },
          },
        },
      },
      stroke: { lineCap: "round" },
      labels: ["Status"],
    }),
    [percent]
  );

  return (
    <div id="crm-main">
      <ApexChart
        type="radialBar"
        height={127}
        width={100}
        options={options}
        series={[percent]}
      />
    </div>
  );
}

export function LeadsSourceDonut({ report }: { report: ReportsSnapshot }) {
  const { items, total } = report.leadsBySource;

  const options: ApexOptions = useMemo(
    () => ({
      chart: { type: "donut" },
      labels: items.map((i) => i.label),
      colors: items.map((i) => i.color),
      dataLabels: { enabled: false },
      legend: { show: false },
      stroke: {
        show: true,
        width: 0,
        colors: ["#fff"],
      },
      plotOptions: {
        pie: {
          expandOnClick: false,
          donut: {
            size: "82%",
            labels: { show: false },
          },
        },
      },
    }),
    [items]
  );

  return (
    <div className="leads-source-chart flex items-center justify-center relative">
      <ApexChart
        type="donut"
        height={250}
        width="100%"
        options={options}
        series={items.map((i) => i.count)}
      />
      <div className="lead-source-value start-[50%] -translate-x-1/2">
        <span className="block text-[0.875rem]">Total</span>
        <span className="block text-[1.5625rem] font-bold">
          {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export function RevenueAnalyticsChart({ report }: { report: ReportsSnapshot }) {
  const { categories, sales, revenue, profit } = report.revenueAnalytics;
  const height = 350;

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        height,
        type: "line",
        toolbar: { show: true },
        dropShadow: {
          enabled: true,
          top: 8,
          left: 0,
          blur: 3,
          color: "#000",
          opacity: 0.1,
        },
      },
      colors: [
        "rgb(132, 90, 223)",
        "rgba(35, 183, 229, 0.85)",
        "rgba(119, 119, 142, 0.05)",
      ],
      dataLabels: { enabled: false },
      grid: {
        borderColor: "#f1f1f1",
        strokeDashArray: 3,
        padding: {
          top: 0,
          right: 8,
          bottom: 0,
          left: 8,
        },
      },
      stroke: {
        curve: "smooth",
        width: [2, 2, 0],
        dashArray: [0, 5, 0],
      },
      xaxis: {
        categories,
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (value: number) => `${Math.round(value)}`,
        },
      },
      legend: {
        show: true,
        customLegendItems: ["Deals Won", "Replies", "Emails Sent"],
        inverseOrder: true,
      },
      title: {
        text: "Outreach activity by month (live counts)",
        align: "left",
        style: {
          fontSize: ".8125rem",
          fontWeight: "600",
          color: "#8c9097",
        },
      },
      markers: {
        hover: { sizeOffset: 5 },
      },
      tooltip: {
        y: [
          { formatter: (v: number) => `${v} deals` },
          { formatter: (v: number) => `${v} replies` },
          { formatter: (v: number) => `${v} emails` },
        ],
      },
    }),
    [categories, height]
  );

  return (
    <div
      id="crm-revenue-analytics"
      className="w-full min-w-[280px] min-h-[350px]"
    >
      <ApexChart
        type="line"
        height={height}
        width="100%"
        options={options}
        series={[
          { name: "Deals Won", type: "line", data: profit },
          { name: "Replies", type: "line", data: revenue },
          { name: "Emails Sent", type: "area", data: sales },
        ]}
      />
    </div>
  );
}

export function ProfitEarnedChart({
  report,
  height = 180,
}: {
  report: ReportsSnapshot;
  height?: number;
}) {
  const { labels, primary, secondary } = report.weeklyProfit;

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        height,
        toolbar: { show: false },
      },
      grid: {
        borderColor: "#f1f1f1",
        strokeDashArray: 3,
      },
      colors: ["rgb(132, 90, 223)", "#e4e7ed"],
      plotOptions: {
        bar: {
          columnWidth: "60%",
          borderRadius: 5,
        },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      xaxis: {
        categories: labels,
        labels: { rotate: -90 },
      },
      yaxis: {
        labels: {
          formatter: (y: number) => `${y}`,
        },
      },
    }),
    [labels, height]
  );

  return (
    <div id="crm-profits-earned" className="h-full">
      <ApexChart
        type="bar"
        height={height}
        width="100%"
        options={options}
        series={[
          { name: "New leads", data: primary },
          { name: "Emails", data: secondary },
        ]}
      />
    </div>
  );
}

export function PipelineOverviewChart({ report }: { report: ReportsSnapshot }) {
  const { categories, newLeads, emailsSent, dealsWon } = report.pipelineOverview;
  const height = 320;

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        stacked: true,
        type: "bar",
        height,
        toolbar: { show: false },
      },
      grid: {
        borderColor: "#f5f4f4",
        strokeDashArray: 5,
        padding: {
          top: 0,
          right: 8,
          bottom: 0,
          left: 8,
        },
      },
      colors: [
        "rgb(132, 90, 223)",
        "rgba(132, 90, 223, 0.6)",
        "rgba(132, 90, 223, 0.3)",
      ],
      plotOptions: {
        bar: {
          columnWidth: "20%",
        },
      },
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: "top",
      },
      yaxis: {
        title: {
          text: "Activity",
          style: {
            color: "#adb5be",
            fontSize: "14px",
            fontWeight: 600,
          },
        },
        labels: {
          formatter: (y: number) => `${y}`,
        },
      },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          rotate: -90,
          offsetY: 0,
        },
      },
    }),
    [categories, height]
  );

  return (
    <div
      id="pipeline-overview"
      className="w-full min-w-[280px] min-h-[320px]"
    >
      <ApexChart
        type="bar"
        height={height}
        width="100%"
        options={options}
        series={[
          { name: "New Leads", data: newLeads },
          { name: "Emails Sent", data: emailsSent },
          { name: "Deals Won", data: dealsWon },
        ]}
      />
    </div>
  );
}

export function WinRateRadialChart({ percent }: { percent: number }) {
  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        height: 233,
        type: "radialBar",
      },
      colors: ["rgb(132, 90, 223)"],
      plotOptions: {
        radialBar: {
          hollow: {
            margin: 0,
            size: "70%",
            background: "#fff",
          },
          track: {
            dropShadow: {
              enabled: true,
              top: 2,
              left: 0,
              blur: 2,
              opacity: 0.15,
            },
          },
          dataLabels: {
            name: {
              offsetY: -10,
              color: "#4b9bfa",
              fontSize: "16px",
              show: false,
            },
            value: {
              color: "#4b9bfa",
              fontSize: "30px",
              show: true,
              formatter: () => `${percent}%`,
            },
          },
        },
      },
      stroke: { lineCap: "round" },
      labels: ["Win Rate"],
    }),
    [percent]
  );

  return (
    <div id="win-rate-radial" className="p-5">
      <ApexChart
        type="radialBar"
        height={233}
        width="100%"
        options={options}
        series={[percent]}
      />
    </div>
  );
}
