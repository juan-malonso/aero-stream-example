"use client";

import { useEffect, useRef, useState } from "react";
import type { ConnectionGroup, PlatformSession } from "@/lib/platform/types";
import { PlatformEventType } from "@/lib/platform/types";
import { colors, radii, shadows, typography } from "@/styles/tokens";
import { EventCard } from "./EventCard";

interface SessionDetailProps {
  session: PlatformSession | null;
  isLoading: boolean;
}

function ConnectionHeader({
  group,
  index,
}: {
  group: ConnectionGroup;
  index: number;
}) {
  const deviceParts = group.device
    ? [
        group.device.browserName
          ? `${String(group.device.browserName)} ${String(group.device.browserVersion ?? "")}`.trim()
          : null,
        group.device.osName ? String(group.device.osName) : null,
        group.device.deviceType ? String(group.device.deviceType) : null,
      ].filter((x): x is string => x !== null)
    : [];

  return (
    <div
      style={{
        background: colors.blue100,
        borderLeft: `3px solid ${colors.blue700}`,
        borderRadius: radii.lg,
        padding: "0.625rem 0.875rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        boxShadow: shadows.xs,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          fontWeight: typography.weights.bold,
          color: colors.blue600,
        }}
      >
        <span
          style={{
            fontSize: typography.sizes.sm,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          #{index + 1} Connection
        </span>
        <span
          style={{ fontFamily: "monospace", fontSize: typography.sizes.xs }}
        >
          {group.connectionId}
        </span>
      </div>
      <div
        style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}
      >
        {deviceParts.length > 0 ? (
          deviceParts.map((part, i) => (
            <span
              key={i}
              style={{
                fontSize: typography.sizes["2xs"],
                color: colors.gray500,
              }}
            >
              {part}
            </span>
          ))
        ) : (
          <span
            style={{ fontSize: typography.sizes["2xs"], color: colors.gray400 }}
          >
            No device info
          </span>
        )}
      </div>
    </div>
  );
}

const STRIP_W = 13;
const STRIP_GAP = 2;

interface ConnectionGridProps {
  connections: ConnectionGroup[];
  eventRowMap: Map<string, number>;
  connectionEventIndex: Map<string, number>;
  emptyCells: { row: number; colIndex: number }[];
}

function ConnectionGrid({
  connections,
  eventRowMap,
  connectionEventIndex,
  emptyCells,
}: ConnectionGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [leftHidden, setLeftHidden] = useState<number[]>([]);
  const [rightHidden, setRightHidden] = useState<number[]>([]);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const colCount = connections.length;

  // For each connection, the sorted list of grid rows where it has events.
  // Used to decide the empty-cell icon (eye vs cross).
  const connEventRows: number[][] = connections.map((group) =>
    group.events
      .map((e) => eventRowMap.get(e.eventId) ?? -1)
      .filter((r) => r !== -1)
      .sort((a, b) => a - b),
  );

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    const update = () => {
      const { scrollLeft, clientWidth, scrollWidth } = scroll;
      setIsOverflowing(scrollWidth > clientWidth);

      const newLeft: number[] = [];
      const newRight: number[] = [];

      colRefs.current.forEach((col, i) => {
        if (!col) return;
        const left = col.offsetLeft;
        const right = left + col.offsetWidth;
        if (right <= scrollLeft) newLeft.push(i);
        else if (left >= scrollLeft + clientWidth) newRight.push(i);
      });

      setLeftHidden(newLeft);
      setRightHidden(newRight);
    };

    scroll.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(scroll);
    update();
    return () => {
      scroll.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [colCount]);

  const scrollToCol = (i: number) => {
    const col = colRefs.current[i];
    const scroll = scrollRef.current;
    if (!col || !scroll) return;
    scroll.scrollTo({ left: col.offsetLeft - 16, behavior: "smooth" });
  };

  const stripStyle = (
    idx: number,
    total: number,
    side: "left" | "right",
  ): React.CSSProperties => ({
    width: `${STRIP_W}px`,
    border: "none",
    padding: 0,
    background: colors.blue700,
    opacity: 0.45 + (idx / Math.max(1, total - 1)) * 0.5,
    borderRadius:
      side === "left"
        ? `0 ${radii.sm} ${radii.sm} 0`
        : `${radii.sm} 0 0 ${radii.sm}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  });

  return (
    <div style={{ position: "relative" }}>
      {/* Left strips — columns scrolled past, rightmost = closest to view */}
      {isOverflowing && leftHidden.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            display: "flex",
            gap: `${STRIP_GAP}px`,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {leftHidden.map((colIdx, i) => (
            <button
              key={colIdx}
              onClick={() => scrollToCol(colIdx)}
              title={`Connection #${colIdx + 1}`}
              style={{
                ...stripStyle(i, leftHidden.length, "left"),
                pointerEvents: "all",
              }}
            >
              <span
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  fontSize: "9px",
                  fontWeight: typography.weights.bold,
                  color: colors.white,
                  userSelect: "none",
                }}
              >
                #{colIdx + 1}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Right strips — columns not yet reached, leftmost = closest to view */}
      {isOverflowing && rightHidden.length > 0 && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "row-reverse",
            gap: `${STRIP_GAP}px`,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {rightHidden.map((colIdx, i) => (
            <button
              key={colIdx}
              onClick={() => scrollToCol(colIdx)}
              title={`Connection #${colIdx + 1}`}
              style={{
                ...stripStyle(
                  rightHidden.length - 1 - i,
                  rightHidden.length,
                  "right",
                ),
                pointerEvents: "all",
              }}
            >
              <span
                style={{
                  writingMode: "vertical-rl",
                  fontSize: "9px",
                  fontWeight: typography.weights.bold,
                  color: colors.white,
                  userSelect: "none",
                }}
              >
                #{colIdx + 1}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Scrollable grid — scrollbar hidden */}
      <div
        ref={scrollRef}
        style={
          {
            position: "relative",
            overflowX: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          } as React.CSSProperties
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${colCount}, minmax(400px, 1fr))`,
            columnGap: "1rem",
            rowGap: "0.375rem",
            alignItems: "center",
          }}
        >
          {/* Headers at logical row 1 → gridRow 2 */}
          {connections.map((group, colIndex) => (
            <div
              key={group.connectionId}
              ref={(el) => {
                colRefs.current[colIndex] = el;
              }}
              style={{
                gridColumn: colIndex + 1,
                gridRow: 2,
                alignSelf: "stretch",
              }}
            >
              <ConnectionHeader group={group} index={colIndex} />
            </div>
          ))}

          {/* Event cells — logical row r → gridRow r*2 */}
          {connections.flatMap((group, colIndex) => {
            const byRow = new Map<number, typeof group.events>();
            for (const event of group.events) {
              const row = eventRowMap.get(event.eventId)!;
              if (!byRow.has(row)) byRow.set(row, []);
              byRow.get(row)!.push(event);
            }
            return Array.from(byRow.entries()).map(([row, events]) => (
              <div
                key={`${group.connectionId}-${row}`}
                style={{
                  gridColumn: colIndex + 1,
                  gridRow: row * 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {events.map((event) => (
                  <EventCard
                    key={event.eventId}
                    event={event}
                    index={connectionEventIndex.get(event.eventId) ?? 0}
                  />
                ))}
              </div>
            ));
          })}

          {/* Empty-cell placeholders */}
          {emptyCells.map(({ row, colIndex }) => {
            const rows = connEventRows[colIndex] ?? [];
            const isObserving =
              rows.some((r) => r < row) && rows.some((r) => r > row);
            return (
              <div
                key={`empty-${colIndex}-${row}`}
                style={{
                  gridColumn: colIndex + 1,
                  gridRow: row * 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isObserving ? (
                  // Eye — connection is active but observing at this point
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill={colors.white}
                    stroke={colors.gray500}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  // Cross — connection has not started or has already ended
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill={colors.white}
                      stroke={colors.gray500}
                    />
                    <line
                      x1="9"
                      y1="9"
                      x2="15"
                      y2="15"
                      stroke={colors.gray500}
                    />
                    <line
                      x1="15"
                      y1="9"
                      x2="9"
                      y2="15"
                      stroke={colors.gray500}
                    />
                  </svg>
                )}
              </div>
            );
          })}

          {/* Horizontal separators between each row — span all columns, sit at odd gridRow slots */}
          {(() => {
            const usedRows = new Set<number>([1]);
            Array.from(eventRowMap.values()).forEach((row) => usedRows.add(row));
            const sorted = Array.from(usedRows).sort((a, b) => a - b);
            return sorted.slice(0, -1).map((r) => (
              <div
                key={`sep-${r}`}
                style={{
                  gridColumn: `1 / ${colCount + 1}`,
                  gridRow: r * 2 + 1,
                  height: "2px",
                  background: colors.gray300,
                  alignSelf: "center",
                  margin: "0.5rem 0",
                }}
              />
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

export function SessionDetail({ session, isLoading }: SessionDetailProps) {
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: colors.gray400,
          fontSize: typography.sizes.base,
        }}
      >
        Loading session...
      </div>
    );
  }

  if (!session) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: colors.gray400,
          fontSize: typography.sizes.base,
        }}
      >
        Select a session to inspect
      </div>
    );
  }

  const globalEvents = session.events.filter(
    (e) => !e.connectionId && e.type !== PlatformEventType.SESSION_RESULT,
  );
  const resultEvents = session.events.filter(
    (e) => e.type === PlatformEventType.SESSION_RESULT,
  );

  // Group all connection events into ±5ms buckets so near-simultaneous events
  // across connections share the same grid row. Events in the same bucket but
  // the same connection stack vertically (consecutive rows).
  const eventRowMap = new Map<string, number>();
  {
    const TIME_WINDOW_MS = 5;
    const allEvents = session.connections
      .flatMap((group) => group.events)
      .sort(
        (a, b) =>
          new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
      );

    // Cluster into buckets: new bucket when gap from bucket start > TIME_WINDOW_MS
    type Bucket = typeof allEvents;
    const buckets: Bucket[] = [];
    let bucketStart = -Infinity;
    for (const event of allEvents) {
      const t = new Date(event.occurredAt).getTime();
      if (t - bucketStart > TIME_WINDOW_MS) {
        buckets.push([]);
        bucketStart = t;
      }
      buckets[buckets.length - 1].push(event);
    }

    let currentRow = 2; // row 1 is the headers
    for (const bucket of buckets) {
      // Group by connection within this bucket
      const byConn = new Map<string, Bucket>();
      for (const event of bucket) {
        const key = event.connectionId ?? "__global__";
        if (!byConn.has(key)) byConn.set(key, []);
        byConn.get(key)!.push(event);
      }
      // All events in the same bucket share the same grid row,
      // regardless of connection — same-connection events stack inside the cell.
      Array.from(byConn.values()).forEach((connEvents) => {
        connEvents.forEach((event) => {
          eventRowMap.set(event.eventId, currentRow);
        });
      });
      currentRow += 1;
    }
  }

  const connectionEventIndex = new Map<string, number>();
  session.connections.forEach((group) => {
    group.events.forEach((event, i) => {
      connectionEventIndex.set(event.eventId, i);
    });
  });

  const occupiedByRow = new Map<number, Set<number>>();
  session.connections.forEach((group, colIndex) => {
    group.events.forEach((event) => {
      const row = eventRowMap.get(event.eventId)!;
      if (!occupiedByRow.has(row)) occupiedByRow.set(row, new Set());
      occupiedByRow.get(row)!.add(colIndex);
    });
  });
  const emptyCells = Array.from(occupiedByRow.entries()).flatMap(
    ([row, occupied]) =>
      Array.from({ length: session.connections.length }, (_, colIndex) => ({
        row,
        colIndex,
      })).filter(({ colIndex }) => !occupied.has(colIndex)),
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        padding: "1.25rem",
      }}
    >
      {/* Session Header */}
      <div
        style={{
          background: colors.white,
          border: `1px solid ${colors.gray200}`,
          borderRadius: radii.lg,
          padding: "0.75rem",
          boxShadow: shadows.xs,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: typography.sizes.xs,
                fontWeight: typography.weights.bold,
                color: colors.gray400,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "4px",
              }}
            >
              Session
            </div>
            <div
              style={{
                fontSize: typography.sizes.base,
                fontWeight: typography.weights.bold,
                color: colors.gray800,
                fontFamily: "monospace",
              }}
            >
              {session.sessionId}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: typography.sizes.xs,
                fontWeight: typography.weights.bold,
                color: colors.gray400,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "4px",
              }}
            >
              Workflow
            </div>
            <div
              style={{
                fontSize: typography.sizes.sm,
                fontWeight: typography.weights.semibold,
                color: colors.gray600,
                fontFamily: "monospace",
              }}
            >
              {session.workflowId}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.bold,
          color: colors.gray500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Event Timeline ({session.events.length})
      </div>

      {globalEvents.map((event, index) => (
        <EventCard key={event.eventId} event={event} index={index} />
      ))}

      {session.connections.length > 0 && (
        <ConnectionGrid
          connections={session.connections}
          eventRowMap={eventRowMap}
          connectionEventIndex={connectionEventIndex}
          emptyCells={emptyCells}
        />
      )}

      {resultEvents.map((event, index) => (
        <EventCard key={event.eventId} event={event} index={index} />
      ))}
    </div>
  );
}
