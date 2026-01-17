import React, { useMemo, useState } from "react";
import type {
  ContributionCalendar,
  ContributionDay,
  ContributionWeek,
} from "../types/calendar.ts";

const CONTRIBUTION_COLORS = [
  "#161b22",
  "#0e4429",
  "#006d32",
  "#26a641",
  "#39d353",
] as const;

export interface ContributionGraphProps {
  calendar: ContributionCalendar;
  yearLabel?: string | number;
  totalLabel?: string;
  className?: string;
}

function getMonthLabels(
  weeks: ContributionWeek[],
): { label: string; weekIndex: number }[] {
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
  let labels: { label: string; weekIndex: number }[] = [];
  let prevMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstDay = week.days[0];
    if (!firstDay) return;
    const m = new Date(firstDay.date).getMonth();
    if (m !== prevMonth) {
      labels.push({ label: MONTHS[m] || "", weekIndex });
      prevMonth = m;
    }
  });
  return labels;
}

function formatDateLabel(day: ContributionDay): string {
  if (!day.date) return "";
  const date = new Date(day.date);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
  calendar,
  yearLabel,
  totalLabel,
  className = "",
}) => {
  const weeks = calendar.weeks;
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);

  const [hovered, setHovered] = useState<{
    day: ContributionDay;
    x: number;
    y: number;
  } | null>(null);

  const CELL = 13;
  const GAP = 2;
  const width = weeks.length * (CELL + GAP) + 40;
  const height = 7 * (CELL + GAP) + 20;

  return (
    <div
      className={`contribution-graph ${className}`}
      style={{ maxWidth: `${width}px` }}
    >
      {(yearLabel || totalLabel) && (
        <div
          className="cg-labels"
          style={{ textAlign: "center", marginBottom: 4 }}
        >
          {yearLabel && (
            <span style={{ fontWeight: 600, marginRight: 16 }}>
              {yearLabel}
            </span>
          )}
          {totalLabel && (
            <span
              style={{
                color: "#37cd3c",
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {totalLabel}
            </span>
          )}
        </div>
      )}
      {/* Labels */}
      <div style={{ position: "relative", height: 16, marginLeft: 36 }}>
        {monthLabels.map(({ label, weekIndex }) => (
          <span
            key={label + weekIndex}
            style={{
              position: "absolute",
              left: weekIndex * (CELL + GAP),
              fontSize: 10,
              color: "#8b949e",
            }}
          >
            {label}
          </span>
        ))}
      </div>
      {/* The SVG heatmap grid for crispness and scalability */}
      <svg width={width} height={height} style={{ display: "block" }}>
        {/* Day row labels (Mon/Wed/Fri) */}
        {DAY_LABELS.map(
          (d, i) =>
            i % 2 === 1 && (
              <text
                key={d}
                x={25}
                y={i * (CELL + GAP) + CELL}
                style={{
                  fontSize: 9,
                  fill: "#8b949e",
                  dominantBaseline: "middle",
                  textAnchor: "end",
                }}
              >
                {d}
              </text>
            ),
        )}
        {/* Main grid: weeks (columns), days (rows) */}
        {weeks.map((week, weekIdx) =>
          week.days.map((day, dayIdx) => (
            <rect
              key={weekIdx + "-" + dayIdx}
              x={weekIdx * (CELL + GAP) + 34}
              y={dayIdx * (CELL + GAP) + 2}
              width={CELL}
              height={CELL}
              rx={2}
              fill={CONTRIBUTION_COLORS[day.level] || CONTRIBUTION_COLORS[0]}
              style={{
                cursor: day.count ? "pointer" : "default",
                transition: "stroke .1s",
              }}
              stroke={hovered?.day.date === day.date ? "#58a6ff" : "none"}
              strokeWidth={1}
              onMouseEnter={(e) => {
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
      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 10,
          color: "#8b949e",
          marginLeft: 36,
          marginTop: 4,
        }}
      >
        <span>Less</span>
        {CONTRIBUTION_COLORS.map((color, idx) => (
          <span
            key={color}
            style={{
              background: color,
              display: "inline-block",
              borderRadius: 2,
              width: CELL,
              height: CELL,
              marginInline: 1,
            }}
          />
        ))}
        <span>More</span>
      </div>
      {/* Tooltip */}
      {hovered?.day?.date && (
        <div
          style={{
            position: "fixed",
            pointerEvents: "none",
            zIndex: 1000,
            left: hovered.x,
            top: hovered.y - 12,
            transform: "translate(-50%, -100%)",
            background: "#24292f",
            border: "1px solid #30363d",
            borderRadius: 6,
            padding: "5px 9px",
            fontSize: 12,
            color: "#fff",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 16px #161b2250",
          }}
        >
          <b>{hovered.day.count}</b> contribution
          {hovered.day.count === 1 ? "" : "s"}
          <br />
          <span style={{ color: "#8b949e" }}>
            {formatDateLabel(hovered.day)}
          </span>
        </div>
      )}
    </div>
  );
};
