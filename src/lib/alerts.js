// Alert evaluation logic — pure functions, UI-agnostic.
// Each rule defines metadata + an evaluate(ctx, config) function that returns:
//   { triggered, severity, headline, detail, measurement, threshold }
//
// Rule thresholds are tunable via a config object. Each rule declares its
// tunable knob in a `tunable` field (used by UI to render an input). Defaults
// are baked in — callers can pass a partial config and missing keys fall back.
//
// Used by:
//   - BudgetPage to render live "is anything firing right now?" panel
//   - (future) server-side cron job to send email/push notifications

export const SEVERITY = {
  CRITICAL: "critical",
  WARNING: "warning",
  INFO: "info",
};

export const RULES = {
  donationsBelowOverhead: {
    id: "donationsBelowOverhead",
    title: "Donations trending below overhead",
    description:
      "Warn if monthly giving falls under operating overhead. Raise the buffer for an early-warning trigger.",
    severity: SEVERITY.CRITICAL,
    icon: "TrendingDown",
    recipients: ["Full Admin", "Finance Admin"],
    tunable: {
      key: "bufferPct",
      label: "Trigger if donations below",
      unit: "% of overhead",
      default: 100,
      min: 80,
      max: 150,
      step: 5,
      // stored as fraction 0.8–1.5; surfaced to UI as percent
      toUi: (v) => Math.round(v * 100),
      fromUi: (n) => n / 100,
    },
    evaluate(ctx, config) {
      const buffer = config.bufferPct; // fraction, e.g. 1.0 or 1.1
      const m = ctx.lastMonthDonations;
      const t = ctx.operatingOverheadMo * buffer;
      const triggered = m < t;
      return {
        triggered,
        measurement: m,
        threshold: t,
        headline: triggered
          ? `Last month giving (${money(m)}) below ${pct(buffer)} of overhead (${money(t)})`
          : `Last month covered overhead by ${money(m - ctx.operatingOverheadMo)}`,
        detail: `${pct(buffer)} of overhead = ${money(t)}/mo. Most recent month came in at ${money(m)}.`,
      };
    },
  },

  ministryOverBudget: {
    id: "ministryOverBudget",
    title: "Ministry exceeds budget",
    description:
      "Notify when a ministry passes the configured percent of its annual budget.",
    severity: SEVERITY.WARNING,
    icon: "AlertTriangle",
    recipients: ["Ministry Leader", "Finance Admin"],
    tunable: {
      key: "threshold",
      label: "Trigger at",
      unit: "% of budget",
      default: 95,
      min: 50,
      max: 120,
      step: 5,
      toUi: (v) => Math.round(v * 100),
      fromUi: (n) => n / 100,
    },
    evaluate(ctx, config) {
      const t = config.threshold;
      const all = ctx.ministries
        .map((m) => ({ name: m.name, pct: m.spent / m.budget, spent: m.spent, budget: m.budget }))
        .sort((a, b) => b.pct - a.pct);
      const overBudget = all.filter((m) => m.pct >= t);
      const top = all[0];
      const triggered = overBudget.length > 0;
      return {
        triggered,
        measurement: overBudget.length,
        threshold: t,
        details: overBudget,
        headline: triggered
          ? `${overBudget.length} ministr${overBudget.length === 1 ? "y" : "ies"} above ${pct(t)}: ${overBudget.map((o) => o.name).join(", ")}`
          : `All ${ctx.ministries.length} ministries below ${pct(t)} of budget`,
        detail: triggered
          ? overBudget.map((o) => `${o.name}: ${pct(o.pct)} (${money(o.spent)} / ${money(o.budget)})`).join(" · ")
          : `Highest: ${top.name} at ${pct(top.pct)}.`,
      };
    },
  },

  receiptsMissing: {
    id: "receiptsMissing",
    title: "Receipts pending review",
    description:
      "Remind ministry leaders to resolve un-synced receipts older than the configured age.",
    severity: SEVERITY.INFO,
    icon: "Receipt",
    recipients: ["Ministry Leader"],
    tunable: {
      key: "staleDays",
      label: "Pending more than",
      unit: "days",
      default: 7,
      min: 1,
      max: 30,
      step: 1,
      toUi: (v) => v,
      fromUi: (n) => Math.round(n),
    },
    evaluate(ctx, config) {
      const days = config.staleDays;
      const stale = ctx.receipts.filter((r) => {
        if (r.status === "synced") return false;
        const ageDays = (ctx.now - new Date(r.date).getTime()) / DAY_MS;
        return ageDays >= days;
      });
      const triggered = stale.length > 0;
      return {
        triggered,
        measurement: stale.length,
        threshold: days,
        details: stale,
        headline: triggered
          ? `${stale.length} receipt${stale.length === 1 ? "" : "s"} pending ${days}+ days`
          : "All receipts current",
        detail: triggered
          ? stale
              .map((r) => `${r.vendor} (${money(r.amount)}, ${Math.floor((ctx.now - new Date(r.date).getTime()) / DAY_MS)}d old)`)
              .join(" · ")
          : `${ctx.receipts.length} tracked, oldest pending is within the ${days}-day window.`,
      };
    },
  },

  runwayBelow6: {
    id: "runwayBelow6",
    title: "Cash runway falling short",
    description:
      "Critical alert when reserves cannot cover the configured number of months of essentials.",
    severity: SEVERITY.CRITICAL,
    icon: "Flame",
    recipients: ["Senior Pastor", "Finance Admin"],
    tunable: {
      key: "months",
      label: "Trigger below",
      unit: "months",
      default: 6,
      min: 1,
      max: 24,
      step: 1,
      toUi: (v) => v,
      fromUi: (n) => Math.round(n),
    },
    evaluate(ctx, config) {
      const t = config.months;
      const months = ctx.cashOnHand / ctx.survivalFloorMo;
      const triggered = months < t;
      return {
        triggered,
        measurement: months,
        threshold: t,
        headline: triggered
          ? `${months.toFixed(1)} months remaining — below ${t} mo threshold`
          : `${months.toFixed(1)} months of essentials reserved (threshold: ${t} mo)`,
        detail: `${money(ctx.cashOnHand)} reserves ÷ ${money(ctx.survivalFloorMo)}/mo essentials.`,
      };
    },
  },
};

// Default config built from each rule's tunable.default.
export const DEFAULT_CONFIG = Object.fromEntries(
  Object.values(RULES).map((r) => [
    r.id,
    { [r.tunable.key]: r.tunable.fromUi(r.tunable.default) },
  ])
);

// Run all rules against ctx. enabledMap is { ruleId: boolean }.
// config is partial — missing rules / keys fall back to DEFAULT_CONFIG.
// Returns one row per rule (even disabled ones, marked muted) so callers
// can render them uniformly.
export function evaluate(ctx, enabledMap, config = {}) {
  return Object.values(RULES).map((rule) => {
    const enabled = !!enabledMap[rule.id];
    if (!enabled) return { rule, enabled, evaluated: false };
    const ruleConfig = { ...DEFAULT_CONFIG[rule.id], ...(config[rule.id] || {}) };
    return { rule, enabled, evaluated: true, config: ruleConfig, ...rule.evaluate(ctx, ruleConfig) };
  });
}

// Convert raw app data into the shape rules expect.
// Centralizing this keeps rules dumb and lets us swap data sources later.
export function buildContext({
  monthlyTrend,
  ministries,
  receipts,
  cashOnHand,
  operatingOverheadMo,
  survivalFloorMo,
  now,
}) {
  const last = monthlyTrend[monthlyTrend.length - 1];
  return {
    lastMonthDonations: last.donations,
    lastMonthExpenses: last.expenses,
    ministries,
    receipts,
    cashOnHand,
    operatingOverheadMo,
    survivalFloorMo,
    now: (now ?? new Date()).getTime(),
  };
}

// ---- internal helpers ----

const DAY_MS = 1000 * 60 * 60 * 24;

const money = (n) => {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return "$" + Math.round(n / 1_000) + "k";
  return "$" + Math.round(n);
};

const pct = (p) => `${Math.round(p * 100)}%`;
