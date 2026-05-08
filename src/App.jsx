import React, { useState, useMemo, useRef } from "react";
import {
  LayoutDashboard, HandHeart, Receipt, Users, Building2, Calendar,
  FileText, Plug, Settings, Search, Bell, ChevronDown, Plus, Upload,
  CheckCircle2, AlertCircle, Clock, TrendingUp, TrendingDown, DollarSign,
  Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Filter, Download,
  CreditCard, Banknote, Shield, UserPlus, Mail, MoreVertical, Eye,
  Edit3, Trash2, ChevronRight, Camera, Paperclip, X, Check, Lock,
  Sparkles, Activity, Church, MapPin, BarChart3, PieChart as PieIcon,
  RefreshCw, Link2, ExternalLink, Globe, Target, Gauge, AlertTriangle, Zap,
  Flame, BellRing, Info
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, AreaChart, Area, LineChart, Line, CartesianGrid, Legend
} from "recharts";
import { RULES as ALERT_RULES, evaluate as evaluateAlerts, buildContext as buildAlertContext, SEVERITY, DEFAULT_CONFIG as ALERT_DEFAULT_CONFIG } from "./lib/alerts.js";

// ============================================================
// DESIGN TOKENS
// ============================================================
const COLORS = {
  bg: "#0A0A0A",          // page canvas
  surface: "#141414",     // card surface
  ink: "#FAFAFA",         // primary text on dark
  inkSoft: "#A0A0A0",     // muted text
  forest: "#D4FF00",      // PRIMARY (lime) — was forest green
  forestDeep: "#000000",  // deep black accent
  copper: "#FF5A1F",      // SECONDARY (orange) — was copper brown
  copperSoft: "#FFB088",  // light orange tint
  cream: "#1F1F1F",       // tinted dark surface (was light beige)
  border: "#2A2A2A",      // standard border
  borderSoft: "#1A1A1A",  // softer / lower contrast border
  green: "#4ADE80",       // success
  red: "#FF3B8A",         // danger / IRC pink — was brick red
  amber: "#FBBF24",       // warning
};

const fontDisplay = `'Bricolage Grotesque', -apple-system, sans-serif`;
const fontBody = `'Manrope', -apple-system, sans-serif`;
const fontSerif = `'Instrument Serif', 'Times New Roman', serif`;

// ============================================================
// REAL 2025 DATA FROM IRC CHURCH FINANCIAL STATEMENT
// ============================================================
const DONATIONS_2025 = [
  { name: "Tithes & Offering", value: 1407005.03, color: "#D4FF00" },   // lime
  { name: "Month of Giving", value: 148302.69, color: "#FF5A1F" },     // orange
  { name: "Events Registration", value: 115976.22, color: "#FF3B8A" }, // pink
  { name: "Legacy", value: 108297.28, color: "#FBBF24" },              // amber
  { name: "New York Campus", value: 44000.00, color: "#A78BFA" },      // indigo
  { name: "Tacoma Campus", value: 24262.53, color: "#22D3EE" },        // teal
  { name: "Merch", value: 13426.61, color: "#F472B6" },                // rose
  { name: "Building Fund", value: 7136.05, color: "#4ADE80" },         // green
  { name: "Kids Ministry", value: 7154.06, color: "#FBBF24" },         // amber
  { name: "Single Mothers", value: 5393.11, color: "#A78BFA" },        // indigo
  { name: "Pastor's Blessing", value: 1748.75, color: "#22D3EE" },     // teal
];

const ADMIN_EXPENSES = [
  { name: "Payroll & Taxes (15 people)", value: 430015.14, pct: 25.94 },
  { name: "Rent, Insurance, Utilities", value: 402908.80, pct: 24.30 },
  { name: "Safe Haven Pay Off", value: 169922.08, pct: 10.25 },
  { name: "Other Expenses", value: 102321.72, pct: 6.17 },
  { name: "Tacoma Campus", value: 30005.99, pct: 1.81 },
  { name: "Ministers Blessing", value: 23200.00, pct: 1.40 },
  { name: "New York Campus", value: 21486.89, pct: 1.30 },
  { name: "Equipment", value: 20418.41, pct: 1.23 },
  { name: "Guests Blessing", value: 19331.80, pct: 1.17 },
];

const MINISTRIES = [
  { id: "worship", name: "Worship", spent: 17625.73, budget: 22000, leader: "Anna K.", campus: "main", color: "#D4FF00", icon: "♪" },          // lime
  { id: "technical", name: "Technical", spent: 33531.65, budget: 38000, leader: "Mark D.", campus: "main", color: "#FF5A1F", icon: "⚙" },     // orange
  { id: "video", name: "Video", spent: 5547.85, budget: 8000, leader: "Sergei P.", campus: "main", color: "#FF3B8A", icon: "▶" },             // pink
  { id: "light-screen", name: "Light & Screen", spent: 2019.90, budget: 3500, leader: "Tom B.", campus: "main", color: "#FBBF24", icon: "✦" },// yellow
  { id: "media", name: "Media", spent: 6590.64, budget: 9000, leader: "Lana V.", campus: "main", color: "#A78BFA", icon: "◈" },               // purple
  { id: "kids", name: "Kids Ministry", spent: 16850.34, budget: 20000, leader: "Maria R.", campus: "main", color: "#22D3EE", icon: "✧" },     // teal
  { id: "teens", name: "Teens", spent: 5615.34, budget: 8000, leader: "David O.", campus: "main", color: "#F472B6", icon: "♦" },              // rose
  { id: "youth", name: "Youth", spent: 9161.67, budget: 12000, leader: "Eli T.", campus: "main", color: "#4ADE80", icon: "▲" },               // green
  { id: "single-mom", name: "Single Moms", spent: 6073.25, budget: 8000, leader: "Olga S.", campus: "main", color: "#FB923C", icon: "♥" },    // peach
  { id: "deaf", name: "Deaf & Hard of Hearing", spent: 3082.89, budget: 5000, leader: "Ruth M.", campus: "main", color: "#60A5FA", icon: "✋" },// sky
  { id: "legacy", name: "Legacy", spent: 2124.07, budget: 4000, leader: "John W.", campus: "main", color: "#FACC15", icon: "✚" },             // gold
  { id: "services", name: "Sun/Fri Services & Care", spent: 57334.39, budget: 65000, leader: "Pastor Vlad", campus: "main", color: "#D4FF00", icon: "✟" }, // lime
  { id: "target", name: "Target Outreach", spent: 11518.67, budget: 15000, leader: "Anna K.", campus: "main", color: "#FF5A1F", icon: "◎" },  // orange
  { id: "merch", name: "Merch", spent: 13178.36, budget: 14000, leader: "Sasha L.", campus: "main", color: "#FF3B8A", icon: "◇" },            // pink
];

const EVENTS_CAMPS = [
  { name: "Bible School", type: "school", status: "completed", attendees: 84 },
  { name: "Church Picnic", type: "event", status: "completed", attendees: 412 },
  { name: "Fasting Retreat", type: "retreat", status: "completed", attendees: 67 },
  { name: "The Standard", type: "conference", status: "completed", attendees: 220 },
  { name: "Next Gen School", type: "school", status: "completed", attendees: 56 },
  { name: "Men's Camp", type: "camp", status: "completed", attendees: 138 },
  { name: "Women's Breakfast", type: "event", status: "completed", attendees: 95 },
  { name: "Open House Day", type: "event", status: "completed", attendees: 320 },
  { name: "Women's Retreat", type: "retreat", status: "completed", attendees: 142 },
  { name: "Family Night", type: "event", status: "recurring", attendees: 180 },
  { name: "Everett Storm Conference", type: "conference", status: "completed", attendees: 305 },
  { name: "Kids Camp", type: "camp", status: "completed", attendees: 76 },
  { name: "Egg Hunt", type: "event", status: "completed", attendees: 240 },
  { name: "Alpha Course", type: "school", status: "recurring", attendees: 48 },
  { name: "Everett Youth Camp", type: "camp", status: "completed", attendees: 92 },
  { name: "Easter Ministry Party", type: "event", status: "completed", attendees: 187 },
  { name: "IRC Camp", type: "camp", status: "completed", attendees: 215 },
  { name: "Teen Hike", type: "event", status: "completed", attendees: 41 },
  { name: "Kids Christmas", type: "event", status: "completed", attendees: 198 },
  { name: "Leadership Meeting", type: "meeting", status: "recurring", attendees: 28 },
  { name: "Candle Light", type: "event", status: "completed", attendees: 165 },
  { name: "Pastoral Board Meeting", type: "meeting", status: "recurring", attendees: 12 },
  { name: "Grand Christmas", type: "event", status: "completed", attendees: 580 },
];

const TEAM = [
  { name: "Pastor Vladimir", email: "vlad@ircchurch.org", role: "Senior Pastor", access: "Full Admin", avatar: "PV", lastActive: "Active now", campus: "All" },
  { name: "Anna Kovalenko", email: "anna@ircchurch.org", role: "Worship Leader", access: "Ministry Leader", avatar: "AK", lastActive: "2h ago", campus: "Main" },
  { name: "Maria Rojas", email: "maria@ircchurch.org", role: "Kids Director", access: "Ministry Leader", avatar: "MR", lastActive: "Yesterday", campus: "Main" },
  { name: "Sergei Popov", email: "sergei@ircchurch.org", role: "Video Lead", access: "Ministry Leader", avatar: "SP", lastActive: "3d ago", campus: "Main" },
  { name: "Elena Volkov", email: "elena@ircchurch.org", role: "Treasurer", access: "Finance Admin", avatar: "EV", lastActive: "Active now", campus: "All" },
  { name: "James Chen", email: "james@ircchurch.org", role: "NY Campus Pastor", access: "Campus Admin", avatar: "JC", lastActive: "5h ago", campus: "New York" },
  { name: "Olga Smirnova", email: "olga@ircchurch.org", role: "Single Moms Lead", access: "Ministry Leader", avatar: "OS", lastActive: "1d ago", campus: "Main" },
  { name: "Marcus Tate", email: "marcus@ircchurch.org", role: "Tacoma Campus Pastor", access: "Campus Admin", avatar: "MT", lastActive: "30m ago", campus: "Tacoma" },
];

const ADMINISTRATORS = [
  { id: "vlad", name: "Pastor Vladimir", avatar: "PV", type: "executive", campus: "All", title: "Senior Pastor", bio: "Vision, preaching, and pastoral care across all campuses." },
  { id: "anna", name: "Anna Kovalenko", avatar: "AK", type: "function", campus: "Main", title: "Creative Arts Director", bio: "Oversees worship, sound, video, lighting, and media production." },
  { id: "maria", name: "Maria Rojas", avatar: "MR", type: "function", campus: "Main", title: "Family & Next Gen", bio: "Children, teens, and young adults — full discipleship pipeline." },
  { id: "olga", name: "Olga Smirnova", avatar: "OS", type: "function", campus: "Main", title: "Care & Outreach", bio: "Single moms, deaf community, and target outreach initiatives." },
  { id: "elena", name: "Elena Volkov", avatar: "EV", type: "function", campus: "All", title: "Finance & Operations", bio: "Books, payroll, vendor relations, and the merch table." },
  { id: "marcus", name: "Marcus Tate", avatar: "MT", type: "campus", campus: "Tacoma", title: "Tacoma Campus Pastor", bio: "Launching Tacoma — building local ministry infrastructure." },
  { id: "james", name: "James Chen", avatar: "JC", type: "campus", campus: "New York", title: "NY Campus Pastor", bio: "Stewarding the New York launch — gathering, preaching, and care." },
];

const INITIAL_ASSIGNMENTS = {
  worship: "anna", technical: "anna", video: "anna", "light-screen": "anna", media: "anna",
  kids: "maria", teens: "maria", youth: "maria",
  "single-mom": "olga", deaf: "olga", target: "olga",
  legacy: "vlad", services: "vlad",
  merch: "elena",
};

const RECENT_RECEIPTS = [
  { id: 1, ministry: "Worship", vendor: "Sweetwater Audio", amount: 1284.50, date: "2025-12-28", status: "synced", uploadedBy: "Anna K." },
  { id: 2, ministry: "Kids Ministry", vendor: "Costco", amount: 487.22, date: "2025-12-27", status: "pending", uploadedBy: "Maria R." },
  { id: 3, ministry: "Technical", vendor: "B&H Photo Video", amount: 2149.99, date: "2025-12-26", status: "synced", uploadedBy: "Mark D." },
  { id: 4, ministry: "Sun/Fri Services", vendor: "Office Depot", amount: 156.80, date: "2025-12-26", status: "review", uploadedBy: "Pastor V." },
  { id: 5, ministry: "Youth", vendor: "Domino's Pizza", amount: 312.40, date: "2025-12-22", status: "synced", uploadedBy: "Eli T." },
  { id: 6, ministry: "Media", vendor: "Adobe", amount: 89.99, date: "2025-12-20", status: "synced", uploadedBy: "Lana V." },
  { id: 7, ministry: "Single Moms", vendor: "Walmart", amount: 425.66, date: "2025-12-19", status: "pending", uploadedBy: "Olga S." },
];

const MONTHLY_TREND = [
  { month: "Jan", donations: 142500, expenses: 128400 },
  { month: "Feb", donations: 138200, expenses: 131200 },
  { month: "Mar", donations: 156700, expenses: 142800 },
  { month: "Apr", donations: 174300, expenses: 138900 },
  { month: "May", donations: 162100, expenses: 145600 },
  { month: "Jun", donations: 158900, expenses: 152300 },
  { month: "Jul", donations: 149800, expenses: 134700 },
  { month: "Aug", donations: 153200, expenses: 141500 },
  { month: "Sep", donations: 167400, expenses: 148200 },
  { month: "Oct", donations: 171800, expenses: 138600 },
  { month: "Nov", donations: 165900, expenses: 156100 },
  { month: "Dec", donations: 241902, expenses: 199371 },
];

const TOTAL_DONATIONS = 1882702.33;
const TOTAL_EXPENSES = 1657771.59;
const TOTAL_SAVINGS = 224930.74;
const BALANCE_START = 702050.10;
const BALANCE_END = 926980.84;

// ============================================================
// BUDGET PLAN — derived from 2025 actuals + 5% buffer, Safe Haven loan removed
// ============================================================

const MONTHLY_OVERHEAD = {
  facilities: [
    { name: "Rent (Main campus)", amount: 20000, essential: true },
    { name: "Property insurance", amount: 4500, essential: true },
    { name: "Utilities (gas, electric, water)", amount: 7500, essential: true },
    { name: "Internet & phone", amount: 1576, essential: true },
  ],
  people: [
    { name: "Payroll (15 staff)", amount: 31000, essential: true },
    { name: "Payroll taxes & benefits", amount: 4835, essential: true },
  ],
  operations: [
    { name: "Software & subscriptions", amount: 2800, essential: false },
    { name: "Banking & merchant fees", amount: 1400, essential: false },
    { name: "D&O / liability insurance", amount: 1500, essential: false },
    { name: "Accounting & legal", amount: 2400, essential: false },
    { name: "Office supplies", amount: 600, essential: false },
    { name: "Misc admin", amount: 1500, essential: false },
  ],
};

const flatten = (cats) => Object.values(cats).flat();
const SURVIVAL_FLOOR_MO = flatten(MONTHLY_OVERHEAD).filter(l => l.essential).reduce((s, l) => s + l.amount, 0);
const OPERATING_OVERHEAD_MO = flatten(MONTHLY_OVERHEAD).reduce((s, l) => s + l.amount, 0);
const OPERATING_OVERHEAD_YR = OPERATING_OVERHEAD_MO * 12;

const MINISTRIES_BUDGET_YR = 231500;
const EVENTS_BUDGET_YR = 130000;
const BLESSINGS_BUDGET_YR = 45000;

const OPERATING_BUDGET_YR = OPERATING_OVERHEAD_YR + MINISTRIES_BUDGET_YR + EVENTS_BUDGET_YR + BLESSINGS_BUDGET_YR;
const DONATION_TARGET_YR = 1980000;
const PLANNED_SURPLUS_YR = DONATION_TARGET_YR - OPERATING_BUDGET_YR;

const DONATION_TIERS = [
  { name: "Survival", target: SURVIVAL_FLOOR_MO * 12, desc: "Keeps the doors open. Bare essentials only.", color: COLORS.red },
  { name: "Operating", target: OPERATING_BUDGET_YR, desc: "Full ministry calendar at planned scale.", color: COLORS.amber },
  { name: "Vision", target: DONATION_TARGET_YR, desc: "Operating + savings + new initiatives.", color: COLORS.green },
];

// Last-month (April 2026) spend per ministry — drives end-of-month reconciliation.
const LAST_MONTH_SPEND = {
  worship: 1420,
  technical: 3210,        // over budget
  video: 540,
  "light-screen": 230,
  media: 590,
  kids: 1480,
  teens: 540,
  youth: 850,
  "single-mom": 290,
  deaf: 280,
  legacy: 175,
  services: 4920,
  target: 990,
  merch: 1015,
};

// 6-month forecast per ministry — synthetic seasonal patterns.
// Real implementation would be statistical projection from years of data.
const FORECAST_HISTORY = {
  worship:        [88, 92, 90, 95, 93, 91],   // stable, slight fall bump
  technical:      [102, 105, 100, 98, 103, 99], // pattern persists, still over
  video:          [62, 65, 68, 64, 67, 65],   // continues under
  "light-screen": [55, 70, 60, 75, 65, 60],   // still volatile
  media:          [80, 82, 81, 83, 82, 80],   // stable
  kids:           [85, 60, 55, 88, 92, 105],  // summer dip, Christmas peak
  teens:          [60, 80, 88, 65, 62, 60],   // summer camp peak
  youth:          [82, 95, 92, 80, 78, 84],   // summer peak
  "single-mom":   [50, 48, 52, 55, 58, 50],   // continues under
  deaf:           [56, 58, 55, 60, 58, 57],   // continues under
  legacy:         [52, 50, 55, 58, 55, 52],   // continues under
  services:       [89, 88, 90, 92, 93, 90],   // stable, slight fall bump
  target:         [83, 82, 84, 85, 83, 84],   // stable
  merch:          [94, 93, 92, 95, 96, 100],  // stable, peaks Dec
};

// Seed activity log — represents the audit trail for the past few days.
const INITIAL_ACTIVITY_LOG = [
  { id: 1, type: "roll", who: "Elena Volkov", ministry: "Worship", amount: 413, note: "April leftover rolled forward to May allocation", timestamp: "2026-05-07T14:30:00" },
  { id: 2, type: "return", who: "Elena Volkov", ministry: "Legacy", amount: 158, note: "April leftover returned to general fund", timestamp: "2026-05-07T14:28:00" },
  { id: 3, type: "return", who: "Elena Volkov", ministry: "Single Moms", amount: 377, note: "April leftover returned to general fund", timestamp: "2026-05-07T14:27:00" },
  { id: 4, type: "budget", who: "Pastor Vladimir", ministry: "Single Moms", amount: -3500, note: "Annual budget reduced from $8,000 to $4,500 based on 6-month utilization", timestamp: "2026-05-07T11:15:00" },
  { id: 5, type: "notification", who: "System", ministry: "Single Moms", amount: 0, note: "Email sent to Olga S. — budget reduction notification with reasoning", timestamp: "2026-05-07T11:15:00" },
  { id: 6, type: "alert", who: "System", ministry: "Technical", amount: 0, note: "Alert: Technical ministry exceeded 95% of monthly budget", timestamp: "2026-05-06T22:04:00" },
  { id: 7, type: "review", who: "Pastor Vladimir", ministry: null, amount: 0, note: "Q1 2026 budget review approved — 4 reductions applied, 1 increase applied", timestamp: "2026-05-06T16:30:00" },
  { id: 8, type: "budget", who: "Pastor Vladimir", ministry: "Technical", amount: 4000, note: "Annual budget increased from $38,000 to $42,000 — 2 months over allocation", timestamp: "2026-05-06T16:25:00" },
  { id: 9, type: "notification", who: "System", ministry: "Technical", amount: 0, note: "Email sent to Mark D. — budget increase notification", timestamp: "2026-05-06T16:25:00" },
  { id: 10, type: "roll", who: "Anna Kovalenko", ministry: "Media", amount: 160, note: "April leftover rolled forward to May allocation", timestamp: "2026-05-06T10:12:00" },
  { id: 11, type: "alert", who: "System", ministry: null, amount: 0, note: "Alert: 1 receipt pending review more than 7 days (Walmart, $425.66)", timestamp: "2026-05-05T08:00:00" },
  { id: 12, type: "roll", who: "Maria Rojas", ministry: "Kids Ministry", amount: 187, note: "April leftover rolled forward to May allocation", timestamp: "2026-05-05T09:45:00" },
  { id: 13, type: "review", who: "Pastor Vladimir", ministry: null, amount: 0, note: "Quarterly review snoozed for 7 days", timestamp: "2026-05-04T18:00:00" },
];

// 6-month utilization history per ministry (% of monthly budget spent).
// Drives the recommendations engine pattern detection.
const UTILIZATION_HISTORY = {
  worship: [85, 88, 91, 87, 89, 86],
  technical: [98, 105, 102, 95, 99, 88],
  video: [55, 60, 65, 62, 68, 64],
  "light-screen": [45, 78, 30, 62, 85, 50],
  media: [78, 82, 75, 80, 79, 81],
  kids: [88, 90, 87, 92, 89, 91],
  teens: [62, 58, 65, 60, 63, 61],
  youth: [82, 85, 80, 87, 84, 86],
  "single-mom": [42, 48, 50, 45, 38, 52],
  deaf: [55, 58, 52, 60, 56, 57],
  legacy: [50, 55, 48, 52, 57, 53],
  services: [88, 90, 87, 89, 91, 88],
  target: [82, 85, 80, 84, 83, 81],
  merch: [92, 95, 93, 94, 96, 92],
};

// Hand-tuned suggestions so totals reconcile to round numbers.
const RECOMMENDATIONS_OVERRIDE = {
  video: 5500,
  teens: 5000,
  "single-mom": 4500,
  deaf: 3500,
  legacy: 3000,
  technical: 42000,
};

// Classify a ministry into reduce / increase / volatile / on-track.
// type:        'reduce' | 'increase' | 'volatile' | 'on-track'
// confidence:  'high' | 'medium' | 'low' (only for actionable types)
// suggestedBudget: optional new annual budget (null for volatile/on-track)
function classifyMinistry(m) {
  const history = UTILIZATION_HISTORY[m.id] || [];
  if (history.length === 0) return { type: "on-track", confidence: "low", reasoning: "No data yet", history };
  const avg = history.reduce((s, n) => s + n, 0) / history.length;
  const max = Math.max(...history);
  const min = Math.min(...history);
  const range = max - min;
  const overCount = history.filter((n) => n > 100).length;

  let type, confidence, reasoning;

  if (range > 35) {
    type = "volatile";
    confidence = "—";
    reasoning = `Spending varies ${min}–${max}% — pattern needs human review`;
  } else if (avg < 65) {
    type = "reduce";
    confidence = range < 15 ? "high" : "medium";
    reasoning = `${Math.round(avg)}% average utilization — significantly underused`;
  } else if (overCount >= 2 || avg > 95) {
    type = "increase";
    confidence = overCount >= 2 ? "medium" : "low";
    reasoning = `Exceeded budget ${overCount} of ${history.length} months — under-allocated`;
  } else {
    type = "on-track";
    confidence = "high";
    reasoning = avg >= 90 ? "Excellent budget discipline" : avg >= 85 ? "Well-managed" : "On track";
  }

  const suggestedBudget = RECOMMENDATIONS_OVERRIDE[m.id] ?? null;
  const delta = suggestedBudget != null ? suggestedBudget - m.budget : 0;
  const forecast = FORECAST_HISTORY[m.id] || [];
  return { type, confidence, reasoning, history, forecast, avg, max, min, range, suggestedBudget, delta };
}

const STRESS_SCENARIOS = [
  { name: "Baseline", drop: 0, projected: DONATION_TARGET_YR },
  { name: "−10% downturn", drop: 0.10, projected: DONATION_TARGET_YR * 0.90 },
  { name: "−25% recession", drop: 0.25, projected: DONATION_TARGET_YR * 0.75 },
  { name: "−50% crisis", drop: 0.50, projected: DONATION_TARGET_YR * 0.50 },
];

const fmt = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n) => {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "k";
  return "$" + n.toFixed(0);
};

// ============================================================
// SHARED COMPONENTS
// ============================================================

const Pill = ({ children, tone = "neutral" }) => {
  const tones = {
    neutral: { bg: "#1F1F1F", color: "#A0A0A0" },
    success: { bg: "rgba(74,222,128,0.16)", color: "#4ADE80" },
    warn: { bg: "rgba(251,191,36,0.18)", color: "#FBBF24" },
    danger: { bg: "rgba(255,59,138,0.18)", color: "#FF3B8A" },
    forest: { bg: "#D4FF00", color: "#0A0A0A" },
    copper: { bg: "rgba(255,90,31,0.18)", color: "#FF5A1F" },
  };
  const s = tones[tone] || tones.neutral;
  return (
    <span style={{
      backgroundColor: s.bg, color: s.color, padding: "3px 10px",
      borderRadius: 99, fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
      textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 4
    }}>
      {children}
    </span>
  );
};

// Click-to-edit text. Enter saves, Esc cancels, blur saves.
// Renders as plain text until clicked; swaps to <input> inline.
// Pass `as="number"` for numeric editing.
const EditableText = ({ value, onChange, placeholder, as = "text", style = {}, hoverHint = true, format }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));

  if (editing) {
    return (
      <input
        autoFocus
        type={as === "number" ? "number" : "text"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onBlur={() => {
          onChange(as === "number" ? Number(draft) : draft);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onChange(as === "number" ? Number(draft) : draft); setEditing(false); }
          if (e.key === "Escape") { setDraft(String(value ?? "")); setEditing(false); }
        }}
        style={{
          ...style,
          background: COLORS.surface,
          border: `1px solid ${COLORS.copper}`,
          borderRadius: 4,
          padding: "2px 6px",
          outline: "none",
          fontFamily: style.fontFamily || fontBody,
          width: as === "number" ? 90 : "100%",
          minWidth: 80,
          boxSizing: "border-box",
        }}
      />
    );
  }

  const display = value === "" || value == null
    ? <span style={{ color: COLORS.inkSoft, fontStyle: "italic" }}>{placeholder || "—"}</span>
    : (format ? format(value) : value);

  return (
    <span
      onClick={(e) => { e.stopPropagation(); setDraft(String(value ?? "")); setEditing(true); }}
      style={{
        ...style,
        cursor: "text",
        padding: "2px 6px",
        borderRadius: 4,
        transition: "background 0.1s",
        display: "inline-block",
      }}
      onMouseEnter={(e) => { if (hoverHint) e.currentTarget.style.background = COLORS.cream; }}
      onMouseLeave={(e) => { if (hoverHint) e.currentTarget.style.background = "transparent"; }}
      title="Click to edit"
    >
      {display}
    </span>
  );
};

const Card = ({ children, style = {}, className = "" }) => (
  <div className={className} style={{
    backgroundColor: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    ...style
  }}>
    {children}
  </div>
);

// ============================================================
// SIDEBAR
// ============================================================

const Sidebar = ({ activePage, setActivePage }) => {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "donations", label: "Donations", icon: HandHeart },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "budget", label: "Budget", icon: Target },
    { id: "ministries", label: "Ministries", icon: Users },
    { id: "campuses", label: "Campuses", icon: Building2 },
    { id: "administrators", label: "Administrators", icon: UserPlus },
    { id: "events", label: "Events & Camps", icon: Calendar },
    { id: "receipts", label: "Receipts", icon: Paperclip },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "people", label: "People & Roles", icon: Shield },
    { id: "integrations", label: "Integrations", icon: Plug },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  return (
    <aside style={{
      width: 248, backgroundColor: COLORS.forestDeep, color: COLORS.ink,
      display: "flex", flexDirection: "column", padding: "24px 0",
      borderRight: `1px solid ${COLORS.border}`, height: "100vh", position: "sticky", top: 0,
    }}>
      <div style={{ padding: "0 24px 24px", borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.copper,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: COLORS.forestDeep, fontFamily: fontDisplay, fontWeight: 700, fontSize: 18,
          }}>✚</div>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 600, letterSpacing: -0.3 }}>IRC</div>
            <div style={{ fontSize: 10, color: "rgba(250,250,250,0.6)", letterSpacing: 1.5, textTransform: "uppercase" }}>Steward · v1.0</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((it) => {
          const Icon = it.icon;
          const active = activePage === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setActivePage(it.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 10,
                backgroundColor: active ? COLORS.copper : "transparent",
                color: active ? COLORS.forestDeep : "rgba(250,250,250,0.85)",
                border: "none", cursor: "pointer", fontSize: 14, fontWeight: active ? 600 : 500,
                fontFamily: fontBody, textAlign: "left", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              {it.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: COLORS.copper, color: COLORS.forestDeep, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>EV</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Elena Volkov</div>
            <div style={{ fontSize: 11, color: "rgba(250,250,250,0.55)" }}>Finance Admin</div>
          </div>
          <Settings size={15} style={{ color: "rgba(250,250,250,0.55)", cursor: "pointer" }} />
        </div>
      </div>
    </aside>
  );
};

// ============================================================
// TOP BAR
// ============================================================

const TopBar = ({ activeCampus, setActiveCampus, pageTitle, pageSubtitle }) => {
  const [campusOpen, setCampusOpen] = useState(false);
  const campuses = [
    { id: "all", name: "All Campuses", desc: "Consolidated view" },
    { id: "main", name: "Main · Everett", desc: "WA · Primary" },
    { id: "tacoma", name: "Tacoma", desc: "WA · Campus" },
    { id: "ny", name: "New York", desc: "NY · Campus" },
  ];
  const current = campuses.find((c) => c.id === activeCampus);

  return (
    <div style={{
      backgroundColor: COLORS.bg, borderBottom: `1px solid ${COLORS.border}`,
      padding: "20px 36px", display: "flex", alignItems: "center", justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(8px)",
    }}>
      <div>
        <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 500, color: COLORS.ink, letterSpacing: -0.5, fontStyle: "italic" }}>
          {pageTitle}
        </div>
        <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>{pageSubtitle}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, backgroundColor: COLORS.surface,
          padding: "8px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, width: 280
        }}>
          <Search size={15} color={COLORS.inkSoft} />
          <input
            placeholder="Search donors, ministries, receipts…"
            style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, fontFamily: fontBody, flex: 1, color: COLORS.ink }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setCampusOpen(!campusOpen)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
              backgroundColor: COLORS.forest, color: COLORS.bg, border: "none",
              borderRadius: 10, cursor: "pointer", fontFamily: fontBody, fontSize: 13, fontWeight: 600
            }}
          >
            <MapPin size={14} />
            {current.name}
            <ChevronDown size={14} />
          </button>
          {campusOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0, width: 240,
              backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`,
              borderRadius: 12, padding: 6, boxShadow: "0 10px 40px rgba(31,58,52,0.12)", zIndex: 30,
            }}>
              {campuses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setActiveCampus(c.id); setCampusOpen(false); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left", padding: "10px 12px",
                    border: "none", borderRadius: 8, fontFamily: fontBody, cursor: "pointer",
                    backgroundColor: activeCampus === c.id ? COLORS.cream : "transparent",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{c.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button style={{ position: "relative", background: COLORS.surface, padding: 9, borderRadius: 10, cursor: "pointer", border: `1px solid ${COLORS.border}` }}>
          <Bell size={16} color={COLORS.ink} />
          <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", backgroundColor: COLORS.red }} />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// BUDGET HEALTH HERO CARD (Dashboard top)
// ============================================================

const BudgetHealthCard = ({ ministries }) => {
  const currentDonations = MONTHLY_TREND[MONTHLY_TREND.length - 1].donations;
  const currentExpenses = MONTHLY_TREND[MONTHLY_TREND.length - 1].expenses;
  const ministriesBudget = ministries.reduce((s, m) => s + m.budget, 0);
  const operatingBudget = OPERATING_OVERHEAD_YR + ministriesBudget + EVENTS_BUDGET_YR + BLESSINGS_BUDGET_YR;
  const monthlyBudget = operatingBudget / 12;
  const cashOnHand = BALANCE_END;

  const overheadCoverage = currentDonations / OPERATING_OVERHEAD_MO;
  const surplusOverOverhead = currentDonations - OPERATING_OVERHEAD_MO;
  const runwayMonths = cashOnHand / SURVIVAL_FLOOR_MO;

  const donationsOK = currentDonations >= monthlyBudget * 0.85;
  const overheadOK = currentDonations >= OPERATING_OVERHEAD_MO;
  const runwayOK = runwayMonths >= 6;
  const passing = [donationsOK, overheadOK, runwayOK].filter(Boolean).length;
  const status = passing === 3 ? "on-track" : passing === 2 ? "caution" : "at-risk";

  const cfg = {
    "on-track": { label: "On Track", color: COLORS.green, bg: "rgba(74,222,128,0.16)", accent: COLORS.green },
    "caution": { label: "Caution", color: COLORS.amber, bg: "rgba(251,191,36,0.18)", accent: COLORS.amber },
    "at-risk": { label: "At Risk", color: COLORS.red, bg: "rgba(255,59,138,0.18)", accent: COLORS.red },
  }[status];

  const headline = status === "on-track"
    ? `On pace to cover overhead with ${fmtShort(surplusOverOverhead)} to spare this month.`
    : status === "caution"
    ? `Watching donations closely — ${fmtShort(surplusOverOverhead)} above overhead so far.`
    : `Overhead at risk — donations trailing target this month.`;

  const metrics = [
    {
      label: "Donations pace",
      value: fmtShort(currentDonations),
      sub: `${Math.round((currentDonations / monthlyBudget) * 100)}% of monthly budget`,
      ok: donationsOK,
    },
    {
      label: "Expenses pace",
      value: fmtShort(currentExpenses),
      sub: `${Math.round((currentExpenses / monthlyBudget) * 100)}% of monthly budget`,
      ok: currentExpenses <= monthlyBudget * 1.15,
    },
    {
      label: "Overhead coverage",
      value: `${overheadCoverage.toFixed(1)}×`,
      sub: `${fmtShort(OPERATING_OVERHEAD_MO)}/mo target`,
      ok: overheadOK,
    },
    {
      label: "Cash runway",
      value: `${runwayMonths.toFixed(1)} mo`,
      sub: `On essentials only (${fmtShort(SURVIVAL_FLOOR_MO)}/mo)`,
      ok: runwayOK,
    },
  ];

  return (
    <Card style={{
      padding: 28, position: "relative", overflow: "hidden",
      background: `linear-gradient(135deg, ${COLORS.surface} 0%, ${cfg.bg}80 100%)`,
      borderColor: cfg.accent + "40",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, backgroundColor: cfg.accent }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Gauge size={18} color={cfg.accent} strokeWidth={2} />
            <span style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>Budget Health</span>
            <Pill tone={status === "on-track" ? "success" : status === "caution" ? "warn" : "danger"}>
              {cfg.label}
            </Pill>
          </div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, color: COLORS.ink, fontStyle: "italic", letterSpacing: -0.5, lineHeight: 1.2, maxWidth: 720 }}>
            {headline}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 8 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{
            padding: 14, backgroundColor: COLORS.surface, borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: m.ok ? COLORS.green : COLORS.amber }} />
              <span style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>{m.label}</span>
            </div>
            <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, color: COLORS.ink, letterSpacing: -0.5 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ============================================================
// DASHBOARD PAGE
// ============================================================

const DashboardPage = ({ ministries }) => {
  const kpis = [
    { label: "Total Donations '25", value: fmt(TOTAL_DONATIONS), trend: "+12.4%", icon: HandHeart, tone: "forest" },
    { label: "Total Expenses '25", value: fmt(TOTAL_EXPENSES), trend: "88.05% of donations", icon: Receipt, tone: "copper" },
    { label: "Net Savings", value: fmt(TOTAL_SAVINGS), trend: "11.95% retained", icon: PiggyBank, tone: "green" },
    { label: "Year-End Balance", value: fmt(BALANCE_END), trend: `+${fmt(BALANCE_END - BALANCE_START)} YoY`, icon: Wallet, tone: "ink" },
  ];

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 24 }}>
      <BudgetHealthCard ministries={ministries} />
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <Card key={i} style={{ padding: 22, position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 500, letterSpacing: 0.4, textTransform: "uppercase" }}>{k.label}</div>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  backgroundColor: i === 0 ? COLORS.forest : i === 1 ? COLORS.copper : i === 2 ? COLORS.green : COLORS.ink,
                  color: COLORS.ink, display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ fontFamily: fontDisplay, fontSize: 30, fontWeight: 500, color: COLORS.ink, letterSpacing: -1 }}>
                {k.value}
              </div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>{k.trend}</div>
            </Card>
          );
        })}
      </div>

      {/* Trend chart + Donation breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Cash flow, 2025</div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Donations vs. expenses, month-over-month</div>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: COLORS.forest }} />Donations
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: COLORS.copper }} />Expenses
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={MONTHLY_TREND}>
              <defs>
                <linearGradient id="don" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.forest} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS.forest} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.copper} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.copper} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={COLORS.border} vertical={false} />
              <XAxis dataKey="month" stroke={COLORS.inkSoft} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={COLORS.inkSoft} fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtShort} />
              <Tooltip
                contentStyle={{ backgroundColor: COLORS.forestDeep, border: "none", borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: COLORS.ink }}
                itemStyle={{ color: COLORS.ink }}
                formatter={(v) => fmtShort(v)}
              />
              <Area type="monotone" dataKey="donations" stroke={COLORS.forest} strokeWidth={2} fill="url(#don)" />
              <Area type="monotone" dataKey="expenses" stroke={COLORS.copper} strokeWidth={2} fill="url(#exp)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Donation sources</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Where giving came from</div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={DONATIONS_2025.slice(0, 6)} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                {DONATIONS_2025.slice(0, 6).map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => fmtShort(v)} contentStyle={{ backgroundColor: COLORS.forestDeep, border: "none", borderRadius: 10, fontSize: 12, color: COLORS.ink }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {DONATIONS_2025.slice(0, 5).map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: d.color }} />
                <span style={{ flex: 1, color: COLORS.ink }}>{d.name}</span>
                <span style={{ color: COLORS.inkSoft, fontVariantNumeric: "tabular-nums" }}>{fmtShort(d.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Ministry budget heatmap + Recent activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Ministry spend vs. budget</div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{ministries.length} active ministries</div>
            </div>
            <button style={{ background: "transparent", border: `1px solid ${COLORS.border}`, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, cursor: "pointer", color: COLORS.ink }}>
              View all →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ministries.slice(0, 8).map((m) => {
              const pct = (m.spent / m.budget) * 100;
              return (
                <div key={m.id} style={{ display: "grid", gridTemplateColumns: "150px 1fr 110px", gap: 14, alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.ink }}>{m.name}</div>
                  <div style={{ height: 8, backgroundColor: COLORS.cream, borderRadius: 99, position: "relative", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${Math.min(pct, 100)}%`,
                      backgroundColor: pct > 95 ? COLORS.red : pct > 80 ? COLORS.amber : m.color,
                      borderRadius: 99, transition: "width 0.4s",
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {fmtShort(m.spent)} <span style={{ color: COLORS.inkSoft }}>/ {fmtShort(m.budget)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Recent activity</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Latest receipts & donations</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {RECENT_RECEIPTS.slice(0, 5).map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Receipt size={15} color={COLORS.copper} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.vendor}</div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{r.ministry} · {r.uploadedBy}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, fontVariantNumeric: "tabular-nums" }}>{fmt(r.amount)}</div>
                  <div style={{ fontSize: 10, color: r.status === "synced" ? COLORS.green : r.status === "pending" ? COLORS.amber : COLORS.red, textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.4 }}>{r.status}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Camp/Retreat strip */}
      <Card style={{ padding: 24, backgroundColor: COLORS.forestDeep, color: COLORS.ink, border: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, fontStyle: "italic" }}>Camps & retreats, 2025</div>
            <div style={{ fontSize: 13, color: "rgba(250,250,250,0.7)" }}>23 events · {fmt(247906.01)} spent · {fmt(115976.22)} recovered via registration</div>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(250,250,250,0.6)", letterSpacing: 0.4, textTransform: "uppercase" }}>Net cost</div>
              <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 500, letterSpacing: -0.5 }}>{fmt(131929.79)}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {EVENTS_CAMPS.slice(0, 12).map((e, i) => (
            <div key={i} style={{ padding: "12px 14px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 12 }}>
              <div style={{ fontWeight: 600 }}>{e.name}</div>
              <div style={{ color: "rgba(250,250,250,0.6)", fontSize: 11, marginTop: 2 }}>{e.attendees} attended</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ============================================================
// DONATIONS PAGE
// ============================================================

const DonationsPage = () => {
  const [filter, setFilter] = useState("all");

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Connected sources strip */}
      <Card style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Live giving sources</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Connected payment platforms · synced every 15 min</div>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.forest, color: COLORS.bg, border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={13} /> Sync now
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { name: "Stripe", status: "connected", amount: 1124400, color: "#635BFF", icon: "S", count: 4287 },
            { name: "Square", status: "connected", amount: 583200, color: "#000000", icon: "■", count: 2104 },
            { name: "Manual / Cash", status: "active", amount: 156100, color: COLORS.copper, icon: "$", count: 312 },
            { name: "Check / ACH", status: "active", amount: 19002, color: COLORS.green, icon: "✓", count: 68 },
          ].map((s, i) => (
            <div key={i} style={{ padding: 16, border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{s.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.ink }}>{s.name}</div>
                </div>
                <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: COLORS.green, boxShadow: `0 0 0 3px ${COLORS.green}25` }} />
              </div>
              <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, color: COLORS.ink, letterSpacing: -0.5 }}>{fmtShort(s.amount)}</div>
              <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{s.count.toLocaleString()} transactions YTD</div>
            </div>
          ))}
        </div>
      </Card>

      {/* All donations breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Donations by category</div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Full year 2025 · {fmt(TOTAL_DONATIONS)} total</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["all", "main", "tacoma", "ny"].map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "6px 12px", border: filter === f ? "none" : `1px solid ${COLORS.border}`,
                  backgroundColor: filter === f ? COLORS.forest : "transparent",
                  color: filter === f ? COLORS.cream : COLORS.ink, borderRadius: 7, fontSize: 11, fontWeight: 600,
                  fontFamily: fontBody, textTransform: "uppercase", letterSpacing: 0.4, cursor: "pointer",
                }}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DONATIONS_2025.map((d, i) => {
              const pct = (d.value / TOTAL_DONATIONS) * 100;
              return (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 10, backgroundColor: COLORS.bg, display: "grid", gridTemplateColumns: "200px 1fr 120px 60px", gap: 14, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</span>
                  </div>
                  <div style={{ height: 6, backgroundColor: COLORS.cream, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, backgroundColor: d.color, borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.ink, fontVariantNumeric: "tabular-nums", fontWeight: 600, textAlign: "right" }}>{fmt(d.value)}</div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, textAlign: "right" }}>{pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Recent donations</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Auto-imported from Stripe & Square</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { donor: "Anonymous", amount: 500, source: "Stripe", category: "Tithes", time: "2 min ago" },
              { donor: "M. Petrov", amount: 1200, source: "Stripe", category: "Building Fund", time: "18 min ago" },
              { donor: "Sarah K.", amount: 250, source: "Square", category: "Tithes", time: "1h ago" },
              { donor: "J. Williams", amount: 100, source: "Square", category: "Kids Ministry", time: "2h ago" },
              { donor: "Anonymous", amount: 75, source: "Stripe", category: "Single Mothers", time: "3h ago" },
              { donor: "T. Garcia", amount: 5000, source: "ACH", category: "Legacy", time: "5h ago" },
              { donor: "L. Vinogradov", amount: 300, source: "Stripe", category: "Tithes", time: "Yesterday" },
              { donor: "Cash · Sun service", amount: 4280, source: "Manual", category: "Tithes", time: "Yesterday" },
            ].map((d, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 12, transition: "background 0.15s", cursor: "pointer" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.bg}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Banknote size={14} color={COLORS.copper} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{d.donor}</div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{d.category} · {d.source}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.green, fontVariantNumeric: "tabular-nums" }}>+{fmt(d.amount)}</div>
                  <div style={{ fontSize: 10, color: COLORS.inkSoft }}>{d.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ============================================================
// EXPENSES PAGE
// ============================================================

const ExpensesPage = () => {
  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <Card style={{ padding: 22 }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Administrative</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, color: COLORS.ink, marginTop: 6, letterSpacing: -0.5 }}>{fmt(1219610.83)}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>73.57% of expenses</div>
        </Card>
        <Card style={{ padding: 22 }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Departments</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, color: COLORS.ink, marginTop: 6, letterSpacing: -0.5 }}>{fmt(190254.75)}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>11.48% of expenses</div>
        </Card>
        <Card style={{ padding: 22 }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Camps & Retreats (net)</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, color: COLORS.ink, marginTop: 6, letterSpacing: -0.5 }}>{fmt(131929.79)}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>14.95% of expenses (gross)</div>
        </Card>
      </div>

      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Administrative breakdown</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Largest line items, FY 2025</div>
          </div>
          <Pill tone="forest"><Sparkles size={11} /> Smart sorted</Pill>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={ADMIN_EXPENSES} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={COLORS.border} horizontal={false} />
            <XAxis type="number" stroke={COLORS.inkSoft} fontSize={11} tickFormatter={fmtShort} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" stroke={COLORS.inkSoft} fontSize={11} width={200} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ backgroundColor: COLORS.forestDeep, border: "none", borderRadius: 10, fontSize: 12, color: COLORS.ink }} />
            <Bar dataKey="value" fill={COLORS.forest} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

// ============================================================
// ALERTS LIVE EVALUATION PANEL
// ============================================================

const ALERT_ICONS = { TrendingDown, AlertTriangle, Receipt, Flame };

const SEVERITY_TONE = {
  critical: { color: COLORS.red, bg: "rgba(255,59,138,0.18)", label: "Critical" },
  warning: { color: COLORS.amber, bg: "rgba(251,191,36,0.18)", label: "Warning" },
  info: { color: COLORS.copper, bg: "rgba(255,90,31,0.18)", label: "Info" },
};

const ThresholdsPanel = ({ config, alerts, updateThreshold }) => {
  return (
    <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${COLORS.border}` }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Thresholds</span>
        <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
          Tune when each alert fires — changes recompute the live evaluation below.
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {Object.values(ALERT_RULES).map((rule) => {
          const t = rule.tunable;
          const stored = config[rule.id]?.[t.key] ?? t.fromUi(t.default);
          const uiValue = t.toUi(stored);
          const enabled = !!alerts[rule.id];
          return (
            <div key={rule.id} style={{
              padding: 14, border: `1px solid ${COLORS.border}`, borderRadius: 10,
              backgroundColor: enabled ? COLORS.surface : COLORS.bg,
              opacity: enabled ? 1 : 0.55,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>{rule.title}</div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{t.label}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  value={uiValue}
                  min={t.min}
                  max={t.max}
                  step={t.step}
                  disabled={!enabled}
                  onChange={(e) => updateThreshold(rule.id, t.key, Number(e.target.value))}
                  style={{
                    width: 64, padding: "6px 8px", fontSize: 13, fontWeight: 600,
                    fontFamily: fontBody, color: COLORS.ink, border: `1px solid ${COLORS.border}`,
                    borderRadius: 6, textAlign: "right", outline: "none",
                    backgroundColor: enabled ? COLORS.surface : COLORS.bg,
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <span style={{ fontSize: 11, color: COLORS.inkSoft, fontWeight: 600, minWidth: 80 }}>{t.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AlertsLivePanel = ({ alerts, config, ministries }) => {
  const ctx = buildAlertContext({
    monthlyTrend: MONTHLY_TREND,
    ministries: ministries,
    receipts: RECENT_RECEIPTS,
    cashOnHand: BALANCE_END,
    operatingOverheadMo: OPERATING_OVERHEAD_MO,
    survivalFloorMo: SURVIVAL_FLOOR_MO,
    now: new Date("2025-12-31T23:59:59"),
  });
  const results = evaluateAlerts(ctx, alerts, config);
  const firingCount = results.filter((r) => r.evaluated && r.triggered).length;

  return (
    <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${COLORS.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Evaluation right now</span>
            {firingCount > 0 ? (
              <Pill tone="danger">{firingCount} firing</Pill>
            ) : (
              <Pill tone="success">All clear</Pill>
            )}
          </div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
            Each rule evaluated against current data — same logic the cron job will run.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {results.map(({ rule, enabled, evaluated, triggered, headline, detail }) => {
          const Icon = ALERT_ICONS[rule.icon] || Info;
          const tone = SEVERITY_TONE[rule.severity];
          const muted = !enabled;
          const accent = !enabled ? COLORS.border : triggered ? tone.color : COLORS.green;
          return (
            <div key={rule.id} style={{
              padding: 14, borderRadius: 10, border: `1px solid ${accent}40`,
              backgroundColor: muted ? COLORS.bg : triggered ? tone.bg + "60" : COLORS.surface,
              display: "flex", alignItems: "flex-start", gap: 12, opacity: muted ? 0.55 : 1,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                backgroundColor: muted ? COLORS.border : triggered ? tone.color : "rgba(74,222,128,0.16)",
                color: muted ? COLORS.inkSoft : triggered ? "#fff" : COLORS.green,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {muted ? <X size={14} /> : triggered ? <Icon size={14} /> : <Check size={14} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{rule.title}</span>
                  {muted ? (
                    <Pill tone="neutral">Off</Pill>
                  ) : triggered ? (
                    <Pill tone={rule.severity === "critical" ? "danger" : rule.severity === "warning" ? "warn" : "copper"}>
                      Firing
                    </Pill>
                  ) : (
                    <Pill tone="success">OK</Pill>
                  )}
                </div>
                <div style={{ fontSize: 12, color: COLORS.ink, fontWeight: 500 }}>
                  {muted ? rule.description : headline}
                </div>
                {!muted && detail && (
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 4, lineHeight: 1.5 }}>
                    {detail}
                  </div>
                )}
                {!muted && (
                  <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 6, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>
                    Recipients: {rule.recipients.join(" · ")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// END-OF-MONTH RECONCILIATION
// ============================================================

const ReconciliationSection = ({ ministries, logActivity }) => {
  const [decisions, setDecisions] = useState({});

  const items = ministries.map((m) => {
    const monthlyBudget = m.budget / 12;
    const spent = LAST_MONTH_SPEND[m.id] ?? monthlyBudget * 0.9;
    const leftover = monthlyBudget - spent;
    return { ...m, monthlyBudget, spent, leftover };
  });

  const totalLeftover = items.reduce((s, i) => s + Math.max(0, i.leftover), 0);
  const eligible = items.filter((i) => i.leftover > 0);
  const overBudget = items.filter((i) => i.leftover < 0);
  const decidedCount = Object.keys(decisions).length;
  const rolled = items.filter((i) => decisions[i.id] === "roll").reduce((s, i) => s + i.leftover, 0);
  const returned = items.filter((i) => decisions[i.id] === "return").reduce((s, i) => s + i.leftover, 0);

  const decide = (item, action) => {
    if (decisions[item.id] === action) return; // no-op
    setDecisions((d) => ({ ...d, [item.id]: action }));
    logActivity({
      type: action === "roll" ? "roll" : "return",
      ministry: item.name,
      amount: item.leftover,
      note: action === "roll"
        ? `April leftover rolled forward to May allocation`
        : `April leftover returned to general fund`,
    });
  };
  const decideAll = (action) => {
    const next = { ...decisions };
    for (const i of eligible) {
      if (next[i.id] !== action) {
        next[i.id] = action;
        logActivity({
          type: action === "roll" ? "roll" : "return",
          ministry: i.name,
          amount: i.leftover,
          note: action === "roll"
            ? `April leftover rolled forward to May allocation (bulk)`
            : `April leftover returned to general fund (bulk)`,
        });
      }
    }
    setDecisions(next);
  };

  return (
    <Card style={{ padding: 28, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${COLORS.copper} 0%, ${COLORS.forest} 100%)` }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <Pill tone="copper">⚡ April 2026 month-end</Pill>
          <div style={{ fontFamily: fontDisplay, fontSize: 44, fontWeight: 600, color: COLORS.forest, letterSpacing: -1.2, marginTop: 14, lineHeight: 1.05 }}>
            {fmt(totalLeftover)} <span style={{ color: COLORS.ink, fontWeight: 500 }}>unused last month</span>
          </div>
          <div style={{ fontFamily: fontSerif, fontSize: 18, fontStyle: "italic", color: COLORS.inkSoft, marginTop: 10, lineHeight: 1.5, maxWidth: 600 }}>
            would you like to roll it forward to May, or return it to the church general fund?
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, alignSelf: "center" }}>
          <button onClick={() => decideAll("roll")} style={{ padding: "12px 22px", backgroundColor: COLORS.forest, color: COLORS.bg, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            <ArrowUpRight size={14} /> Roll all forward to May
          </button>
          <button onClick={() => decideAll("return")} style={{ padding: "12px 22px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: fontBody, whiteSpace: "nowrap" }}>
            Return all to general fund
          </button>
        </div>
      </div>

      <div style={{ padding: 12, backgroundColor: COLORS.cream, borderRadius: 9, marginBottom: 14, fontSize: 12, color: COLORS.ink, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span><strong style={{ color: COLORS.forest }}>{decidedCount}</strong> of {eligible.length} decided</span>
        <span style={{ color: COLORS.inkSoft }}>·</span>
        <span>rolled <strong style={{ color: COLORS.green }}>{fmt(rolled)}</strong></span>
        <span style={{ color: COLORS.inkSoft }}>·</span>
        <span>returned <strong style={{ color: COLORS.copper }}>{fmt(returned)}</strong></span>
        {overBudget.length > 0 && (
          <>
            <span style={{ color: COLORS.inkSoft, marginLeft: "auto" }}>·</span>
            <span style={{ color: COLORS.red }}>{overBudget.length} over budget · needs review</span>
          </>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((m) => {
          const decision = decisions[m.id];
          const isOver = m.leftover < 0;
          return (
            <div key={m.id} style={{
              display: "grid", gridTemplateColumns: "30px 1fr 130px 240px",
              gap: 12, alignItems: "center", padding: "10px 12px", borderRadius: 8,
              backgroundColor: COLORS.bg, border: `1px solid ${COLORS.borderSoft}`,
            }}>
              <span style={{ color: m.color, fontFamily: fontDisplay, fontSize: 16, fontWeight: 600 }}>{m.icon}</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{m.name}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: isOver ? COLORS.red : COLORS.forest, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {isOver ? "−" : "+"}{fmt(Math.abs(m.leftover))}
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                {isOver ? (
                  <Pill tone="danger">Over budget — needs review</Pill>
                ) : decision === "roll" ? (
                  <Pill tone="success">→ Rolled to May</Pill>
                ) : decision === "return" ? (
                  <Pill tone="copper">↺ Returned to fund</Pill>
                ) : (
                  <>
                    <button onClick={() => decide(m, "roll")} style={{ padding: "6px 12px", backgroundColor: COLORS.cream, color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: fontBody }}>
                      Roll
                    </button>
                    <button onClick={() => decide(m, "return")} style={{ padding: "6px 12px", backgroundColor: COLORS.cream, color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: fontBody }}>
                      Return
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ============================================================
// SMART BUDGET RECOMMENDATIONS
// ============================================================

// MiniBarChart renders past + (optional) forecast. Forecast bars render at
// lower opacity with a dashed top border, separated by a copper divider line.
const MONTH_LABELS_PAST = ["6mo ago", "5mo ago", "4mo ago", "3mo ago", "2mo ago", "1mo ago"];
const MONTH_LABELS_FUTURE = ["Next mo", "+2 mo", "+3 mo", "+4 mo", "+5 mo", "+6 mo"];
const MiniBarChart = ({ history, forecast }) => {
  const colorFor = (v) => (v > 100 ? COLORS.red : v < 65 ? COLORS.amber : COLORS.green);
  const heightFor = (v) => `${Math.min(v, 110) / 110 * 100}%`;
  const totalBars = history.length + (forecast?.length || 0);
  const width = totalBars * 9 + (forecast?.length ? 6 : 0); // include divider gap

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 36, width }}>
      {history.map((v, i) => (
        <div
          key={`p-${i}`}
          style={{ width: 7, height: heightFor(v), backgroundColor: colorFor(v), borderRadius: 2, opacity: 0.9, flexShrink: 0 }}
          title={`${MONTH_LABELS_PAST[i] || `M${i + 1}`}: ${v}% (actual)`}
        />
      ))}
      {forecast && forecast.length > 0 && (
        <>
          <div style={{ width: 1, height: "100%", backgroundColor: COLORS.copper, opacity: 0.5, margin: "0 2px", flexShrink: 0 }} title="Past | Forecast" />
          {forecast.map((v, i) => (
            <div
              key={`f-${i}`}
              style={{
                width: 7, height: heightFor(v),
                backgroundColor: colorFor(v) + "30",
                border: `1px dashed ${colorFor(v)}`,
                borderRadius: 2,
                flexShrink: 0,
              }}
              title={`${MONTH_LABELS_FUTURE[i] || `+${i + 1}mo`}: ${v}% (forecast)`}
            />
          ))}
        </>
      )}
    </div>
  );
};

const REC_TONE = {
  reduce: { color: COLORS.amber, label: "REDUCE", pillTone: "warn" },
  increase: { color: COLORS.copper, label: "INCREASE", pillTone: "copper" },
  volatile: { color: COLORS.red, label: "VOLATILE", pillTone: "danger" },
  "on-track": { color: COLORS.green, label: "ON TRACK", pillTone: "success" },
};

const RecommendationsSection = ({ ministries, updateMinistryBudget, logActivity }) => {
  const [applied, setApplied] = useState({});
  const [dismissed, setDismissed] = useState({});
  const [showOnTrack, setShowOnTrack] = useState(false);
  const [notifyModal, setNotifyModal] = useState(null);

  // Re-classify against current ministries (uses live budget for delta computation).
  const classified = ministries.map((m) => ({ ministry: m, ...classifyMinistry(m) }));
  const groups = {
    reduce: classified.filter((c) => c.type === "reduce" && !dismissed[c.ministry.id]),
    increase: classified.filter((c) => c.type === "increase" && !dismissed[c.ministry.id]),
    volatile: classified.filter((c) => c.type === "volatile" && !dismissed[c.ministry.id]),
    "on-track": classified.filter((c) => c.type === "on-track"),
  };

  const totalReduceSavings = groups.reduce.reduce((s, c) => s + Math.max(0, -c.delta), 0);
  const totalIncrease = groups.increase.reduce((s, c) => s + Math.max(0, c.delta), 0);
  const netSavings = totalReduceSavings - totalIncrease;

  const logBudgetChange = (c, source = "recommendation") => {
    logActivity({
      type: "budget",
      ministry: c.ministry.name,
      amount: c.delta,
      note: `Annual budget ${c.delta < 0 ? "reduced" : "increased"} from ${fmt(c.ministry.budget)} to ${fmt(c.suggestedBudget)} via ${source}`,
    });
  };
  const logEmail = (c) => {
    logActivity({
      type: "notification",
      who: "System",
      ministry: c.ministry.name,
      note: `Email sent to ${c.ministry.leader || "ministry leader"} — budget ${c.delta < 0 ? "reduction" : "increase"} notification with reasoning`,
    });
  };

  // Reduce recs trigger the leader-notification preview modal first.
  // Increases skip the modal — no need to soften an increase.
  const apply = (c) => {
    if (c.type === "reduce") {
      setNotifyModal(c);
    } else {
      if (c.suggestedBudget != null) {
        updateMinistryBudget(c.ministry.id, c.suggestedBudget);
        logBudgetChange(c);
      }
      setApplied((a) => ({ ...a, [c.ministry.id]: true }));
    }
  };
  const sendAndApply = (c) => {
    if (c.suggestedBudget != null) {
      updateMinistryBudget(c.ministry.id, c.suggestedBudget);
      logBudgetChange(c);
      logEmail(c);
    }
    setApplied((a) => ({ ...a, [c.ministry.id]: true }));
    setNotifyModal(null);
  };
  const applyWithoutNotify = (c) => {
    if (c.suggestedBudget != null) {
      updateMinistryBudget(c.ministry.id, c.suggestedBudget);
      logBudgetChange(c, "recommendation (no notification)");
    }
    setApplied((a) => ({ ...a, [c.ministry.id]: true }));
    setNotifyModal(null);
  };
  const dismiss = (id) => setDismissed((d) => ({ ...d, [id]: true }));
  const applyAll = () => {
    const next = { ...applied };
    const all = [...groups.reduce, ...groups.increase];
    for (const c of all) {
      if (c.suggestedBudget != null) {
        updateMinistryBudget(c.ministry.id, c.suggestedBudget);
        logBudgetChange(c, "Apply all");
      }
      next[c.ministry.id] = true;
    }
    if (all.length > 0) {
      logActivity({
        type: "review",
        ministry: null,
        note: `Apply all · ${groups.reduce.length} reduction${groups.reduce.length === 1 ? "" : "s"}, ${groups.increase.length} increase${groups.increase.length === 1 ? "" : "s"} applied in one click`,
      });
    }
    setApplied(next);
  };

  const renderRow = (c) => {
    const tone = REC_TONE[c.type];
    const isApplied = applied[c.ministry.id];
    return (
      <div key={c.ministry.id} style={{
        padding: 16, borderRadius: 10, backgroundColor: COLORS.cream,
        border: `1px solid ${COLORS.borderSoft}`,
        display: "grid", gridTemplateColumns: "auto 1fr 150px 180px 200px", gap: 16, alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: c.ministry.color + "20", color: c.ministry.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisplay, fontSize: 17, fontWeight: 600 }}>
            {c.ministry.icon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>{c.ministry.name}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <Pill tone={tone.pillTone}>{tone.label}</Pill>
              {c.confidence !== "—" && (
                <span style={{ fontSize: 9, color: COLORS.inkSoft, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, padding: "2px 7px", border: `1px solid ${COLORS.border}`, borderRadius: 99 }}>
                  {c.confidence}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.5, fontStyle: "italic" }}>
          {c.reasoning}
        </div>
        <div>
          <MiniBarChart history={c.history} forecast={c.forecast} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: COLORS.inkSoft, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>
            <span>6mo past · avg {Math.round(c.avg)}%</span>
            <span style={{ color: COLORS.copper, opacity: 0.7 }}>6mo forecast</span>
          </div>
        </div>
        <div>
          {c.suggestedBudget != null ? (
            <>
              <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Proposed</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, fontFamily: fontBody, fontVariantNumeric: "tabular-nums" }}>
                {fmtShort(c.ministry.budget)} → {fmtShort(c.suggestedBudget)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: c.delta < 0 ? COLORS.green : COLORS.copper, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                {c.delta < 0 ? "−" : "+"}{fmt(Math.abs(c.delta))}/year
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: COLORS.inkSoft, fontStyle: "italic" }}>Investigate, no suggestion yet</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {isApplied ? (
            <Pill tone="success">✓ Applied to 2026</Pill>
          ) : c.suggestedBudget != null ? (
            <>
              <button onClick={() => apply(c)} style={{ padding: "8px 14px", backgroundColor: COLORS.forest, color: COLORS.bg, border: "none", borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: fontBody }}>
                Apply
              </button>
              <button onClick={() => dismiss(c.ministry.id)} style={{ padding: "8px 14px", backgroundColor: "transparent", color: COLORS.inkSoft, border: `1px solid ${COLORS.border}`, borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: fontBody }}>
                Dismiss
              </button>
            </>
          ) : (
            <button onClick={() => dismiss(c.ministry.id)} style={{ padding: "8px 14px", backgroundColor: "transparent", color: COLORS.inkSoft, border: `1px solid ${COLORS.border}`, borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: fontBody }}>
              Dismiss
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card style={{ padding: 28 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: fontSerif, fontSize: 30, fontWeight: 400, color: COLORS.ink, fontStyle: "italic", letterSpacing: -0.5 }}>
          Smart budget recommendations.
        </div>
        <div style={{ fontFamily: fontSerif, fontSize: 16, fontStyle: "italic", color: COLORS.inkSoft, marginTop: 4 }}>
          We analyzed 6 months of spending across all {ministries.length} ministries. Here's what to adjust for next year.
        </div>
      </div>

      {/* SUMMARY BAR */}
      <div style={{ padding: 18, backgroundColor: COLORS.cream, borderRadius: 10, marginBottom: 22, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.amber, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>To reduce</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>{groups.reduce.length}</div>
          <div style={{ fontSize: 11, color: COLORS.amber, fontWeight: 600 }}>−{fmt(totalReduceSavings)}/yr</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>To increase</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>{groups.increase.length}</div>
          <div style={{ fontSize: 11, color: COLORS.copper, fontWeight: 600 }}>+{fmt(totalIncrease)}/yr</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.red, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Review</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>{groups.volatile.length}</div>
          <div style={{ fontSize: 11, color: COLORS.red, fontWeight: 600 }}>volatile patterns</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.green, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>On track</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>{groups["on-track"].length}</div>
          <div style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>well-managed</div>
        </div>
        <button onClick={applyAll} style={{ marginLeft: "auto", padding: "12px 22px", backgroundColor: COLORS.forest, color: COLORS.bg, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={14} /> Apply all · save {fmt(netSavings)}/yr
        </button>
      </div>

      {/* GROUPED RECS */}
      {["reduce", "increase", "volatile"].map((groupKey) => {
        const list = groups[groupKey];
        if (list.length === 0) return null;
        const tone = REC_TONE[groupKey];
        return (
          <div key={groupKey} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, color: tone.color, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700, marginBottom: 10 }}>
              {tone.label} <span style={{ color: COLORS.inkSoft, fontWeight: 600 }}>({list.length})</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {list.map(renderRow)}
            </div>
          </div>
        );
      })}

      {/* ON TRACK COLLAPSIBLE */}
      <button
        onClick={() => setShowOnTrack(!showOnTrack)}
        style={{ width: "100%", padding: "14px 18px", backgroundColor: COLORS.cream, border: `1px solid ${COLORS.border}`, borderRadius: 10, cursor: "pointer", fontFamily: fontBody, color: COLORS.ink, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={14} color={COLORS.green} />
          {groups["on-track"].length} ministries on track — keep budgets as-is
        </span>
        <ChevronRight size={14} style={{ transform: showOnTrack ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {showOnTrack && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 10 }}>
          {groups["on-track"].map((c) => (
            <div key={c.ministry.id} style={{ padding: 12, backgroundColor: COLORS.cream, borderRadius: 8, border: `1px solid ${COLORS.borderSoft}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: c.ministry.color + "20", color: c.ministry.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisplay, fontSize: 14, fontWeight: 600 }}>
                {c.ministry.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>{c.ministry.name}</div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{Math.round(c.avg)}% avg utilization · {c.reasoning}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {notifyModal && (
        <NotificationPreviewModal
          rec={notifyModal}
          onSendAndApply={() => sendAndApply(notifyModal)}
          onApplyWithoutNotify={() => applyWithoutNotify(notifyModal)}
          onCancel={() => setNotifyModal(null)}
        />
      )}
    </Card>
  );
};

// ============================================================
// NOTIFICATION PREVIEW MODAL — leader email preview before applying a reduction
// ============================================================

const NotificationPreviewModal = ({ rec, onSendAndApply, onApplyWithoutNotify, onCancel }) => {
  const m = rec.ministry;
  const firstName = (m.leader || "Leader").split(" ")[0];
  const lastInitial = (m.leader || "").split(" ")[1] || "";
  const email = `${firstName.toLowerCase()}@ircchurch.org`;

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(10,10,10,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: COLORS.surface, borderRadius: 16, width: 620, maxWidth: "100%", maxHeight: "90vh",
        display: "flex", flexDirection: "column", boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
        border: `1px solid ${COLORS.border}`,
      }}>

        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Mail size={16} color={COLORS.copper} />
              <span style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
                Email preview · before sending
              </span>
            </div>
            <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 600, color: COLORS.ink, marginTop: 4 }}>
              Notify {firstName} {lastInitial} about {m.name} budget change
            </div>
          </div>
          <button onClick={onCancel} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color={COLORS.inkSoft} />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          {/* Email envelope */}
          <div style={{ padding: "10px 14px", backgroundColor: COLORS.bg, borderRadius: 9, border: `1px solid ${COLORS.borderSoft}`, fontSize: 12, marginBottom: 14, fontFamily: "ui-monospace, monospace", lineHeight: 1.8 }}>
            <div><span style={{ color: COLORS.inkSoft }}>From:</span> <span style={{ color: COLORS.ink }}>pastor.vladimir@ircchurch.org</span></div>
            <div><span style={{ color: COLORS.inkSoft }}>To:</span> <span style={{ color: COLORS.ink }}>{firstName} {lastInitial} &lt;{email}&gt;</span></div>
            <div><span style={{ color: COLORS.inkSoft }}>Cc:</span> <span style={{ color: COLORS.ink }}>elena@ircchurch.org</span></div>
            <div><span style={{ color: COLORS.inkSoft }}>Subject:</span> <span style={{ color: COLORS.ink, fontWeight: 700 }}>2026 budget update for {m.name}</span></div>
          </div>

          {/* Email body */}
          <div style={{ padding: 18, backgroundColor: COLORS.bg, borderRadius: 9, border: `1px solid ${COLORS.borderSoft}`, fontSize: 13, color: COLORS.ink, lineHeight: 1.65 }}>
            <p style={{ margin: 0, marginBottom: 12 }}>Hi {firstName},</p>
            <p style={{ margin: 0, marginBottom: 12 }}>
              I wanted to give you a heads-up before this lands in your dashboard. After looking at six months of {m.name} spending, we're adjusting the annual budget for the rest of 2026.
            </p>

            <div style={{ padding: 14, backgroundColor: COLORS.cream, borderRadius: 8, margin: "12px 0", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Annual budget change</div>
              <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: COLORS.ink, marginTop: 4 }}>
                {fmt(m.budget)} <span style={{ color: COLORS.copper }}>→</span> {fmt(rec.suggestedBudget)}
              </div>
              <div style={{ fontSize: 12, color: rec.delta < 0 ? COLORS.green : COLORS.copper, fontWeight: 700, marginTop: 4 }}>
                {rec.delta < 0 ? "−" : "+"}{fmt(Math.abs(rec.delta))}/year
              </div>
            </div>

            <p style={{ margin: 0, marginBottom: 8 }}>
              <strong>Here's the reasoning:</strong>
            </p>
            <p style={{ margin: 0, marginBottom: 12, fontStyle: "italic", color: COLORS.inkSoft }}>
              {rec.reasoning}
            </p>

            {/* Embedded chart */}
            <div style={{ padding: 14, backgroundColor: COLORS.surface, borderRadius: 8, border: `1px solid ${COLORS.border}`, margin: "12px 0" }}>
              <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 8 }}>
                {m.name} · last 6 months · % of budget used
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 50 }}>
                {rec.history.map((v, i) => {
                  const color = v > 100 ? COLORS.red : v < 65 ? COLORS.amber : COLORS.green;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ width: "100%", height: `${Math.min(v, 110) / 110 * 100}%`, backgroundColor: color, borderRadius: 2, opacity: 0.85 }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", marginTop: 6, gap: 4 }}>
                {rec.history.map((v, i) => (
                  <div key={i} style={{ flex: 1, fontSize: 10, color: COLORS.inkSoft, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                    {v}%
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: COLORS.inkSoft }}>
                <span>Average: <strong style={{ color: COLORS.ink }}>{Math.round(rec.avg)}%</strong></span>
                <span>Range: <strong style={{ color: COLORS.ink }}>{rec.min}–{rec.max}%</strong></span>
              </div>
            </div>

            <p style={{ margin: 0, marginBottom: 12 }}>
              This isn't about your work — {m.name} has been steady. We're just right-sizing so the unused funds can support new initiatives this year.
            </p>
            <p style={{ margin: 0, marginBottom: 12 }}>
              Pastor V is happy to chat. Just reply to this email if you want to talk it through.
            </p>
            <p style={{ margin: 0, color: COLORS.inkSoft }}>— IRC Stewardship</p>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onCancel} style={{ padding: "10px 18px", backgroundColor: "transparent", color: COLORS.inkSoft, border: `1px solid ${COLORS.border}`, borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: fontBody }}>
            Cancel
          </button>
          <button onClick={onApplyWithoutNotify} style={{ padding: "10px 18px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: fontBody }}>
            Apply without notifying
          </button>
          <button onClick={onSendAndApply} style={{ padding: "10px 22px", backgroundColor: COLORS.forest, color: COLORS.bg, border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", gap: 6 }}>
            <Mail size={14} /> Send & apply
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// VARIANCE STATS
// ============================================================

const VarianceSection = ({ ministries }) => {
  const totalBudget = ministries.reduce((s, m) => s + m.budget, 0);
  const totalSpent = ministries.reduce((s, m) => s + m.spent, 0);
  const unused = totalBudget - totalSpent;
  const utilizationPct = (totalSpent / totalBudget) * 100;
  const variance = 100 - utilizationPct;

  const sorted = [...ministries].map((m) => ({ ...m, pct: (m.spent / m.budget) * 100 }));
  // Best discipline = highest utilization without exceeding 100
  const bestDiscipline = sorted.filter((m) => m.pct <= 100).sort((a, b) => b.pct - a.pct)[0];
  // Most underused = lowest utilization
  const mostUnderused = sorted.sort((a, b) => a.pct - b.pct)[0];

  // Total potential savings = sum of reduce-recommendation deltas
  const reduceCandidates = ministries.map((m) => ({ m, c: classifyMinistry(m) })).filter((x) => x.c.type === "reduce");
  const totalSavings = reduceCandidates.reduce((s, x) => s + Math.max(0, -x.c.delta), 0);

  return (
    <Card style={{ padding: 28 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: fontSerif, fontSize: 30, fontWeight: 400, color: COLORS.ink, fontStyle: "italic", letterSpacing: -0.5 }}>
          Budget variance · year-to-date.
        </div>
        <div style={{ fontFamily: fontSerif, fontSize: 16, fontStyle: "italic", color: COLORS.inkSoft, marginTop: 4 }}>
          Where the church is over-, under-, and right-on-budget.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 22 }}>
        <div style={{ padding: 18, backgroundColor: COLORS.cream, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Total budgeted</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 600, color: COLORS.ink, marginTop: 4, letterSpacing: -0.5 }}>{fmtShort(totalBudget)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>across {ministries.length} ministries</div>
        </div>
        <div style={{ padding: 18, backgroundColor: COLORS.cream, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Actually used</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 600, color: COLORS.ink, marginTop: 4, letterSpacing: -0.5 }}>{fmtShort(totalSpent)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{utilizationPct.toFixed(1)}% of budget</div>
        </div>
        <div style={{ padding: 18, backgroundColor: "rgba(212,255,0,0.08)", borderRadius: 10, border: `1px solid ${COLORS.forest}40` }}>
          <div style={{ fontSize: 11, color: COLORS.forest, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Unused funds</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 600, color: COLORS.forest, marginTop: 4, letterSpacing: -0.5 }}>{fmtShort(unused)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>available to redirect</div>
        </div>
        <div style={{ padding: 18, backgroundColor: COLORS.cream, borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: COLORS.amber, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Variance</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 600, color: COLORS.amber, marginTop: 4, letterSpacing: -0.5 }}>{variance.toFixed(1)}%</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>good forecast, room to tighten</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <div style={{ padding: 18, borderRadius: 10, border: `1px solid ${COLORS.green}40`, backgroundColor: "rgba(74,222,128,0.06)" }}>
          <div style={{ fontSize: 11, color: COLORS.green, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>🏆 Best discipline</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 600, color: COLORS.ink, marginTop: 6 }}>{bestDiscipline.name}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>
            {Math.round(bestDiscipline.pct)}% used — close to budget without exceeding
          </div>
        </div>
        <div style={{ padding: 18, borderRadius: 10, border: `1px solid ${COLORS.amber}40`, backgroundColor: "rgba(251,191,36,0.06)" }}>
          <div style={{ fontSize: 11, color: COLORS.amber, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>📉 Most underused</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 600, color: COLORS.ink, marginTop: 6 }}>{mostUnderused.name}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>
            Only {Math.round(mostUnderused.pct)}% spent — major reduction candidate
          </div>
        </div>
        <div style={{ padding: 18, borderRadius: 10, border: `1px solid ${COLORS.copper}40`, backgroundColor: "rgba(255,90,31,0.06)" }}>
          <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>💰 Total potential savings</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 600, color: COLORS.ink, marginTop: 6 }}>{fmt(totalSavings)}/year</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>
            apply all {reduceCandidates.length} reduction recs to free this up
          </div>
        </div>
      </div>
    </Card>
  );
};

// ============================================================
// QUARTERLY REVIEW BANNER — surfaces every 90 days at the top of Budget
// ============================================================

const QuarterlyReviewBanner = ({ ministries, updateMinistryBudget, logActivity, onScrollToRecs }) => {
  const [state, setState] = useState("pending"); // pending | approved | snoozed

  const recs = ministries.map((m) => ({ ministry: m, ...classifyMinistry(m) }));
  const reduceRecs = recs.filter((c) => c.type === "reduce");
  const increaseRecs = recs.filter((c) => c.type === "increase");
  const totalToReview = reduceRecs.length + increaseRecs.length + recs.filter((c) => c.type === "volatile").length;

  const approveAllReductions = () => {
    for (const c of reduceRecs) {
      if (c.suggestedBudget != null) {
        updateMinistryBudget(c.ministry.id, c.suggestedBudget);
        logActivity({
          type: "budget",
          ministry: c.ministry.name,
          amount: c.delta,
          note: `Annual budget reduced from ${fmt(c.ministry.budget)} to ${fmt(c.suggestedBudget)} via Q2 quarterly review`,
        });
      }
    }
    logActivity({
      type: "review",
      ministry: null,
      note: `Q2 2026 quarterly review approved — ${reduceRecs.length} reduction${reduceRecs.length === 1 ? "" : "s"} applied via "Approve all"`,
    });
    setState("approved");
  };

  const snoozeReview = () => {
    logActivity({
      type: "review",
      ministry: null,
      note: "Q2 quarterly review snoozed — will reappear May 14, 2026",
    });
    setState("snoozed");
  };

  if (state === "approved") {
    return (
      <Card style={{ padding: 22, backgroundColor: "rgba(74,222,128,0.06)", borderColor: COLORS.green + "40", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.green, color: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Check size={20} strokeWidth={3} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: COLORS.green, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Q2 2026 review approved</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 17, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>
            {reduceRecs.length} reduction{reduceRecs.length === 1 ? "" : "s"} applied · next review due Aug 1, 2026
          </div>
        </div>
        <button onClick={() => setState("pending")} style={{ padding: "8px 14px", backgroundColor: "transparent", color: COLORS.inkSoft, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: fontBody }}>
          Reopen
        </button>
      </Card>
    );
  }

  if (state === "snoozed") {
    return (
      <Card style={{ padding: 22, backgroundColor: "rgba(251,191,36,0.06)", borderColor: COLORS.amber + "40", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.amber, color: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Clock size={18} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: COLORS.amber, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Q2 review snoozed</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 17, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>
            Will reappear May 14, 2026
          </div>
        </div>
        <button onClick={() => setState("pending")} style={{ padding: "8px 14px", backgroundColor: "transparent", color: COLORS.inkSoft, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: fontBody }}>
          Reopen now
        </button>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, backgroundColor: COLORS.copper }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <Pill tone="copper">Q2 review · due this week</Pill>
          <div style={{ fontFamily: fontSerif, fontSize: 26, fontWeight: 400, color: COLORS.ink, fontStyle: "italic", letterSpacing: -0.5, marginTop: 12, lineHeight: 1.2 }}>
            {totalToReview} recommendations need your sign-off this quarter.
          </div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 6 }}>
            {reduceRecs.length} reductions ({fmt(reduceRecs.reduce((s, c) => s + Math.max(0, -c.delta), 0))}/yr saved) ·{" "}
            {increaseRecs.length} increase ·{" "}
            {recs.filter((c) => c.type === "volatile").length} flagged for human review
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, alignSelf: "center" }}>
          <button onClick={approveAllReductions} style={{ padding: "11px 20px", backgroundColor: COLORS.forest, color: COLORS.bg, border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            <Check size={14} /> Approve all reductions
          </button>
          <button onClick={onScrollToRecs} style={{ padding: "11px 20px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: fontBody, whiteSpace: "nowrap" }}>
            Review individually ↓
          </button>
          <button onClick={snoozeReview} style={{ padding: "8px 20px", backgroundColor: "transparent", color: COLORS.inkSoft, border: "none", borderRadius: 9, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: fontBody, textDecoration: "underline" }}>
            Snooze 7 days
          </button>
        </div>
      </div>
    </Card>
  );
};

// ============================================================
// WHAT-IF SCENARIO BUILDER — sliders that recompute totals live
// ============================================================

const WhatIfScenarioSection = ({ ministries, updateMinistryBudget, logActivity }) => {
  const [drafts, setDrafts] = useState({});
  const [savedCount, setSavedCount] = useState(0);

  const projected = (m) => (drafts[m.id] !== undefined ? drafts[m.id] : m.budget);
  const setDraft = (id, v) => setDrafts((d) => ({ ...d, [id]: v }));

  const ministryTotal = ministries.reduce((s, m) => s + projected(m), 0);
  const operatingTotal = OPERATING_OVERHEAD_YR + ministryTotal + EVENTS_BUDGET_YR + BLESSINGS_BUDGET_YR;
  const surplus = DONATION_TARGET_YR - operatingTotal;
  const survivalFloorMo = SURVIVAL_FLOOR_MO;
  const runwayMonths = BALANCE_END / survivalFloorMo;

  const hasChanges = Object.keys(drafts).length > 0 && ministries.some((m) => drafts[m.id] !== undefined && drafts[m.id] !== m.budget);

  const reset = () => setDrafts({});
  const apply = () => {
    const changes = [];
    for (const m of ministries) {
      const draft = drafts[m.id];
      if (draft !== undefined && draft !== m.budget) {
        updateMinistryBudget(m.id, draft);
        changes.push({ ministry: m, draft });
      }
    }
    for (const ch of changes) {
      logActivity({
        type: "budget",
        ministry: ch.ministry.name,
        amount: ch.draft - ch.ministry.budget,
        note: `Annual budget set to ${fmt(ch.draft)} via what-if scenario`,
      });
    }
    if (changes.length > 0) {
      logActivity({
        type: "review",
        ministry: null,
        note: `What-if scenario applied — ${changes.length} ministry budget${changes.length === 1 ? "" : "s"} updated`,
      });
    }
    setDrafts({});
  };
  const save = () => {
    setSavedCount((s) => s + 1);
    const changedCount = Object.keys(drafts).filter((id) => {
      const m = ministries.find((mm) => mm.id === id);
      return m && drafts[id] !== m.budget;
    }).length;
    logActivity({
      type: "review",
      ministry: null,
      note: `What-if scenario saved (${changedCount} change${changedCount === 1 ? "" : "s"}) for later comparison`,
    });
  };

  return (
    <Card style={{ padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 16 }}>
        <div>
          <div style={{ fontFamily: fontSerif, fontSize: 30, fontWeight: 400, color: COLORS.ink, fontStyle: "italic", letterSpacing: -0.5 }}>
            What if · scenario planning.
          </div>
          <div style={{ fontFamily: fontSerif, fontSize: 16, fontStyle: "italic", color: COLORS.inkSoft, marginTop: 4 }}>
            Drag any ministry's slider — every total updates live.
          </div>
        </div>
      </div>

      {/* LIVE TOTALS */}
      <div style={{
        padding: 18, borderRadius: 12, marginBottom: 22,
        backgroundColor: hasChanges ? "rgba(255,90,31,0.05)" : COLORS.cream,
        border: `1px solid ${hasChanges ? COLORS.copper + "60" : COLORS.borderSoft}`,
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18,
      }}>
        <div>
          <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Ministry total</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: COLORS.ink, marginTop: 4, letterSpacing: -0.5 }}>{fmtShort(ministryTotal)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{ministries.length} ministries</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Annual operating</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: COLORS.ink, marginTop: 4, letterSpacing: -0.5 }}>{fmtShort(operatingTotal)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>incl. overhead + events</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Annual surplus</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: surplus >= 0 ? COLORS.green : COLORS.red, marginTop: 4, letterSpacing: -0.5 }}>
            {surplus >= 0 ? "+" : ""}{fmtShort(surplus)}
          </div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>vs. {fmtShort(DONATION_TARGET_YR)} target</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Cash runway</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: COLORS.ink, marginTop: 4, letterSpacing: -0.5 }}>{runwayMonths.toFixed(1)} mo</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>on essentials only</div>
        </div>
      </div>

      {/* MINISTRY SLIDERS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ministries.map((m) => {
          const value = projected(m);
          const delta = value - m.budget;
          const min = Math.max(500, Math.floor(m.budget * 0.5 / 500) * 500);
          const max = Math.ceil(m.budget * 1.5 / 500) * 500;
          const changed = drafts[m.id] !== undefined && drafts[m.id] !== m.budget;
          const direction = delta > 0 ? "increase" : delta < 0 ? "decrease" : "none";
          const sliderColor = direction === "increase" ? COLORS.copper : direction === "decrease" ? COLORS.forest : COLORS.inkSoft;
          return (
            <div key={m.id} style={{
              display: "grid", gridTemplateColumns: "180px 1fr 110px 110px",
              alignItems: "center", gap: 14, padding: "8px 12px",
              borderRadius: 8, backgroundColor: changed ? COLORS.cream : "transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: 14, color: m.color, fontFamily: fontDisplay, fontWeight: 600, flexShrink: 0 }}>{m.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={500}
                value={value}
                onChange={(e) => setDraft(m.id, Number(e.target.value))}
                style={{
                  width: "100%", accentColor: sliderColor, height: 4, cursor: "pointer",
                }}
              />
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                {fmtShort(value)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {direction === "none" ? (
                  <span style={{ color: COLORS.inkSoft, fontStyle: "italic" }}>unchanged</span>
                ) : (
                  <span style={{ color: direction === "increase" ? COLORS.copper : COLORS.green }}>
                    {delta > 0 ? "+" : ""}{fmt(delta)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div style={{
        marginTop: 18, paddingTop: 18, borderTop: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ fontSize: 12, color: COLORS.inkSoft }}>
          {savedCount > 0 ? `${savedCount} scenario${savedCount === 1 ? "" : "s"} saved · ` : ""}
          {hasChanges ? <span style={{ color: COLORS.copper, fontWeight: 700 }}>Unsaved changes</span> : "No changes yet"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {hasChanges && (
            <button onClick={reset} style={{ padding: "9px 16px", backgroundColor: "transparent", color: COLORS.inkSoft, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: fontBody }}>
              Reset all
            </button>
          )}
          <button onClick={save} disabled={!hasChanges} style={{
            padding: "9px 16px", backgroundColor: "transparent", color: hasChanges ? COLORS.ink : COLORS.inkSoft,
            border: `1px solid ${COLORS.border}`, borderRadius: 8, fontWeight: 600, fontSize: 12,
            cursor: hasChanges ? "pointer" : "not-allowed", fontFamily: fontBody,
          }}>
            Save scenario
          </button>
          <button onClick={apply} disabled={!hasChanges} style={{
            padding: "10px 20px", border: "none", borderRadius: 8,
            backgroundColor: hasChanges ? COLORS.forest : COLORS.cream,
            color: hasChanges ? COLORS.bg : COLORS.inkSoft,
            fontWeight: 700, fontSize: 13, cursor: hasChanges ? "pointer" : "not-allowed",
            fontFamily: fontBody, display: "flex", alignItems: "center", gap: 6,
          }}>
            <Check size={13} /> Apply to 2026 budget
          </button>
        </div>
      </div>
    </Card>
  );
};

// ============================================================
// BUDGET PAGE
// ============================================================

const BudgetPage = ({ ministries, updateMinistryBudget, logActivity }) => {
  const [alerts, setAlerts] = useState({
    donationsBelowOverhead: true,
    ministryOverBudget: true,
    receiptsMissing: true,
    runwayBelow6: true,
  });
  const [alertConfig, setAlertConfig] = useState(ALERT_DEFAULT_CONFIG);

  const updateThreshold = (ruleId, key, uiValue) => {
    const rule = ALERT_RULES[ruleId];
    const stored = rule.tunable.fromUi(uiValue);
    setAlertConfig((c) => ({ ...c, [ruleId]: { ...c[ruleId], [key]: stored } }));
  };

  const sections = [
    { key: "facilities", label: "Facilities", icon: Building2, items: MONTHLY_OVERHEAD.facilities },
    { key: "people", label: "People", icon: Users, items: MONTHLY_OVERHEAD.people },
    { key: "operations", label: "Operations", icon: Activity, items: MONTHLY_OVERHEAD.operations },
  ];

  const fullBudget = [
    { name: "Operating overhead", amount: OPERATING_OVERHEAD_YR, color: COLORS.forest, desc: "Rent, payroll, utilities, ops" },
    { name: "Ministries", amount: MINISTRIES_BUDGET_YR, color: COLORS.copper, desc: "All 14 active ministries" },
    { name: "Events & camps", amount: EVENTS_BUDGET_YR, color: COLORS.green, desc: "Net of registration revenue" },
    { name: "Blessings & care", amount: BLESSINGS_BUDGET_YR, color: COLORS.amber, desc: "Pastor's, ministers', guests'" },
  ];

  const runway2026Worst = BALANCE_END / SURVIVAL_FLOOR_MO;

  const recsRef = useRef(null);
  const scrollToRecs = () => recsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* QUARTERLY REVIEW BANNER */}
      <QuarterlyReviewBanner ministries={ministries} updateMinistryBudget={updateMinistryBudget} logActivity={logActivity} onScrollToRecs={scrollToRecs} />

      {/* HERO SUMMARY */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <Card style={{ padding: 22 }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>2026 Donation Target</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, color: COLORS.ink, marginTop: 6, letterSpacing: -0.5 }}>{fmtShort(DONATION_TARGET_YR)}</div>
          <div style={{ fontSize: 12, color: COLORS.green, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
            <ArrowUpRight size={12} /> +5% vs. 2025
          </div>
        </Card>
        <Card style={{ padding: 22 }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Operating Budget</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, color: COLORS.ink, marginTop: 6, letterSpacing: -0.5 }}>{fmtShort(OPERATING_BUDGET_YR)}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{Math.round((OPERATING_BUDGET_YR / DONATION_TARGET_YR) * 100)}% of target</div>
        </Card>
        <Card style={{ padding: 22 }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Planned Surplus</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, color: COLORS.green, marginTop: 6, letterSpacing: -0.5 }}>{fmtShort(PLANNED_SURPLUS_YR)}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>Reserve + new initiatives</div>
        </Card>
        <Card style={{ padding: 22, backgroundColor: COLORS.cream, borderColor: COLORS.copperSoft }}>
          <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Min. Monthly Overhead</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, color: COLORS.ink, marginTop: 6, letterSpacing: -0.5 }}>{fmtShort(OPERATING_OVERHEAD_MO)}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>Survival floor: {fmtShort(SURVIVAL_FLOOR_MO)}</div>
        </Card>
      </div>

      {/* END-OF-MONTH RECONCILIATION */}
      <ReconciliationSection ministries={ministries} logActivity={logActivity} />

      {/* SMART RECOMMENDATIONS */}
      <div ref={recsRef}>
        <RecommendationsSection ministries={ministries} updateMinistryBudget={updateMinistryBudget} logActivity={logActivity} />
      </div>

      {/* VARIANCE STATS */}
      <VarianceSection ministries={ministries} />

      {/* WHAT-IF SCENARIO BUILDER */}
      <WhatIfScenarioSection ministries={ministries} updateMinistryBudget={updateMinistryBudget} logActivity={logActivity} />

      {/* MONTHLY OVERHEAD SETUP */}
      <Card style={{ padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 500, color: COLORS.ink, fontStyle: "italic", letterSpacing: -0.5 }}>Monthly minimum overhead</div>
            <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>The number every alert references. Mark each line essential or operational.</div>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: COLORS.red }} />
              <span style={{ color: COLORS.inkSoft, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>Essential</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: COLORS.amber }} />
              <span style={{ color: COLORS.inkSoft, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>Operational</span>
            </span>
          </div>
        </div>

        <div style={{ padding: 14, backgroundColor: COLORS.cream, borderRadius: 10, marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <Sparkles size={18} color={COLORS.copper} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.6 }}>
            <strong>Smart suggestion.</strong> These figures are derived from your 2025 actuals: payroll & taxes ($430k), facilities ($403k), with the Safe Haven loan removed (paid off Dec 2025) and a 5% inflation buffer. Adjust any line below — every alert and dashboard color updates instantly.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {sections.map((sec) => {
            const Icon = sec.icon;
            const subtotal = sec.items.reduce((s, l) => s + l.amount, 0);
            return (
              <div key={sec.key} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.cream, color: COLORS.forest, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{sec.label}</div>
                    <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{fmtShort(subtotal)}/mo</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {sec.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 7, backgroundColor: COLORS.bg }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: item.essential ? COLORS.red : COLORS.amber, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 12, color: COLORS.ink, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>
                      <span style={{ fontSize: 12, color: COLORS.ink, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtShort(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 18 }}>
          <div style={{ padding: 18, borderRadius: 12, border: `1px solid ${COLORS.red}30`, backgroundColor: "rgba(255,59,138,0.10)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Flame size={14} color={COLORS.red} />
              <div style={{ fontSize: 11, color: COLORS.red, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Survival Floor</div>
            </div>
            <div style={{ fontFamily: fontDisplay, fontSize: 30, fontWeight: 500, color: COLORS.ink, letterSpacing: -0.7 }}>{fmtShort(SURVIVAL_FLOOR_MO)}<span style={{ fontSize: 16, color: COLORS.inkSoft, fontWeight: 400 }}>/mo</span></div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>If everything else stops — facilities + people only.</div>
          </div>
          <div style={{ padding: 18, borderRadius: 12, border: `1px solid ${COLORS.amber}30`, backgroundColor: "rgba(251,191,36,0.10)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Gauge size={14} color={COLORS.amber} />
              <div style={{ fontSize: 11, color: COLORS.amber, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Operating Overhead</div>
            </div>
            <div style={{ fontFamily: fontDisplay, fontSize: 30, fontWeight: 500, color: COLORS.ink, letterSpacing: -0.7 }}>{fmtShort(OPERATING_OVERHEAD_MO)}<span style={{ fontSize: 16, color: COLORS.inkSoft, fontWeight: 400 }}>/mo</span></div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>Full overhead at planned operating scale.</div>
          </div>
        </div>
      </Card>

      {/* FULL OPERATING BUDGET */}
      <Card style={{ padding: 28 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Full operating budget, 2026</div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft }}>Every dollar planned · {fmt(OPERATING_BUDGET_YR)} total</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {fullBudget.map((b, i) => {
            const pct = (b.amount / OPERATING_BUDGET_YR) * 100;
            return (
              <div key={i} style={{ padding: 16, backgroundColor: COLORS.bg, borderRadius: 10, display: "grid", gridTemplateColumns: "260px 1fr 130px 70px", gap: 18, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: b.color }} />
                    {b.name}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2, marginLeft: 18 }}>{b.desc}</div>
                </div>
                <div style={{ height: 8, backgroundColor: COLORS.cream, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, backgroundColor: b.color, borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{fmtShort(b.amount)}</div>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, textAlign: "right" }}>{pct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, padding: 14, backgroundColor: COLORS.forestDeep, color: COLORS.ink, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <TrendingDown size={16} color={COLORS.copper} />
            <div style={{ fontSize: 13 }}>vs. 2025 actual ({fmt(TOTAL_EXPENSES)}) — projecting</div>
          </div>
          <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 500, color: COLORS.copper }}>
            {fmtShort(TOTAL_EXPENSES - OPERATING_BUDGET_YR)} less in 2026
          </div>
        </div>
      </Card>

      {/* DONATION TARGETS — TIERS */}
      <Card style={{ padding: 28 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Donation targets</div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft }}>Three tiers — clear goals at every level</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {DONATION_TIERS.map((t, i) => {
            const monthly = t.target / 12;
            return (
              <div key={i} style={{ padding: 22, borderRadius: 12, border: `1px solid ${t.color}40`, backgroundColor: t.color + "08", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: t.color }} />
                <div style={{ fontSize: 11, color: t.color, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700, marginTop: 6 }}>{t.name}</div>
                <div style={{ fontFamily: fontDisplay, fontSize: 30, fontWeight: 500, color: COLORS.ink, marginTop: 6, letterSpacing: -0.7 }}>{fmtShort(t.target)}</div>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{fmtShort(monthly)}/mo · annual</div>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 12, lineHeight: 1.6 }}>{t.desc}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* STRESS TEST */}
      <Card style={{ padding: 28 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Stress test</div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft }}>What happens if donations drop? The math, instantly.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {STRESS_SCENARIOS.map((s, i) => {
            const gap = s.projected - OPERATING_BUDGET_YR;
            const survives = s.projected >= SURVIVAL_FLOOR_MO * 12;
            const advice = gap >= 0
              ? "Full operating plan covered."
              : gap >= -(MINISTRIES_BUDGET_YR + EVENTS_BUDGET_YR)
              ? "Cut events + ministries. Keep overhead intact."
              : survives
              ? "Cut all but essentials. Tap reserves for staff."
              : "Below survival floor. Reserves required.";
            const tone = gap >= 0 ? COLORS.green : survives ? COLORS.amber : COLORS.red;
            return (
              <div key={i} style={{ padding: 16, backgroundColor: COLORS.bg, borderRadius: 10, display: "grid", gridTemplateColumns: "180px 140px 140px 1fr 120px", gap: 18, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>{s.name}</div>
                  {s.drop > 0 && <div style={{ fontSize: 11, color: COLORS.inkSoft }}>−{Math.round(s.drop * 100)}% giving</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.3, fontWeight: 600 }}>Projected</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, fontVariantNumeric: "tabular-nums" }}>{fmtShort(s.projected)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.3, fontWeight: 600 }}>vs. budget</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: gap >= 0 ? COLORS.green : COLORS.red, fontVariantNumeric: "tabular-nums" }}>
                    {gap >= 0 ? "+" : ""}{fmtShort(gap)}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: COLORS.ink }}>{advice}</div>
                <div>
                  <Pill tone={gap >= 0 ? "success" : survives ? "warn" : "danger"}>
                    {gap >= 0 ? "Healthy" : survives ? "Trim" : "Crisis"}
                  </Pill>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16, padding: 18, backgroundColor: COLORS.forestDeep, color: COLORS.ink, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={20} color={COLORS.copper} />
            <div>
              <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 500, fontStyle: "italic" }}>Worst-case runway</div>
              <div style={{ fontSize: 12, color: "rgba(250,250,250,0.7)" }}>If giving stopped tomorrow and you ran on essentials only.</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: fontDisplay, fontSize: 32, fontWeight: 500, color: COLORS.copper, letterSpacing: -0.7 }}>{runway2026Worst.toFixed(1)} months</div>
            <div style={{ fontSize: 11, color: "rgba(250,250,250,0.6)" }}>{fmt(BALANCE_END)} reserves ÷ {fmtShort(SURVIVAL_FLOOR_MO)}/mo</div>
          </div>
        </div>
      </Card>

      {/* SMART ALERTS */}
      <Card style={{ padding: 28 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Smart alerts</div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft }}>Get notified the moment something needs your attention</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { key: "donationsBelowOverhead", icon: TrendingDown, title: "Donations trending below overhead", desc: "Warn if monthly giving falls under operating overhead for 2 weeks running.", tone: COLORS.red },
            { key: "ministryOverBudget", icon: AlertTriangle, title: "Ministry exceeds budget", desc: "Notify the leader and finance admin when a ministry passes 95% of its annual budget.", tone: COLORS.amber },
            { key: "receiptsMissing", icon: Receipt, title: "Receipts missing 7+ days", desc: "Remind ministry leaders to upload receipts for any approved spending older than a week.", tone: COLORS.copper },
            { key: "runwayBelow6", icon: Flame, title: "Cash runway drops below 6 months", desc: "Critical alert to the senior pastor and treasurer when reserves can't cover 6 months of essentials.", tone: COLORS.red },
          ].map((a) => {
            const Icon = a.icon;
            const on = alerts[a.key];
            return (
              <div key={a.key} style={{ padding: 16, border: `1px solid ${COLORS.border}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: a.tone + "15", color: a.tone, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{a.desc}</div>
                </div>
                <button
                  onClick={() => setAlerts({ ...alerts, [a.key]: !on })}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                    backgroundColor: on ? COLORS.forest : COLORS.border, position: "relative", transition: "background 0.15s",
                  }}
                  aria-label={`Toggle ${a.title}`}
                >
                  <span style={{
                    position: "absolute", top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: "50%",
                    backgroundColor: COLORS.surface, transition: "left 0.15s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }} />
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, padding: 12, backgroundColor: COLORS.bg, borderRadius: 8, display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: COLORS.inkSoft }}>
          <Info size={14} />
          Alerts deliver via email + push. Configure recipients in <strong style={{ color: COLORS.ink }}>People & Roles</strong>.
        </div>

        <ThresholdsPanel config={alertConfig} alerts={alerts} updateThreshold={updateThreshold} />

        <AlertsLivePanel alerts={alerts} config={alertConfig} ministries={ministries} />
      </Card>

    </div>
  );
};

// ============================================================
// MINISTRIES PAGE
// ============================================================

const MinistriesPage = ({ openReceiptModal, ministries, addMinistry }) => {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newLeader, setNewLeader] = useState("");
  const [recent, setRecent] = useState(null); // { id, name } of last-added, for flash banner

  const canSubmit = newName.trim().length > 0 && Number(newBudget) > 0;

  const handleAdd = () => {
    if (!canSubmit) return;
    const id = addMinistry({ name: newName.trim(), budget: Number(newBudget), leader: newLeader.trim() });
    setRecent({ id, name: newName.trim() });
    setNewName("");
    setNewBudget("");
    setNewLeader("");
    setAdding(false);
  };

  const cancel = () => {
    setNewName("");
    setNewBudget("");
    setNewLeader("");
    setAdding(false);
  };

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 600, color: COLORS.ink, letterSpacing: -0.5 }}>
            All ministries
          </div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>
            {ministries.length} active · upload receipts on any card · new ministries land unassigned
          </div>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} style={{
            display: "flex", alignItems: "center", gap: 6, backgroundColor: COLORS.forest,
            color: COLORS.bg, border: "none", padding: "10px 18px", borderRadius: 9,
            fontSize: 13, fontFamily: fontBody, fontWeight: 700, cursor: "pointer",
          }}>
            <Plus size={14} /> New ministry
          </button>
        )}
      </div>

      {/* RECENT-ADDED FLASH */}
      {recent && (
        <Card style={{
          padding: 14, backgroundColor: "rgba(212,255,0,0.06)", borderColor: COLORS.forest + "60",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, backgroundColor: COLORS.forest, color: COLORS.bg,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Check size={14} strokeWidth={3} />
          </div>
          <div style={{ flex: 1, fontSize: 13, color: COLORS.ink }}>
            <strong>{recent.name}</strong> added — currently unassigned.{" "}
            <span style={{ color: COLORS.inkSoft }}>
              Go to <strong style={{ color: COLORS.forest }}>Administrators</strong> to assign it to a leader.
            </span>
          </div>
          <button onClick={() => setRecent(null)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: COLORS.inkSoft }}>
            <X size={16} />
          </button>
        </Card>
      )}

      {/* INLINE NEW-MINISTRY FORM */}
      {adding && (
        <Card style={{
          padding: 22, position: "relative", overflow: "hidden",
          borderColor: COLORS.forest + "60",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: COLORS.forest }} />
          <div style={{ marginBottom: 16, marginTop: 4 }}>
            <div style={{ fontSize: 11, color: COLORS.forest, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>
              New ministry
            </div>
            <div style={{ fontFamily: fontSerif, fontSize: 18, fontStyle: "italic", color: COLORS.inkSoft, marginTop: 4 }}>
              Name it, set the annual budget, and we'll add it to the master list.
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600, marginBottom: 4 }}>Ministry name *</div>
              <input
                autoFocus
                placeholder="e.g. Prayer Team"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleAdd(); if (e.key === "Escape") cancel(); }}
                style={{
                  width: "100%", padding: "10px 12px", fontSize: 14, fontWeight: 600,
                  fontFamily: fontBody, color: COLORS.ink, background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600, marginBottom: 4 }}>Annual budget * ($)</div>
              <input
                type="number"
                placeholder="5000"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleAdd(); if (e.key === "Escape") cancel(); }}
                style={{
                  width: "100%", padding: "10px 12px", fontSize: 14, fontWeight: 600,
                  fontFamily: fontBody, color: COLORS.ink, background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none", boxSizing: "border-box",
                  fontVariantNumeric: "tabular-nums",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600, marginBottom: 4 }}>Leader (optional)</div>
              <input
                placeholder="e.g. Sarah K."
                value={newLeader}
                onChange={(e) => setNewLeader(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleAdd(); if (e.key === "Escape") cancel(); }}
                style={{
                  width: "100%", padding: "10px 12px", fontSize: 14, fontWeight: 600,
                  fontFamily: fontBody, color: COLORS.ink, background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={handleAdd}
              disabled={!canSubmit}
              style={{
                padding: "10px 20px", border: "none", borderRadius: 9, fontFamily: fontBody, fontWeight: 700,
                fontSize: 13, cursor: canSubmit ? "pointer" : "not-allowed",
                backgroundColor: canSubmit ? COLORS.forest : COLORS.cream,
                color: canSubmit ? COLORS.bg : COLORS.inkSoft,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Plus size={14} /> Add to ministries
            </button>
            <button
              onClick={cancel}
              style={{
                padding: "10px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 9,
                fontFamily: fontBody, fontWeight: 600, fontSize: 13, cursor: "pointer",
                backgroundColor: "transparent", color: COLORS.ink,
              }}
            >
              Cancel
            </button>
            <span style={{ fontSize: 11, color: COLORS.inkSoft, marginLeft: 8 }}>
              Press Enter to add · Esc to cancel
            </span>
          </div>
        </Card>
      )}

      {/* GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {ministries.map((m) => {
          const pct = (m.spent / m.budget) * 100;
          const remaining = m.budget - m.spent;
          return (
            <Card key={m.id} style={{ padding: 22, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: m.color }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, marginTop: 4 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, backgroundColor: m.color + "20",
                  color: m.color, display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: fontDisplay, fontSize: 22, fontWeight: 600,
                }}>{m.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft }}>Led by {m.leader}</div>
                </div>
                <button style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
                  <MoreVertical size={15} color={COLORS.inkSoft} />
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Spent</span>
                <span style={{ fontSize: 11, color: COLORS.inkSoft }}>{pct.toFixed(0)}% of budget</span>
              </div>
              <div style={{ height: 7, backgroundColor: COLORS.cream, borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
                <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 95 ? COLORS.red : pct > 80 ? COLORS.amber : m.color, borderRadius: 99 }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, color: COLORS.ink, letterSpacing: -0.5 }}>{fmt(m.spent)}</div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft }}>of {fmt(m.budget)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: remaining > 0 ? COLORS.green : COLORS.red, fontVariantNumeric: "tabular-nums" }}>
                    {fmt(Math.abs(remaining))}
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.3 }}>{remaining > 0 ? "remaining" : "over"}</div>
                </div>
              </div>

              <button onClick={() => openReceiptModal(m)} style={{
                width: "100%", padding: "9px 12px", backgroundColor: COLORS.cream,
                border: `1px solid ${COLORS.border}`, color: COLORS.ink, borderRadius: 8,
                cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: fontBody,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Upload size={13} /> Upload receipt
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// CAMPUSES PAGE
// ============================================================

const CampusesPage = () => {
  const campuses = [
    { name: "Main · Everett", isMain: true, donations: 1814440, expenses: 1606278, members: 1240, ministries: 14, address: "Everett, WA" },
    { name: "Tacoma", isMain: false, donations: 24262.53, expenses: 30005.99, members: 180, ministries: 4, address: "Tacoma, WA" },
    { name: "New York", isMain: false, donations: 44000.00, expenses: 21486.89, members: 95, ministries: 3, address: "New York, NY" },
  ];
  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>
      {campuses.map((c, i) => {
        const surplus = c.donations - c.expenses;
        return (
          <Card key={i} style={{ padding: 28, position: "relative", overflow: "hidden" }}>
            {c.isMain && (
              <div style={{ position: "absolute", top: 16, right: 16 }}>
                <Pill tone="forest">★ Primary</Pill>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: 24, alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <Church size={22} color={COLORS.forest} strokeWidth={1.6} />
                  <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, color: COLORS.ink, letterSpacing: -0.5 }}>{c.name}</div>
                </div>
                <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{c.address}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Donations</div>
                <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, color: COLORS.ink, marginTop: 2 }}>{fmtShort(c.donations)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Expenses</div>
                <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, color: COLORS.ink, marginTop: 2 }}>{fmtShort(c.expenses)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Net</div>
                <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, color: surplus >= 0 ? COLORS.green : COLORS.red, marginTop: 2 }}>
                  {surplus >= 0 ? "+" : ""}{fmtShort(surplus)}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <Pill tone="copper">{c.members} members</Pill>
                <Pill tone="neutral">{c.ministries} ministries</Pill>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// ============================================================
// ADMINISTRATORS PAGE
// ============================================================

const ADMIN_TYPE_TONE = {
  executive: { color: COLORS.forest, bg: "rgba(74,222,128,0.16)", label: "Executive" },
  function: { color: COLORS.copper, bg: "rgba(255,90,31,0.18)", label: "Function" },
  campus: { color: COLORS.amber, bg: "rgba(251,191,36,0.18)", label: "Campus" },
};

// Computes per-admin totals from current assignments.
const computeOversight = (adminId, assignments, ministriesList) => {
  const ministries = ministriesList.filter((m) => assignments[m.id] === adminId);
  const budget = ministries.reduce((s, m) => s + m.budget, 0);
  const spent = ministries.reduce((s, m) => s + m.spent, 0);
  return { ministries, budget, spent };
};

const NEW_MINISTRY_PALETTE = ["#D4FF00", "#FF5A1F", "#FF3B8A", "#FBBF24", "#A78BFA", "#22D3EE", "#F472B6", "#4ADE80", "#60A5FA"];
const NEW_MINISTRY_ICONS = ["○", "◆", "▲", "■", "♦", "★", "✦", "◈", "◇"];

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `m-${Date.now()}`;

const AssignmentModal = ({ admin, assignments, ministries, renameMinistry, updateMinistryBudget, addMinistry, onSave, onClose }) => {
  const initialOwned = new Set(
    Object.entries(assignments).filter(([, aid]) => aid === admin.id).map(([mid]) => mid)
  );
  const [selected, setSelected] = useState(initialOwned);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBudgetInput, setNewBudgetInput] = useState("");

  const toggle = (mid) => {
    const next = new Set(selected);
    if (next.has(mid)) next.delete(mid);
    else next.add(mid);
    setSelected(next);
  };

  const handleAddMinistry = () => {
    const name = newName.trim();
    const budget = Number(newBudgetInput);
    if (!name || !budget || budget <= 0) return;
    const newId = addMinistry({ name, budget });
    setSelected((prev) => new Set([...prev, newId]));
    setNewName("");
    setNewBudgetInput("");
    setAdding(false);
  };

  const newBudget = ministries.filter((m) => selected.has(m.id)).reduce((s, m) => s + m.budget, 0);
  const transfersIn = [...selected].filter((mid) => assignments[mid] && assignments[mid] !== admin.id).length;
  const willLose = [...initialOwned].filter((mid) => !selected.has(mid));

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(21,39,36,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: COLORS.surface, borderRadius: 16, width: 880, maxWidth: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 80px rgba(21,39,36,0.3)" }}>

        <div style={{ padding: "24px 28px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: COLORS.forest, color: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{admin.avatar}</div>
            <div>
              <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, color: COLORS.ink, fontStyle: "italic", letterSpacing: -0.3 }}>Assign ministries to {admin.name}</div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>Click any ministry to toggle. Selecting one already assigned transfers it.</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} color={COLORS.inkSoft} />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {ministries.map((m) => {
              const isSelected = selected.has(m.id);
              const currentOwner = assignments[m.id];
              const owner = ADMINISTRATORS.concat([]).find((a) => a.id === currentOwner);
              const isOurs = currentOwner === admin.id;
              const isOther = currentOwner && !isOurs;
              const isUnassigned = !currentOwner;

              const borderColor = isSelected ? COLORS.green : isOther ? COLORS.amber : COLORS.border;
              const bg = isSelected ? "rgba(74,222,128,0.10)" : isOther ? "rgba(251,191,36,0.10)" : COLORS.surface;

              return (
                <div
                  key={m.id}
                  onClick={() => toggle(m.id)}
                  role="button"
                  tabIndex={0}
                  style={{
                    padding: 14, border: `2px solid ${borderColor}`, borderRadius: 10,
                    backgroundColor: bg, textAlign: "left", cursor: "pointer", fontFamily: fontBody,
                    display: "flex", flexDirection: "column", gap: 8, transition: "all 0.12s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: m.color + "20", color: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisplay, fontSize: 16, fontWeight: 600, flexShrink: 0 }}>{m.icon}</div>
                      <EditableText
                        value={m.name}
                        onChange={(v) => renameMinistry(m.id, v)}
                        style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, fontFamily: fontBody }}
                      />
                    </div>
                    {isSelected && (
                      <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: COLORS.green, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Check size={13} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                    <EditableText
                      value={m.budget}
                      as="number"
                      onChange={(v) => updateMinistryBudget(m.id, v)}
                      format={(n) => fmtShort(n)}
                      style={{ fontSize: 11, color: COLORS.inkSoft, fontWeight: 600, fontFamily: fontBody }}
                    />
                    <span>budget · led by {m.leader || "—"}</span>
                  </div>
                  {isOther && !isSelected && (
                    <div style={{ fontSize: 10, color: COLORS.amber, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
                      Currently under {owner?.avatar || "?"} · click to transfer
                    </div>
                  )}
                  {isOther && isSelected && (
                    <div style={{ fontSize: 10, color: COLORS.green, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
                      Will transfer from {owner?.avatar || "?"}
                    </div>
                  )}
                  {isUnassigned && !isSelected && (
                    <div style={{ fontSize: 10, color: COLORS.inkSoft, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
                      Unassigned
                    </div>
                  )}
                </div>
              );
            })}

            {/* + NEW MINISTRY TILE */}
            {!adding ? (
              <button
                onClick={() => setAdding(true)}
                style={{
                  padding: 14, border: `2px dashed ${COLORS.copper}80`, borderRadius: 10,
                  backgroundColor: COLORS.cream + "40", textAlign: "left", cursor: "pointer",
                  fontFamily: fontBody, display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 6, color: COLORS.copper, minHeight: 110,
                }}
              >
                <Plus size={20} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>New ministry</span>
                <span style={{ fontSize: 11, color: COLORS.inkSoft, fontWeight: 500 }}>auto-assigned to {admin.avatar}</span>
              </button>
            ) : (
              <div style={{
                padding: 14, border: `2px solid ${COLORS.copper}`, borderRadius: 10,
                backgroundColor: COLORS.surface, display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ fontSize: 11, color: COLORS.copper, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>New ministry</div>
                <input
                  autoFocus
                  placeholder="Ministry name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddMinistry(); if (e.key === "Escape") setAdding(false); }}
                  style={{ fontSize: 13, fontWeight: 600, fontFamily: fontBody, padding: "7px 9px", border: `1px solid ${COLORS.border}`, borderRadius: 6, outline: "none" }}
                />
                <input
                  type="number"
                  placeholder="Annual budget ($)"
                  value={newBudgetInput}
                  onChange={(e) => setNewBudgetInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddMinistry(); if (e.key === "Escape") setAdding(false); }}
                  style={{ fontSize: 13, fontFamily: fontBody, padding: "7px 9px", border: `1px solid ${COLORS.border}`, borderRadius: 6, outline: "none" }}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={handleAddMinistry}
                    disabled={!newName.trim() || !Number(newBudgetInput)}
                    style={{
                      flex: 1, padding: "7px 10px", border: "none", borderRadius: 6, fontFamily: fontBody, fontWeight: 700,
                      fontSize: 12, cursor: newName.trim() && Number(newBudgetInput) ? "pointer" : "not-allowed",
                      backgroundColor: newName.trim() && Number(newBudgetInput) ? COLORS.forest : COLORS.border,
                      color: COLORS.ink,
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setAdding(false); setNewName(""); setNewBudgetInput(""); }}
                    style={{ padding: "7px 10px", border: `1px solid ${COLORS.border}`, borderRadius: 6, fontFamily: fontBody, fontWeight: 600, fontSize: 12, cursor: "pointer", backgroundColor: "transparent", color: COLORS.ink }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "18px 24px", borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.5 }}>
            <div><strong style={{ color: COLORS.ink }}>New oversight:</strong> {selected.size} ministr{selected.size === 1 ? "y" : "ies"} · {fmt(newBudget)}</div>
            {transfersIn > 0 && <div>{transfersIn} ministr{transfersIn === 1 ? "y" : "ies"} will transfer in from other admins.</div>}
            {willLose.length > 0 && <div>{willLose.length} ministr{willLose.length === 1 ? "y" : "ies"} will become unassigned.</div>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "10px 18px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: fontBody }}>
              Cancel
            </button>
            <button onClick={() => { onSave(selected); onClose(); }} style={{ padding: "10px 20px", backgroundColor: COLORS.forest, color: COLORS.bg, border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", gap: 6 }}>
              <Check size={14} /> Save assignments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdministratorsPage = ({
  ministries, admins,
  renameMinistry, updateMinistryBudget, addMinistry,
  renameAdmin, updateAdminTitle, addAdmin,
}) => {
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);

  // Keep `editing` reference in sync if its admin object changes (after rename).
  const editingAdmin = editing ? admins.find((a) => a.id === editing.id) : null;

  const stats = useMemo(() => {
    const totalBudget = admins.reduce((s, a) => s + computeOversight(a.id, assignments, ministries).budget, 0);
    const assignedCount = Object.values(assignments).filter(Boolean).length;
    const avgPerAdmin = (assignedCount / admins.length).toFixed(1);
    const unassigned = ministries.filter((m) => !assignments[m.id]);
    return { totalBudget, assignedCount, avgPerAdmin, unassigned };
  }, [assignments, ministries, admins]);

  const counts = {
    all: admins.length,
    executive: admins.filter((a) => a.type === "executive").length,
    campus: admins.filter((a) => a.type === "campus").length,
    function: admins.filter((a) => a.type === "function").length,
  };

  const visible = filter === "all" ? admins : admins.filter((a) => a.type === filter);

  const handleSave = (selected) => {
    setAssignments((prev) => {
      const next = { ...prev };
      for (const [mid, aid] of Object.entries(next)) {
        if (aid === editing.id) next[mid] = null;
      }
      for (const mid of selected) {
        next[mid] = editing.id;
      }
      return next;
    });
  };

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* TOP STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <Card style={{ padding: 22 }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Administrators</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, color: COLORS.ink, marginTop: 6, letterSpacing: -0.5 }}>{ADMINISTRATORS.length}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{counts.executive} exec · {counts.function} function · {counts.campus} campus</div>
        </Card>
        <Card style={{ padding: 22 }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Combined oversight</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, color: COLORS.ink, marginTop: 6, letterSpacing: -0.5 }}>{fmtShort(stats.totalBudget)}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>across all ministries</div>
        </Card>
        <Card style={{ padding: 22, backgroundColor: stats.unassigned.length === 0 ? COLORS.surface : "rgba(251,191,36,0.10)", borderColor: stats.unassigned.length === 0 ? COLORS.border : COLORS.amber + "60" }}>
          <div style={{ fontSize: 11, color: stats.unassigned.length === 0 ? COLORS.inkSoft : COLORS.amber, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Coverage</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, color: COLORS.ink, marginTop: 6, letterSpacing: -0.5 }}>
            {stats.assignedCount} <span style={{ color: COLORS.inkSoft, fontSize: 18 }}>/ {ministries.length}</span>
          </div>
          <div style={{ fontSize: 12, color: stats.unassigned.length === 0 ? COLORS.green : COLORS.amber, marginTop: 2, fontWeight: 600 }}>
            {stats.unassigned.length === 0 ? "All ministries covered" : `${stats.unassigned.length} unassigned`}
          </div>
        </Card>
        <Card style={{ padding: 22 }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Avg. ministries per admin</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, color: COLORS.ink, marginTop: 6, letterSpacing: -0.5 }}>{stats.avgPerAdmin}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>across all admins</div>
        </Card>
      </div>

      {/* UNASSIGNED WARNING */}
      {stats.unassigned.length > 0 && (
        <Card style={{ padding: 16, backgroundColor: "rgba(251,191,36,0.10)", borderColor: COLORS.amber + "60", display: "flex", alignItems: "center", gap: 12 }}>
          <AlertTriangle size={18} color={COLORS.amber} />
          <div style={{ flex: 1, fontSize: 13, color: COLORS.ink }}>
            <strong>{stats.unassigned.length} ministr{stats.unassigned.length === 1 ? "y has" : "ies have"} no administrator:</strong>{" "}
            {stats.unassigned.map((m) => m.name).join(", ")}. Every dollar should have a name attached.
          </div>
        </Card>
      )}

      {/* FILTER TABS + ADD */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { id: "all", label: "All" },
            { id: "executive", label: "Executive" },
            { id: "campus", label: "Campus" },
            { id: "function", label: "Function" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: "8px 14px", border: filter === tab.id ? "none" : `1px solid ${COLORS.border}`,
                backgroundColor: filter === tab.id ? COLORS.forest : "transparent",
                color: filter === tab.id ? COLORS.cream : COLORS.ink,
                borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: fontBody,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {tab.label}
              <span style={{
                padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                backgroundColor: filter === tab.id ? "rgba(255,255,255,0.18)" : COLORS.cream,
                color: filter === tab.id ? COLORS.cream : COLORS.inkSoft,
              }}>{counts[tab.id]}</span>
            </button>
          ))}
        </div>
        <button onClick={addAdmin} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.forest, color: COLORS.bg, border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, fontWeight: 600, cursor: "pointer" }}>
          <UserPlus size={14} /> Add administrator
        </button>
      </div>

      {/* ADMIN CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
        {visible.map((admin) => {
          const oversight = computeOversight(admin.id, assignments, ministries);
          const tone = ADMIN_TYPE_TONE[admin.type];
          const pct = oversight.budget > 0 ? (oversight.spent / oversight.budget) * 100 : 0;

          return (
            <Card key={admin.id} style={{ padding: 22, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: tone.color }} />

              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 4, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: tone.color, color: tone.color === COLORS.amber ? COLORS.forestDeep : COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                  {admin.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <EditableText
                    value={admin.name}
                    onChange={(v) => renameAdmin(admin.id, v)}
                    style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 600, color: COLORS.ink, letterSpacing: -0.3 }}
                  />
                  <div style={{ marginTop: 2 }}>
                    <EditableText
                      value={admin.title}
                      onChange={(v) => updateAdminTitle(admin.id, v)}
                      style={{ fontSize: 12, color: COLORS.inkSoft, fontFamily: fontBody }}
                    />
                  </div>
                </div>
                <button onClick={() => setEditing(admin)} style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: `1px solid ${COLORS.border}`, padding: "6px 10px", borderRadius: 7, fontSize: 11, fontFamily: fontBody, fontWeight: 600, cursor: "pointer", color: COLORS.ink }}>
                  <Edit3 size={11} /> Assign
                </button>
              </div>

              <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                <Pill tone={admin.type === "executive" ? "forest" : admin.type === "function" ? "copper" : "warn"}>
                  {tone.label}
                </Pill>
                <Pill tone="neutral">{admin.campus}</Pill>
              </div>

              <div style={{ fontSize: 12, color: COLORS.ink, fontStyle: "italic", lineHeight: 1.55, marginBottom: 16 }}>
                {admin.bio}
              </div>

              {oversight.ministries.length > 0 ? (
                <>
                  <div style={{ padding: 14, backgroundColor: COLORS.bg, borderRadius: 10, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Total oversight</span>
                      <span style={{ fontSize: 11, color: COLORS.inkSoft }}>{oversight.ministries.length} ministr{oversight.ministries.length === 1 ? "y" : "ies"}</span>
                    </div>
                    <div style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 500, color: COLORS.ink, letterSpacing: -0.5 }}>{fmt(oversight.budget)}</div>
                    <div style={{ height: 6, backgroundColor: COLORS.cream, borderRadius: 99, overflow: "hidden", marginTop: 8 }}>
                      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 95 ? COLORS.red : pct > 85 ? COLORS.amber : COLORS.green, borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 4 }}>{fmt(oversight.spent)} spent · {pct.toFixed(0)}% of budget</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {oversight.ministries.map((m) => {
                      const mp = (m.spent / m.budget) * 100;
                      return (
                        <div key={m.id} style={{ display: "grid", gridTemplateColumns: "20px 1fr 60px", gap: 8, alignItems: "center", padding: "4px 0" }}>
                          <span style={{ fontSize: 14, color: m.color, fontFamily: fontDisplay, fontWeight: 600 }}>{m.icon}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>{m.name}</div>
                            <div style={{ height: 3, backgroundColor: COLORS.cream, borderRadius: 99, marginTop: 3, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${Math.min(mp, 100)}%`, backgroundColor: m.color }} />
                            </div>
                          </div>
                          <div style={{ fontSize: 10, color: COLORS.inkSoft, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            {fmtShort(m.spent)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ padding: 18, border: `1px dashed ${COLORS.border}`, borderRadius: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 8 }}>No ministries assigned yet</div>
                  <button onClick={() => setEditing(admin)} style={{ background: COLORS.cream, border: `1px solid ${COLORS.border}`, padding: "7px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, fontFamily: fontBody, cursor: "pointer", color: COLORS.ink, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Plus size={12} /> Assign ministries
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* HINT FOOTER */}
      <Card style={{ padding: 14, backgroundColor: COLORS.bg, borderColor: COLORS.borderSoft, display: "flex", alignItems: "center", gap: 10 }}>
        <Info size={14} color={COLORS.inkSoft} />
        <div style={{ fontSize: 12, color: COLORS.inkSoft }}>
          A ministry has exactly one administrator at a time. Reassigning automatically removes it from the previous owner — no double-assignment possible.
        </div>
      </Card>

      {editingAdmin && (
        <AssignmentModal
          admin={editingAdmin}
          assignments={assignments}
          ministries={ministries}
          renameMinistry={renameMinistry}
          updateMinistryBudget={updateMinistryBudget}
          addMinistry={addMinistry}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

// ============================================================
// EVENTS PAGE
// ============================================================

const EventsPage = () => {
  const typeColor = {
    camp: COLORS.forest, retreat: COLORS.green, conference: COLORS.copper,
    school: COLORS.amber, event: "#22D3EE", meeting: COLORS.inkSoft,
  };
  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Total Events", value: "23", sub: "FY 2025" },
          { label: "Total Attendees", value: "3,901", sub: "Across all events" },
          { label: "Registration Revenue", value: fmt(115976.22), sub: "Recovered cost" },
          { label: "Net Event Cost", value: fmt(131929.79), sub: "After registrations" },
        ].map((s, i) => (
          <Card key={i} style={{ padding: 18 }}>
            <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 500, color: COLORS.ink, marginTop: 4, letterSpacing: -0.5 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>All events & camps</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Track registration, attendance, and budgets</div>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.forest, color: COLORS.bg, border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> New event
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {EVENTS_CAMPS.map((e, i) => (
            <div key={i} style={{
              padding: 16, border: `1px solid ${COLORS.border}`, borderRadius: 10,
              display: "flex", flexDirection: "column", gap: 8, cursor: "pointer", transition: "all 0.15s",
            }}
              onMouseEnter={(ev) => { ev.currentTarget.style.borderColor = typeColor[e.type]; ev.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(ev) => { ev.currentTarget.style.borderColor = COLORS.border; ev.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase",
                  color: typeColor[e.type], padding: "2px 8px", borderRadius: 4, backgroundColor: typeColor[e.type] + "15"
                }}>{e.type}</span>
                {e.status === "recurring" && <Pill tone="copper">Recurring</Pill>}
              </div>
              <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>{e.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.inkSoft }}>
                <Users size={12} /> {e.attendees} attendees
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ============================================================
// RECEIPTS PAGE
// ============================================================

const ReceiptsPage = ({ openReceiptModal }) => {
  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{
        padding: 32, backgroundColor: COLORS.forestDeep, color: COLORS.ink, border: "none",
        backgroundImage: `radial-gradient(circle at 80% 20%, rgba(184,133,94,0.15) 0%, transparent 50%)`
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, fontStyle: "italic", letterSpacing: -0.5 }}>Snap a receipt, we'll do the rest.</div>
            <div style={{ fontSize: 13, color: "rgba(250,250,250,0.75)", marginTop: 6, maxWidth: 540 }}>
              Upload a photo or PDF. AI extracts vendor, amount, and date — auto-codes it to the right ministry, then syncs to QuickBooks once approved.
            </div>
          </div>
          <button onClick={() => openReceiptModal(null)} style={{
            display: "flex", alignItems: "center", gap: 8, backgroundColor: COLORS.copper,
            color: COLORS.forestDeep, border: "none", padding: "12px 20px", borderRadius: 10,
            fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: fontBody,
          }}>
            <Upload size={15} /> Upload receipt
          </button>
        </div>
      </Card>

      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Recent receipts</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{RECENT_RECEIPTS.length} this month · 4 awaiting approval</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${COLORS.border}`, padding: "7px 12px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, cursor: "pointer", color: COLORS.ink }}>
              <Filter size={13} /> Filter
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${COLORS.border}`, padding: "7px 12px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, cursor: "pointer", color: COLORS.ink }}>
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "60px 1.5fr 1fr 100px 100px 130px 100px", gap: 12, padding: "8px 14px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>
          <div></div><div>Vendor</div><div>Ministry</div><div>Amount</div><div>Date</div><div>Uploaded by</div><div>Status</div>
        </div>
        {RECENT_RECEIPTS.map((r) => (
          <div key={r.id} style={{
            display: "grid", gridTemplateColumns: "60px 1.5fr 1fr 100px 100px 130px 100px",
            gap: 12, padding: "14px", borderBottom: `1px solid ${COLORS.borderSoft}`,
            alignItems: "center", cursor: "pointer", transition: "background 0.1s"
          }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.bg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
            <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${COLORS.border}` }}>
              <FileText size={16} color={COLORS.copper} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{r.vendor}</div>
              <div style={{ fontSize: 11, color: COLORS.inkSoft }}>Receipt #{1000 + r.id}</div>
            </div>
            <div style={{ fontSize: 13, color: COLORS.ink }}>{r.ministry}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, fontVariantNumeric: "tabular-nums" }}>{fmt(r.amount)}</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{r.date}</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{r.uploadedBy}</div>
            <div>
              {r.status === "synced" && <Pill tone="success"><CheckCircle2 size={10} /> Synced</Pill>}
              {r.status === "pending" && <Pill tone="warn"><Clock size={10} /> Pending</Pill>}
              {r.status === "review" && <Pill tone="danger"><AlertCircle size={10} /> Review</Pill>}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ============================================================
// ACTIVITY PAGE — audit trail of every decision
// ============================================================

const ACTIVITY_TYPES = {
  roll:         { label: "Roll forward",  icon: ArrowUpRight,  color: COLORS.forest },
  return:       { label: "Return to fund",icon: ArrowDownRight,color: COLORS.copper },
  budget:       { label: "Budget change", icon: Edit3,          color: COLORS.amber },
  notification: { label: "Notification",  icon: Mail,           color: COLORS.copper },
  alert:        { label: "Alert fired",   icon: AlertTriangle,  color: COLORS.red },
  review:       { label: "Quarterly review", icon: Check,       color: COLORS.green },
};

const FILTER_TABS = [
  { id: "all",          label: "All",            types: null },
  { id: "rolls",        label: "Rolls",          types: ["roll"] },
  { id: "returns",      label: "Returns",        types: ["return"] },
  { id: "budget",       label: "Budget changes", types: ["budget"] },
  { id: "notifications",label: "Notifications",  types: ["notification"] },
  { id: "reviews",      label: "Reviews",        types: ["review"] },
  { id: "alerts",       label: "Alerts",         types: ["alert"] },
];

const formatDateLabel = (dateStr, todayStr) => {
  const d = new Date(dateStr);
  const today = new Date(todayStr);
  const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
  const dayOfWeek = d.toLocaleDateString("en-US", { weekday: "long" });
  const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (diffDays === 0) return `Today · ${formatted}`;
  if (diffDays === 1) return `Yesterday · ${formatted}`;
  if (diffDays < 7) return `${dayOfWeek} · ${formatted}`;
  return formatted;
};

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

const ActivityPage = ({ activityLog }) => {
  const [filter, setFilter] = useState("all");
  const today = "2026-05-07T23:59:59"; // demo "now"

  const tab = FILTER_TABS.find((t) => t.id === filter);
  const visible = tab.types === null
    ? activityLog
    : activityLog.filter((e) => tab.types.includes(e.type));

  // Group by date (YYYY-MM-DD)
  const grouped = visible.reduce((acc, e) => {
    const key = e.timestamp.split("T")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});
  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Top stats
  const totalRolled = activityLog.filter((e) => e.type === "roll").reduce((s, e) => s + e.amount, 0);
  const totalReturned = activityLog.filter((e) => e.type === "return").reduce((s, e) => s + e.amount, 0);
  const budgetChanges = activityLog.filter((e) => e.type === "budget").length;

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* TOP STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Total entries</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 600, color: COLORS.ink, marginTop: 4 }}>{activityLog.length}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>last 7 days</div>
        </Card>
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 11, color: COLORS.green, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Rolled forward</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 600, color: COLORS.ink, marginTop: 4 }}>{fmt(totalRolled)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{activityLog.filter((e) => e.type === "roll").length} ministries</div>
        </Card>
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Returned to fund</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 600, color: COLORS.ink, marginTop: 4 }}>{fmt(totalReturned)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{activityLog.filter((e) => e.type === "return").length} ministries</div>
        </Card>
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 11, color: COLORS.amber, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Budget changes</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 600, color: COLORS.ink, marginTop: 4 }}>{budgetChanges}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>applied this period</div>
        </Card>
      </div>

      {/* FILTER TABS + EXPORT */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTER_TABS.map((t) => {
            const count = t.types === null ? INITIAL_ACTIVITY_LOG.length : activityLog.filter((e) => t.types.includes(e.type)).length;
            const active = filter === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                style={{
                  padding: "8px 14px", border: active ? "none" : `1px solid ${COLORS.border}`,
                  backgroundColor: active ? COLORS.forest : "transparent",
                  color: active ? COLORS.bg : COLORS.ink,
                  borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: fontBody,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {t.label}
                <span style={{
                  padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                  backgroundColor: active ? "rgba(0,0,0,0.18)" : COLORS.cream,
                  color: active ? COLORS.bg : COLORS.inkSoft,
                }}>{count}</span>
              </button>
            );
          })}
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.cream, color: COLORS.ink, border: `1px solid ${COLORS.border}`, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, fontWeight: 600, cursor: "pointer" }}>
          <Download size={13} /> Export CSV for board
        </button>
      </div>

      {/* GROUPED FEED */}
      {dateKeys.length === 0 ? (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontFamily: fontSerif, fontSize: 18, fontStyle: "italic", color: COLORS.inkSoft }}>No activity in this filter.</div>
        </Card>
      ) : (
        dateKeys.map((dateKey) => (
          <div key={dateKey}>
            <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 10 }}>
              {formatDateLabel(dateKey, today)}
            </div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {grouped[dateKey].map((e, i) => {
                const meta = ACTIVITY_TYPES[e.type];
                const Icon = meta.icon;
                const isLast = i === grouped[dateKey].length - 1;
                return (
                  <div key={e.id} style={{
                    display: "grid", gridTemplateColumns: "44px 1fr 130px 90px",
                    gap: 14, alignItems: "center", padding: "14px 18px",
                    borderBottom: isLast ? "none" : `1px solid ${COLORS.borderSoft}`,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      backgroundColor: meta.color + "20", color: meta.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={15} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                        <span style={{ color: COLORS.inkSoft }}>{e.who}</span> · <span style={{ color: meta.color }}>{meta.label.toLowerCase()}</span>{e.ministry ? ` · ${e.ministry}` : ""}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{e.note}</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                      color: e.amount > 0 ? COLORS.green : e.amount < 0 ? COLORS.copper : COLORS.inkSoft,
                    }}>
                      {e.amount === 0 ? "—" : `${e.amount > 0 ? "+" : "−"}${fmt(Math.abs(e.amount))}`}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.inkSoft, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                      {formatTime(e.timestamp)}
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        ))
      )}
    </div>
  );
};

// ============================================================
// PEOPLE / PERMISSIONS PAGE
// ============================================================

const PeoplePage = () => {
  const ROLES = [
    { name: "Full Admin", desc: "Everything · all campuses · billing · permissions", count: 1, color: COLORS.forest },
    { name: "Finance Admin", desc: "Donations · expenses · QuickBooks · reports", count: 1, color: COLORS.copper },
    { name: "Campus Admin", desc: "Their campus only · ministries · receipts", count: 2, color: COLORS.green },
    { name: "Ministry Leader", desc: "Their ministry only · receipts · budget view", count: 4, color: COLORS.amber },
    { name: "View Only", desc: "Read access for board members & auditors", count: 0, color: COLORS.inkSoft },
  ];

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {ROLES.map((r, i) => (
          <Card key={i} style={{ padding: 18, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, backgroundColor: r.color }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Shield size={14} color={r.color} />
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>{r.name}</div>
            </div>
            <div style={{ fontSize: 11, color: COLORS.inkSoft, lineHeight: 1.5, marginBottom: 10, minHeight: 32 }}>{r.desc}</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, color: COLORS.ink }}>{r.count}</div>
            <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.3 }}>active</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Team & access</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{TEAM.length} active members · invite ministry leaders with limited access</div>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.forest, color: COLORS.bg, border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, fontWeight: 600, cursor: "pointer" }}>
            <UserPlus size={14} /> Invite member
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 80px", gap: 12, padding: "8px 14px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>
          <div>Member</div><div>Role</div><div>Access level</div><div>Campus</div><div>Last active</div>
        </div>
        {TEAM.map((p, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 80px", gap: 12, padding: 14, borderBottom: `1px solid ${COLORS.borderSoft}`, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: COLORS.forest, color: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{p.avatar}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{p.name}</div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{p.email}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: COLORS.ink }}>{p.role}</div>
            <div>
              <Pill tone={p.access === "Full Admin" ? "forest" : p.access === "Finance Admin" ? "copper" : p.access === "Campus Admin" ? "success" : "neutral"}>
                {p.access}
              </Pill>
            </div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{p.campus}</div>
            <div style={{ fontSize: 11, color: p.lastActive.includes("now") ? COLORS.green : COLORS.inkSoft }}>{p.lastActive}</div>
          </div>
        ))}
      </Card>

      <Card style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Permissions matrix</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft }}>What each role can see and do</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, color: COLORS.inkSoft, textTransform: "uppercase", fontSize: 10, letterSpacing: 0.4 }}>Capability</th>
                {["Full Admin", "Finance", "Campus", "Ministry", "View"].map((r, i) => (
                  <th key={i} style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 600, color: COLORS.inkSoft, textTransform: "uppercase", fontSize: 10, letterSpacing: 0.4, textAlign: "center" }}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["View dashboard", true, true, "campus", "ministry", true],
                ["See all donations", true, true, "campus", false, true],
                ["Add manual donations", true, true, "campus", false, false],
                ["Upload receipts", true, true, true, "ministry", false],
                ["Approve receipts", true, true, "campus", false, false],
                ["Manage ministry budget", true, true, "campus", "ministry", false],
                ["Sync to QuickBooks", true, true, false, false, false],
                ["Invite team members", true, false, "campus", false, false],
                ["Access financial reports", true, true, "campus", "ministry", true],
                ["Modify integrations", true, false, false, false, false],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                  <td style={{ padding: "11px 12px", color: COLORS.ink, fontWeight: 500 }}>{row[0]}</td>
                  {row.slice(1).map((cell, j) => (
                    <td key={j} style={{ padding: "11px 12px", textAlign: "center" }}>
                      {cell === true && <CheckCircle2 size={15} color={COLORS.green} style={{ display: "inline-block" }} />}
                      {cell === false && <X size={15} color={COLORS.inkSoft} style={{ display: "inline-block", opacity: 0.4 }} />}
                      {cell === "campus" && <span style={{ fontSize: 10, color: COLORS.amber, fontWeight: 700 }}>OWN CAMPUS</span>}
                      {cell === "ministry" && <span style={{ fontSize: 10, color: COLORS.copper, fontWeight: 700 }}>OWN MINISTRY</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ============================================================
// INTEGRATIONS PAGE
// ============================================================

const INTEGRATIONS = [
  {
    name: "Stripe", logo: "S", color: "#635BFF",
    desc: "Online giving via website & mobile. Auto-imports donations every 15 min.",
    fields: [
      { key: "secretKey", label: "Secret API key", placeholder: "sk_live_…", type: "password", required: true, help: "Dashboard → Developers → API keys" },
      { key: "webhookSecret", label: "Webhook signing secret", placeholder: "whsec_…", type: "password", required: false, help: "Developers → Webhooks → Signing secret" },
    ],
    perms: ["Read all charges", "Read customer info", "Webhook on charge.succeeded"],
  },
  {
    name: "Square", logo: "■", color: "#000000",
    desc: "In-person giving via Square readers. Sun & Fri service offerings.",
    fields: [
      { key: "accessToken", label: "Access token", placeholder: "EAAAEx…", type: "password", required: true, help: "Developer Dashboard → Credentials → Access tokens" },
      { key: "locationId", label: "Location ID", placeholder: "L8X09F2…", type: "text", required: true, help: "Account & Settings → Business → Locations" },
    ],
    perms: ["Read payments", "Read locations", "Read items (offerings)"],
  },
  {
    name: "QuickBooks Online", logo: "Q", color: "#2CA01C",
    desc: "Two-way accounting sync. Donations → income, receipts → expenses, classes per ministry.",
    fields: [
      { key: "companyId", label: "Company / Realm ID", placeholder: "1234567890", type: "text", required: true, help: "Settings → Account & Settings → Billing → Company ID" },
      { key: "clientId", label: "OAuth Client ID", placeholder: "ABxxx…", type: "text", required: true },
      { key: "clientSecret", label: "OAuth Client Secret", placeholder: "•••", type: "password", required: true },
    ],
    perms: ["Read & write accounts", "Manage classes (ministries)", "Manage customers (donors)"],
  },
  {
    name: "Google Workspace", logo: "G", color: "#4285F4",
    desc: "Single sign-on for ministry leaders. Calendar sync for events & camps.",
    fields: [
      { key: "domain", label: "Workspace domain", placeholder: "ircchurch.org", type: "text", required: true },
      { key: "serviceAccount", label: "Service account email", placeholder: "irc-steward@…iam.gserviceaccount.com", type: "text", required: true, help: "Google Cloud Console → IAM & Admin → Service accounts" },
    ],
    perms: ["Read user directory", "Read calendar events"],
  },
  {
    name: "Mailchimp", logo: "M", color: "#FFE01B",
    desc: "Auto-segment donors for thank-you emails, year-end giving statements.",
    fields: [
      { key: "apiKey", label: "API key", placeholder: "abc123…-us21", type: "password", required: true, help: "Account → Extras → API keys. Datacenter is the suffix after the dash." },
      { key: "audienceId", label: "Audience ID", placeholder: "a1b2c3d4e5", type: "text", required: true, help: "Audience → Settings → Audience name and defaults" },
    ],
    perms: ["Read & manage subscribers", "Send campaigns"],
  },
  {
    name: "Planning Center", logo: "P", color: "#4099FF",
    desc: "Sync member directory, attendance, and check-in for kids ministry.",
    fields: [
      { key: "appId", label: "Application ID", placeholder: "…", type: "text", required: true, help: "api.planningcenteronline.com → Personal Access Tokens" },
      { key: "secret", label: "Secret", placeholder: "•••", type: "password", required: true },
    ],
    perms: ["Read people", "Read check-ins"],
  },
];

const ConnectionModal = ({ integration, existing, onConnect, onClose }) => {
  const [values, setValues] = useState(existing || {});
  const [reveal, setReveal] = useState({});

  const requiredOk = integration.fields
    .filter((f) => f.required)
    .every((f) => (values[f.key] ?? "").trim().length > 0);

  const submit = () => {
    if (!requiredOk) return;
    onConnect(integration, values);
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(10,10,10,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: COLORS.surface, borderRadius: 16, width: 540, maxWidth: "100%", maxHeight: "90vh",
        display: "flex", flexDirection: "column", boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
        border: `1px solid ${COLORS.border}`,
      }}>

        <div style={{ padding: "24px 28px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 11, backgroundColor: integration.color,
              color: integration.color === "#FFE01B" ? "#000" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20,
            }}>{integration.logo}</div>
            <div>
              <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 600, color: COLORS.ink, letterSpacing: -0.3 }}>
                Connect {integration.name}
              </div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{integration.desc}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color={COLORS.inkSoft} />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

          <div style={{ padding: 12, backgroundColor: COLORS.cream, borderRadius: 9, fontSize: 11, color: COLORS.inkSoft, display: "flex", alignItems: "flex-start", gap: 8, lineHeight: 1.5 }}>
            <Lock size={13} color={COLORS.green} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Credentials are stored encrypted server-side and never shown again after save. Demo: this prototype keeps them in browser state only.</span>
          </div>

          {integration.fields.map((field) => {
            const isPassword = field.type === "password";
            const isRevealed = reveal[field.key];
            return (
              <div key={field.key}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>
                    {field.label} {field.required && <span style={{ color: COLORS.copper }}>*</span>}
                  </label>
                  {isPassword && (values[field.key] ?? "").length > 0 && (
                    <button
                      type="button"
                      onClick={() => setReveal((r) => ({ ...r, [field.key]: !r[field.key] }))}
                      style={{ background: "transparent", border: "none", color: COLORS.copper, fontSize: 10, fontFamily: fontBody, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, cursor: "pointer" }}
                    >
                      {isRevealed ? "Hide" : "Show"}
                    </button>
                  )}
                </div>
                <input
                  type={isPassword && !isRevealed ? "password" : "text"}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 12px", fontSize: 13,
                    fontFamily: isPassword ? "ui-monospace, monospace" : fontBody,
                    color: COLORS.ink, background: COLORS.bg,
                    border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {field.help && (
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 4, fontStyle: "italic" }}>
                    {field.help}
                  </div>
                )}
              </div>
            );
          })}

          {integration.perms.length > 0 && (
            <div style={{ padding: 12, border: `1px solid ${COLORS.border}`, borderRadius: 9, marginTop: 4 }}>
              <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 6 }}>
                Permissions this connection grants
              </div>
              {integration.perms.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.ink, padding: "3px 0" }}>
                  <Check size={12} color={COLORS.green} /> {p}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "18px 24px", borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 18px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: fontBody }}>
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!requiredOk}
            style={{
              padding: "10px 22px", border: "none", borderRadius: 9,
              fontWeight: 700, fontSize: 13, fontFamily: fontBody,
              cursor: requiredOk ? "pointer" : "not-allowed",
              backgroundColor: requiredOk ? COLORS.forest : COLORS.cream,
              color: requiredOk ? COLORS.bg : COLORS.inkSoft,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Link2 size={13} /> {existing ? "Update credentials" : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
};

const IntegrationsPage = () => {
  // connections: { [integrationName]: { credentials, connectedAt, lastSync } }
  const [connections, setConnections] = useState({});
  const [editing, setEditing] = useState(null);

  const connect = (integration, credentials) => {
    setConnections((c) => ({
      ...c,
      [integration.name]: {
        credentials,
        connectedAt: new Date(),
        lastSync: new Date(),
      },
    }));
    setEditing(null);
  };

  const disconnect = (integration) => {
    if (!confirm(`Disconnect ${integration.name}? Stored credentials will be cleared.`)) return;
    setConnections((c) => {
      const next = { ...c };
      delete next[integration.name];
      return next;
    });
  };

  const sync = (integration) => {
    setConnections((c) => ({
      ...c,
      [integration.name]: { ...c[integration.name], lastSync: new Date() },
    }));
  };

  const totalConnected = Object.keys(connections).length;
  const formatRelative = (d) => {
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  };

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>

      <Card style={{ padding: 24, backgroundColor: COLORS.cream, borderColor: COLORS.copper + "40" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.copper, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: fontSerif, fontSize: 22, fontWeight: 400, color: COLORS.ink, fontStyle: "italic" }}>
              {totalConnected === 0
                ? "Nothing connected yet — pick one to start."
                : `${totalConnected} of ${INTEGRATIONS.length} connected.`}
            </div>
            <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 4 }}>
              Click Connect on any tile, paste your credentials, and we'll start syncing.
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {INTEGRATIONS.map((int) => {
          const conn = connections[int.name];
          const isConnected = !!conn;

          return (
            <Card key={int.name} style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, backgroundColor: int.color,
                  color: int.color === "#FFE01B" ? "#000" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 22, flexShrink: 0,
                }}>{int.logo}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                    <div style={{ fontFamily: fontDisplay, fontSize: 19, fontWeight: 600, color: COLORS.ink }}>{int.name}</div>
                    {isConnected ? (
                      <Pill tone="success">
                        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: COLORS.green, marginRight: 4, boxShadow: `0 0 0 3px ${COLORS.green}30` }} />
                        Connected
                      </Pill>
                    ) : (
                      <Pill tone="neutral">Not connected</Pill>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5 }}>{int.desc}</div>
                </div>
              </div>

              {isConnected ? (
                <div style={{ padding: 14, backgroundColor: COLORS.bg, borderRadius: 10, marginBottom: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Last sync</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>{formatRelative(conn.lastSync)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Connected</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>{formatRelative(conn.connectedAt)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Status</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.green, marginTop: 2 }}>● Live</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, lineHeight: 1.7 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: COLORS.ink, textTransform: "uppercase", letterSpacing: 0.4 }}>Permissions granted</div>
                    {int.perms.map((p, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Lock size={10} color={COLORS.green} /> {p}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding: 14, backgroundColor: COLORS.bg, borderRadius: 10, marginBottom: 12, fontSize: 11, color: COLORS.inkSoft, lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: COLORS.ink, textTransform: "uppercase", letterSpacing: 0.4 }}>You'll need</div>
                  {int.fields.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: COLORS.copper }}>•</span> {f.label}{f.required && <span style={{ color: COLORS.copper }}>*</span>}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                {isConnected ? (
                  <>
                    <button onClick={() => sync(int)} style={{ flex: 1, padding: "9px 14px", backgroundColor: COLORS.forest, color: COLORS.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <RefreshCw size={12} /> Sync now
                    </button>
                    <button onClick={() => setEditing(int)} style={{ padding: "9px 14px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: fontBody }}>
                      Update
                    </button>
                    <button onClick={() => disconnect(int)} style={{ padding: "9px 14px", backgroundColor: "transparent", color: COLORS.red, border: `1px solid ${COLORS.red}40`, borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: fontBody }}>
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(int)} style={{ flex: 1, padding: "10px 14px", backgroundColor: COLORS.copper, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Link2 size={13} /> Connect {int.name}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {editing && (
        <ConnectionModal
          integration={editing}
          existing={connections[editing.name]?.credentials}
          onConnect={connect}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

// ============================================================
// REPORTS PAGE
// ============================================================

const ReportsPage = () => {
  const reports = [
    { name: "Annual Financial Statement", desc: "Year-end summary matching your 2025 PDF format", icon: FileText, color: COLORS.forest },
    { name: "Donor Year-End Letters", desc: "Tax-deductible giving statements for all donors", icon: Mail, color: COLORS.copper },
    { name: "Ministry Budget vs. Actual", desc: "Per-ministry spending against budget, drillable", icon: BarChart3, color: COLORS.green },
    { name: "Campus Comparison", desc: "Side-by-side: Main · Tacoma · NY", icon: Building2, color: COLORS.amber },
    { name: "Camp & Retreat P&L", desc: "Registration revenue vs. event expenses", icon: Calendar, color: "#52796F" },
    { name: "Board Pack (PDF)", desc: "One-click monthly board meeting deck", icon: FileText, color: COLORS.ink },
  ];

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{ padding: 24 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, color: COLORS.ink, fontStyle: "italic", letterSpacing: -0.5 }}>Generate a report</div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft }}>One click. PDF, Excel, or Google Sheets — your choice.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {reports.map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={i} style={{
                padding: 18, border: `1px solid ${COLORS.border}`, borderRadius: 12,
                cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 10,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(31,58,52,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: r.color + "15", color: r.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, marginBottom: 4 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.5 }}>{r.desc}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: r.color, fontWeight: 600, marginTop: 4 }}>
                  Generate <ChevronRight size={12} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card style={{ padding: 24 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Recent exports</div>
        </div>
        {[
          { name: "Annual Financial Statement 2025", date: "Dec 31, 2025", by: "Elena Volkov", size: "1.2 MB", format: "PDF" },
          { name: "Q4 Ministry Report", date: "Dec 15, 2025", by: "Pastor Vladimir", size: "840 KB", format: "PDF" },
          { name: "Donor List for Year-End Letters", date: "Dec 10, 2025", by: "Elena Volkov", size: "2.1 MB", format: "Excel" },
          { name: "Camp & Retreat P&L", date: "Dec 1, 2025", by: "Elena Volkov", size: "320 KB", format: "PDF" },
        ].map((e, i) => (
          <div key={i} style={{
            padding: "14px 0", borderBottom: i < 3 ? `1px solid ${COLORS.borderSoft}` : "none",
            display: "flex", alignItems: "center", gap: 14
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={15} color={COLORS.copper} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{e.name}</div>
              <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{e.date} · by {e.by} · {e.size}</div>
            </div>
            <Pill tone="copper">{e.format}</Pill>
            <button style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.ink, padding: 6 }}>
              <Download size={15} />
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ============================================================
// RECEIPT UPLOAD MODAL
// ============================================================

const ReceiptModal = ({ ministry, onClose }) => {
  const [step, setStep] = useState(1);
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(21,39,36,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: COLORS.surface, borderRadius: 16, width: 520, padding: 28, boxShadow: "0 25px 80px rgba(21,39,36,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, color: COLORS.ink, fontStyle: "italic", letterSpacing: -0.3 }}>Upload receipt</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{ministry ? `For ${ministry.name}` : "Choose a ministry below"}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color={COLORS.inkSoft} />
          </button>
        </div>

        {step === 1 && (
          <>
            <div style={{
              border: `2px dashed ${COLORS.copper}`, borderRadius: 12, padding: 36, textAlign: "center",
              backgroundColor: COLORS.cream + "60", marginBottom: 16, cursor: "pointer",
            }}
              onClick={() => setStep(2)}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: COLORS.copper, color: COLORS.forestDeep, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Camera size={26} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink, marginBottom: 4 }}>Drop a photo or PDF here</div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft }}>or click to browse · jpg, png, pdf · up to 20 MB</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: 12, backgroundColor: COLORS.forest, color: COLORS.bg, border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: fontBody, fontSize: 13 }}>
                Use sample receipt →
              </button>
              <button onClick={onClose} style={{ padding: 12, backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: fontBody, fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ padding: 14, backgroundColor: COLORS.cream, borderRadius: 10, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <Sparkles size={16} color={COLORS.copper} />
              <div style={{ fontSize: 12, color: COLORS.ink, fontWeight: 500 }}>AI extracted these details automatically. Review & confirm.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Vendor", value: "Sweetwater Audio" },
                { label: "Amount", value: "$1,284.50" },
                { label: "Date", value: "December 28, 2025" },
                { label: "Ministry", value: ministry?.name || "Worship" },
                { label: "Category", value: "Equipment" },
              ].map((f, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>{f.label}</div>
                  <div style={{ padding: "10px 12px", backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, color: COLORS.ink, fontWeight: 500 }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={onClose} style={{ flex: 1, padding: 12, backgroundColor: COLORS.forest, color: COLORS.bg, border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: fontBody, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Check size={14} /> Submit & sync to QuickBooks
              </button>
              <button onClick={() => setStep(1)} style={{ padding: 12, backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: fontBody, fontSize: 13 }}>
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================

export default function IRCChurchApp() {
  const [activePage, setActivePage] = useState("dashboard");
  const [activeCampus, setActiveCampus] = useState("all");
  const [receiptModal, setReceiptModal] = useState({ open: false, ministry: null });

  // Lifted: ministries are the shared source of truth across Budget, Dashboard,
  // Ministries, and Administrators pages. Recommendations Apply, ministry
  // renames, and "+New ministry" all mutate this state and propagate everywhere.
  const [ministries, setMinistries] = useState(MINISTRIES);
  const [admins, setAdmins] = useState(ADMINISTRATORS);

  const updateMinistryBudget = (id, budget) => {
    setMinistries((prev) => prev.map((m) => (m.id === id ? { ...m, budget } : m)));
  };
  const renameMinistry = (id, name) => {
    setMinistries((prev) => prev.map((m) => (m.id === id ? { ...m, name } : m)));
  };
  const addMinistry = ({ name, budget, leader = "" }) => {
    const id = slugify(name);
    let uniqueId = id;
    let i = 2;
    while (ministries.some((m) => m.id === uniqueId)) uniqueId = `${id}-${i++}`;
    const idx = ministries.length;
    const ministry = {
      id: uniqueId, name, budget, spent: 0, leader, campus: "main",
      color: NEW_MINISTRY_PALETTE[idx % NEW_MINISTRY_PALETTE.length],
      icon: NEW_MINISTRY_ICONS[idx % NEW_MINISTRY_ICONS.length],
    };
    setMinistries((prev) => [...prev, ministry]);
    return uniqueId;
  };
  // Audit trail: every Roll/Return/Apply/Approve/Snooze appends one entry.
  // Activity page reads from this; nothing is mutated except via logActivity.
  const [activityLog, setActivityLog] = useState(INITIAL_ACTIVITY_LOG);
  const logActivity = (entry) => {
    setActivityLog((prev) => [
      {
        id: (prev[0]?.id ?? 100) + 1,
        who: "Elena Volkov",
        ministry: null,
        amount: 0,
        timestamp: new Date().toISOString(),
        ...entry,
      },
      ...prev,
    ]);
  };

  const renameAdmin = (id, name) =>
    setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)));
  const updateAdminTitle = (id, title) =>
    setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, title } : a)));
  const addAdmin = () => {
    const id = `admin-${Date.now()}`;
    setAdmins((prev) => [...prev, {
      id, name: "New Administrator", avatar: "NA",
      type: "function", campus: "Main", title: "Click title to edit",
      bio: "Click any name to rename.",
    }]);
  };

  const titles = {
    dashboard: { t: "Dashboard", s: "IRC Church · Fiscal Year 2025 overview" },
    donations: { t: "Donations", s: "All giving · all sources · all campuses" },
    expenses: { t: "Expenses", s: "Where the money goes" },
    budget: { t: "Budget", s: "Plan, monitor, stress-test — and stay on top of it" },
    ministries: { t: "Ministries", s: "Budget vs. actual for every department" },
    campuses: { t: "Campuses", s: "Main · Tacoma · New York" },
    administrators: { t: "Administrators", s: "Who oversees what — budgets that update as you reassign" },
    events: { t: "Events & Camps", s: "23 events · 3,901 attendees" },
    receipts: { t: "Receipts", s: "Snap, classify, sync — automatically" },
    activity: { t: "Activity", s: "Audit trail · every roll, return, budget change, and alert" },
    people: { t: "People & Roles", s: "Manage who can see and do what" },
    integrations: { t: "Integrations", s: "Stripe · Square · QuickBooks · and more" },
    reports: { t: "Reports", s: "Generate any report in one click" },
  };

  const content = useMemo(() => {
    const open = (m) => setReceiptModal({ open: true, ministry: m });
    switch (activePage) {
      case "dashboard": return <DashboardPage ministries={ministries} />;
      case "donations": return <DonationsPage />;
      case "expenses": return <ExpensesPage />;
      case "budget": return <BudgetPage ministries={ministries} updateMinistryBudget={updateMinistryBudget} logActivity={logActivity} />;
      case "ministries": return <MinistriesPage openReceiptModal={open} ministries={ministries} addMinistry={addMinistry} />;
      case "campuses": return <CampusesPage />;
      case "administrators": return <AdministratorsPage
        ministries={ministries} admins={admins}
        renameMinistry={renameMinistry} updateMinistryBudget={updateMinistryBudget} addMinistry={addMinistry}
        renameAdmin={renameAdmin} updateAdminTitle={updateAdminTitle} addAdmin={addAdmin}
      />;
      case "events": return <EventsPage />;
      case "receipts": return <ReceiptsPage openReceiptModal={open} />;
      case "activity": return <ActivityPage activityLog={activityLog} />;
      case "people": return <PeoplePage />;
      case "integrations": return <IntegrationsPage />;
      case "reports": return <ReportsPage />;
      default: return <DashboardPage ministries={ministries} />;
    }
  }, [activePage, ministries, admins, activityLog]);

  return (
    <div style={{
      display: "flex", minHeight: "100vh", backgroundColor: COLORS.bg,
      fontFamily: fontBody, color: COLORS.ink,
    }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Manrope:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap"
        rel="stylesheet"
      />
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: ${COLORS.copper}; }
      `}</style>

      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main style={{ flex: 1, minWidth: 0 }}>
        <TopBar
          activeCampus={activeCampus}
          setActiveCampus={setActiveCampus}
          pageTitle={titles[activePage].t}
          pageSubtitle={titles[activePage].s}
        />
        {content}
      </main>

      {receiptModal.open && (
        <ReceiptModal ministry={receiptModal.ministry} onClose={() => setReceiptModal({ open: false, ministry: null })} />
      )}
    </div>
  );
}
