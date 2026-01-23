"use client";

import { useMemo, useState } from "react";
import type {
  ContributionCalendar,
  ContributionDay,
  ContributionWeek,
} from "../types/calendar.js";

interface ViewProps {
  calendar: ContributionCalendar;
  yearLabel?: string;
  totalLabel?: string;
  className?: string;
}

const CONTRIBUTION_COLORS: Record<number, string> = {
  0: "#161b22",
  1: "#0e4429",
  2: "#006d32",
  3: "#26a641",
  4: "#39d353",
} as const;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthLabels(
  weeks: ContributionWeek[],
): { label: string; weekIndex: number }[] {
  const labels: { label: string; weekIndex: number }[] = [];
  let prevMonth = -1;

  weeks.forEach((week, weekIndex) => {
    const firstDay = week.days.find((d) => d.date);
    if (!firstDay) return;

    const month = new Date(firstDay.date).getMonth();
    if (month !== prevMonth) {
      labels.push({ label: MONTHS[month]!, weekIndex });
      prevMonth = month;
    }
  });

  return labels;
}

function formatDateLabel(day: ContributionDay): string {
  if (!day.date) return "";
  const date = new Date(day.date);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ContributionGraphView({
  calendar,
  yearLabel,
  totalLabel,
  className = "",
}: ViewProps) {
  const [hovered, setHovered] = useState<{
    day: ContributionDay;
    x: number;
    y: number;
  } | null>(null);

  const monthLabels = useMemo(
    () => getMonthLabels(calendar.weeks),
    [calendar.weeks],
  );

  const displayYearLabel = yearLabel ?? "Last 12 months";
  const displayTotalLabel =
    totalLabel ??
    `${calendar.total.toLocaleString()} contributions in the last year`;

  const CELL_SIZE = 12;
  const CELL_GAP = 3;
  const LABEL_WIDTH = 30;

  return (
    <div className="flex justify-center overflow-x-auto">
      <div
        className={`bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6 max-w-full ${className}`}
      >
        {/* Header */}
        <div className="mb-4 text-center sm:text-left">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white inline-block mr-3">
            {displayYearLabel}
          </h3>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {displayTotalLabel}
          </span>
        </div>
        {/* Graph Container - Scrollable on mobile */}
        <div className="overflow-x-auto overflow-y-hidden -mx-2 px-2">
          <div className="inline-block">
            {/* Month Labels */}
            <div
              className="relative h-5 mb-2"
              style={{
                marginLeft: `${LABEL_WIDTH}px`,
                width: `${calendar.weeks.length * (CELL_SIZE + CELL_GAP)}px`,
              }}
            >
              {monthLabels.map(({ label, weekIndex }) => (
                <span
                  key={label + weekIndex}
                  className="absolute text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium"
                  style={{
                    left: `${weekIndex * (CELL_SIZE + CELL_GAP)}px`,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* SVG Grid */}
            <div className="relative">
              <svg
                width={
                  calendar.weeks.length * (CELL_SIZE + CELL_GAP) + LABEL_WIDTH
                }
                height={7 * (CELL_SIZE + CELL_GAP) + 5}
                className="block"
                style={{ display: "block" }}
              >
                {/* Day Labels */}
                {DAYS.map((day, i) =>
                  i % 2 === 1 ? (
                    <text
                      key={day}
                      x={LABEL_WIDTH - 5}
                      y={i * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 1}
                      className="text-[9px] sm:text-[10px] fill-gray-600 dark:fill-gray-400"
                      textAnchor="end"
                      dominantBaseline="middle"
                    >
                      {day}
                    </text>
                  ) : null,
                )}

                {/* Contribution Cells */}
                {calendar.weeks.map((week, weekIdx) =>
                  week.days.map((day, dayIdx) => (
                    <rect
                      key={`${weekIdx}-${dayIdx}`}
                      x={weekIdx * (CELL_SIZE + CELL_GAP) + LABEL_WIDTH}
                      y={dayIdx * (CELL_SIZE + CELL_GAP)}
                      width={CELL_SIZE}
                      height={CELL_SIZE}
                      rx={2}
                      className="transition-all duration-150 cursor-pointer"
                      fill={
                        day.date
                          ? CONTRIBUTION_COLORS[day.level] ||
                            CONTRIBUTION_COLORS[0]
                          : "transparent"
                      }
                      stroke={
                        hovered?.day.date === day.date
                          ? "#3b82f6"
                          : "transparent"
                      }
                      strokeWidth={2}
                      onMouseEnter={(e) => {
                        if (!day.date) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHovered({
                          day,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHovered(null)}
                    />
                  )),
                )}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-1 mt-3 text-xs text-gray-600 dark:text-gray-400">
              <span className="mr-1">Less</span>
              {([0, 1, 2, 3, 4] as const).map((level) => (
                <div
                  key={level}
                  className="rounded-sm"
                  style={{
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                    backgroundColor: CONTRIBUTION_COLORS[level],
                  }}
                />
              ))}
              <span className="ml-1">More</span>
            </div>
          </div>
        </div>

        {/* Scroll hint for mobile */}
        <p className="text-center text-[10px] text-gray-500 dark:text-gray-500 mt-2 sm:hidden">
          Scroll horizontally to view full graph →
        </p>

        {/* Tooltip */}
        {hovered?.day?.date && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: hovered.x,
              top: hovered.y - 10,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg text-xs whitespace-nowrap">
              <div className="font-semibold">
                {hovered.day.count} contribution
                {hovered.day.count === 1 ? "" : "s"}
              </div>
              <div className="text-gray-300 dark:text-gray-400 text-[10px] mt-0.5">
                {formatDateLabel(hovered.day)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
