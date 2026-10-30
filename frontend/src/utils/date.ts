/**
 * Safe UTC date-time parser and local time formatter.
 * Ensures timestamps from EF Core/SQL Server are always interpreted as UTC,
 * handles edge cases (e.g., dot-separated time from regional locales like en-IN, missing offsets),
 * and accurately formats into the user's local timezone.
 */

export function parseUtcDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  let s = String(val).trim();
  if (!s || s === "null" || s === "undefined") return null;

  // Handle dot time separators e.g. "2026-10-30T10.45.00.769Z" or "2026-10-30 10.45.00"
  s = s.replace(/(\d{4}-\d{2}-\d{2}[ T])(\d{2})\.(\d{2})\.(\d{2})/, "$1$2:$3:$4");

  // Normalize space to 'T' if standard SQL datetime format
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(s)) {
    s = s.replace(" ", "T");
  }

  // If timestamp has no timezone indicator (Z or +/-offset), append 'Z' so browser parses as UTC
  const hasTimezone = /[Zz]$|[+-]\d{2}(:?\d{2})?$/.test(s);
  const normalized = hasTimezone ? s : `${s}Z`;

  let d = new Date(normalized);
  if (isNaN(d.getTime())) {
    d = new Date(s);
  }

  return isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(val: unknown): string {
  const d = parseUtcDate(val);
  if (!d) return "";
  return d.toLocaleString([], {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(val: unknown): string {
  const d = parseUtcDate(val);
  if (!d) return "";
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(val: unknown): string {
  const d = parseUtcDate(val);
  if (!d) return "";
  return d.toLocaleDateString();
}

export function formatRelativeTime(val: unknown): string {
  const d = parseUtcDate(val);
  if (!d) return "";
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  // Slight clock skew tolerance
  if (diffSec < 0 && diffSec > -60) return "Just now";
  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}
