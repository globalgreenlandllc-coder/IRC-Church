import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LayoutDashboard, HandHeart, Receipt, Users, Building2, Calendar,
  FileText, Plug, Settings, Search, Bell, ChevronDown, Plus, Upload,
  CheckCircle2, AlertCircle, Clock, TrendingUp, TrendingDown, DollarSign,
  Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Filter, Download,
  CreditCard, Banknote, Shield, UserPlus, Mail, MoreVertical, Eye,
  Edit3, Trash2, ChevronRight, Camera, Paperclip, X, Check, Lock,
  Sparkles, Activity, Church, MapPin, BarChart3, PieChart as PieIcon,
  RefreshCw, Link2, ExternalLink, Globe, Target, Gauge, AlertTriangle, Zap,
  Flame, BellRing, Info, Repeat, CalendarDays, ChevronLeft
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, AreaChart, Area, LineChart, Line, CartesianGrid, Legend
} from "recharts";
import { RULES as ALERT_RULES, evaluate as evaluateAlerts, buildContext as buildAlertContext, SEVERITY, DEFAULT_CONFIG as ALERT_DEFAULT_CONFIG } from "./lib/alerts.js";

// ============================================================
// DESIGN TOKENS
// ============================================================
// Two themes — same keys, swap-in on demand. Brand accents (lime, copper)
// stay constant; the canvas, surfaces, ink, and status colors shift.
const THEME_DARK = {
  bg: "#0A0A0A",
  surface: "#141414",
  ink: "#FAFAFA",
  inkSoft: "#A0A0A0",
  forest: "#D4FF00",      // lime — always used as a BACKGROUND color (chips, buttons, accents)
  forestText: "#D4FF00",  // accent for TEXT — lime works on dark surfaces
  forestDeep: "#000000",  // dark accent / sidebar / "dark island" cards (constant)
  copper: "#FF5A1F",
  copperSoft: "#FFB088",
  cream: "#1F1F1F",       // tinted elevated surface
  border: "#2A2A2A",
  borderSoft: "#1A1A1A",
  green: "#4ADE80",
  red: "#FF3B8A",
  amber: "#FBBF24",
};

const THEME_LIGHT = {
  bg: "#FBF7F0",          // warm cream canvas
  surface: "#FFFFFF",     // pure white cards
  ink: "#0A0A0A",         // near-black text
  inkSoft: "#5C5C5C",     // medium gray
  forest: "#D4FF00",      // lime stays as bg
  forestText: "#0A0A0A",  // pure black for text in light mode — lime is invisible on cream, deep green is brand-mismatched
  forestDeep: "#000000",  // stays — sidebar + dark islands always dark
  copper: "#FF5A1F",      // orange stays
  copperSoft: "#FFB088",
  cream: "#F5F1E9",       // slightly darker cream for tinted/elevated surfaces
  border: "rgba(0,0,0,0.10)",
  borderSoft: "rgba(0,0,0,0.05)",
  green: "#3FA961",       // deeper, readable on cream
  red: "#E11D74",         // deeper pink
  amber: "#E08826",       // deeper amber
};

let _activeTheme = THEME_DARK;
const setActiveTheme = (mode) => {
  _activeTheme = mode === "light" ? THEME_LIGHT : THEME_DARK;
};

// Proxy that reads from _activeTheme on every property access.
// Components don't need to subscribe — when React re-renders after a
// theme change, every inline style.{}={ color: COLORS.ink } reads fresh.
const COLORS = new Proxy({}, {
  get: (_, key) => _activeTheme[key],
});

// Constant text colors for high-contrast use on bright brand backgrounds.
// These are theme-independent — picked from accessibility math (WCAG AA+).
const INVERSE_INK = "#FAFAFA";  // for text on always-dark surfaces (sidebar, dark hero cards)
const ON_LIME    = "#0A0A0A";  // text on lime (#D4FF00 vs #0A0A0A = 16.5:1)
const ON_COPPER  = "#FFFFFF";  // text on copper/orange (#FF5A1F vs #FFFFFF = 4.75:1)
const ON_PINK    = "#FFFFFF";  // text on pink (#FF3B8A vs #FFFFFF = 3.91:1, large/bold)
const ON_AMBER   = "#0A0A0A";  // text on amber/yellow (#FBBF24 vs #0A0A0A = 13:1)
const ON_GREEN   = "#0A0A0A";  // text on green (#4ADE80 vs #0A0A0A = 11.4:1)

// Pick black or white text based on a background color's luminance.
// Used for campus badges, ministry chips, and any bright-color background.
const textOnBg = (hex) => {
  if (!hex || hex.length < 7) return "#FFFFFF";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.55 ? "#0A0A0A" : "#FFFFFF";
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
  { id: "worship", name: "Worship", spent: 17625.73, budget: 22000, leader: "Anna K.", campusId: "bellevue", color: "#D4FF00", icon: "♪" },
  { id: "technical", name: "Technical", spent: 33531.65, budget: 38000, leader: "Mark D.", campusId: "bellevue", color: "#FF5A1F", icon: "⚙" },
  { id: "video", name: "Video", spent: 5547.85, budget: 8000, leader: "Sergei P.", campusId: "bellevue", color: "#FF3B8A", icon: "▶" },
  { id: "light-screen", name: "Light & Screen", spent: 2019.90, budget: 3500, leader: "Tom B.", campusId: "bellevue", color: "#FBBF24", icon: "✦" },
  { id: "media", name: "Media", spent: 6590.64, budget: 9000, leader: "Lana V.", campusId: "bellevue", color: "#A78BFA", icon: "◈" },
  { id: "kids", name: "Kids Ministry", spent: 16850.34, budget: 20000, leader: "Maria R.", campusId: "bellevue", color: "#22D3EE", icon: "✧" },
  { id: "teens", name: "Teens", spent: 5615.34, budget: 8000, leader: "David O.", campusId: "bellevue", color: "#F472B6", icon: "♦" },
  { id: "youth", name: "Youth", spent: 9161.67, budget: 12000, leader: "Eli T.", campusId: "bellevue", color: "#4ADE80", icon: "▲" },
  { id: "single-mom", name: "Single Moms", spent: 6073.25, budget: 8000, leader: "Olga S.", campusId: "bellevue", color: "#FB923C", icon: "♥" },
  { id: "services", name: "Sun/Fri Services & Care", spent: 57334.39, budget: 65000, leader: "Pastor Vlad", campusId: "bellevue", color: "#D4FF00", icon: "✟" },
  { id: "merch", name: "Merch", spent: 13178.36, budget: 14000, leader: "Sasha L.", campusId: "bellevue", color: "#FF3B8A", icon: "◇" },
  { id: "deaf", name: "Deaf & Hard of Hearing", spent: 3082.89, budget: 5000, leader: "Ruth M.", campusId: "everett", color: "#60A5FA", icon: "✋" },
  { id: "target", name: "Target Outreach", spent: 11518.67, budget: 15000, leader: "Anna K.", campusId: "everett", color: "#FF5A1F", icon: "◎" },
  { id: "legacy", name: "Legacy", spent: 2124.07, budget: 4000, leader: "John W.", campusId: "tacoma", color: "#FACC15", icon: "✚" },
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
  { name: "Anna Kovalenko", email: "anna@ircchurch.org", role: "Worship Leader", access: "Ministry Leader", avatar: "AK", lastActive: "2h ago", campus: "Bellevue" },
  { name: "Maria Rojas", email: "maria@ircchurch.org", role: "Kids Director", access: "Ministry Leader", avatar: "MR", lastActive: "Yesterday", campus: "Bellevue" },
  { name: "Sergei Popov", email: "sergei@ircchurch.org", role: "Video Lead", access: "Ministry Leader", avatar: "SP", lastActive: "3d ago", campus: "Bellevue" },
  { name: "Elena Volkov", email: "elena@ircchurch.org", role: "Treasurer", access: "Finance Admin", avatar: "EV", lastActive: "Active now", campus: "All" },
  { name: "James Chen", email: "james@ircchurch.org", role: "Brooklyn Campus Pastor", access: "Campus Admin", avatar: "JC", lastActive: "5h ago", campus: "Brooklyn" },
  { name: "Olga Smirnova", email: "olga@ircchurch.org", role: "Single Moms Lead", access: "Ministry Leader", avatar: "OS", lastActive: "1d ago", campus: "Bellevue" },
  { name: "Marcus Tate", email: "marcus@ircchurch.org", role: "Tacoma Campus Pastor", access: "Campus Admin", avatar: "MT", lastActive: "30m ago", campus: "Tacoma" },
];

// Three-tier role system. Each user has one role + a scope (campus / ministry).
// HQ admins see everything; campus admins see their campus; ministry leaders see only their ministry.
const ROLE_HQ = "hq_admin";
const ROLE_CAMPUS = "campus_admin";
const ROLE_MINISTRY = "ministry_leader";

const ROLE_LABELS = {
  [ROLE_HQ]: "HQ Admin",
  [ROLE_CAMPUS]: "Campus Admin",
  [ROLE_MINISTRY]: "Ministry Leader",
};

// Demo identities — switch between them via the role picker in the topbar.
const USERS = [
  { id: "u-vlad",   name: "Pastor Vladimir",  avatar: "PV", role: ROLE_HQ,       campusId: null,        ministryId: null,         title: "Senior Pastor · HQ" },
  { id: "u-elena",  name: "Elena Volkov",     avatar: "EV", role: ROLE_HQ,       campusId: null,        ministryId: null,         title: "Treasurer · HQ Finance" },
  { id: "u-marcus", name: "Marcus Tate",      avatar: "MT", role: ROLE_CAMPUS,   campusId: "tacoma",    ministryId: null,         title: "Tacoma Campus Pastor" },
  { id: "u-james",  name: "James Chen",       avatar: "JC", role: ROLE_CAMPUS,   campusId: "brooklyn",  ministryId: null,         title: "Brooklyn Campus Pastor" },
  { id: "u-anna",   name: "Anna Kovalenko",   avatar: "AK", role: ROLE_MINISTRY, campusId: "bellevue",  ministryId: "worship",    title: "Worship Leader · Bellevue" },
  { id: "u-olga",   name: "Olga Smirnova",    avatar: "OS", role: ROLE_MINISTRY, campusId: "bellevue",  ministryId: "single-mom", title: "Single Moms Lead · Bellevue" },
];

// Campuses — single source of truth. Lifted to IRCChurchApp state.
// Bellevue is HQ; Everett, Tacoma, Brooklyn are satellites.
const INITIAL_CAMPUSES = [
  { id: "bellevue", name: "Bellevue", address: "Bellevue, WA", isHQ: true,  short: "B", color: "#D4FF00", donations: 1500000.00, expenses: 1300000.00, members: 950, ministries: 11 },
  { id: "everett",  name: "Everett",  address: "Everett, WA",  isHQ: false, short: "E", color: "#FF5A1F", donations: 314440.00,  expenses: 306278.00,  members: 290, ministries: 5  },
  { id: "tacoma",   name: "Tacoma",   address: "Tacoma, WA",   isHQ: false, short: "T", color: "#FF3B8A", donations: 24262.53,   expenses: 30005.99,   members: 180, ministries: 4  },
  { id: "brooklyn", name: "Brooklyn", address: "Brooklyn, NY", isHQ: false, short: "K", color: "#A78BFA", donations: 44000.00,   expenses: 21486.89,   members: 95,  ministries: 3  },
];

const ADMINISTRATORS = [
  { id: "vlad", name: "Pastor Vladimir", avatar: "PV", type: "executive", campus: "All", title: "Senior Pastor", bio: "Vision, preaching, and pastoral care across all campuses." },
  { id: "anna", name: "Anna Kovalenko", avatar: "AK", type: "function", campus: "Bellevue", title: "Creative Arts Director", bio: "Oversees worship, sound, video, lighting, and media production." },
  { id: "maria", name: "Maria Rojas", avatar: "MR", type: "function", campus: "Bellevue", title: "Family & Next Gen", bio: "Children, teens, and young adults — full discipleship pipeline." },
  { id: "olga", name: "Olga Smirnova", avatar: "OS", type: "function", campus: "Bellevue", title: "Care & Outreach", bio: "Single moms, deaf community, and target outreach initiatives." },
  { id: "elena", name: "Elena Volkov", avatar: "EV", type: "function", campus: "All", title: "Finance & Operations", bio: "Books, payroll, vendor relations, and the merch table." },
  { id: "marcus", name: "Marcus Tate", avatar: "MT", type: "campus", campus: "Tacoma", title: "Tacoma Campus Pastor", bio: "Launching Tacoma — building local ministry infrastructure." },
  { id: "james", name: "James Chen", avatar: "JC", type: "campus", campus: "Brooklyn", title: "Brooklyn Campus Pastor", bio: "Stewarding the Brooklyn launch — gathering, preaching, and care." },
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

// ============================================================
// SMART BUDGET — annual mandatory + extras per campus, paid events
// ============================================================

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Each campus has a 12-month plan: mandatory (must-pay) + extras (discretionary).
// Mandatory mirrors recurring overhead; extras = ministry & outreach budget.
const ANNUAL_BUDGETS = {
  bellevue: {
    mandatory: [78000, 78000, 78000, 78000, 78000, 79500, 79500, 79500, 81000, 81000, 81000, 83000],
    extras:    [12500, 11000, 13500, 12000, 14000, 18000, 17500, 16000, 14500, 15500, 17000, 24000],
    breakdown: {
      mandatory: [
        { label: "Rent & utilities", amount: 24000, color: "#FF5A1F" },
        { label: "Payroll",          amount: 42000, color: "#D4FF00" },
        { label: "Insurance + ops",  amount: 5800,  color: "#A78BFA" },
        { label: "Mortgage",         amount: 7800,  color: "#22D3EE" },
      ],
      extras: [
        { label: "Outreach campaigns",   amount: 5500, color: "#FF3B8A" },
        { label: "Kids extras",          amount: 3200, color: "#22D3EE" },
        { label: "Building improvements",amount: 4000, color: "#FBBF24" },
        { label: "Blessings & care",     amount: 1300, color: "#FF5A1F" },
      ],
    },
  },
  everett: {
    mandatory: [8000, 8000, 8000, 8000, 8000, 8200, 8200, 8200, 8400, 8400, 8400, 8600],
    extras:    [1300, 1300, 1500, 1400, 1300, 2200, 2400, 2400, 1800, 2000, 2200, 3000],
    breakdown: {
      mandatory: [
        { label: "Rent",        amount: 4800, color: "#FF5A1F" },
        { label: "Utilities",   amount: 1200, color: "#A78BFA" },
        { label: "Local staff", amount: 2000, color: "#D4FF00" },
      ],
      extras: [
        { label: "Outreach",     amount: 800, color: "#FF3B8A" },
        { label: "Local events", amount: 500, color: "#FBBF24" },
      ],
    },
  },
  tacoma: {
    mandatory: [4200, 4200, 4200, 4200, 4200, 4200, 4200, 4200, 4400, 4400, 4400, 4400],
    extras:    [800,  800,  900,  800,  900,  1400, 1500, 1500, 1100, 1100, 1300, 1900],
    breakdown: {
      mandatory: [
        { label: "Rent",      amount: 4200, color: "#FF5A1F" },
      ],
      extras: [
        { label: "Outreach",   amount: 600, color: "#FF3B8A" },
        { label: "Youth costs",amount: 300, color: "#22D3EE" },
      ],
    },
  },
  brooklyn: {
    mandatory: [5800, 5800, 5800, 5800, 5800, 5800, 5800, 5800, 6000, 6000, 6000, 6000],
    extras:    [900,  900,  1000, 900,  1000, 1600, 1700, 1700, 1200, 1200, 1400, 2100],
    breakdown: {
      mandatory: [
        { label: "Rent", amount: 5800, color: "#FF5A1F" },
      ],
      extras: [
        { label: "Outreach", amount: 700, color: "#FF3B8A" },
        { label: "Events",   amount: 300, color: "#FBBF24" },
      ],
    },
  },
};

// Donations per month per campus — actuals through last month, projections after.
// Demo "today" = May 11, 2026 → Jan-Apr are actuals; May-onward are projected.
const MONTHLY_DONATIONS = {
  bellevue: [122000, 118000, 134000, 142000, 128000, 138000, 134000, 132000, 144000, 148000, 142000, 215000],
  everett:  [11500,  10800,  11900,  12500,  12000,  13000,  12500,  12200,  13500,  13800,  13500,  20500],
  tacoma:   [5400,   5100,   5700,   6000,   5800,   6300,   6100,   5900,   6500,   6700,   6500,   9800],
  brooklyn: [7800,   7400,   8200,   8600,   8400,   9000,   8800,   8600,   9400,   9700,   9400,  14200],
};

// Demo "now" month index (May = 4, zero-indexed).
const CURRENT_MONTH_IDX = 4;

// Paid events with break-even math.
const PAID_EVENTS = [
  { id: "youth-camp",      campusId: "bellevue", name: "Youth Summer Camp",      date: "Jul 15–22, 2026", budget: 14500, ticketPrice: 250, expectedAttendees: 60, paidRegistrations: 42, scholarships: 6, notes: "Sliding-scale for 6 students" },
  { id: "vbs",             campusId: "bellevue", name: "Vacation Bible School",  date: "Jun 22, 2026",    budget: 4000,  ticketPrice: 40,  expectedAttendees: 85, paidRegistrations: 72, scholarships: 4, notes: "Strong demand" },
  { id: "mens-retreat",    campusId: "bellevue", name: "Men's Retreat",          date: "Sep 12–13, 2026", budget: 8500,  ticketPrice: 145, expectedAttendees: 70, paidRegistrations: 38, scholarships: 0, notes: "Speakers locked" },
  { id: "womens-conf",     campusId: "everett",  name: "Women's Conference",     date: "Oct 17, 2026",    budget: 2800,  ticketPrice: 45,  expectedAttendees: 75, paidRegistrations: 52, scholarships: 3, notes: "" },
  { id: "kids-fall-party", campusId: "brooklyn", name: "Brooklyn Kids Fall Party", date: "Oct 25, 2026",  budget: 1800,  ticketPrice: 25,  expectedAttendees: 50, paidRegistrations: 11, scholarships: 2, notes: "Slow ticket sales" },
];

// ----- COVERAGE COMPUTATIONS -----

// For a given campus + month index, return the smart coverage signal.
function getMonthCoverage(campusId, monthIdx) {
  const b = ANNUAL_BUDGETS[campusId];
  const d = MONTHLY_DONATIONS[campusId];
  if (!b || !d) return null;
  const mandatory = b.mandatory[monthIdx] || 0;
  const extras = b.extras[monthIdx] || 0;
  const donations = d[monthIdx] || 0;
  const total = mandatory + extras;
  const surplus = donations - total;       // positive = fully covered + buffer
  const deficit = mandatory - donations;   // positive = mandatory at risk
  const extrasAvailable = Math.max(0, donations - mandatory);
  const extrasShortfall = Math.max(0, extras - extrasAvailable);
  const isActual = monthIdx < CURRENT_MONTH_IDX;
  // Status levels: good = fully covered with buffer; ok = covered exactly;
  // warn = mandatory ok but extras short; danger = mandatory at risk.
  let level, status;
  if (donations < mandatory) {
    level = "danger"; status = isActual ? "Mandatory missed" : "Mandatory at risk";
  } else if (extrasAvailable < extras) {
    level = "warn"; status = "Partial extras";
  } else {
    level = "good"; status = "Fully covered";
  }
  return { mandatory, extras, donations, total, surplus, deficit, extrasAvailable, extrasShortfall, level, status, isActual };
}

// Per-event break-even math.
function getEventCoverage(event) {
  const revenueCurrent = event.paidRegistrations * event.ticketPrice;
  const revenueMax = (event.expectedAttendees - event.scholarships) * event.ticketPrice;
  const breakEvenAttendees = Math.ceil(event.budget / event.ticketPrice);
  const needed = Math.max(0, breakEvenAttendees - event.paidRegistrations);
  const salesPct = event.paidRegistrations / event.expectedAttendees;
  const netCurrent = revenueCurrent - event.budget;
  const netMax = revenueMax - event.budget;
  let level, status;
  if (netMax < 0) {
    level = "danger"; status = "Can't break even at current capacity";
  } else if (netCurrent < 0 && salesPct < 0.7) {
    level = "danger"; status = "At risk";
  } else if (netCurrent < 0) {
    level = "warn"; status = "On track to break even";
  } else {
    level = "good"; status = "Breaking even";
  }
  return { revenueCurrent, revenueMax, breakEvenAttendees, needed, salesPct, netCurrent, netMax, level, status };
}

// Aggregate full-year coverage for a campus.
function getYearCoverage(campusId) {
  const months = MONTH_LABELS.map((_, i) => ({ label: MONTH_LABELS[i], idx: i, ...getMonthCoverage(campusId, i) }));
  const totalMandatory = months.reduce((s, m) => s + (m?.mandatory || 0), 0);
  const totalExtras = months.reduce((s, m) => s + (m?.extras || 0), 0);
  const totalDonations = months.reduce((s, m) => s + (m?.donations || 0), 0);
  const monthsCovered = months.filter((m) => m?.level === "good").length;
  const monthsAtRisk = months.filter((m) => m?.level === "danger").length;
  return { months, totalMandatory, totalExtras, totalDonations, monthsCovered, monthsAtRisk };
}

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

// Recurring payments — fire on a fixed day every month, auto-roll forward.
const INITIAL_RECURRING_PAYMENTS = [
  { id: "rent-bellevue",  name: "Bellevue Rent",                amount: 24500, dayOfMonth: 1,  category: "facilities", note: "HQ campus lease",       campusId: "bellevue" },
  { id: "rent-everett",   name: "Everett Rent",                 amount: 4800,  dayOfMonth: 1,  category: "facilities", note: null,                    campusId: "everett" },
  { id: "rent-tacoma",    name: "Tacoma Rent",                  amount: 4200,  dayOfMonth: 1,  category: "facilities", note: null,                    campusId: "tacoma" },
  { id: "rent-brooklyn",  name: "Brooklyn Rent",                amount: 5800,  dayOfMonth: 1,  category: "facilities", note: null,                    campusId: "brooklyn" },
  { id: "missions",       name: "Monthly Missions Support",     amount: 2500,  dayOfMonth: 1,  category: "ministry",   note: "Partner ministries",    campusId: "bellevue" },
  { id: "insurance",      name: "Insurance Premium",            amount: 2840,  dayOfMonth: 5,  category: "facilities", note: "Org-wide policy",       campusId: "bellevue" },
  { id: "cleaning",       name: "Cleaning Service",             amount: 1800,  dayOfMonth: 5,  category: "facilities", note: null,                    campusId: "bellevue" },
  { id: "utilities",      name: "Utilities (Electric + Gas)",   amount: 4200,  dayOfMonth: 8,  category: "facilities", note: "HQ campus",             campusId: "bellevue" },
  { id: "internet",       name: "Internet & Phone",             amount: 480,   dayOfMonth: 10, category: "operations", note: "Org-wide",              campusId: "bellevue" },
  { id: "software",       name: "Software Subscriptions",       amount: 320,   dayOfMonth: 12, category: "operations", note: "PCO, Canva, Mailchimp", campusId: "bellevue" },
  { id: "payroll-mid",    name: "Mid-month Payroll",            amount: 17500, dayOfMonth: 15, category: "people",     note: "8 staff (org-wide)",    campusId: "bellevue" },
  { id: "equipment",      name: "Equipment Lease",              amount: 850,   dayOfMonth: 15, category: "operations", note: "Audio booth + camera",  campusId: "bellevue" },
  { id: "office-supplies",name: "Office Supplies",              amount: 350,   dayOfMonth: 20, category: "operations", note: null,                    campusId: "bellevue" },
  { id: "bank-fees",      name: "Bank Fees",                    amount: 220,   dayOfMonth: 28, category: "operations", note: null,                    campusId: "bellevue" },
  { id: "payroll-end",    name: "End-month Payroll",            amount: 17500, dayOfMonth: 30, category: "people",     note: "8 staff (org-wide)",    campusId: "bellevue" },
];

// One-time scheduled events with full date.
const SCHEDULED_EVENTS = [
  { id: "ev-mom",          name: "Mother's Day Service",       date: "2026-05-10", amount: 800,   note: "Flowers + program" },
  { id: "ev-mens-bf",      name: "Men's Breakfast",            date: "2026-05-16", amount: 600,   note: null },
  { id: "ev-memorial",     name: "Memorial Day Outreach",      date: "2026-05-25", amount: 1200,  note: null },
  { id: "ev-youth-night",  name: "Youth Worship Night",        date: "2026-05-31", amount: 820,   note: null },
  { id: "ev-grad",         name: "Graduation Service",         date: "2026-06-07", amount: 1100,  note: null },
  { id: "ev-camp-deposit", name: "Summer Camp Deposit",        date: "2026-06-15", amount: 5000,  note: null },
  { id: "ev-fathers",      name: "Father's Day Lunch",         date: "2026-06-21", amount: 1500,  note: null },
  { id: "ev-july4",        name: "Independence Day Picnic",    date: "2026-07-04", amount: 1800,  note: null },
  { id: "ev-summer-camp",  name: "Summer Youth Camp",          date: "2026-07-13", amount: 18000, note: "5-day camp · 50 youth" },
  { id: "ev-vbs",          name: "Kids VBS Week",              date: "2026-07-20", amount: 4900,  note: "Vacation Bible School" },
  { id: "ev-school-drive", name: "Back-to-School Drive",       date: "2026-08-15", amount: 2200,  note: "Backpacks + supplies" },
  { id: "ev-mens-retreat", name: "Men's Retreat",              date: "2026-08-22", amount: 8500,  note: "Weekend retreat" },
  { id: "ev-fall-kickoff", name: "Fall Kickoff",               date: "2026-09-06", amount: 2400,  note: null },
  { id: "ev-marriage",     name: "Marriage Conference",        date: "2026-09-19", amount: 3200,  note: null },
  { id: "ev-womens-conf",  name: "Women's Conference",         date: "2026-10-10", amount: 4800,  note: null },
  { id: "ev-fall-fest",    name: "Fall Festival",              date: "2026-10-31", amount: 2800,  note: null },
  { id: "ev-thanksgiving", name: "Thanksgiving Outreach",      date: "2026-11-22", amount: 1900,  note: "200 meals" },
  { id: "ev-banquet",      name: "Year-End Banquet",           date: "2026-12-13", amount: 6400,  note: null },
  { id: "ev-christmas",    name: "Christmas Service Production",date: "2026-12-24",amount: 7500,  note: "Live band, lights, video" },
];

const CALENDAR_CATEGORIES = {
  facilities: { label: "Facilities",       color: "#FF5A1F" },  // orange
  people:     { label: "People & Payroll", color: "#D4FF00" },  // lime
  operations: { label: "Operations",       color: "#A78BFA" },  // purple
  ministry:   { label: "Ministry",         color: "#FF3B8A" },  // pink
  event:      { label: "Event",            color: "#FBBF24" },  // amber
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
    forest: { bg: COLORS.forest, color: ON_LIME },
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

// Each sidebar item declares which roles see it. Undefined = all roles.
const SIDEBAR_ITEMS = [
  { id: "dashboard",     label: "Dashboard",       icon: LayoutDashboard, roles: [ROLE_HQ, ROLE_CAMPUS, ROLE_MINISTRY] },
  { id: "donations",     label: "Donations",       icon: HandHeart,       roles: [ROLE_HQ, ROLE_CAMPUS] },
  { id: "expenses",      label: "Expenses",        icon: Receipt,         roles: [ROLE_HQ, ROLE_CAMPUS] },
  { id: "budget",        label: "Budget",          icon: Target,          roles: [ROLE_HQ, ROLE_CAMPUS, ROLE_MINISTRY] },
  { id: "smart",         label: "Smart Budget",    icon: Gauge,           roles: [ROLE_HQ, ROLE_CAMPUS, ROLE_MINISTRY] },
  { id: "calendar",      label: "Calendar",        icon: CalendarDays,    roles: [ROLE_HQ, ROLE_CAMPUS] },
  { id: "ministries",    label: "Ministries",      icon: Users,           roles: [ROLE_HQ, ROLE_CAMPUS] },
  { id: "campuses",      label: "Campuses",        icon: Building2,       roles: [ROLE_HQ] },
  { id: "administrators",label: "Administrators",  icon: UserPlus,        roles: [ROLE_HQ] },
  { id: "events",        label: "Events & Camps",  icon: Calendar,        roles: [ROLE_HQ, ROLE_CAMPUS] },
  { id: "receipts",      label: "Receipts",        icon: Paperclip,       roles: [ROLE_HQ, ROLE_CAMPUS, ROLE_MINISTRY] },
  { id: "activity",      label: "Activity",        icon: Activity,        roles: [ROLE_HQ, ROLE_CAMPUS] },
  { id: "people",        label: "People & Roles",  icon: Shield,          roles: [ROLE_HQ, ROLE_CAMPUS, ROLE_MINISTRY] },
  { id: "integrations",  label: "Integrations",    icon: Plug,            roles: [ROLE_HQ] },
  { id: "reports",       label: "Reports",         icon: FileText,        roles: [ROLE_HQ, ROLE_CAMPUS] },
  { id: "settings",      label: "Settings",        icon: Settings,        roles: [ROLE_HQ, ROLE_CAMPUS, ROLE_MINISTRY] },
];

// Resolve which sidebar items a given role can see.
const sidebarItemsForRole = (role) =>
  SIDEBAR_ITEMS.filter((it) => !it.roles || it.roles.includes(role));

const Sidebar = ({ activePage, setActivePage, currentUser }) => {
  const items = sidebarItemsForRole(currentUser?.role || ROLE_HQ);

  return (
    <aside style={{
      width: 248, backgroundColor: COLORS.forestDeep, color: INVERSE_INK,
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
            <div style={{ fontSize: 13, fontWeight: 600, color: INVERSE_INK }}>Elena Volkov</div>
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

const TopBar = ({ activeCampus, setActiveCampus, pageTitle, pageSubtitle, campuses: campusesData, currentUser, setCurrentUser, users }) => {
  const [campusOpen, setCampusOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const isHQ = currentUser?.role === ROLE_HQ;
  const campuses = [
    { id: "all", name: "All Campuses", desc: "Consolidated view" },
    ...campusesData.map((c) => ({
      id: c.id,
      name: c.isHQ ? `${c.name} · HQ` : c.name,
      desc: `${c.address.split(",").pop().trim()} · ${c.isHQ ? "Primary" : "Campus"}`,
    })),
  ];
  const current = campuses.find((c) => c.id === activeCampus) || campuses[0];

  const roleColor = currentUser?.role === ROLE_HQ ? COLORS.forest : currentUser?.role === ROLE_CAMPUS ? COLORS.copper : COLORS.amber;

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

        {/* ROLE SWITCHER (demo affordance) */}
        {users && currentUser && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setUserOpen(!userOpen)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 12px",
                backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`,
                borderRadius: 10, cursor: "pointer", fontFamily: fontBody, fontSize: 12, fontWeight: 600
              }}
            >
              <span style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: roleColor, color: textOnBg(roleColor), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, fontFamily: fontDisplay }}>
                {currentUser.avatar}
              </span>
              <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1 }}>
                <span>{currentUser.name}</span>
                <span style={{ fontSize: 9, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </span>
              <ChevronDown size={12} />
            </button>
            {userOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0, width: 280, zIndex: 30,
                backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12,
                padding: 6, boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
              }}>
                <div style={{ padding: "8px 12px", fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
                  View as · demo
                </div>
                {users.map((u) => {
                  const active = u.id === currentUser.id;
                  const c = u.role === ROLE_HQ ? COLORS.forest : u.role === ROLE_CAMPUS ? COLORS.copper : COLORS.amber;
                  return (
                    <button
                      key={u.id}
                      onClick={() => { setCurrentUser(u); setUserOpen(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                        padding: "8px 10px", border: "none", borderRadius: 8, cursor: "pointer",
                        backgroundColor: active ? COLORS.cream : "transparent", fontFamily: fontBody,
                      }}
                    >
                      <span style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: c, color: textOnBg(c), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, fontFamily: fontDisplay, flexShrink: 0 }}>
                        {u.avatar}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.ink }}>{u.name}</div>
                        <div style={{ fontSize: 10, color: COLORS.inkSoft }}>{u.title}</div>
                      </div>
                      {active && <Check size={13} color={COLORS.forestText} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ position: "relative" }}>
          <button
            onClick={() => isHQ && setCampusOpen(!campusOpen)}
            disabled={!isHQ}
            title={isHQ ? "" : "Campus is locked to your assignment"}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
              backgroundColor: COLORS.forest, color: ON_LIME, border: "none",
              borderRadius: 10, cursor: isHQ ? "pointer" : "not-allowed", fontFamily: fontBody, fontSize: 13, fontWeight: 600,
              opacity: isHQ ? 1 : 0.7,
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

const BudgetHealthCard = ({ ministries, operatingOverheadMo, survivalFloorMo }) => {
  const currentDonations = MONTHLY_TREND[MONTHLY_TREND.length - 1].donations;
  const currentExpenses = MONTHLY_TREND[MONTHLY_TREND.length - 1].expenses;
  const ministriesBudget = ministries.reduce((s, m) => s + m.budget, 0);
  const operatingBudget = (operatingOverheadMo * 12) + ministriesBudget + EVENTS_BUDGET_YR + BLESSINGS_BUDGET_YR;
  const monthlyBudget = operatingBudget / 12;
  const cashOnHand = BALANCE_END;

  const overheadCoverage = currentDonations / operatingOverheadMo;
  const surplusOverOverhead = currentDonations - operatingOverheadMo;
  const runwayMonths = cashOnHand / survivalFloorMo;

  const donationsOK = currentDonations >= monthlyBudget * 0.85;
  const overheadOK = currentDonations >= operatingOverheadMo;
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
      sub: `${fmtShort(operatingOverheadMo)}/mo target`,
      ok: overheadOK,
    },
    {
      label: "Cash runway",
      value: `${runwayMonths.toFixed(1)} mo`,
      sub: `On essentials only (${fmtShort(survivalFloorMo)}/mo)`,
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

const DashboardPage = ({ ministries, operatingOverheadMo, survivalFloorMo, activeCampus, campuses }) => {
  const currentCampus = campuses?.find((c) => c.id === activeCampus);
  const kpis = [
    { label: "Total Donations '25", value: fmt(TOTAL_DONATIONS), trend: "+12.4%", icon: HandHeart, tone: "forest" },
    { label: "Total Expenses '25", value: fmt(TOTAL_EXPENSES), trend: "88.05% of donations", icon: Receipt, tone: "copper" },
    { label: "Net Savings", value: fmt(TOTAL_SAVINGS), trend: "11.95% retained", icon: PiggyBank, tone: "green" },
    { label: "Year-End Balance", value: fmt(BALANCE_END), trend: `+${fmt(BALANCE_END - BALANCE_START)} YoY`, icon: Wallet, tone: "ink" },
  ];

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 24 }}>
      {currentCampus && (
        <Card style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, borderColor: currentCampus.color + "60", background: currentCampus.color + "10" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: currentCampus.color, color: textOnBg(currentCampus.color), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisplay, fontWeight: 700, fontSize: 13 }}>
            {currentCampus.short}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Viewing</div>
            <div style={{ fontSize: 14, color: COLORS.ink, fontWeight: 700 }}>{currentCampus.name} {currentCampus.isHQ ? "· HQ" : ""}</div>
          </div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, fontStyle: "italic" }}>
            Use the campus dropdown (top-right) to switch · "All Campuses" for the consolidated rollup
          </div>
        </Card>
      )}
      <BudgetHealthCard ministries={ministries} operatingOverheadMo={operatingOverheadMo} survivalFloorMo={survivalFloorMo} />
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
      <Card style={{ padding: 24, backgroundColor: COLORS.forestDeep, color: INVERSE_INK, border: "none" }}>
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
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.forest, color: ON_LIME, border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, fontWeight: 600, cursor: "pointer" }}>
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

const AlertsLivePanel = ({ alerts, config, ministries, operatingOverheadMo, survivalFloorMo }) => {
  const ctx = buildAlertContext({
    monthlyTrend: MONTHLY_TREND,
    ministries: ministries,
    receipts: RECENT_RECEIPTS,
    cashOnHand: BALANCE_END,
    operatingOverheadMo,
    survivalFloorMo,
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
          <div style={{ fontFamily: fontDisplay, fontSize: 44, fontWeight: 600, color: COLORS.forestText, letterSpacing: -1.2, marginTop: 14, lineHeight: 1.05 }}>
            {fmt(totalLeftover)} <span style={{ color: COLORS.ink, fontWeight: 500 }}>unused last month</span>
          </div>
          <div style={{ fontFamily: fontSerif, fontSize: 18, fontStyle: "italic", color: COLORS.inkSoft, marginTop: 10, lineHeight: 1.5, maxWidth: 600 }}>
            would you like to roll it forward to May, or return it to the church general fund?
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, alignSelf: "center" }}>
          <button onClick={() => decideAll("roll")} style={{ padding: "12px 22px", backgroundColor: COLORS.forest, color: ON_LIME, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            <ArrowUpRight size={14} /> Roll all forward to May
          </button>
          <button onClick={() => decideAll("return")} style={{ padding: "12px 22px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: fontBody, whiteSpace: "nowrap" }}>
            Return all to general fund
          </button>
        </div>
      </div>

      <div style={{ padding: 12, backgroundColor: COLORS.cream, borderRadius: 9, marginBottom: 14, fontSize: 12, color: COLORS.ink, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span><strong style={{ color: COLORS.forestText }}>{decidedCount}</strong> of {eligible.length} decided</span>
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
              <button onClick={() => apply(c)} style={{ padding: "8px 14px", backgroundColor: COLORS.forest, color: ON_LIME, border: "none", borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: fontBody }}>
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
        <button onClick={applyAll} style={{ marginLeft: "auto", padding: "12px 22px", backgroundColor: COLORS.forest, color: ON_LIME, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", gap: 6 }}>
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
          <button onClick={onSendAndApply} style={{ padding: "10px 22px", backgroundColor: COLORS.forest, color: ON_LIME, border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", gap: 6 }}>
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
          <div style={{ fontSize: 11, color: COLORS.forestText, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Unused funds</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 600, color: COLORS.forestText, marginTop: 4, letterSpacing: -0.5 }}>{fmtShort(unused)}</div>
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
        <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.green, color: ON_GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
        <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.amber, color: ON_AMBER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
          <button onClick={approveAllReductions} style={{ padding: "11px 20px", backgroundColor: COLORS.forest, color: ON_LIME, border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
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

const WhatIfScenarioSection = ({ ministries, updateMinistryBudget, logActivity, operatingOverheadMo, survivalFloorMo }) => {
  const [drafts, setDrafts] = useState({});
  const [savedCount, setSavedCount] = useState(0);

  const projected = (m) => (drafts[m.id] !== undefined ? drafts[m.id] : m.budget);
  const setDraft = (id, v) => setDrafts((d) => ({ ...d, [id]: v }));

  const ministryTotal = ministries.reduce((s, m) => s + projected(m), 0);
  const operatingTotal = (operatingOverheadMo * 12) + ministryTotal + EVENTS_BUDGET_YR + BLESSINGS_BUDGET_YR;
  const surplus = DONATION_TARGET_YR - operatingTotal;
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

// Banner that explains how this campus's budget is funded.
// ============================================================
// SMART BUDGET COMPONENTS — mandatory vs extras watchdog,
// event break-even monitor, annual planner.
// ============================================================

// Theme-aware level color helper. Returns text/bg/border for a status level.
// Called inside JSX (not at module load) so the proxy reads the current theme.
const levelTone = (level) => {
  const map = {
    good:   { text: COLORS.green, bg: "rgba(74,222,128,0.10)", border: COLORS.green },
    warn:   { text: COLORS.amber, bg: "rgba(251,191,36,0.10)", border: COLORS.amber },
    danger: { text: COLORS.red,   bg: "rgba(255,59,138,0.10)", border: COLORS.red },
  };
  return map[level] || map.good;
};

const YearCoverageStrip = ({ campusId, selectedMonth, onPickMonth }) => {
  const year = getYearCoverage(campusId);
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Year at a glance · 2026</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>
            {year.monthsCovered} months fully covered · {year.monthsAtRisk} at risk
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: COLORS.green }} /> Covered</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: COLORS.amber }} /> Partial</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: COLORS.red }} /> At risk</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 6 }}>
        {year.months.map((m) => {
          const tone = levelTone(m.level);
          const sel = selectedMonth === m.idx;
          const isNow = m.idx === CURRENT_MONTH_IDX;
          return (
            <button
              key={m.idx}
              onClick={() => onPickMonth(m.idx)}
              style={{
                padding: 10, borderRadius: 8, cursor: "pointer", fontFamily: fontBody, textAlign: "center",
                border: sel ? `2px solid ${COLORS.copper}` : `1px solid ${COLORS.border}`,
                backgroundColor: sel ? "rgba(255,90,31,0.06)" : tone.bg,
                position: "relative",
              }}
            >
              {isNow && (
                <span style={{ position: "absolute", top: -7, left: "50%", transform: "translateX(-50%)", padding: "1px 6px", borderRadius: 99, backgroundColor: COLORS.copper, color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Now
                </span>
              )}
              <div style={{ fontSize: 11, color: COLORS.inkSoft, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{m.label}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: tone.text }} />
                <span style={{ fontFamily: fontDisplay, fontSize: 14, fontWeight: 700, color: COLORS.ink, fontVariantNumeric: "tabular-nums" }}>
                  {fmtShort(m.donations)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

const MandatoryVsExtrasCard = ({ campusId, monthIdx }) => {
  const cov = getMonthCoverage(campusId, monthIdx);
  if (!cov) return null;
  const b = ANNUAL_BUDGETS[campusId];
  const mTone = cov.donations >= cov.mandatory ? "good" : "danger";
  const eTone = cov.extrasShortfall === 0 ? "good" : cov.extrasAvailable > 0 ? "warn" : "danger";
  const mandatoryPct = Math.min(100, (cov.donations / cov.mandatory) * 100);
  const extrasPct = Math.min(100, (cov.extrasAvailable / cov.extras) * 100);

  return (
    <Card style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
            {MONTH_LABELS[monthIdx]} 2026 · coverage
          </div>
          <div style={{ fontFamily: fontSerif, fontSize: 22, fontStyle: "italic", color: COLORS.ink, marginTop: 4, letterSpacing: -0.3 }}>
            Mandatory vs extras.
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Donations</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 700, color: COLORS.ink, letterSpacing: -0.5 }}>{fmtShort(cov.donations)}</div>
          <div style={{ fontSize: 10, color: COLORS.inkSoft, fontStyle: "italic" }}>
            {cov.isActual ? "actual" : "projected"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* MANDATORY */}
        <div style={{ padding: 16, borderRadius: 11, border: `1px solid ${levelTone(mTone).border}40`, backgroundColor: levelTone(mTone).bg }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Mandatory min</span>
            <Pill tone={mTone === "good" ? "success" : "danger"}>{mTone === "good" ? "Covered" : "At risk"}</Pill>
          </div>
          <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 700, color: COLORS.ink, letterSpacing: -0.5 }}>{fmtShort(cov.mandatory)}</div>
          <div style={{ height: 8, backgroundColor: COLORS.cream, borderRadius: 99, overflow: "hidden", margin: "10px 0 6px" }}>
            <div style={{ height: "100%", width: `${mandatoryPct}%`, backgroundColor: levelTone(mTone).text, transition: "width 0.3s" }} />
          </div>
          <div style={{ fontSize: 12, color: levelTone(mTone).text, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {Math.round(mandatoryPct)}% covered
            {mTone === "good" && cov.surplus > 0 && <span style={{ color: COLORS.inkSoft, fontWeight: 500 }}> · +{fmtShort(cov.surplus)} buffer</span>}
            {mTone === "danger" && <span style={{ color: COLORS.inkSoft, fontWeight: 500 }}> · −{fmtShort(cov.deficit)} short</span>}
          </div>
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${COLORS.borderSoft}`, display: "flex", flexDirection: "column", gap: 5 }}>
            {b.breakdown.mandatory.map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: row.color }} />
                <span style={{ flex: 1, color: COLORS.inkSoft }}>{row.label}</span>
                <span style={{ color: COLORS.ink, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtShort(row.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* EXTRAS */}
        <div style={{ padding: 16, borderRadius: 11, border: `1px solid ${levelTone(eTone).border}40`, backgroundColor: levelTone(eTone).bg }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Extras</span>
            <Pill tone={eTone === "good" ? "success" : eTone === "warn" ? "warn" : "danger"}>
              {eTone === "good" ? "Funded" : eTone === "warn" ? "Partial" : "No room"}
            </Pill>
          </div>
          <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 700, color: COLORS.ink, letterSpacing: -0.5 }}>{fmtShort(cov.extras)}</div>
          <div style={{ height: 8, backgroundColor: COLORS.cream, borderRadius: 99, overflow: "hidden", margin: "10px 0 6px" }}>
            <div style={{ height: "100%", width: `${extrasPct}%`, backgroundColor: levelTone(eTone).text, transition: "width 0.3s" }} />
          </div>
          <div style={{ fontSize: 12, color: levelTone(eTone).text, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {fmtShort(cov.extrasAvailable)} of {fmtShort(cov.extras)} available
            {cov.extrasShortfall > 0 && <span style={{ color: COLORS.inkSoft, fontWeight: 500 }}> · −{fmtShort(cov.extrasShortfall)} short</span>}
          </div>
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${COLORS.borderSoft}`, display: "flex", flexDirection: "column", gap: 5 }}>
            {b.breakdown.extras.map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: row.color }} />
                <span style={{ flex: 1, color: COLORS.inkSoft }}>{row.label}</span>
                <span style={{ color: COLORS.ink, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtShort(row.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

const SmartWarningBanner = ({ campusId, monthIdx }) => {
  const cov = getMonthCoverage(campusId, monthIdx);
  if (!cov || cov.level === "good") return null;

  const isDanger = cov.level === "danger";
  const tone = levelTone(cov.level);
  const advice = isDanger
    ? `You need ${fmtShort(cov.deficit)} more in donations to cover ${MONTH_LABELS[monthIdx]}'s mandatory minimum. Pause extras, run an outreach, or tap reserves.`
    : `Mandatory is covered, but extras have a ${fmtShort(cov.extrasShortfall)} shortfall. Consider pausing some extras — or wait, late-month giving usually adds 18-23% of the total.`;

  return (
    <Card style={{ padding: 16, backgroundColor: tone.bg, borderColor: tone.border + "60", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: tone.border, color: isDanger ? ON_PINK : ON_AMBER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <AlertTriangle size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: tone.text, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>{cov.status}</div>
        <div style={{ fontFamily: fontSerif, fontSize: 17, fontStyle: "italic", color: COLORS.ink, marginTop: 4, lineHeight: 1.35 }}>
          {advice}
        </div>
      </div>
    </Card>
  );
};

const EventBudgetCard = ({ event, campus }) => {
  const cov = getEventCoverage(event);
  const tone = levelTone(cov.level);
  const breakEvenPct = (event.paidRegistrations / cov.breakEvenAttendees) * 100;

  return (
    <Card style={{ padding: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, backgroundColor: tone.border }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Pill tone={cov.level === "good" ? "success" : cov.level === "warn" ? "warn" : "danger"}>{cov.status}</Pill>
            {campus && <Pill tone="neutral">{campus.name}</Pill>}
          </div>
          <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 700, color: COLORS.ink }}>{event.name}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{event.date} · ticket ${event.ticketPrice}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Net (current)</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 700, color: cov.netCurrent >= 0 ? COLORS.green : COLORS.red, letterSpacing: -0.4 }}>
            {cov.netCurrent >= 0 ? "+" : "−"}{fmtShort(Math.abs(cov.netCurrent))}
          </div>
          <div style={{ fontSize: 10, color: COLORS.inkSoft, fontStyle: "italic" }}>max possible {fmtShort(cov.netMax)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Budget</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 15, fontWeight: 700, color: COLORS.ink, marginTop: 2 }}>{fmtShort(event.budget)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Sold</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 15, fontWeight: 700, color: COLORS.ink, marginTop: 2 }}>{event.paidRegistrations}/{event.expectedAttendees}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Break-even</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 15, fontWeight: 700, color: COLORS.ink, marginTop: 2 }}>{cov.breakEvenAttendees}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Need</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 15, fontWeight: 700, color: cov.needed > 0 ? COLORS.copper : COLORS.green, marginTop: 2 }}>
            {cov.needed > 0 ? `+${cov.needed}` : "✓"}
          </div>
        </div>
      </div>

      {/* break-even bar */}
      <div style={{ position: "relative", height: 10, backgroundColor: COLORS.cream, borderRadius: 99, overflow: "hidden", marginBottom: 4 }}>
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${Math.min(100, breakEvenPct)}%`, backgroundColor: tone.text, transition: "width 0.3s" }} />
        <div style={{ position: "absolute", top: -2, bottom: -2, left: "100%", width: 2, backgroundColor: COLORS.ink, transform: "translateX(-1px)" }} title="Break-even point" />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: COLORS.inkSoft, fontWeight: 600 }}>
        <span>{event.paidRegistrations} sold</span>
        <span>{cov.breakEvenAttendees} needed to break even</span>
      </div>

      {event.notes && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 7, backgroundColor: COLORS.bg, border: `1px solid ${COLORS.borderSoft}`, fontSize: 11, color: COLORS.inkSoft, fontStyle: "italic" }}>
          {event.notes}
        </div>
      )}
    </Card>
  );
};

const EventsCoverageMonitor = ({ campuses, scopeCampusId }) => {
  // Filter events by campus if a specific scope is passed.
  const events = scopeCampusId && scopeCampusId !== "all"
    ? PAID_EVENTS.filter((e) => e.campusId === scopeCampusId)
    : PAID_EVENTS;
  // Sort by risk: danger first, then warn, then good.
  const sortKey = { danger: 0, warn: 1, good: 2 };
  const sorted = [...events].sort((a, b) => sortKey[getEventCoverage(a).level] - sortKey[getEventCoverage(b).level]);

  if (sorted.length === 0) {
    return (
      <Card style={{ padding: 22, textAlign: "center" }}>
        <div style={{ fontFamily: fontSerif, fontSize: 17, fontStyle: "italic", color: COLORS.inkSoft }}>No paid events scheduled for this campus.</div>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div>
          <div style={{ fontFamily: fontSerif, fontSize: 22, fontStyle: "italic", color: COLORS.ink, letterSpacing: -0.3 }}>
            Paid events · break-even watchdog.
          </div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>
            Revenue must cover budget. Sorted by risk — most exposed first.
          </div>
        </div>
        <div style={{ fontSize: 12, color: COLORS.inkSoft }}>
          {sorted.length} event{sorted.length === 1 ? "" : "s"}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {sorted.map((e) => (
          <EventBudgetCard key={e.id} event={e} campus={campuses.find((c) => c.id === e.campusId)} />
        ))}
      </div>
    </div>
  );
};

const AnnualBudgetPlanner = ({ campusId, currentUser }) => {
  const [view, setView] = useState("annual"); // "annual" | "grid"
  // Local editable drafts initialized from data.
  const b = ANNUAL_BUDGETS[campusId];
  if (!b) return null;
  const annualMandatory = b.mandatory.reduce((s, v) => s + v, 0);
  const annualExtras = b.extras.reduce((s, v) => s + v, 0);
  const [annualM, setAnnualM] = useState(annualMandatory);
  const [annualE, setAnnualE] = useState(annualExtras);
  const [distribution, setDistribution] = useState("even"); // "even" | "seasonal"
  const [monthly, setMonthly] = useState({ mandatory: [...b.mandatory], extras: [...b.extras] });
  const canEdit = currentUser?.role === ROLE_HQ || currentUser?.role === ROLE_CAMPUS;

  // Seasonal weights — heavier in winter (heating) and December (Christmas giving).
  const SEASONAL_M = [1.0, 1.0, 1.0, 1.0, 1.0, 1.02, 1.02, 1.02, 1.04, 1.04, 1.04, 1.06];
  const SEASONAL_E = [0.85, 0.75, 0.92, 0.82, 0.95, 1.23, 1.20, 1.10, 1.00, 1.06, 1.16, 1.65];

  const distribute = (total, weights) => {
    const sumW = weights.reduce((s, w) => s + w, 0);
    return weights.map((w) => Math.round((total * w / sumW) / 100) * 100);
  };
  const projectedMandatory = distribution === "seasonal" ? distribute(annualM, SEASONAL_M) : Array(12).fill(Math.round(annualM / 12 / 100) * 100);
  const projectedExtras = distribution === "seasonal" ? distribute(annualE, SEASONAL_E) : Array(12).fill(Math.round(annualE / 12 / 100) * 100);

  return (
    <Card style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Annual planner · 2026</div>
          <div style={{ fontFamily: fontSerif, fontSize: 22, fontStyle: "italic", color: COLORS.ink, marginTop: 4, letterSpacing: -0.3 }}>
            Set the year, edit any month.
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, padding: 4, backgroundColor: COLORS.cream, borderRadius: 99, border: `1px solid ${COLORS.border}` }}>
          <button onClick={() => setView("annual")} style={{
            padding: "6px 14px", borderRadius: 99, border: "none", fontFamily: fontBody, fontWeight: 700, fontSize: 11, cursor: "pointer",
            backgroundColor: view === "annual" ? COLORS.surface : "transparent",
            color: view === "annual" ? COLORS.ink : COLORS.inkSoft,
            boxShadow: view === "annual" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
          }}>Annual total</button>
          <button onClick={() => setView("grid")} style={{
            padding: "6px 14px", borderRadius: 99, border: "none", fontFamily: fontBody, fontWeight: 700, fontSize: 11, cursor: "pointer",
            backgroundColor: view === "grid" ? COLORS.surface : "transparent",
            color: view === "grid" ? COLORS.ink : COLORS.inkSoft,
            boxShadow: view === "grid" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
          }}>12-month grid</button>
        </div>
      </div>

      {view === "annual" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div style={{ padding: 14, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Annual mandatory</div>
              <input
                type="number" value={annualM} disabled={!canEdit}
                onChange={(e) => setAnnualM(Number(e.target.value))}
                style={{ width: "100%", marginTop: 8, padding: "8px 10px", fontSize: 22, fontFamily: fontDisplay, fontWeight: 700, color: COLORS.ink, backgroundColor: canEdit ? COLORS.bg : COLORS.cream, border: `1px solid ${COLORS.border}`, borderRadius: 7, outline: "none", boxSizing: "border-box", fontVariantNumeric: "tabular-nums" }}
              />
              <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 4 }}>≈ {fmtShort(Math.round(annualM / 12))}/mo on average</div>
            </div>
            <div style={{ padding: 14, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Annual extras</div>
              <input
                type="number" value={annualE} disabled={!canEdit}
                onChange={(e) => setAnnualE(Number(e.target.value))}
                style={{ width: "100%", marginTop: 8, padding: "8px 10px", fontSize: 22, fontFamily: fontDisplay, fontWeight: 700, color: COLORS.ink, backgroundColor: canEdit ? COLORS.bg : COLORS.cream, border: `1px solid ${COLORS.border}`, borderRadius: 7, outline: "none", boxSizing: "border-box", fontVariantNumeric: "tabular-nums" }}
              />
              <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 4 }}>≈ {fmtShort(Math.round(annualE / 12))}/mo on average</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Distribution</span>
            <div style={{ display: "flex", gap: 4 }}>
              {[{ id: "even", label: "Even months" }, { id: "seasonal", label: "Seasonal weights" }].map((opt) => (
                <button key={opt.id} onClick={() => setDistribution(opt.id)} disabled={!canEdit} style={{
                  padding: "5px 10px", border: distribution === opt.id ? `2px solid ${COLORS.forest}` : `1px solid ${COLORS.border}`,
                  borderRadius: 6, fontFamily: fontBody, fontWeight: 600, fontSize: 11, cursor: canEdit ? "pointer" : "not-allowed",
                  backgroundColor: distribution === opt.id ? "rgba(212,255,0,0.08)" : "transparent", color: COLORS.ink,
                }}>{opt.label}</button>
              ))}
            </div>
          </div>
          {/* Live preview stacked bars */}
          <div style={{ padding: 14, borderRadius: 10, backgroundColor: COLORS.bg }}>
            <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 8 }}>Live preview — monthly spread</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
              {MONTH_LABELS.map((m, i) => {
                const mAmt = projectedMandatory[i];
                const eAmt = projectedExtras[i];
                const maxTotal = Math.max(...projectedMandatory.map((mm, j) => mm + projectedExtras[j]));
                const mh = (mAmt / maxTotal) * 100;
                const eh = (eAmt / maxTotal) * 100;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column-reverse", height: "100%" }}>
                      <div style={{ width: "100%", height: `${mh}%`, backgroundColor: COLORS.forest, borderRadius: "0 0 3px 3px" }} title={`Mandatory: ${fmtShort(mAmt)}`} />
                      <div style={{ width: "100%", height: `${eh}%`, backgroundColor: COLORS.copper, borderRadius: "3px 3px 0 0", marginBottom: 1 }} title={`Extras: ${fmtShort(eAmt)}`} />
                    </div>
                    <span style={{ fontSize: 9, color: COLORS.inkSoft, fontWeight: 600 }}>{m}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: COLORS.forest }} />Mandatory</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: COLORS.copper }} />Extras</span>
            </div>
          </div>
        </>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700, borderBottom: `1px solid ${COLORS.border}` }}>Row</th>
                {MONTH_LABELS.map((m, i) => (
                  <th key={i} style={{ padding: "8px 6px", fontSize: 10, color: i === CURRENT_MONTH_IDX ? COLORS.copper : COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700, textAlign: "center", borderBottom: `1px solid ${COLORS.border}` }}>{m}</th>
                ))}
                <th style={{ padding: "8px 10px", fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700, textAlign: "right", borderBottom: `1px solid ${COLORS.border}` }}>Year</th>
              </tr>
            </thead>
            <tbody>
              {["mandatory", "extras"].map((kind) => {
                const row = monthly[kind];
                const total = row.reduce((s, v) => s + v, 0);
                return (
                  <tr key={kind}>
                    <td style={{ padding: "6px 10px", fontWeight: 700, color: COLORS.ink, textTransform: "capitalize", borderBottom: `1px solid ${COLORS.borderSoft}` }}>{kind}</td>
                    {row.map((v, i) => (
                      <td key={i} style={{ padding: "4px 4px", textAlign: "center", borderBottom: `1px solid ${COLORS.borderSoft}` }}>
                        <input
                          type="number" value={v} disabled={!canEdit}
                          onChange={(e) => setMonthly((m) => ({ ...m, [kind]: m[kind].map((x, j) => j === i ? Number(e.target.value) : x) }))}
                          style={{
                            width: "100%", padding: "5px 4px", fontSize: 11, fontFamily: fontBody, fontWeight: 600, color: COLORS.ink,
                            backgroundColor: i === CURRENT_MONTH_IDX ? "rgba(255,90,31,0.06)" : COLORS.bg,
                            border: `1px solid ${i === CURRENT_MONTH_IDX ? COLORS.copper + "60" : COLORS.border}`,
                            borderRadius: 5, outline: "none", boxSizing: "border-box", textAlign: "right", fontVariantNumeric: "tabular-nums",
                          }}
                        />
                      </td>
                    ))}
                    <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: COLORS.ink, fontVariantNumeric: "tabular-nums", borderBottom: `1px solid ${COLORS.borderSoft}` }}>{fmtShort(total)}</td>
                  </tr>
                );
              })}
              <tr>
                <td style={{ padding: "8px 10px", fontWeight: 700, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontSize: 10 }}>Total</td>
                {MONTH_LABELS.map((_, i) => {
                  const t = monthly.mandatory[i] + monthly.extras[i];
                  return <td key={i} style={{ padding: "6px 4px", textAlign: "center", fontSize: 11, fontWeight: 700, color: COLORS.ink, fontVariantNumeric: "tabular-nums" }}>{fmtShort(t)}</td>;
                })}
                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: COLORS.forestText, fontVariantNumeric: "tabular-nums" }}>{fmtShort(monthly.mandatory.reduce((s, v) => s + v, 0) + monthly.extras.reduce((s, v) => s + v, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

const SmartBudgetPage = ({ currentUser, activeCampus, campuses }) => {
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH_IDX);
  // Effective campus: HQ default to Bellevue for the per-campus view, others locked.
  const effectiveCampusId = activeCampus === "all"
    ? (currentUser?.campusId || "bellevue")
    : activeCampus;
  const campus = campuses.find((c) => c.id === effectiveCampusId);

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Hero */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 700, color: COLORS.ink, letterSpacing: -0.5 }}>
            Smart budget · {campus?.name || "Campus"}
          </div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>
            Watchdog for mandatory + extras + paid events. Click a month in the strip below to drill in.
          </div>
        </div>
        {activeCampus === "all" && currentUser?.role === ROLE_HQ && (
          <Pill tone="copper">Showing {campus?.name} · use campus dropdown to switch</Pill>
        )}
      </div>

      <YearCoverageStrip campusId={effectiveCampusId} selectedMonth={selectedMonth} onPickMonth={setSelectedMonth} />
      <SmartWarningBanner campusId={effectiveCampusId} monthIdx={selectedMonth} />
      <MandatoryVsExtrasCard campusId={effectiveCampusId} monthIdx={selectedMonth} />
      <EventsCoverageMonitor campuses={campuses} scopeCampusId={effectiveCampusId} />
      <AnnualBudgetPlanner campusId={effectiveCampusId} currentUser={currentUser} />
    </div>
  );
};

const FundingSourceBanner = ({ activeCampus, campuses, connections, currentUser, onRequestChange }) => {
  const isAll = activeCampus === "all";
  const campus = isAll ? null : campuses.find((c) => c.id === activeCampus);
  const directConnections = campus ? connections.filter((c) => c.scope === campus.id) : [];
  const inheritedConnections = connections.filter((c) => c.scope === "all");

  let fundingState, label, sublabel, color, Icon, accent;
  if (isAll) {
    fundingState = "rollup"; label = "Org-wide rollup"; sublabel = `Aggregating ${campuses.length} campuses · all donation sources combined`;
    color = COLORS.copper; Icon = Globe; accent = COLORS.copper;
  } else if (campus.isHQ) {
    fundingState = "master"; label = `${campus.name} · HQ master`; sublabel = `${directConnections.length + inheritedConnections.length} live sources · funds the whole org`;
    color = COLORS.copper; Icon = Building2; accent = COLORS.copper;
  } else if (directConnections.length > 0) {
    fundingState = "independent"; label = `${campus.name} · independent`; sublabel = `${directConnections.length} own source${directConnections.length === 1 ? "" : "s"} · stopped inheriting from HQ`;
    color = COLORS.green; Icon = Check; accent = COLORS.green;
  } else {
    fundingState = "inheriting"; label = `${campus.name} · funded by HQ`; sublabel = `Inheriting from Bellevue · no own sources connected yet`;
    color = COLORS.amber; Icon = ArrowDownRight; accent = COLORS.amber;
  }

  const isCampusAdmin = currentUser?.role === ROLE_CAMPUS;
  const isMinistryLeader = currentUser?.role === ROLE_MINISTRY;

  return (
    <Card style={{
      padding: 18, position: "relative", overflow: "hidden",
      background: `linear-gradient(135deg, ${COLORS.surface} 0%, ${accent}10 100%)`,
      borderColor: accent + "50",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, backgroundColor: accent }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, backgroundColor: accent + "20", color: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, color: accent, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Funding source</div>
            {fundingState === "master" && <Pill tone="copper">★ HQ</Pill>}
            {fundingState === "independent" && <Pill tone="success">Own books</Pill>}
            {fundingState === "inheriting" && <Pill tone="warn">Shared with HQ</Pill>}
          </div>
          <div style={{ fontFamily: fontDisplay, fontSize: 17, fontWeight: 700, color: COLORS.ink }}>{label}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{sublabel}</div>
        </div>
        {isCampusAdmin && fundingState !== "rollup" && (
          <button onClick={onRequestChange} style={{
            padding: "9px 14px", border: `1px solid ${COLORS.copper}`, borderRadius: 8,
            backgroundColor: COLORS.copper + "15", color: COLORS.copper,
            fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: fontBody,
            display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
          }}>
            <Mail size={12} /> Request budget change
          </button>
        )}
        {isMinistryLeader && (
          <Pill tone="neutral"><Lock size={11} /> Read only</Pill>
        )}
      </div>
    </Card>
  );
};

const BudgetRequestModal = ({ campus, onSubmit, onClose }) => {
  const [type, setType] = useState("increase");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const canSubmit = amount && Number(amount) > 0 && reason.trim().length >= 10;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(10,10,10,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: COLORS.surface, borderRadius: 16, width: 540, maxWidth: "100%", boxShadow: "0 25px 80px rgba(0,0,0,0.6)", border: `1px solid ${COLORS.border}` }}>
        <div style={{ padding: "22px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Budget request</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 19, fontWeight: 600, color: COLORS.ink, marginTop: 4 }}>Send to HQ for {campus?.name || "this campus"}</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4, fontStyle: "italic" }}>HQ admins receive this in their queue and can approve, deny, or open discussion.</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}><X size={18} color={COLORS.inkSoft} /></button>
        </div>
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700, marginBottom: 6, display: "block" }}>Request type</label>
            <div style={{ display: "flex", gap: 6 }}>
              {["increase", "decrease", "new line"].map((t) => (
                <button key={t} onClick={() => setType(t)} style={{
                  padding: "7px 12px", border: type === t ? `2px solid ${COLORS.forest}` : `1px solid ${COLORS.border}`,
                  borderRadius: 7, backgroundColor: type === t ? "rgba(212,255,0,0.06)" : "transparent",
                  fontFamily: fontBody, fontWeight: 600, fontSize: 12, color: COLORS.ink, cursor: "pointer", textTransform: "capitalize",
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700, marginBottom: 6, display: "block" }}>Amount ($)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000" style={{
              width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: fontBody, color: COLORS.ink,
              backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none", boxSizing: "border-box",
            }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700, marginBottom: 6, display: "block" }}>Reason (10+ chars)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Tacoma's youth ministry has grown 40% — need more program budget for camps and weekly events." style={{
              width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: fontBody, color: COLORS.ink,
              backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none", boxSizing: "border-box",
              minHeight: 90, resize: "vertical",
            }} />
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.bg, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 18px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: fontBody }}>Cancel</button>
          <button onClick={() => canSubmit && onSubmit({ type, amount: Number(amount), reason })} disabled={!canSubmit} style={{
            padding: "10px 22px", border: "none", borderRadius: 9,
            backgroundColor: canSubmit ? COLORS.forest : COLORS.cream,
            color: canSubmit ? ON_LIME : COLORS.inkSoft,
            fontWeight: 700, fontSize: 13, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: fontBody,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Mail size={13} /> Send to HQ
          </button>
        </div>
      </div>
    </div>
  );
};

const BudgetPage = ({ ministries, updateMinistryBudget, logActivity, recurringPayments, operatingOverheadMo, survivalFloorMo, currentUser, activeCampus, campuses, connections }) => {
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(null);
  const isMinistryLeader = currentUser?.role === ROLE_MINISTRY;
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
    { key: "facilities", label: "Facilities", icon: Building2,
      items: recurringPayments.filter((p) => p.category === "facilities").map((p) => ({ name: p.name, amount: p.amount, essential: true })) },
    { key: "people", label: "People & Payroll", icon: Users,
      items: recurringPayments.filter((p) => p.category === "people").map((p) => ({ name: p.name, amount: p.amount, essential: true })) },
    { key: "operations", label: "Operations & Ministry", icon: Activity,
      items: recurringPayments.filter((p) => p.category === "operations" || p.category === "ministry").map((p) => ({ name: p.name, amount: p.amount, essential: false })) },
  ];

  const fullBudget = [
    { name: "Operating overhead", amount: OPERATING_OVERHEAD_YR, color: COLORS.forest, desc: "Rent, payroll, utilities, ops" },
    { name: "Ministries", amount: MINISTRIES_BUDGET_YR, color: COLORS.copper, desc: "All 14 active ministries" },
    { name: "Events & camps", amount: EVENTS_BUDGET_YR, color: COLORS.green, desc: "Net of registration revenue" },
    { name: "Blessings & care", amount: BLESSINGS_BUDGET_YR, color: COLORS.amber, desc: "Pastor's, ministers', guests'" },
  ];

  const runway2026Worst = BALANCE_END / survivalFloorMo;

  const recsRef = useRef(null);
  const scrollToRecs = () => recsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* QUARTERLY REVIEW BANNER */}
      {/* FUNDING SOURCE BANNER */}
      <FundingSourceBanner
        activeCampus={activeCampus}
        campuses={campuses}
        connections={connections || []}
        currentUser={currentUser}
        onRequestChange={() => setRequestOpen(true)}
      />

      {/* RECENT REQUEST FLASH */}
      {requestSent && (
        <Card style={{ padding: 14, backgroundColor: "rgba(74,222,128,0.06)", borderColor: COLORS.green + "60", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: COLORS.green, color: ON_GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={14} strokeWidth={3} /></div>
          <div style={{ flex: 1, fontSize: 13, color: COLORS.ink }}>
            <strong>Request sent to HQ.</strong> {requestSent.type} · ${requestSent.amount.toLocaleString()} · awaiting review.
          </div>
          <button onClick={() => setRequestSent(null)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: COLORS.inkSoft }}><X size={16} /></button>
        </Card>
      )}

      {/* MINISTRY LEADER LOCK NOTICE */}
      {isMinistryLeader && (
        <Card style={{ padding: 14, backgroundColor: "rgba(251,191,36,0.06)", borderColor: COLORS.amber + "40", display: "flex", alignItems: "center", gap: 12 }}>
          <Lock size={16} color={COLORS.amber} />
          <div style={{ flex: 1, fontSize: 13, color: COLORS.ink, lineHeight: 1.5 }}>
            <strong>Read-only view.</strong> Ministry leaders see budget context for awareness. Changes go through your campus admin.
          </div>
        </Card>
      )}

      {requestOpen && (
        <BudgetRequestModal
          campus={campuses?.find((c) => c.id === activeCampus)}
          onSubmit={(req) => {
            logActivity({ type: "review", note: `Budget ${req.type} request: $${req.amount.toLocaleString()} — ${req.reason.slice(0, 80)}${req.reason.length > 80 ? "…" : ""}` });
            setRequestSent(req);
            setRequestOpen(false);
          }}
          onClose={() => setRequestOpen(false)}
        />
      )}

      {!isMinistryLeader && (
      <QuarterlyReviewBanner ministries={ministries} updateMinistryBudget={updateMinistryBudget} logActivity={logActivity} onScrollToRecs={scrollToRecs} />)}

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
          <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, color: COLORS.ink, marginTop: 6, letterSpacing: -0.5 }}>{fmtShort(operatingOverheadMo)}</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>Survival floor: {fmtShort(survivalFloorMo)}</div>
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
      <WhatIfScenarioSection ministries={ministries} updateMinistryBudget={updateMinistryBudget} logActivity={logActivity} operatingOverheadMo={operatingOverheadMo} survivalFloorMo={survivalFloorMo} />

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
            <strong>Single source of truth.</strong> These line items are your recurring payments — edit them on the <strong>Calendar</strong> page and every total here updates instantly. Survival floor counts only Facilities + People & Payroll; Operations & Ministry are operational.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {sections.map((sec) => {
            const Icon = sec.icon;
            const subtotal = sec.items.reduce((s, l) => s + l.amount, 0);
            return (
              <div key={sec.key} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.cream, color: COLORS.forestText, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
            <div style={{ fontFamily: fontDisplay, fontSize: 30, fontWeight: 500, color: COLORS.ink, letterSpacing: -0.7 }}>{fmtShort(survivalFloorMo)}<span style={{ fontSize: 16, color: COLORS.inkSoft, fontWeight: 400 }}>/mo</span></div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>If everything else stops — facilities + people only.</div>
          </div>
          <div style={{ padding: 18, borderRadius: 12, border: `1px solid ${COLORS.amber}30`, backgroundColor: "rgba(251,191,36,0.10)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Gauge size={14} color={COLORS.amber} />
              <div style={{ fontSize: 11, color: COLORS.amber, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Operating Overhead</div>
            </div>
            <div style={{ fontFamily: fontDisplay, fontSize: 30, fontWeight: 500, color: COLORS.ink, letterSpacing: -0.7 }}>{fmtShort(operatingOverheadMo)}<span style={{ fontSize: 16, color: COLORS.inkSoft, fontWeight: 400 }}>/mo</span></div>
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
        <div style={{ marginTop: 14, padding: 14, backgroundColor: COLORS.forestDeep, color: INVERSE_INK, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
            const survives = s.projected >= survivalFloorMo * 12;
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
        <div style={{ marginTop: 16, padding: 18, backgroundColor: COLORS.forestDeep, color: INVERSE_INK, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertTriangle size={20} color={COLORS.copper} />
            <div>
              <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 500, fontStyle: "italic" }}>Worst-case runway</div>
              <div style={{ fontSize: 12, color: "rgba(250,250,250,0.7)" }}>If giving stopped tomorrow and you ran on essentials only.</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: fontDisplay, fontSize: 32, fontWeight: 500, color: COLORS.copper, letterSpacing: -0.7 }}>{runway2026Worst.toFixed(1)} months</div>
            <div style={{ fontSize: 11, color: "rgba(250,250,250,0.6)" }}>{fmt(BALANCE_END)} reserves ÷ {fmtShort(survivalFloorMo)}/mo</div>
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

        <AlertsLivePanel alerts={alerts} config={alertConfig} ministries={ministries} operatingOverheadMo={operatingOverheadMo} survivalFloorMo={survivalFloorMo} />
      </Card>

    </div>
  );
};

// ============================================================
// CALENDAR PAGE — recurring payments + scheduled events
// ============================================================

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PaymentEditorModal = ({ payment, onSave, onDelete, onClose }) => {
  const isNew = !payment?.id;
  const [name, setName] = useState(payment?.name || "");
  const [amount, setAmount] = useState(payment?.amount?.toString() || "");
  const [day, setDay] = useState(payment?.dayOfMonth?.toString() || "1");
  const [category, setCategory] = useState(payment?.category || "operations");
  const [note, setNote] = useState(payment?.note || "");

  const canSubmit = name.trim().length > 0 && Number(amount) > 0 && Number(day) >= 1 && Number(day) <= 31;

  const submit = () => {
    if (!canSubmit) return;
    onSave({
      id: payment?.id || `p-${Date.now()}`,
      name: name.trim(),
      amount: Number(amount),
      dayOfMonth: Math.min(31, Math.max(1, Number(day))),
      category,
      note: note.trim() || null,
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(10,10,10,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: COLORS.surface, borderRadius: 16, width: 480, maxWidth: "100%", maxHeight: "90vh",
        display: "flex", flexDirection: "column", boxShadow: "0 25px 80px rgba(0,0,0,0.6)",
        border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>{isNew ? "New" : "Edit"} recurring payment</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>
              {isNew ? "Add a payment" : payment.name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} color={COLORS.inkSoft} />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Payment name *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quarterly Software Audit"
              style={{ display: "block", width: "100%", padding: "10px 12px", marginTop: 4, fontSize: 14, fontWeight: 600, fontFamily: fontBody, color: COLORS.ink, backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Amount * ($)</label>
              <input
                type="number" min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2500"
                style={{ display: "block", width: "100%", padding: "10px 12px", marginTop: 4, fontSize: 14, fontWeight: 600, fontFamily: fontBody, color: COLORS.ink, backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none", boxSizing: "border-box", fontVariantNumeric: "tabular-nums" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Day of month *</label>
              <input
                type="number" min="1" max="31"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                style={{ display: "block", width: "100%", padding: "10px 12px", marginTop: 4, fontSize: 14, fontWeight: 600, fontFamily: fontBody, color: COLORS.ink, backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none", boxSizing: "border-box", fontVariantNumeric: "tabular-nums" }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 6, display: "block" }}>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.entries(CALENDAR_CATEGORIES).filter(([k]) => k !== "event").map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  style={{
                    padding: "7px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: fontBody,
                    backgroundColor: category === key ? cat.color + "25" : "transparent",
                    color: category === key ? cat.color : COLORS.ink,
                    border: `1px solid ${category === key ? cat.color : COLORS.border}`,
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: cat.color }} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. PCO, Canva, Mailchimp"
              style={{ display: "block", width: "100%", padding: "10px 12px", marginTop: 4, fontSize: 13, fontFamily: fontBody, color: COLORS.ink, backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ padding: 12, backgroundColor: COLORS.cream, borderRadius: 9, fontSize: 11, color: COLORS.inkSoft, display: "flex", alignItems: "flex-start", gap: 8, lineHeight: 1.5 }}>
            <Repeat size={13} color={COLORS.copper} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>This payment will auto-roll forward every month on day {day || "—"}. Change it any time. Months with fewer days clamp to the last day.</span>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          {!isNew ? (
            <button onClick={onDelete} style={{ padding: "9px 14px", backgroundColor: "transparent", color: COLORS.red, border: `1px solid ${COLORS.red}40`, borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", gap: 6 }}>
              <Trash2 size={12} /> Delete
            </button>
          ) : <div />}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ padding: "10px 16px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: fontBody }}>
              Cancel
            </button>
            <button onClick={submit} disabled={!canSubmit} style={{
              padding: "10px 20px", border: "none", borderRadius: 8,
              backgroundColor: canSubmit ? COLORS.forest : COLORS.cream,
              color: canSubmit ? COLORS.bg : COLORS.inkSoft,
              fontWeight: 700, fontSize: 13, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: fontBody,
            }}>
              {isNew ? "Add payment" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CalendarPage = ({ recurringPayments, savePayment, deletePayment }) => {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4); // May (0-indexed)
  const [selectedDay, setSelectedDay] = useState(8);
  const [editing, setEditing] = useState(null); // payment object | "new" | null
  const recurring = recurringPayments;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const todayY = 2026, todayM = 4, todayD = 8; // demo today
  const isToday = (d) => year === todayY && month === todayM && d === todayD;

  // Items on a given day of the current month
  const itemsForDay = (d) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const recurringItems = recurring
      .filter((p) => Math.min(p.dayOfMonth, daysInMonth) === d)
      .map((p) => ({ ...p, kind: "recurring" }));
    const eventItems = SCHEDULED_EVENTS
      .filter((e) => e.date === dateStr)
      .map((e) => ({ ...e, category: "event", kind: "event" }));
    return [...recurringItems, ...eventItems];
  };

  // Aggregate stats for visible month
  const monthRecurringTotal = recurring.reduce((s, p) => s + p.amount, 0);
  const monthEventTotal = SCHEDULED_EVENTS
    .filter((e) => {
      const [y, m] = e.date.split("-").map(Number);
      return y === year && m - 1 === month;
    })
    .reduce((s, e) => s + e.amount, 0);
  const monthTotal = monthRecurringTotal + monthEventTotal;
  const dailyAvg = monthTotal / daysInMonth;

  // Navigation
  const goPrev = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };
  const goToday = () => { setYear(todayY); setMonth(todayM); setSelectedDay(todayD); };

  // Modal handlers — delegate to lifted state
  const handleSave = (p) => { savePayment(p); setEditing(null); };
  const handleDelete = () => { deletePayment(editing.id); setEditing(null); };

  const selectedDayItems = itemsForDay(selectedDay);
  const selectedDayTotal = selectedDayItems.reduce((s, i) => s + i.amount, 0);
  const selectedDate = new Date(year, month, selectedDay);
  const selectedDow = selectedDate.toLocaleDateString("en-US", { weekday: "long" });

  // Build cells for the grid
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* TOP STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Total this month</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 600, color: COLORS.ink, marginTop: 4 }}>{fmtShort(monthTotal)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>recurring + events</div>
        </Card>
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Recurring payments</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 600, color: COLORS.ink, marginTop: 4 }}>{fmtShort(monthRecurringTotal)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{recurring.length} scheduled · auto-roll</div>
        </Card>
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 11, color: COLORS.amber, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>Event spending</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 600, color: COLORS.ink, marginTop: 4 }}>{fmtShort(monthEventTotal)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>one-time this month</div>
        </Card>
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Daily average</div>
          <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 600, color: COLORS.ink, marginTop: 4 }}>{fmtShort(dailyAvg)}</div>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>over {daysInMonth} days</div>
        </Card>
      </div>

      {/* CALENDAR + SIDE PANEL */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20, alignItems: "flex-start" }}>

        {/* CALENDAR GRID */}
        <Card style={{ padding: 22 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={goPrev} style={{ width: 32, height: 32, border: `1px solid ${COLORS.border}`, borderRadius: 8, backgroundColor: "transparent", color: COLORS.ink, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={15} />
              </button>
              <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: COLORS.ink, letterSpacing: -0.4, minWidth: 220 }}>
                {MONTH_NAMES[month]} {year}
              </div>
              <button onClick={goNext} style={{ width: 32, height: 32, border: `1px solid ${COLORS.border}`, borderRadius: 8, backgroundColor: "transparent", color: COLORS.ink, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={15} />
              </button>
            </div>
            <button onClick={goToday} style={{ padding: "8px 14px", backgroundColor: COLORS.cream, color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: fontBody }}>
              Today
            </button>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
            {Object.values(CALENDAR_CATEGORIES).map((cat) => (
              <span key={cat.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: COLORS.inkSoft, fontWeight: 600 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: cat.color }} />
                {cat.label}
              </span>
            ))}
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
            {DOW_LABELS.map((d) => (
              <div key={d} style={{ fontSize: 10, color: COLORS.inkSoft, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center", padding: "6px 0" }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const items = itemsForDay(d);
              const dayTotal = items.reduce((s, x) => s + x.amount, 0);
              const today = isToday(d);
              const sel = d === selectedDay;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(d)}
                  style={{
                    minHeight: 92, padding: 6, borderRadius: 8, fontFamily: fontBody, cursor: "pointer",
                    background: sel ? "rgba(212,255,0,0.08)" : COLORS.bg,
                    border: `1px solid ${sel ? COLORS.forest + "80" : COLORS.borderSoft}`,
                    display: "flex", flexDirection: "column", alignItems: "stretch", textAlign: "left",
                    transition: "all 0.12s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{
                      fontFamily: fontDisplay, fontSize: 14, fontWeight: 700,
                      color: today ? COLORS.copper : COLORS.ink,
                      width: 22, height: 22, borderRadius: 99,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      backgroundColor: today ? COLORS.copper + "20" : "transparent",
                    }}>{d}</span>
                    {dayTotal > 0 && (
                      <span style={{ fontSize: 9, color: COLORS.inkSoft, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        {fmtShort(dayTotal)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {items.slice(0, 3).map((it, j) => {
                      const cat = CALENDAR_CATEGORIES[it.category];
                      return (
                        <span key={j} title={`${it.name} · ${fmt(it.amount)}`}
                          style={{
                            fontSize: 10, fontWeight: 600, color: cat.color,
                            backgroundColor: cat.color + "15",
                            borderLeft: `2px solid ${cat.color}`,
                            padding: "2px 5px", borderRadius: 3,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                          {it.name}
                        </span>
                      );
                    })}
                    {items.length > 3 && (
                      <span style={{ fontSize: 9, color: COLORS.inkSoft, fontWeight: 600, padding: "1px 4px" }}>
                        +{items.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* SIDE PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Selected day */}
          <Card style={{ padding: 22 }}>
            <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>{selectedDow}</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 600, color: COLORS.ink, letterSpacing: -0.5, marginTop: 2 }}>
              {MONTH_NAMES[month]} {selectedDay}, {year}
            </div>
            {isToday(selectedDay) && (
              <div style={{ marginTop: 4 }}>
                <Pill tone="copper">Today</Pill>
              </div>
            )}

            {selectedDayItems.length === 0 ? (
              <div style={{ marginTop: 18, padding: 18, border: `1px dashed ${COLORS.border}`, borderRadius: 9, textAlign: "center" }}>
                <div style={{ fontFamily: fontSerif, fontSize: 16, fontStyle: "italic", color: COLORS.inkSoft }}>
                  No payments or events on this day.
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                  {selectedDayItems.map((it, i) => {
                    const cat = CALENDAR_CATEGORIES[it.category];
                    const Icon = it.kind === "recurring" ? Repeat : Sparkles;
                    return (
                      <div key={i} style={{
                        padding: "10px 12px", borderRadius: 8,
                        backgroundColor: COLORS.bg, borderLeft: `3px solid ${cat.color}`,
                        display: "flex", alignItems: "center", gap: 10,
                      }}>
                        <Icon size={13} color={cat.color} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{it.name}</div>
                          {it.note && <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>{it.note}</div>}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                          {fmt(it.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Day total</span>
                  <span style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: COLORS.forestText }}>{fmt(selectedDayTotal)}</span>
                </div>
              </>
            )}
          </Card>

          {/* Scheduled payments list */}
          <Card style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 600, color: COLORS.ink }}>Scheduled payments</div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft }}>Click any to edit · auto-rolls every month</div>
              </div>
              <button onClick={() => setEditing("new")} style={{
                width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.forest, color: ON_LIME,
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Plus size={15} strokeWidth={2.5} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[...recurring].sort((a, b) => a.dayOfMonth - b.dayOfMonth).map((p) => {
                const cat = CALENDAR_CATEGORIES[p.category];
                return (
                  <button
                    key={p.id}
                    onClick={() => setEditing(p)}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 7, fontFamily: fontBody, cursor: "pointer",
                      backgroundColor: "transparent", border: `1px solid ${COLORS.borderSoft}`, textAlign: "left",
                      display: "grid", gridTemplateColumns: "30px 1fr auto", gap: 8, alignItems: "center",
                    }}
                  >
                    <span style={{
                      fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums", textAlign: "center",
                      padding: "3px 0", borderRadius: 4, backgroundColor: cat.color + "20", color: cat.color,
                    }}>{p.dayOfMonth}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: COLORS.inkSoft }}>{cat.label}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.ink, fontVariantNumeric: "tabular-nums" }}>{fmtShort(p.amount)}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {editing && (
        <PaymentEditorModal
          payment={editing === "new" ? null : editing}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditing(null)}
        />
      )}
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
            color: ON_LIME, border: "none", padding: "10px 18px", borderRadius: 9,
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
            width: 28, height: 28, borderRadius: 7, backgroundColor: COLORS.forest, color: ON_LIME,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Check size={14} strokeWidth={3} />
          </div>
          <div style={{ flex: 1, fontSize: 13, color: COLORS.ink }}>
            <strong>{recent.name}</strong> added — currently unassigned.{" "}
            <span style={{ color: COLORS.inkSoft }}>
              Go to <strong style={{ color: COLORS.forestText }}>Administrators</strong> to assign it to a leader.
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
            <div style={{ fontSize: 11, color: COLORS.forestText, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>
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

const CampusesPage = ({ campuses, addCampus, setActiveCampus }) => {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [recent, setRecent] = useState(null);

  const canSubmit = name.trim().length > 0 && address.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    addCampus({ name: name.trim(), address: address.trim() });
    setRecent(name.trim());
    setName(""); setAddress(""); setAdding(false);
  };
  const cancel = () => { setName(""); setAddress(""); setAdding(false); };

  const totalDonations = campuses.reduce((s, c) => s + c.donations, 0);
  const totalExpenses = campuses.reduce((s, c) => s + c.expenses, 0);

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 600, color: COLORS.ink, letterSpacing: -0.5 }}>
            All campuses
          </div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>
            {campuses.length} active · {fmtShort(totalDonations)} total donations · {fmtShort(totalExpenses)} total expenses
          </div>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} style={{
            display: "flex", alignItems: "center", gap: 6,
            backgroundColor: COLORS.forest, color: ON_LIME, border: "none",
            padding: "10px 18px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody,
          }}>
            <Plus size={14} /> New campus
          </button>
        )}
      </div>

      {/* RECENT-ADDED FLASH */}
      {recent && (
        <Card style={{ padding: 14, backgroundColor: "rgba(212,255,0,0.06)", borderColor: COLORS.forest + "60", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: COLORS.forest, color: ON_LIME, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Check size={14} strokeWidth={3} />
          </div>
          <div style={{ flex: 1, fontSize: 13, color: COLORS.ink }}>
            <strong>{recent}</strong> added — appears in <strong>TopBar</strong> dropdown, <strong>Integrations</strong> routing map, and is ready to assign admins/ministries to.
          </div>
          <button onClick={() => setRecent(null)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: COLORS.inkSoft }}>
            <X size={16} />
          </button>
        </Card>
      )}

      {/* INLINE NEW-CAMPUS FORM */}
      {adding && (
        <Card style={{ padding: 22, position: "relative", overflow: "hidden", borderColor: COLORS.forest + "60" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: COLORS.forest }} />
          <div style={{ marginBottom: 14, marginTop: 4 }}>
            <div style={{ fontSize: 11, color: COLORS.forestText, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>New campus</div>
            <div style={{ fontFamily: fontSerif, fontSize: 18, fontStyle: "italic", color: COLORS.inkSoft, marginTop: 4 }}>
              Spin up the structure — donations, expenses, ministries, admins all start at zero.
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600, marginBottom: 4 }}>Campus name *</div>
              <input
                autoFocus value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) submit(); if (e.key === "Escape") cancel(); }}
                placeholder="e.g. Spokane"
                style={{ width: "100%", padding: "10px 12px", fontSize: 14, fontWeight: 600, fontFamily: fontBody, color: COLORS.ink, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600, marginBottom: 4 }}>Address *</div>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) submit(); if (e.key === "Escape") cancel(); }}
                placeholder="e.g. Spokane, WA"
                style={{ width: "100%", padding: "10px 12px", fontSize: 14, fontWeight: 600, fontFamily: fontBody, color: COLORS.ink, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={submit} disabled={!canSubmit} style={{
              padding: "10px 18px", border: "none", borderRadius: 9, fontFamily: fontBody, fontWeight: 700, fontSize: 13,
              cursor: canSubmit ? "pointer" : "not-allowed",
              backgroundColor: canSubmit ? COLORS.forest : COLORS.cream,
              color: canSubmit ? COLORS.bg : COLORS.inkSoft,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Plus size={14} /> Add campus
            </button>
            <button onClick={cancel} style={{ padding: "10px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 9, fontFamily: fontBody, fontWeight: 600, fontSize: 13, cursor: "pointer", backgroundColor: "transparent", color: COLORS.ink }}>
              Cancel
            </button>
            <span style={{ fontSize: 11, color: COLORS.inkSoft, marginLeft: 8 }}>Press Enter to add · Esc to cancel</span>
          </div>
        </Card>
      )}

      {/* CAMPUS CARDS */}
      {campuses.map((c, i) => {
        const surplus = c.donations - c.expenses;
        return (
          <Card key={c.id || i} style={{ padding: 24, position: "relative", overflow: "hidden" }}>
            {c.isHQ && (
              <div style={{ position: "absolute", top: 16, right: 16 }}>
                <Pill tone="forest">★ HQ</Pill>
              </div>
            )}
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, backgroundColor: c.color }} />
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 160px", gap: 20, alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: c.color, color: textOnBg(c.color), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisplay, fontWeight: 700, fontSize: 16 }}>
                    {c.short}
                  </div>
                  <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 500, color: COLORS.ink, letterSpacing: -0.5 }}>{c.name}</div>
                </div>
                <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{c.address}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Donations</div>
                <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, marginTop: 2 }}>{fmtShort(c.donations)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Annual overhead</div>
                <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, marginTop: 2 }}>{fmtShort(c.annualOverhead || 0)}</div>
                <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 2 }}>{c.paymentCount || 0} payments</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Ministry budget</div>
                <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, marginTop: 2 }}>{fmtShort(c.ministryBudget || 0)}</div>
                <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 2 }}>{c.ministryCount || 0} ministries</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Net</div>
                <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: surplus >= 0 ? COLORS.green : COLORS.red, marginTop: 2 }}>
                  {surplus >= 0 ? "+" : ""}{fmtShort(surplus)}
                </div>
                <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 2 }}>{c.members} members</div>
              </div>
              <button
                onClick={() => setActiveCampus(c.id)}
                style={{
                  padding: "10px 14px", borderRadius: 9, border: "none",
                  backgroundColor: c.color, color: textOnBg(c.color),
                  fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: fontBody,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                Work on {c.name} →
              </button>
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
  executive: { get color() { return COLORS.forestText; }, bg: "rgba(74,222,128,0.16)", label: "Executive" },
  function: { get color() { return COLORS.copper; }, bg: "rgba(255,90,31,0.18)", label: "Function" },
  campus: { get color() { return COLORS.amber; }, bg: "rgba(251,191,36,0.18)", label: "Campus" },
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
            <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: COLORS.forest, color: ON_LIME, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{admin.avatar}</div>
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
            <button onClick={() => { onSave(selected); onClose(); }} style={{ padding: "10px 20px", backgroundColor: COLORS.forest, color: ON_LIME, border: "none", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", gap: 6 }}>
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
        <button onClick={addAdmin} style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.forest, color: ON_LIME, border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, fontWeight: 600, cursor: "pointer" }}>
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
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.forest, color: ON_LIME, border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, fontWeight: 600, cursor: "pointer" }}>
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
        padding: 32, backgroundColor: COLORS.forestDeep, color: INVERSE_INK, border: "none",
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
  roll:         { label: "Roll forward",     icon: ArrowUpRight,   get color() { return COLORS.forestText; } },
  return:       { label: "Return to fund",   icon: ArrowDownRight, get color() { return COLORS.copper; } },
  budget:       { label: "Budget change",    icon: Edit3,          get color() { return COLORS.amber; } },
  notification: { label: "Notification",     icon: Mail,           get color() { return COLORS.copper; } },
  alert:        { label: "Alert fired",      icon: AlertTriangle,  get color() { return COLORS.red; } },
  review:       { label: "Quarterly review", icon: Check,          get color() { return COLORS.green; } },
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

// Map TEAM access strings → role enum used for hierarchy + invite modal.
const accessToRole = (access) => {
  if (access === "Full Admin" || access === "Finance Admin") return ROLE_HQ;
  if (access === "Campus Admin") return ROLE_CAMPUS;
  return ROLE_MINISTRY;
};

const RoleBadge = ({ access }) => (
  <Pill tone={access === "Full Admin" ? "forest" : access === "Finance Admin" ? "copper" : access === "Campus Admin" ? "success" : "neutral"}>
    {access}
  </Pill>
);

const PersonRow = ({ p, canEdit }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 100px auto", gap: 12, padding: "12px 14px", borderRadius: 8, alignItems: "center", backgroundColor: COLORS.bg, border: `1px solid ${COLORS.borderSoft}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: COLORS.forest, color: ON_LIME, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{p.avatar}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{p.name}</div>
        <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{p.email}</div>
      </div>
    </div>
    <div style={{ fontSize: 12, color: COLORS.ink }}>{p.role}</div>
    <RoleBadge access={p.access} />
    <div style={{ fontSize: 11, color: p.lastActive.includes("now") ? COLORS.green : COLORS.inkSoft }}>{p.lastActive}</div>
    <div style={{ display: "flex", gap: 4 }}>
      {canEdit ? (
        <>
          <button title="Edit" style={{ background: "transparent", border: "none", padding: 6, cursor: "pointer", color: COLORS.inkSoft, borderRadius: 6 }}><Edit3 size={13} /></button>
          <button title="Remove" style={{ background: "transparent", border: "none", padding: 6, cursor: "pointer", color: COLORS.red, borderRadius: 6 }}><Trash2 size={13} /></button>
        </>
      ) : null}
    </div>
  </div>
);

const InviteAdminModal = ({ currentUser, campuses, ministries, onClose, onInvite }) => {
  const isHQ = currentUser?.role === ROLE_HQ;
  const allowedRoles = isHQ ? [ROLE_HQ, ROLE_CAMPUS, ROLE_MINISTRY] : [ROLE_MINISTRY];
  const [role, setRole] = useState(allowedRoles[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // For campus admins inviting ministry leaders: campus is locked to their own.
  const [campusId, setCampusId] = useState(isHQ ? campuses[0]?.id : currentUser?.campusId);
  const [ministryId, setMinistryId] = useState("");

  const availableMinistries = ministries.filter((m) => m.campusId === campusId);
  const canSubmit = name.trim() && email.includes("@") && (role !== ROLE_MINISTRY || ministryId);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(10,10,10,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: COLORS.surface, borderRadius: 16, width: 540, maxWidth: "100%", boxShadow: "0 25px 80px rgba(0,0,0,0.6)", border: `1px solid ${COLORS.border}` }}>
        <div style={{ padding: "22px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Invite member</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 19, fontWeight: 600, color: COLORS.ink, marginTop: 4 }}>Add a new {ROLE_LABELS[role].toLowerCase()}</div>
            {!isHQ && (
              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4, fontStyle: "italic" }}>
                Campus admins can only invite ministry leaders for their own campus.
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}><X size={18} color={COLORS.inkSoft} /></button>
        </div>
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700, marginBottom: 6, display: "block" }}>Role</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {allowedRoles.map((r) => (
                <button key={r} onClick={() => setRole(r)} style={{
                  padding: "7px 12px", border: role === r ? `2px solid ${COLORS.forest}` : `1px solid ${COLORS.border}`,
                  borderRadius: 7, backgroundColor: role === r ? "rgba(212,255,0,0.06)" : "transparent",
                  fontFamily: fontBody, fontWeight: 600, fontSize: 12, color: COLORS.ink, cursor: "pointer",
                }}>{ROLE_LABELS[r]}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700, marginBottom: 6, display: "block" }}>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah K." style={{ width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: fontBody, color: COLORS.ink, backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700, marginBottom: 6, display: "block" }}>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@ircchurch.org" style={{ width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: fontBody, color: COLORS.ink, backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          {role !== ROLE_HQ && (
            <div>
              <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700, marginBottom: 6, display: "block" }}>Campus</label>
              <select disabled={!isHQ} value={campusId} onChange={(e) => { setCampusId(e.target.value); setMinistryId(""); }} style={{
                width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: fontBody, color: COLORS.ink,
                backgroundColor: isHQ ? COLORS.bg : COLORS.cream, border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none",
              }}>
                {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}{c.isHQ ? " (HQ)" : ""}</option>)}
              </select>
              {!isHQ && <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 4, fontStyle: "italic" }}>Locked to your campus.</div>}
            </div>
          )}
          {role === ROLE_MINISTRY && (
            <div>
              <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700, marginBottom: 6, display: "block" }}>Ministry</label>
              <select value={ministryId} onChange={(e) => setMinistryId(e.target.value)} style={{
                width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: fontBody, color: COLORS.ink,
                backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, outline: "none",
              }}>
                <option value="">— Pick a ministry —</option>
                {availableMinistries.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {availableMinistries.length === 0 && <div style={{ fontSize: 11, color: COLORS.amber, marginTop: 4, fontStyle: "italic" }}>No ministries on this campus yet — create one first.</div>}
            </div>
          )}
        </div>
        <div style={{ padding: "16px 22px", borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.bg, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 18px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: fontBody }}>Cancel</button>
          <button onClick={() => canSubmit && onInvite({ role, name, email, campusId, ministryId })} disabled={!canSubmit} style={{
            padding: "10px 22px", border: "none", borderRadius: 9,
            backgroundColor: canSubmit ? COLORS.forest : COLORS.cream,
            color: canSubmit ? ON_LIME : COLORS.inkSoft,
            fontWeight: 700, fontSize: 13, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: fontBody,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Mail size={13} /> Send invite
          </button>
        </div>
      </div>
    </div>
  );
};

const PeoplePage = ({ currentUser, users, campuses, ministries, admins }) => {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [recentInvite, setRecentInvite] = useState(null);

  const isHQ = currentUser?.role === ROLE_HQ;
  const isCampusAdmin = currentUser?.role === ROLE_CAMPUS;
  const isMinistryLeader = currentUser?.role === ROLE_MINISTRY;

  // Group team. Team members have campus name like "Bellevue", "Tacoma", "All".
  const hqMembers = TEAM.filter((t) => accessToRole(t.access) === ROLE_HQ);
  const campusGroups = campuses.map((c) => {
    const members = TEAM.filter((t) => t.campus === c.name);
    const admin = members.find((m) => accessToRole(m.access) === ROLE_CAMPUS);
    const leaders = members.filter((m) => accessToRole(m.access) === ROLE_MINISTRY);
    return { campus: c, admin, leaders };
  });

  // Visibility: HQ sees everything. Campus admin sees only their campus. Ministry leader same (just their campus subtree, focusing on their own ministry).
  const visibleHQ = isHQ ? hqMembers : [];
  const visibleCampusGroups = isHQ ? campusGroups : campusGroups.filter((g) => g.campus.id === currentUser?.campusId);

  const toggleCampus = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));
  const canInvite = !isMinistryLeader;

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 600, color: COLORS.ink, letterSpacing: -0.5 }}>
            {isHQ ? "Org chart" : isCampusAdmin ? `${campuses.find((c) => c.id === currentUser.campusId)?.name} team` : "My team"}
          </div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>
            {isHQ ? `${TEAM.length} people across HQ + ${campuses.length} campuses` : isCampusAdmin ? `Your campus admins and ministry leaders` : "Your campus context"}
          </div>
        </div>
        {canInvite && (
          <button onClick={() => setInviteOpen(true)} style={{
            display: "flex", alignItems: "center", gap: 6, backgroundColor: COLORS.forest, color: ON_LIME,
            border: "none", padding: "10px 18px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody,
          }}>
            <UserPlus size={14} /> Invite {isCampusAdmin ? "ministry leader" : "member"}
          </button>
        )}
      </div>

      {/* RECENT INVITE FLASH */}
      {recentInvite && (
        <Card style={{ padding: 14, backgroundColor: "rgba(74,222,128,0.06)", borderColor: COLORS.green + "60", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: COLORS.green, color: ON_GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={14} strokeWidth={3} /></div>
          <div style={{ flex: 1, fontSize: 13, color: COLORS.ink }}>
            <strong>Invite sent.</strong> {recentInvite.name} ({recentInvite.email}) — {ROLE_LABELS[recentInvite.role]}
          </div>
          <button onClick={() => setRecentInvite(null)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: COLORS.inkSoft }}><X size={16} /></button>
        </Card>
      )}

      {/* HQ ADMIN SECTION */}
      {visibleHQ.length > 0 && (
        <Card style={{ padding: 22, position: "relative", overflow: "hidden", borderColor: COLORS.copper + "50" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: COLORS.copper }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 4 }}>
            <Shield size={16} color={COLORS.copper} />
            <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 600, color: COLORS.ink }}>HQ admins</div>
            <Pill tone="copper">{visibleHQ.length}</Pill>
            <span style={{ fontSize: 12, color: COLORS.inkSoft, marginLeft: "auto" }}>Org-wide access · all campuses</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {visibleHQ.map((p, i) => <PersonRow key={i} p={p} canEdit={isHQ} />)}
          </div>
        </Card>
      )}

      {/* CAMPUS SUBTREES */}
      {visibleCampusGroups.map((g) => {
        const open = expanded[g.campus.id] !== false; // default open
        const totalCount = (g.admin ? 1 : 0) + g.leaders.length;
        return (
          <Card key={g.campus.id} style={{ padding: 0, overflow: "hidden", borderColor: g.campus.color + "40" }}>
            <button
              onClick={() => toggleCampus(g.campus.id)}
              style={{
                width: "100%", padding: "16px 22px", display: "flex", alignItems: "center", gap: 12,
                backgroundColor: g.campus.color + "10", border: "none", cursor: "pointer", textAlign: "left", fontFamily: fontBody,
                borderBottom: open ? `1px solid ${COLORS.border}` : "none",
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: g.campus.color, color: textOnBg(g.campus.color), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisplay, fontWeight: 700, fontSize: 15 }}>{g.campus.short}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: fontDisplay, fontSize: 17, fontWeight: 600, color: COLORS.ink }}>{g.campus.name}</span>
                  {g.campus.isHQ && <Pill tone="copper">HQ</Pill>}
                </div>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
                  {g.campus.address} · {totalCount} {totalCount === 1 ? "person" : "people"}
                  {!g.admin && !g.campus.isHQ && <span style={{ color: COLORS.amber, fontWeight: 700 }}> · no campus admin assigned</span>}
                </div>
              </div>
              <ChevronRight size={16} color={COLORS.inkSoft} style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
            </button>
            {open && (
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                {g.admin ? (
                  <div>
                    <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 6 }}>Campus admin</div>
                    <PersonRow p={g.admin} canEdit={isHQ} />
                  </div>
                ) : g.campus.isHQ ? null : (
                  <div style={{ padding: 14, border: `1px dashed ${COLORS.border}`, borderRadius: 9, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 8 }}>No campus admin assigned to {g.campus.name}</div>
                    {isHQ && (
                      <button onClick={() => setInviteOpen(true)} style={{ background: COLORS.cream, border: `1px solid ${COLORS.border}`, padding: "7px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, fontFamily: fontBody, cursor: "pointer", color: COLORS.ink, display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <UserPlus size={12} /> Assign campus admin
                      </button>
                    )}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 6 }}>Ministry leaders ({g.leaders.length})</div>
                  {g.leaders.length === 0 ? (
                    <div style={{ padding: 14, border: `1px dashed ${COLORS.border}`, borderRadius: 9, fontSize: 12, color: COLORS.inkSoft, textAlign: "center", fontStyle: "italic" }}>
                      No ministry leaders yet on this campus.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {g.leaders.map((p, i) => {
                        const isSelf = currentUser?.role === ROLE_MINISTRY && p.email.startsWith(currentUser.id.replace("u-", ""));
                        return <PersonRow key={i} p={p} canEdit={isHQ || (isCampusAdmin && currentUser.campusId === g.campus.id)} />;
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {inviteOpen && (
        <InviteAdminModal
          currentUser={currentUser}
          campuses={campuses}
          ministries={ministries}
          onClose={() => setInviteOpen(false)}
          onInvite={(invite) => { setRecentInvite(invite); setInviteOpen(false); }}
        />
      )}

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
    name: "Stripe", logo: "S", color: "#635BFF", donations: true,
    desc: "Online giving via website & mobile. Auto-imports donations every 15 min.",
    fields: [
      { key: "secretKey", label: "Secret API key", placeholder: "sk_live_…", type: "password", required: true, help: "Dashboard → Developers → API keys" },
      { key: "webhookSecret", label: "Webhook signing secret", placeholder: "whsec_…", type: "password", required: false, help: "Developers → Webhooks → Signing secret" },
    ],
    perms: ["Read all charges", "Read customer info", "Webhook on charge.succeeded"],
  },
  {
    name: "Square", logo: "■", color: "#000000", donations: true,
    desc: "In-person giving via Square readers. Sun & Fri service offerings.",
    fields: [
      { key: "accessToken", label: "Access token", placeholder: "EAAAEx…", type: "password", required: true, help: "Developer Dashboard → Credentials → Access tokens" },
      { key: "locationId", label: "Location ID", placeholder: "L8X09F2…", type: "text", required: true, help: "Account & Settings → Business → Locations" },
    ],
    perms: ["Read payments", "Read locations", "Read items (offerings)"],
  },
  {
    name: "ACH Direct", logo: "$", color: "#4ADE80", donations: true,
    desc: "Direct bank transfers for tithes and large gifts. Lower fees than card.",
    fields: [
      { key: "bankRouting", label: "Bank routing number", placeholder: "123456789", type: "text", required: true },
      { key: "merchantId", label: "Merchant ID", placeholder: "MERCH_…", type: "text", required: true },
      { key: "apiToken", label: "API token", placeholder: "•••", type: "password", required: true },
    ],
    perms: ["Initiate ACH credits", "Read transaction status", "Webhook on settle"],
  },
  {
    name: "QuickBooks Online", logo: "Q", color: "#2CA01C", donations: false,
    desc: "Two-way accounting sync. Donations → income, receipts → expenses, classes per ministry. Org-wide only.",
    fields: [
      { key: "companyId", label: "Company / Realm ID", placeholder: "1234567890", type: "text", required: true, help: "Settings → Account & Settings → Billing → Company ID" },
      { key: "clientId", label: "OAuth Client ID", placeholder: "ABxxx…", type: "text", required: true },
      { key: "clientSecret", label: "OAuth Client Secret", placeholder: "•••", type: "password", required: true },
    ],
    perms: ["Read & write accounts", "Manage classes (ministries)", "Manage customers (donors)"],
  },
  {
    name: "Google Workspace", logo: "G", color: "#4285F4", donations: false,
    desc: "Single sign-on for ministry leaders. Calendar sync for events & camps. Org-wide only.",
    fields: [
      { key: "domain", label: "Workspace domain", placeholder: "ircchurch.org", type: "text", required: true },
      { key: "serviceAccount", label: "Service account email", placeholder: "irc-steward@…iam.gserviceaccount.com", type: "text", required: true, help: "Google Cloud Console → IAM & Admin → Service accounts" },
    ],
    perms: ["Read user directory", "Read calendar events"],
  },
  {
    name: "Mailchimp", logo: "M", color: "#FFE01B", donations: false,
    desc: "Auto-segment donors for thank-you emails, year-end giving statements.",
    fields: [
      { key: "apiKey", label: "API key", placeholder: "abc123…-us21", type: "password", required: true, help: "Account → Extras → API keys. Datacenter is the suffix after the dash." },
      { key: "audienceId", label: "Audience ID", placeholder: "a1b2c3d4e5", type: "text", required: true, help: "Audience → Settings → Audience name and defaults" },
    ],
    perms: ["Read & manage subscribers", "Send campaigns"],
  },
  {
    name: "Planning Center", logo: "P", color: "#4099FF", donations: true,
    desc: "Member directory, attendance, kids check-in, and Giving module donations.",
    fields: [
      { key: "appId", label: "Application ID", placeholder: "…", type: "text", required: true, help: "api.planningcenteronline.com → Personal Access Tokens" },
      { key: "secret", label: "Secret", placeholder: "•••", type: "password", required: true },
    ],
    perms: ["Read people", "Read check-ins", "Read giving"],
  },
];

// Pre-populate to match IRC's actual setup: Stripe org-wide, Square Main only, QuickBooks org-wide.
const INITIAL_CONNECTIONS = [
  { id: "conn-stripe-all",  integrationName: "Stripe", scope: "all", credentials: { secretKey: "sk_live_•••" }, connectedAt: Date.now() - 90 * 24 * 60 * 60 * 1000, lastSync: Date.now() - 2 * 60 * 1000 },
  { id: "conn-square-bellevue", integrationName: "Square", scope: "bellevue", credentials: { accessToken: "EAAAEx•••", locationId: "L8X09F•••" }, connectedAt: Date.now() - 60 * 24 * 60 * 60 * 1000, lastSync: Date.now() - 8 * 60 * 1000 },
  { id: "conn-qb-all",      integrationName: "QuickBooks Online", scope: "all", credentials: { companyId: "1234567890", clientId: "AB•••", clientSecret: "•••" }, connectedAt: Date.now() - 90 * 24 * 60 * 60 * 1000, lastSync: Date.now() - 60 * 60 * 1000 },
];

const ConnectionModal = ({ integration, existing, defaultScope, campuses, onConnect, onClose }) => {
  const [values, setValues] = useState(existing || {});
  const [reveal, setReveal] = useState({});
  const [scopeMode, setScopeMode] = useState(defaultScope || "all"); // 'all' | 'campus'
  const [scopeCampus, setScopeCampus] = useState(null); // campus id when scopeMode='campus'

  const supportsCampusScope = integration.donations;

  const requiredOk = integration.fields
    .filter((f) => f.required)
    .every((f) => (values[f.key] ?? "").trim().length > 0);
  const scopeOk = !supportsCampusScope || scopeMode === "all" || scopeCampus != null;
  const canSubmit = requiredOk && scopeOk;

  const submit = () => {
    if (!canSubmit) return;
    const scope = supportsCampusScope ? (scopeMode === "all" ? "all" : scopeCampus) : "all";
    onConnect(integration, values, scope);
  };

  const submitLabel = (() => {
    if (existing) return "Update credentials";
    if (!supportsCampusScope) return "Connect";
    if (scopeMode === "all") return "Connect for all campuses";
    if (!scopeCampus) return "Choose a campus";
    const c = campuses?.find((c) => c.id === scopeCampus);
    return `Connect for ${c?.name || ""}`;
  })();

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(10,10,10,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: COLORS.surface, borderRadius: 16, width: 600, maxWidth: "100%", maxHeight: "90vh",
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

          {!existing && (
            supportsCampusScope ? (
              <>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 4 }}>Campus routing</div>
                  <div style={{ fontFamily: fontSerif, fontSize: 17, color: COLORS.ink, fontStyle: "italic", marginBottom: 12 }}>
                    Choose how this integration serves your campuses.
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <button
                      onClick={() => setScopeMode("all")}
                      style={{
                        padding: 14, borderRadius: 10, fontFamily: fontBody, cursor: "pointer", textAlign: "left",
                        backgroundColor: scopeMode === "all" ? "rgba(212,255,0,0.08)" : COLORS.bg,
                        border: `2px solid ${scopeMode === "all" ? COLORS.forest : COLORS.border}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <Globe size={16} color={scopeMode === "all" ? COLORS.forest : COLORS.inkSoft} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>All campuses</span>
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.inkSoft, lineHeight: 1.45 }}>One account, one feed. Donations tagged by campus internally.</div>
                    </button>
                    <button
                      onClick={() => setScopeMode("campus")}
                      style={{
                        padding: 14, borderRadius: 10, fontFamily: fontBody, cursor: "pointer", textAlign: "left",
                        backgroundColor: scopeMode === "campus" ? "rgba(255,90,31,0.06)" : COLORS.bg,
                        border: `2px solid ${scopeMode === "campus" ? COLORS.copper : COLORS.border}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <MapPin size={16} color={scopeMode === "campus" ? COLORS.copper : COLORS.inkSoft} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>Specific campus</span>
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.inkSoft, lineHeight: 1.45 }}>Lock this account to one campus. Add another later for siblings.</div>
                    </button>
                  </div>
                </div>

                {scopeMode === "campus" && (
                  <div>
                    <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 8 }}>Pick a campus</div>
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${campuses.length}, 1fr)`, gap: 8 }}>
                      {campuses.map((c) => {
                        const sel = scopeCampus === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => setScopeCampus(c.id)}
                            style={{
                              padding: 12, borderRadius: 8, cursor: "pointer", fontFamily: fontBody, textAlign: "center",
                              backgroundColor: sel ? c.color + "20" : COLORS.bg,
                              border: `2px solid ${sel ? c.color : COLORS.border}`,
                            }}
                          >
                            <div style={{ width: 32, height: 32, borderRadius: 8, margin: "0 auto 6px", backgroundColor: c.color, color: textOnBg(c.color), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisplay, fontWeight: 700, fontSize: 14 }}>
                              {c.short}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.ink }}>{c.name}</div>
                            <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 2 }}>{c.subtitle}</div>
                            {c.isHQ && <div style={{ fontSize: 9, color: COLORS.copper, fontWeight: 700, marginTop: 4, letterSpacing: 0.4 }}>MAIN</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: 14, borderRadius: 9, backgroundColor: COLORS.cream, border: `1px solid ${COLORS.borderSoft}`, display: "flex", alignItems: "center", gap: 10 }}>
                <Globe size={16} color={COLORS.copper} />
                <div style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.5 }}>
                  <strong>Serves all campuses.</strong> {integration.name} is a back-office tool — no per-campus split needed.
                </div>
              </div>
            )
          )}

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

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.bg }}>
          {!existing && supportsCampusScope && (
            <div style={{ fontSize: 11, color: COLORS.inkSoft, fontStyle: "italic", marginBottom: 12, textAlign: "center" }}>
              You can change this later. Add another account for a different campus, or merge them back into one — anytime.
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "10px 18px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: fontBody }}>
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit}
              style={{
                padding: "10px 22px", border: "none", borderRadius: 9,
                fontWeight: 700, fontSize: 13, fontFamily: fontBody,
                cursor: canSubmit ? "pointer" : "not-allowed",
                backgroundColor: canSubmit ? COLORS.forest : COLORS.cream,
                color: canSubmit ? COLORS.bg : COLORS.inkSoft,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Link2 size={13} /> {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const IntegrationsPage = ({ campuses }) => {
  // Connections is an array — multiple instances per integration allowed
  // for donation providers (one per campus). Non-donation integrations
  // get one entry with scope='all'.
  const [connections, setConnections] = useState(INITIAL_CONNECTIONS);
  // editing: { integration, connection?, mode: 'new' | 'add-campus' | 'edit' }
  const [editing, setEditing] = useState(null);

  const formatRelative = (timestamp) => {
    const sec = Math.floor((Date.now() - timestamp) / 1000);
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  };

  const connect = (integration, credentials, scope) => {
    if (editing?.connection) {
      // Update existing
      const id = editing.connection.id;
      setConnections((cs) => cs.map((c) => c.id === id ? { ...c, credentials } : c));
    } else {
      // Add new
      setConnections((cs) => [...cs, {
        id: `conn-${integration.name.toLowerCase().replace(/\s+/g, "-")}-${scope}-${Date.now()}`,
        integrationName: integration.name,
        scope,
        credentials,
        connectedAt: Date.now(),
        lastSync: Date.now(),
      }]);
    }
    setEditing(null);
  };

  const disconnect = (connection) => {
    if (!confirm(`Disconnect this ${connection.integrationName} integration? Stored credentials will be cleared.`)) return;
    setConnections((cs) => cs.filter((c) => c.id !== connection.id));
  };

  const sync = (connection) => {
    setConnections((cs) => cs.map((c) => c.id === connection.id ? { ...c, lastSync: Date.now() } : c));
  };

  // Group connections per integration
  const connectionsFor = (integrationName) => connections.filter((c) => c.integrationName === integrationName);
  // Donation providers serving a given campus (either scope='all' or scope=campusId)
  const donationConnsForCampus = (campusId) => connections.filter((c) => {
    const int = INTEGRATIONS.find((i) => i.name === c.integrationName);
    return int?.donations && (c.scope === "all" || c.scope === campusId);
  });

  const totalConnected = connections.length;

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* HERO */}
      <Card style={{ padding: 24, backgroundColor: COLORS.cream, borderColor: COLORS.copper + "40" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.copper, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sparkles size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: fontSerif, fontSize: 22, fontWeight: 400, color: COLORS.ink, fontStyle: "italic" }}>
              One integration for everyone, or one per campus — your call.
            </div>
            <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 6, lineHeight: 1.55, maxWidth: 720 }}>
              Donation providers (Stripe, Square, ACH) can route to a single campus or be shared across all. Accounting tools stay org-wide. Connect more than one of the same provider to split donations cleanly between campuses.
            </div>
          </div>
        </div>
      </Card>

      {/* DONATION ROUTING MAP */}
      <Card style={{ padding: 22 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={14} color={COLORS.copper} />
            <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Donation routing · per campus</div>
          </div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>Where each campus's giving lands. Shared providers route to all four.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${campuses.length}, 1fr)`, gap: 12 }}>
          {campuses.map((c) => {
            const conns = donationConnsForCampus(c.id);
            return (
              <div key={c.id} style={{ padding: 16, borderRadius: 10, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${c.color}`, backgroundColor: COLORS.bg }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: c.color, color: textOnBg(c.color), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisplay, fontWeight: 700, fontSize: 14 }}>
                    {c.short}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{c.name}</span>
                      {c.isHQ && <span style={{ fontSize: 9, color: COLORS.copper, fontWeight: 700, padding: "1px 6px", borderRadius: 4, backgroundColor: COLORS.copper + "20", letterSpacing: 0.4 }}>HQ</span>}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{c.subtitle}</div>
                  </div>
                </div>
                {conns.length === 0 ? (
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, fontStyle: "italic" }}>
                    No donation providers · inheriting from {campuses.find((cc) => cc.isHQ)?.name}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {conns.map((conn) => {
                      const int = INTEGRATIONS.find((i) => i.name === conn.integrationName);
                      const shared = conn.scope === "all";
                      return (
                        <div key={conn.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: COLORS.ink }}>
                          {shared ? <Globe size={10} color={COLORS.forest} /> : <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: c.color }} />}
                          <span style={{ fontWeight: 600 }}>{int?.name || conn.integrationName}</span>
                          <span style={{ color: COLORS.inkSoft }}>· {shared ? "shared" : "direct"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* INTEGRATION CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {INTEGRATIONS.map((int) => {
          const conns = connectionsFor(int.name);
          const isConnected = conns.length > 0;

          return (
            <Card key={int.name} style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, backgroundColor: int.color,
                  color: int.color === "#FFE01B" ? "#000" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 22, flexShrink: 0,
                }}>{int.logo}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <div style={{ fontFamily: fontDisplay, fontSize: 19, fontWeight: 600, color: COLORS.ink }}>{int.name}</div>
                    {int.donations && (
                      <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, color: COLORS.copper, backgroundColor: COLORS.copper + "18", textTransform: "uppercase", letterSpacing: 0.4 }}>Donations</span>
                    )}
                    {isConnected ? (
                      <Pill tone="success">
                        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: COLORS.green, marginRight: 4, boxShadow: `0 0 0 3px ${COLORS.green}30` }} />
                        {conns.length} connected
                      </Pill>
                    ) : (
                      <Pill tone="neutral">Not connected</Pill>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5 }}>{int.desc}</div>
                </div>
              </div>

              {isConnected && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                  {conns.map((conn) => {
                    const isAll = conn.scope === "all";
                    const campus = isAll ? null : campuses.find((c) => c.id === conn.scope);
                    const chipColor = isAll ? COLORS.forest : (campus?.color || COLORS.inkSoft);
                    return (
                      <div key={conn.id} style={{ padding: 12, borderRadius: 9, backgroundColor: COLORS.bg, border: `1px solid ${COLORS.borderSoft}` }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                            backgroundColor: chipColor + "20", color: chipColor, textTransform: "uppercase", letterSpacing: 0.4,
                          }}>
                            {isAll ? <Globe size={11} /> : <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: chipColor }} />}
                            {isAll ? "All campuses" : `${campus?.name || conn.scope} only`}
                          </span>
                          <div style={{ fontSize: 11, color: COLORS.inkSoft }}>
                            Last sync <strong style={{ color: COLORS.green }}>{formatRelative(conn.lastSync)}</strong>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button onClick={() => sync(conn)} style={{ flex: 1, minWidth: 100, padding: "7px 12px", backgroundColor: COLORS.forest, color: ON_LIME, border: "none", borderRadius: 7, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                            <RefreshCw size={11} /> Sync now
                          </button>
                          <button onClick={() => setEditing({ integration: int, connection: conn, mode: "edit" })} style={{ padding: "7px 12px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 7, fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: fontBody }}>
                            Update
                          </button>
                          <button onClick={() => disconnect(conn)} style={{ padding: "7px 12px", backgroundColor: "transparent", color: COLORS.red, border: `1px solid ${COLORS.red}40`, borderRadius: 7, fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: fontBody }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isConnected && (
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
                {!isConnected ? (
                  <button onClick={() => setEditing({ integration: int, mode: "new" })} style={{ flex: 1, padding: "10px 14px", backgroundColor: COLORS.copper, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Link2 size={13} /> Connect {int.name}
                  </button>
                ) : int.donations ? (
                  <button onClick={() => setEditing({ integration: int, mode: "add-campus" })} style={{
                    flex: 1, padding: "10px 14px", backgroundColor: "transparent",
                    color: COLORS.copper, border: `1px solid ${COLORS.copper}80`,
                    borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: fontBody,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    <Plus size={12} /> Add for another campus
                  </button>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>

      {editing && (
        <ConnectionModal
          integration={editing.integration}
          existing={editing.connection?.credentials}
          defaultScope={editing.mode === "add-campus" ? "campus" : "all"}
          campuses={campuses}
          onConnect={connect}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

// ============================================================
// SETTINGS PAGE — theme toggle + other prefs
// ============================================================

// Mini-mockup preview that renders with a SPECIFIC theme regardless of the
// active one. Uses the theme's raw hex values so both previews always show
// their correct look.
const ThemeMockup = ({ palette }) => (
  <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${palette.border}`, backgroundColor: palette.bg }}>
    {/* Browser chrome */}
    <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 6, borderBottom: `1px solid ${palette.border}` }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#FF5F57" }} />
      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#FEBC2E" }} />
      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#28C840" }} />
    </div>
    <div style={{ display: "flex", minHeight: 180 }}>
      {/* Always-dark sidebar */}
      <div style={{ width: 60, backgroundColor: "#000", padding: "10px 6px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: palette.copper }} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ width: "100%", height: 8, borderRadius: 2, backgroundColor: i === 1 ? palette.copper : "rgba(255,255,255,0.15)" }} />
        ))}
      </div>
      <div style={{ flex: 1, padding: 12 }}>
        <div style={{ height: 14, width: "60%", backgroundColor: palette.ink, borderRadius: 3, marginBottom: 10, opacity: 0.8 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 12 }}>
          {[palette.ink, palette.copper, palette.forest].map((c, i) => (
            <div key={i} style={{ padding: 8, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 6 }}>
              <div style={{ height: 6, width: "55%", backgroundColor: palette.inkSoft, borderRadius: 2, marginBottom: 5, opacity: 0.6 }} />
              <div style={{ height: 10, width: "70%", backgroundColor: c, borderRadius: 2 }} />
            </div>
          ))}
        </div>
        <div style={{ padding: 8, backgroundColor: palette.surface, border: `1px solid ${palette.border}`, borderRadius: 6 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 32 }}>
            {[55, 50, 62, 70, 64, 58, 55, 60, 67, 70, 65, 95].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: palette.forest, borderRadius: 1, opacity: 0.85 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Donation routing modes shown in the Settings panel.
const ROUTING_MODES = [
  { id: "pooled",      label: "Pooled",      sublabel: "One master account",   desc: "All campuses' donations land in HQ Bellevue. Satellites inherit. Easiest start for a young multi-site.", icon: Globe,   recommended: true },
  { id: "hybrid",      label: "Hybrid",      sublabel: "Mixed routing",        desc: "Some sources pool to HQ, others route per campus. Define rules per source — best for transitions.", icon: Sparkles },
  { id: "independent", label: "Independent", sublabel: "Each campus its own",  desc: "Every campus collects its own donations into its own books. Full autonomy — usually after a campus matures.", icon: Building2 },
];

const AddSourceModal = ({ campus, onConnect, onClose }) => {
  const [picked, setPicked] = useState(null);
  const providers = INTEGRATIONS.filter((i) => i.donations);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(10,10,10,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: COLORS.surface, borderRadius: 16, width: 540, maxWidth: "100%", display: "flex", flexDirection: "column", boxShadow: "0 25px 80px rgba(0,0,0,0.6)", border: `1px solid ${COLORS.border}` }}>
        <div style={{ padding: "22px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>{campus.name} · own source</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 19, fontWeight: 600, color: COLORS.ink, marginTop: 4 }}>Pick a provider for {campus.name}</div>
            <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4, fontStyle: "italic" }}>
              After this, {campus.name}'s donations stop inheriting from HQ Bellevue.
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}><X size={18} color={COLORS.inkSoft} /></button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            {providers.map((p) => {
              const sel = picked?.name === p.name;
              return (
                <button key={p.name} onClick={() => setPicked(p)} style={{
                  padding: 14, border: `2px solid ${sel ? COLORS.forest : COLORS.border}`, borderRadius: 10,
                  backgroundColor: sel ? "rgba(212,255,0,0.08)" : COLORS.bg, cursor: "pointer", fontFamily: fontBody,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: p.color, color: p.color === "#FFE01B" ? "#000" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>{p.logo}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.ink }}>{p.name}</div>
                </button>
              );
            })}
          </div>
          <div style={{ padding: 12, borderRadius: 9, border: `1px solid ${COLORS.copper}40`, backgroundColor: "rgba(255,90,31,0.06)", fontSize: 11, color: COLORS.inkSoft, lineHeight: 1.55 }}>
            <strong style={{ color: COLORS.ink }}>Reversible.</strong> You can switch back to HQ-pooled inheritance at any time from this panel.
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.bg, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 18px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: fontBody }}>Cancel</button>
          <button onClick={() => onConnect(picked)} disabled={!picked} style={{
            padding: "10px 22px", border: "none", borderRadius: 9,
            backgroundColor: picked ? COLORS.forest : COLORS.cream,
            color: picked ? ON_LIME : COLORS.inkSoft,
            fontWeight: 700, fontSize: 13, cursor: picked ? "pointer" : "not-allowed", fontFamily: fontBody,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Link2 size={13} /> Continue to provider
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmModeModal = ({ targetMode, onConfirm, onClose }) => {
  const cfg = ROUTING_MODES.find((m) => m.id === targetMode);
  const warning = targetMode === "independent"
    ? "Every satellite campus becomes financially independent. Their donations stop flowing to HQ Bellevue."
    : targetMode === "pooled"
    ? "All donations from every campus pool into HQ Bellevue's master account. Satellites lose any direct sources."
    : "You'll define routing rules per source or campus. Next step is the rule editor.";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(10,10,10,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: COLORS.surface, borderRadius: 16, width: 480, maxWidth: "100%", boxShadow: "0 25px 80px rgba(0,0,0,0.6)", border: `1px solid ${COLORS.border}` }}>
        <div style={{ padding: 22, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: COLORS.amber + "20", color: COLORS.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: COLORS.amber, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Switch routing mode</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>Confirm: {cfg.label}</div>
          </div>
        </div>
        <div style={{ padding: 22, fontSize: 13, color: COLORS.ink, lineHeight: 1.6 }}>
          <p style={{ margin: 0, marginBottom: 12 }}>{warning}</p>
          <div style={{ padding: 12, borderRadius: 9, border: `1px solid ${COLORS.green}40`, backgroundColor: "rgba(74,222,128,0.06)", fontSize: 12, color: COLORS.inkSoft }}>
            <strong style={{ color: COLORS.ink }}>Existing donation history is preserved.</strong> This change applies to future donations only.
          </div>
        </div>
        <div style={{ padding: "16px 22px", borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.bg, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 18px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: fontBody }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: "10px 22px", border: "none", borderRadius: 9,
            backgroundColor: COLORS.forest, color: ON_LIME,
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody,
          }}>Switch to {cfg.label}</button>
        </div>
      </div>
    </div>
  );
};

const DonationRoutingPanel = ({ currentUser, campuses, routingMode, setRoutingMode, connections, upsertConnection }) => {
  const [pendingMode, setPendingMode] = useState(null);
  const [addSourceFor, setAddSourceFor] = useState(null);
  const isHQ = currentUser?.role === ROLE_HQ;

  // Group connections by campus for the routing map.
  const sourcesForCampus = (campusId) => {
    const direct = connections.filter((c) => c.scope === campusId);
    const inherited = connections.filter((c) => c.scope === "all");
    const isHQCampus = campuses.find((cc) => cc.id === campusId)?.isHQ;
    return { direct, inherited: isHQCampus ? [] : inherited, isHQCampus };
  };

  const liveSourceCount = connections.length;
  const inheritingCount = campuses.filter((c) => !c.isHQ && connections.filter((cc) => cc.scope === c.id).length === 0).length;
  const totalSatellites = campuses.filter((c) => !c.isHQ).length;

  const handleSwitchMode = (newMode) => { if (newMode === routingMode) return; setPendingMode(newMode); };
  const confirmModeSwitch = () => { setRoutingMode(pendingMode); setPendingMode(null); };

  const handleAddSource = (provider) => {
    const conn = {
      id: `conn-${provider.name.toLowerCase().replace(/\s/g, "-")}-${addSourceFor.id}-${Date.now()}`,
      integrationName: provider.name,
      scope: addSourceFor.id,
      credentials: { mock: "demo" },
      connectedAt: Date.now(),
      lastSync: Date.now(),
    };
    upsertConnection(conn);
    setAddSourceFor(null);
  };

  return (
    <Card style={{ padding: 24 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 22, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Donation routing</div>
          <div style={{ fontFamily: fontSerif, fontSize: 24, fontStyle: "italic", color: COLORS.ink, marginTop: 6, letterSpacing: -0.4 }}>
            {isHQ ? "Pick the master mode for the whole org." : currentUser?.role === ROLE_CAMPUS ? "Read-only summary for your campus." : "Contact your campus admin to change routing."}
          </div>
          <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 6, lineHeight: 1.55, maxWidth: 620 }}>
            One source for everyone, or one per campus — your call. Donation providers (Stripe, Square, ACH) can pool to HQ or split per campus. Accounting tools stay org-wide.
          </div>
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          <div>
            <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Live sources</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 600, color: COLORS.ink, marginTop: 2, letterSpacing: -0.5 }}>{liveSourceCount}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Inheriting</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 600, color: COLORS.forestText, marginTop: 2, letterSpacing: -0.5 }}>{inheritingCount}/{totalSatellites}</div>
          </div>
        </div>
      </div>

      {/* MODE PICKER (HQ only) */}
      {isHQ ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 22 }}>
          {ROUTING_MODES.map((m) => {
            const active = routingMode === m.id;
            const Icon = m.icon;
            return (
              <button key={m.id} onClick={() => handleSwitchMode(m.id)} style={{
                padding: 18, borderRadius: 12, fontFamily: fontBody, cursor: "pointer", textAlign: "left",
                backgroundColor: active ? "rgba(212,255,0,0.06)" : COLORS.bg,
                border: `2px solid ${active ? COLORS.forest : COLORS.border}`,
                position: "relative", display: "flex", flexDirection: "column", gap: 6,
              }}>
                {m.recommended && <div style={{ position: "absolute", top: -8, left: 12, padding: "2px 8px", borderRadius: 99, backgroundColor: COLORS.copper, color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Recommended for IRC today</div>}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon size={18} color={active ? COLORS.forestText : COLORS.inkSoft} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{m.label}</span>
                  {active && <Pill tone="forest">Active</Pill>}
                </div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, fontWeight: 600 }}>{m.sublabel}</div>
                <div style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.5, marginTop: 4 }}>{m.desc}</div>
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: 14, borderRadius: 9, backgroundColor: COLORS.cream, border: `1px solid ${COLORS.borderSoft}`, marginBottom: 22, display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: COLORS.ink }}>
          <Info size={14} color={COLORS.inkSoft} />
          Routing mode is set by HQ. Current: <strong>{ROUTING_MODES.find((m) => m.id === routingMode)?.label}</strong>.
        </div>
      )}

      {/* CAMPUS ROUTING MAP */}
      <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 10 }}>
        Campus routing · per source
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {campuses.map((c) => {
          const { direct, inherited, isHQCampus } = sourcesForCampus(c.id);
          const independent = !isHQCampus && direct.length > 0;
          const inheriting = !isHQCampus && direct.length === 0;
          // Visibility: HQ sees all; campus admin sees only their campus; ministry leader sees only their campus.
          if (!isHQ && currentUser?.campusId && currentUser.campusId !== c.id) return null;

          return (
            <div key={c.id} style={{
              padding: 16, borderRadius: 11,
              border: inheriting ? `2px dashed ${COLORS.border}` : `2px solid ${isHQCampus ? COLORS.copper + "60" : c.color}`,
              backgroundColor: inheriting ? COLORS.bg : isHQCampus ? "rgba(255,90,31,0.04)" : c.color + "10",
              opacity: inheriting ? 0.85 : 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: c.color, color: textOnBg(c.color), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisplay, fontWeight: 700, fontSize: 14 }}>{c.short}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: COLORS.inkSoft }}>{c.address}</div>
                  </div>
                </div>
                {isHQCampus && <Pill tone="copper">HQ · master</Pill>}
                {independent && <Pill tone="forest">Independent</Pill>}
                {inheriting && <Pill tone="neutral">Shared with HQ</Pill>}
              </div>

              {isHQCampus && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {direct.map((conn) => (
                    <div key={conn.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.ink }}>
                      <Check size={12} color={COLORS.green} /> {conn.integrationName}
                      {conn.integrationName === "Stripe" && <span style={{ marginLeft: "auto", padding: "1px 6px", borderRadius: 4, backgroundColor: COLORS.amber + "30", color: COLORS.amber, fontSize: 9, fontWeight: 700, letterSpacing: 0.4 }}>MASTER</span>}
                    </div>
                  ))}
                  {inherited.map((conn) => (
                    <div key={conn.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.ink }}>
                      <Check size={12} color={COLORS.green} /> {conn.integrationName}
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 6, fontStyle: "italic" }}>Funds the org · {direct.length + inherited.length} live sources</div>
                </div>
              )}

              {independent && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {direct.map((conn) => (
                    <div key={conn.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.ink }}>
                      <Check size={12} color={COLORS.green} /> {conn.integrationName} · direct
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 6, fontStyle: "italic" }}>Independent · {direct.length} own source{direct.length === 1 ? "" : "s"}</div>
                </div>
              )}

              {inheriting && (
                <>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, fontStyle: "italic", marginBottom: 8 }}>Inheriting from Bellevue HQ</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {inherited.map((conn) => (
                      <div key={conn.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: COLORS.inkSoft, fontStyle: "italic" }}>
                        <Globe size={11} /> {conn.integrationName}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    {isHQ ? (
                      <button onClick={() => setAddSourceFor(c)} style={{
                        padding: "7px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 7,
                        backgroundColor: COLORS.cream, color: COLORS.ink, fontFamily: fontBody, fontWeight: 600, fontSize: 11,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <Plus size={11} /> Connect own source
                      </button>
                    ) : currentUser?.campusId === c.id && currentUser?.role === ROLE_CAMPUS ? (
                      <button style={{
                        padding: "7px 12px", border: `1px solid ${COLORS.copper}`, borderRadius: 7,
                        backgroundColor: COLORS.copper + "15", color: COLORS.copper, fontFamily: fontBody, fontWeight: 700, fontSize: 11,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <Mail size={11} /> Request own source from HQ
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: COLORS.inkSoft, fontStyle: "italic" }}>Contact HQ to add a source</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* LEGEND */}
      {isHQ && (
        <div style={{ marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 10, color: COLORS.inkSoft, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, border: `2px solid ${COLORS.copper}60`, borderRadius: 3, backgroundColor: "rgba(255,90,31,0.04)" }} /> HQ master</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, border: `2px dashed ${COLORS.border}`, borderRadius: 3 }} /> Inheriting</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, border: `2px solid ${COLORS.forest}`, borderRadius: 3 }} /> Independent</span>
        </div>
      )}

      {addSourceFor && <AddSourceModal campus={addSourceFor} onConnect={handleAddSource} onClose={() => setAddSourceFor(null)} />}
      {pendingMode && <ConfirmModeModal targetMode={pendingMode} onConfirm={confirmModeSwitch} onClose={() => setPendingMode(null)} />}
    </Card>
  );
};

const SettingsPage = ({ themeMode, setThemeMode, onSignOut, currentUser, campuses, routingMode, setRoutingMode, connections, upsertConnection }) => {
  const rows = [
    { icon: BellRing, label: "Notifications",   value: "Email + push",                onClick: () => {} },
    { icon: Globe,     label: "Time zone",       value: "Pacific (PT)",                onClick: () => {} },
    { icon: CreditCard,label: "Billing",         value: "Growth · $199/mo",            onClick: () => {} },
    { icon: Shield,    label: "Two-factor auth", value: "Enabled",                     active: true,    onClick: () => {} },
    { icon: Mail,      label: "Receipt forwarding", value: "receipts@steward.app",     onClick: () => {} },
  ];

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 1100 }}>

      {/* DONATION ROUTING */}
      <DonationRoutingPanel
        currentUser={currentUser}
        campuses={campuses}
        routingMode={routingMode}
        setRoutingMode={setRoutingMode}
        connections={connections}
        upsertConnection={upsertConnection}
      />

      {/* APPEARANCE */}
      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Appearance</div>
            <div style={{ fontFamily: fontSerif, fontSize: 24, fontStyle: "italic", color: COLORS.ink, marginTop: 6, letterSpacing: -0.4 }}>
              Pick the look that fits your day.
            </div>
            <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 6, lineHeight: 1.55, maxWidth: 540 }}>
              Lime accents and copper highlights stay consistent in both modes — that's the brand. The sidebar stays dark either way to keep your visual anchor.
            </div>
          </div>
          {/* Quick toggle pill */}
          <div style={{ padding: 4, borderRadius: 99, backgroundColor: COLORS.cream, border: `1px solid ${COLORS.border}`, display: "inline-flex", flexShrink: 0 }}>
            <button onClick={() => setThemeMode("dark")} style={{
              padding: "8px 14px", borderRadius: 99, border: "none", cursor: "pointer", fontFamily: fontBody, fontWeight: 700, fontSize: 12,
              backgroundColor: themeMode === "dark" ? "#000" : "transparent",
              color: themeMode === "dark" ? "#FAFAFA" : COLORS.ink,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Flame size={12} /> Dark
            </button>
            <button onClick={() => setThemeMode("light")} style={{
              padding: "8px 14px", borderRadius: 99, border: "none", cursor: "pointer", fontFamily: fontBody, fontWeight: 700, fontSize: 12,
              backgroundColor: themeMode === "light" ? COLORS.forest : "transparent",
              color: themeMode === "light" ? ON_LIME : COLORS.ink,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Sparkles size={12} /> Light
            </button>
          </div>
        </div>

        {/* Two big preview cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}>
          {[
            { mode: "dark",  palette: THEME_DARK,  label: "Dark",  desc: "Default. Easy on the eyes for long sessions." },
            { mode: "light", palette: THEME_LIGHT, label: "Light", desc: "Cream canvas. Matches the marketing site." },
          ].map((t) => {
            const active = themeMode === t.mode;
            return (
              <button
                key={t.mode}
                onClick={() => setThemeMode(t.mode)}
                style={{
                  padding: 14, borderRadius: 14, fontFamily: fontBody, cursor: "pointer", textAlign: "left",
                  backgroundColor: active ? "rgba(212,255,0,0.04)" : COLORS.surface,
                  border: `2px solid ${active ? COLORS.forest : COLORS.border}`,
                  boxShadow: active ? `0 12px 36px ${COLORS.forest}25` : "none",
                  transition: "all 0.18s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 700, color: COLORS.ink }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{t.desc}</div>
                  </div>
                  {active && <Pill tone="forest">Active</Pill>}
                </div>
                <ThemeMockup palette={t.palette} />
              </button>
            );
          })}
        </div>
      </Card>

      {/* OTHER SETTINGS */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {rows.map((row, i) => {
          const Icon = row.icon;
          return (
            <button
              key={i}
              onClick={row.onClick}
              style={{
                width: "100%", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
                backgroundColor: "transparent", border: "none", cursor: "pointer", fontFamily: fontBody, textAlign: "left",
                borderBottom: i < rows.length - 1 ? `1px solid ${COLORS.borderSoft}` : "none",
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.cream, color: COLORS.copper, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{row.label}</div>
              </div>
              <div style={{ fontSize: 12, color: row.active ? COLORS.green : COLORS.copper, fontWeight: 600 }}>
                {row.value}
              </div>
              <ChevronRight size={14} color={COLORS.inkSoft} />
            </button>
          );
        })}
      </Card>

      {/* SIGN OUT */}
      <Card style={{ padding: 18, borderColor: COLORS.red + "40", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>Sign out</div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>You'll need to sign in again to access this admin.</div>
        </div>
        <button onClick={onSignOut} style={{
          padding: "10px 18px", border: `1px solid ${COLORS.red}80`, borderRadius: 9,
          backgroundColor: "transparent", color: COLORS.red, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody,
        }}>
          Sign out
        </button>
      </Card>

    </div>
  );
};

// ============================================================
// REPORTS PAGE
// ============================================================

const REPORT_DEFINITIONS = [
  { id: "annual",   name: "Annual Financial Statement", desc: "Full P&L, cash flow, balance sheet — board-ready",                      icon: FileText,  get color() { return COLORS.forestText; }, formats: ["PDF", "Excel"],          lastRun: "Dec 31, 2025", badge: null },
  { id: "donor",    name: "Donor Year-End Letters",     desc: "Auto-merged from Stripe, Square, and manual entries",                  icon: Mail,      get color() { return COLORS.copper; },     formats: ["PDF", "Mail-merge"],     lastRun: "Dec 10, 2025", badge: { label: "387 ready to send", tone: "success" } },
  { id: "ministry", name: "Ministry Budget vs. Actual", desc: "Per-ministry variance highlighted, drill into any line item",          icon: BarChart3, get color() { return COLORS.green; },      formats: ["PDF", "Excel", "Sheets"], lastRun: "Apr 30, 2026", badge: null },
  { id: "campus",   name: "Campus Comparison",          desc: "Side-by-side P&L and KPIs across every campus",                        icon: Building2, color: "#A78BFA",                          formats: ["PDF", "Sheets"],         lastRun: "Apr 15, 2026", badge: null },
  { id: "board",    name: "Board Pack",                 desc: "Full board deck — KPIs, alerts, decisions awaiting sign-off",          icon: FileText,  get color() { return COLORS.red; },        formats: ["PDF", "PowerPoint"],     lastRun: "May 1, 2026",  badge: { label: "Auto · 1st of month", tone: "copper" } },
  { id: "990",      name: "IRS Form 990 Worksheet",     desc: "Pre-filled rows mapped from QuickBooks classes and accounts",         icon: Shield,    get color() { return COLORS.amber; },      formats: ["PDF", "Excel"],          lastRun: "—",           badge: null },
];

const PERIOD_OPTIONS = [
  { id: "ytd",    label: "Year to date" },
  { id: "q1",     label: "Q1 2026" },
  { id: "fy2025", label: "FY 2025" },
  { id: "custom", label: "Custom" },
];

// Trigger a real file download in the browser.
const downloadFile = (filename, content, mime = "text/csv;charset=utf-8") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Open a styled print-ready window. User saves as PDF via the browser's print dialog.
const openPrintWindow = (title, bodyHtml) => {
  const win = window.open("", "_blank", "width=900,height=800");
  if (!win) { alert("Popup blocked. Allow popups to print PDF reports."); return; }
  win.document.write(`<!doctype html><html><head><title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700&family=Manrope:wght@400;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Manrope', sans-serif; padding: 50px 40px; max-width: 820px; margin: 0 auto; color: #0A0A0A; }
      .brand { display: flex; align-items: center; gap: 10px; padding-bottom: 20px; border-bottom: 1px solid #ccc; margin-bottom: 30px; }
      .brand-mark { width: 32px; height: 32px; border-radius: 8px; background: #D4FF00; color: #000; display: flex; align-items: center; justify-content: center; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 18px; }
      .brand-name { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 18px; }
      h1 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 36px; font-weight: 600; letter-spacing: -1px; margin: 0 0 4px; line-height: 1.1; }
      h1 em { font-family: 'Instrument Serif', serif; font-weight: 400; color: #FF5A1F; }
      h2 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 18px; font-weight: 700; margin: 30px 0 12px; color: #0A0A0A; }
      .meta { font-size: 13px; color: #5C5C5C; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin: 0 0 24px; font-size: 13px; }
      th { background: #FBF7F0; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 700; color: #5C5C5C; border-bottom: 1px solid #ddd; }
      td { padding: 10px 12px; border-bottom: 1px solid #eee; }
      tr.total td { font-weight: 700; background: #f5f1e9; border-top: 2px solid #0A0A0A; border-bottom: none; }
      .num { text-align: right; font-variant-numeric: tabular-nums; }
      .pos { color: #3FA961; }
      .neg { color: #E11D74; }
      .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 0 0 24px; }
      .stat { padding: 16px; border: 1px solid #ddd; border-radius: 10px; }
      .stat .label { font-size: 11px; color: #5C5C5C; text-transform: uppercase; font-weight: 700; letter-spacing: 0.4px; }
      .stat .value { font-family: 'Bricolage Grotesque', sans-serif; font-size: 24px; font-weight: 600; margin-top: 6px; letter-spacing: -0.5px; }
      .footer { font-size: 11px; color: #5C5C5C; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; }
      @media print { body { padding: 25px; } }
    </style></head><body>${bodyHtml}<script>setTimeout(() => window.print(), 300);</script></body></html>`);
  win.document.close();
};

const csvEscape = (v) => {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};
const csvRow = (cells) => cells.map(csvEscape).join(",");
const fmtCsv = (n) => Number(n).toFixed(2);
const todayStr = () => new Date().toISOString().slice(0, 10);

// Build a report context from the current scope (campus or "all").
const buildReportCtx = ({ ministries, payments, campuses, scope, periodLabel }) => {
  const campus = scope === "all" ? null : campuses.find((c) => c.id === scope);
  const scopeName = scope === "all" ? "All Campuses (HQ rollup)" : `${campus.name} · ${campus.address}`;
  const scopedMinistries = scope === "all" ? ministries : ministries.filter((m) => m.campusId === scope);
  const scopedPayments = scope === "all" ? payments : payments.filter((p) => p.campusId === scope);
  const monthlyOverhead = scopedPayments.reduce((s, p) => s + p.amount, 0);
  const ministryBudget = scopedMinistries.reduce((s, m) => s + m.budget, 0);
  const ministrySpent = scopedMinistries.reduce((s, m) => s + m.spent, 0);
  return {
    scope, scopeName, periodLabel,
    campus, campuses,
    ministries: scopedMinistries,
    payments: scopedPayments,
    monthlyOverhead,
    annualOverhead: monthlyOverhead * 12,
    ministryBudget,
    ministrySpent,
    ministryVariance: ministryBudget - ministrySpent,
    generatedAt: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
  };
};

// Per-report CSV builders.
const REPORT_CSV = {
  annual: (ctx) => [
    csvRow(["Annual Financial Statement"]),
    csvRow(["Scope", ctx.scopeName]),
    csvRow(["Period", ctx.periodLabel]),
    csvRow(["Generated", ctx.generatedAt]),
    "",
    csvRow(["Section", "Amount"]),
    csvRow(["Annual operating overhead", fmtCsv(ctx.annualOverhead)]),
    csvRow(["Ministry budget", fmtCsv(ctx.ministryBudget)]),
    csvRow(["Ministry spent YTD", fmtCsv(ctx.ministrySpent)]),
    csvRow(["Ministry variance", fmtCsv(ctx.ministryVariance)]),
    "",
    csvRow(["Ministry", "Budget", "Spent", "Variance", "% used"]),
    ...ctx.ministries.map((m) => csvRow([m.name, fmtCsv(m.budget), fmtCsv(m.spent), fmtCsv(m.budget - m.spent), `${Math.round((m.spent / m.budget) * 100)}%`])),
  ].join("\n"),

  donor: (ctx) => [
    csvRow(["Donor Year-End Letter Data"]),
    csvRow(["Scope", ctx.scopeName]),
    csvRow(["Period", ctx.periodLabel]),
    csvRow(["Generated", ctx.generatedAt]),
    "",
    csvRow(["Donor name", "Email", "Total giving", "Last gift", "Pledge fulfilled"]),
    ...["Anonymous", "M. Petrov", "Sarah K.", "J. Williams", "T. Garcia", "L. Vinogradov"].map((d, i) => csvRow([d, `${d.toLowerCase().replace(/[^a-z]/g, "")}@email.com`, (1200 + i * 350).toFixed(2), "2025-12-28", i % 2 ? "Yes" : "Partial"])),
  ].join("\n"),

  ministry: (ctx) => [
    csvRow(["Ministry Budget vs. Actual"]),
    csvRow(["Scope", ctx.scopeName]),
    csvRow(["Period", ctx.periodLabel]),
    csvRow(["Generated", ctx.generatedAt]),
    "",
    csvRow(["Ministry", "Leader", "Budget", "Spent", "Remaining", "% used", "Status"]),
    ...ctx.ministries.map((m) => {
      const pct = m.spent / m.budget;
      const status = pct > 0.95 ? "Over budget" : pct > 0.8 ? "Watch" : "On track";
      return csvRow([m.name, m.leader || "—", fmtCsv(m.budget), fmtCsv(m.spent), fmtCsv(m.budget - m.spent), `${Math.round(pct * 100)}%`, status]);
    }),
  ].join("\n"),

  campus: (ctx) => [
    csvRow(["Campus Comparison"]),
    csvRow(["Scope", ctx.scopeName]),
    csvRow(["Period", ctx.periodLabel]),
    csvRow(["Generated", ctx.generatedAt]),
    "",
    csvRow(["Campus", "Type", "Donations", "Expenses", "Net", "Members", "Ministries"]),
    ...ctx.campuses.map((c) => csvRow([c.name, c.isHQ ? "HQ" : "Satellite", fmtCsv(c.donations), fmtCsv(c.expenses), fmtCsv(c.donations - c.expenses), c.members, c.ministries])),
  ].join("\n"),

  board: (ctx) => [
    csvRow(["Board Pack"]),
    csvRow(["Scope", ctx.scopeName]),
    csvRow(["Period", ctx.periodLabel]),
    csvRow(["Generated", ctx.generatedAt]),
    "",
    csvRow(["Metric", "Value"]),
    csvRow(["Annual operating overhead", fmtCsv(ctx.annualOverhead)]),
    csvRow(["Total ministry budget", fmtCsv(ctx.ministryBudget)]),
    csvRow(["Ministry YTD spent", fmtCsv(ctx.ministrySpent)]),
    csvRow(["Variance to budget", fmtCsv(ctx.ministryVariance)]),
    csvRow(["Recurring monthly payments", ctx.payments.length]),
    csvRow(["Active ministries", ctx.ministries.length]),
  ].join("\n"),

  990: (ctx) => [
    csvRow(["IRS Form 990 Worksheet"]),
    csvRow(["Scope", ctx.scopeName]),
    csvRow(["Period", ctx.periodLabel]),
    csvRow(["Generated", ctx.generatedAt]),
    "",
    csvRow(["Line", "Description", "Amount"]),
    csvRow(["1a", "Federated campaigns", "0.00"]),
    csvRow(["1b", "Membership dues", "0.00"]),
    csvRow(["1f", "All other contributions", fmtCsv(ctx.ministryBudget * 0.85)]),
    csvRow(["7", "Total revenue", fmtCsv(ctx.annualOverhead + ctx.ministryBudget)]),
    csvRow(["13", "Grants & similar amounts", "0.00"]),
    csvRow(["15", "Compensation of officers", fmtCsv(ctx.annualOverhead * 0.4)]),
    csvRow(["18", "Total expenses", fmtCsv(ctx.annualOverhead)]),
    csvRow(["19", "Revenue less expenses", fmtCsv(ctx.ministryBudget - ctx.annualOverhead * 0.5)]),
  ].join("\n"),
};

// Per-report HTML builders for printable PDF.
const REPORT_HTML = {
  annual: (ctx) => `
    <div class="brand"><div class="brand-mark">S</div><div class="brand-name">Steward</div></div>
    <h1>Annual Financial <em>Statement.</em></h1>
    <div class="meta">${ctx.scopeName} · ${ctx.periodLabel} · Generated ${ctx.generatedAt}</div>
    <div class="stat-grid">
      <div class="stat"><div class="label">Annual overhead</div><div class="value">$${ctx.annualOverhead.toLocaleString()}</div></div>
      <div class="stat"><div class="label">Ministry budget</div><div class="value">$${ctx.ministryBudget.toLocaleString()}</div></div>
      <div class="stat"><div class="label">YTD spent</div><div class="value">$${ctx.ministrySpent.toLocaleString()}</div></div>
      <div class="stat"><div class="label">Variance</div><div class="value pos">$${ctx.ministryVariance.toLocaleString()}</div></div>
    </div>
    <h2>Ministry breakdown</h2>
    <table><thead><tr><th>Ministry</th><th>Leader</th><th class="num">Budget</th><th class="num">Spent</th><th class="num">Variance</th></tr></thead><tbody>
      ${ctx.ministries.map((m) => `<tr><td>${m.name}</td><td>${m.leader || "—"}</td><td class="num">$${m.budget.toLocaleString()}</td><td class="num">$${m.spent.toLocaleString()}</td><td class="num pos">$${(m.budget - m.spent).toLocaleString()}</td></tr>`).join("")}
      <tr class="total"><td colspan="2">Total</td><td class="num">$${ctx.ministryBudget.toLocaleString()}</td><td class="num">$${ctx.ministrySpent.toLocaleString()}</td><td class="num pos">$${ctx.ministryVariance.toLocaleString()}</td></tr>
    </tbody></table>
    <div class="footer">Prepared by Steward · steward.app · Confidential</div>
  `,

  ministry: (ctx) => `
    <div class="brand"><div class="brand-mark">S</div><div class="brand-name">Steward</div></div>
    <h1>Ministry Budget vs. <em>Actual.</em></h1>
    <div class="meta">${ctx.scopeName} · ${ctx.periodLabel} · Generated ${ctx.generatedAt}</div>
    <table><thead><tr><th>Ministry</th><th>Leader</th><th class="num">Budget</th><th class="num">Spent</th><th class="num">% Used</th><th>Status</th></tr></thead><tbody>
      ${ctx.ministries.map((m) => { const pct = m.spent / m.budget; const status = pct > 0.95 ? "Over" : pct > 0.8 ? "Watch" : "On track"; return `<tr><td>${m.name}</td><td>${m.leader || "—"}</td><td class="num">$${m.budget.toLocaleString()}</td><td class="num">$${m.spent.toLocaleString()}</td><td class="num">${Math.round(pct * 100)}%</td><td>${status}</td></tr>`; }).join("")}
    </tbody></table>
    <div class="footer">Prepared by Steward · steward.app</div>
  `,

  campus: (ctx) => `
    <div class="brand"><div class="brand-mark">S</div><div class="brand-name">Steward</div></div>
    <h1>Campus <em>Comparison.</em></h1>
    <div class="meta">${ctx.periodLabel} · Generated ${ctx.generatedAt}</div>
    <table><thead><tr><th>Campus</th><th>Type</th><th class="num">Donations</th><th class="num">Expenses</th><th class="num">Net</th><th class="num">Members</th></tr></thead><tbody>
      ${ctx.campuses.map((c) => { const net = c.donations - c.expenses; return `<tr><td>${c.name}</td><td>${c.isHQ ? "HQ" : "Satellite"}</td><td class="num">$${c.donations.toLocaleString()}</td><td class="num">$${c.expenses.toLocaleString()}</td><td class="num ${net >= 0 ? "pos" : "neg"}">${net >= 0 ? "+" : ""}$${net.toLocaleString()}</td><td class="num">${c.members}</td></tr>`; }).join("")}
    </tbody></table>
    <div class="footer">Prepared by Steward · steward.app</div>
  `,

  board: (ctx) => `
    <div class="brand"><div class="brand-mark">S</div><div class="brand-name">Steward</div></div>
    <h1>Board <em>Pack.</em></h1>
    <div class="meta">${ctx.scopeName} · ${ctx.periodLabel} · Generated ${ctx.generatedAt}</div>
    <h2>Key metrics</h2>
    <div class="stat-grid">
      <div class="stat"><div class="label">Annual overhead</div><div class="value">$${ctx.annualOverhead.toLocaleString()}</div></div>
      <div class="stat"><div class="label">Ministry budget</div><div class="value">$${ctx.ministryBudget.toLocaleString()}</div></div>
      <div class="stat"><div class="label">YTD spent</div><div class="value">$${ctx.ministrySpent.toLocaleString()}</div></div>
      <div class="stat"><div class="label">Variance</div><div class="value pos">$${ctx.ministryVariance.toLocaleString()}</div></div>
    </div>
    <h2>Ministry summary</h2>
    <table><thead><tr><th>Ministry</th><th class="num">Budget</th><th class="num">Spent</th></tr></thead><tbody>
      ${ctx.ministries.map((m) => `<tr><td>${m.name}</td><td class="num">$${m.budget.toLocaleString()}</td><td class="num">$${m.spent.toLocaleString()}</td></tr>`).join("")}
    </tbody></table>
    <h2>Recurring overhead</h2>
    <table><thead><tr><th>Line</th><th class="num">Day</th><th class="num">Monthly</th></tr></thead><tbody>
      ${ctx.payments.map((p) => `<tr><td>${p.name}</td><td class="num">${p.dayOfMonth}</td><td class="num">$${p.amount.toLocaleString()}</td></tr>`).join("")}
    </tbody></table>
    <div class="footer">Prepared by Steward · steward.app · Confidential</div>
  `,

  donor: (ctx) => `
    <div class="brand"><div class="brand-mark">S</div><div class="brand-name">Steward</div></div>
    <h1>Donor Year-End <em>Letter Data.</em></h1>
    <div class="meta">${ctx.scopeName} · ${ctx.periodLabel} · Generated ${ctx.generatedAt}</div>
    <table><thead><tr><th>Donor</th><th>Email</th><th class="num">Total</th><th>Last gift</th></tr></thead><tbody>
      ${["Anonymous", "M. Petrov", "Sarah K.", "J. Williams", "T. Garcia", "L. Vinogradov"].map((d, i) => `<tr><td>${d}</td><td>${d.toLowerCase().replace(/[^a-z]/g, "")}@email.com</td><td class="num">$${(1200 + i * 350).toLocaleString()}.00</td><td>2025-12-28</td></tr>`).join("")}
    </tbody></table>
    <div class="footer">Tax ID 91-XXXXXXX · Steward Church · Confidential</div>
  `,

  990: (ctx) => `
    <div class="brand"><div class="brand-mark">S</div><div class="brand-name">Steward</div></div>
    <h1>IRS Form 990 <em>Worksheet.</em></h1>
    <div class="meta">${ctx.scopeName} · ${ctx.periodLabel} · Generated ${ctx.generatedAt}</div>
    <table><thead><tr><th>Line</th><th>Description</th><th class="num">Amount</th></tr></thead><tbody>
      <tr><td>1a</td><td>Federated campaigns</td><td class="num">$0.00</td></tr>
      <tr><td>1b</td><td>Membership dues</td><td class="num">$0.00</td></tr>
      <tr><td>1f</td><td>All other contributions</td><td class="num">$${(ctx.ministryBudget * 0.85).toLocaleString()}</td></tr>
      <tr class="total"><td>7</td><td>Total revenue</td><td class="num">$${(ctx.annualOverhead + ctx.ministryBudget).toLocaleString()}</td></tr>
      <tr><td>15</td><td>Compensation of officers</td><td class="num">$${(ctx.annualOverhead * 0.4).toLocaleString()}</td></tr>
      <tr class="total"><td>18</td><td>Total expenses</td><td class="num">$${ctx.annualOverhead.toLocaleString()}</td></tr>
    </tbody></table>
    <div class="footer">Pre-filled from Steward · review with your accountant before filing</div>
  `,
};

const ReportsPage = ({ campuses, ministries, recurringPayments }) => {
  const [period, setPeriod] = useState("ytd");
  const [campusFilter, setCampusFilter] = useState("all");
  const [scopes, setScopes] = useState({});
  const [generating, setGenerating] = useState(null);

  const periodLabel = PERIOD_OPTIONS.find((p) => p.id === period)?.label || period;

  // Per-card scope falls back to global filter unless overridden.
  const scopeFor = (id) => scopes[id] !== undefined ? scopes[id] : campusFilter;
  const setScope = (id, val) => setScopes((s) => ({ ...s, [id]: val }));

  const generate = (id, format) => {
    const scope = scopeFor(id);
    const ctx = buildReportCtx({ ministries, payments: recurringPayments, campuses, scope, periodLabel });
    setGenerating(`${id}-${format}`);
    setTimeout(() => {
      if (format === "csv") {
        const csv = REPORT_CSV[id]?.(ctx) || "";
        const fname = `${id}_${scope}_${todayStr()}.csv`;
        downloadFile(fname, csv);
      } else if (format === "pdf") {
        const html = REPORT_HTML[id]?.(ctx) || `<h1>Report not available</h1>`;
        openPrintWindow(REPORT_DEFINITIONS.find((r) => r.id === id)?.name || id, html);
      }
      setGenerating(null);
    }, 600);
  };

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* HERO */}
      <Card style={{
        padding: 24, position: "relative", overflow: "hidden",
        background: `linear-gradient(135deg, ${COLORS.surface} 0%, rgba(212,255,0,0.06) 100%)`,
        borderColor: COLORS.forest + "40",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, backgroundColor: COLORS.forest }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>Reports</div>
            <div style={{ fontFamily: fontSerif, fontSize: 28, fontWeight: 400, fontStyle: "italic", color: COLORS.ink, marginTop: 6, lineHeight: 1.15, letterSpacing: -0.5 }}>
              One click. PDF, Excel, or Google Sheets — your choice.
            </div>
            <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 6 }}>
              Generate any report in seconds. Schedule the recurring ones to run themselves.
            </div>
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <div>
              <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Generated YTD</div>
              <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 600, color: COLORS.ink, marginTop: 2, letterSpacing: -0.5 }}>47</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Auto-scheduled</div>
              <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 600, color: COLORS.forestText, marginTop: 2, letterSpacing: -0.5 }}>3</div>
            </div>
          </div>
        </div>
      </Card>

      {/* FILTER BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          {/* Period */}
          <div>
            <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 6 }}>Period</div>
            <div style={{ display: "flex", gap: 4, padding: 4, backgroundColor: COLORS.cream, borderRadius: 99, border: `1px solid ${COLORS.border}` }}>
              {PERIOD_OPTIONS.map((opt) => {
                const active = period === opt.id;
                return (
                  <button key={opt.id} onClick={() => setPeriod(opt.id)} style={{
                    padding: "6px 12px", borderRadius: 99, border: "none", fontFamily: fontBody, fontWeight: 600, fontSize: 12,
                    cursor: "pointer", backgroundColor: active ? COLORS.surface : "transparent",
                    color: active ? COLORS.ink : COLORS.inkSoft,
                    boxShadow: active ? `0 1px 4px rgba(0,0,0,0.1)` : "none",
                  }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Campus */}
          <div>
            <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 6 }}>Campus</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                onClick={() => setCampusFilter("all")}
                style={{
                  padding: "6px 12px", borderRadius: 99, fontFamily: fontBody, fontWeight: 700, fontSize: 12, cursor: "pointer",
                  border: campusFilter === "all" ? "none" : `1px solid ${COLORS.border}`,
                  backgroundColor: campusFilter === "all" ? COLORS.ink : "transparent",
                  color: campusFilter === "all" ? COLORS.surface : COLORS.ink,
                }}
              >All</button>
              {campuses?.map((c) => {
                const active = campusFilter === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCampusFilter(c.id)}
                    style={{
                      padding: "6px 12px", borderRadius: 99, fontFamily: fontBody, fontWeight: 700, fontSize: 12, cursor: "pointer",
                      border: active ? "none" : `1px solid ${COLORS.border}`,
                      backgroundColor: active ? c.color : "transparent",
                      color: active ? textOnBg(c.color) : COLORS.ink,
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    {!active && <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: c.color }} />}
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 14px", border: `1px dashed ${COLORS.border}`, borderRadius: 8,
          backgroundColor: "transparent", color: COLORS.ink, fontFamily: fontBody, fontWeight: 600, fontSize: 12, cursor: "pointer",
        }}>
          <Plus size={13} /> Custom report
        </button>
      </div>

      {/* REPORT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {REPORT_DEFINITIONS.map((r) => {
          const Icon = r.icon;
          const csvBusy = generating === `${r.id}-csv`;
          const pdfBusy = generating === `${r.id}-pdf`;
          const cardScope = scopeFor(r.id);
          const scopedCampus = campuses.find((c) => c.id === cardScope);

          return (
            <Card key={r.id} style={{ padding: 22, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: r.color }} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginTop: 4 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  backgroundColor: r.color + "20", color: r.color,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <div style={{ fontFamily: fontDisplay, fontSize: 17, fontWeight: 600, color: COLORS.ink }}>{r.name}</div>
                    {r.badge && <Pill tone={r.badge.tone}>{r.badge.label}</Pill>}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.5 }}>{r.desc}</div>
                </div>
              </div>

              {/* Scope picker */}
              <div style={{ padding: 10, borderRadius: 9, border: `1px solid ${COLORS.borderSoft}`, backgroundColor: COLORS.cream, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {cardScope === "all" ? (
                    <Globe size={13} color={COLORS.copper} />
                  ) : (
                    <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: scopedCampus?.color || COLORS.inkSoft }} />
                  )}
                  <span style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Scope</span>
                </div>
                <select
                  value={cardScope}
                  onChange={(e) => setScope(r.id, e.target.value)}
                  style={{
                    flex: 1, padding: "5px 8px", border: `1px solid ${COLORS.border}`,
                    borderRadius: 6, fontFamily: fontBody, fontSize: 12, fontWeight: 600,
                    color: COLORS.ink, backgroundColor: COLORS.surface, cursor: "pointer", outline: "none",
                  }}
                >
                  <option value="all">All campuses · HQ rollup</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.isHQ ? " · HQ only" : ` only`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {r.formats.map((f) => (
                  <span key={f} style={{
                    padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 700,
                    backgroundColor: COLORS.cream, color: COLORS.inkSoft,
                    textTransform: "uppercase", letterSpacing: 0.4, border: `1px solid ${COLORS.borderSoft}`,
                  }}>{f}</span>
                ))}
                <span style={{ marginLeft: "auto", fontSize: 11, color: COLORS.inkSoft }}>
                  Last: <strong style={{ color: COLORS.ink }}>{r.lastRun}</strong>
                </span>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => generate(r.id, "csv")}
                  disabled={csvBusy || pdfBusy}
                  style={{
                    flex: 1, padding: "10px 14px", border: "none", borderRadius: 9,
                    backgroundColor: COLORS.forest, color: ON_LIME,
                    fontFamily: fontBody, fontWeight: 700, fontSize: 12,
                    cursor: (csvBusy || pdfBusy) ? "wait" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    opacity: (csvBusy || pdfBusy) ? 0.7 : 1,
                  }}
                >
                  {csvBusy ? <><RefreshCw size={12} style={{ animation: "spin 0.9s linear infinite" }} /> CSV…</> : <><Download size={12} /> Download CSV</>}
                </button>
                <button
                  onClick={() => generate(r.id, "pdf")}
                  disabled={csvBusy || pdfBusy}
                  style={{
                    flex: 1, padding: "10px 14px", border: `1px solid ${COLORS.border}`, borderRadius: 9,
                    backgroundColor: "transparent", color: COLORS.ink,
                    fontFamily: fontBody, fontWeight: 700, fontSize: 12,
                    cursor: (csvBusy || pdfBusy) ? "wait" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {pdfBusy ? <><RefreshCw size={12} style={{ animation: "spin 0.9s linear infinite" }} /> PDF…</> : <><FileText size={12} /> Print PDF</>}
                </button>
                <button style={{
                  padding: "10px 12px", border: `1px solid ${COLORS.border}`, borderRadius: 9,
                  backgroundColor: "transparent", color: COLORS.inkSoft,
                  fontFamily: fontBody, fontWeight: 600, fontSize: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                }} title="Schedule">
                  <Clock size={12} />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* RECENTLY GENERATED */}
      <Card style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div style={{ fontFamily: fontSerif, fontSize: 20, fontStyle: "italic", color: COLORS.ink }}>Recently generated</div>
          <a href="#" style={{ fontSize: 12, color: COLORS.copper, fontWeight: 700, textDecoration: "none" }}>View all →</a>
        </div>
        {[
          { name: "Annual Financial Statement 2025", date: "Dec 31, 2025", by: "Elena Volkov", size: "1.2 MB", format: "PDF",   color: COLORS.forestText },
          { name: "Q4 Ministry Report",              date: "Dec 15, 2025", by: "Pastor Vladimir", size: "840 KB", format: "PDF",   color: COLORS.green },
          { name: "Donor List for Year-End Letters", date: "Dec 10, 2025", by: "Elena Volkov",    size: "2.1 MB", format: "EXCEL", color: COLORS.copper },
          { name: "Camp & Retreat P&L",              date: "Dec 1, 2025",  by: "Elena Volkov",    size: "320 KB", format: "PDF",   color: COLORS.amber },
        ].map((e, i, arr) => (
          <div key={i} style={{
            padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.borderSoft}` : "none",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: e.color + "20", color: e.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileText size={14} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{e.name}</div>
              <div style={{ fontSize: 11, color: COLORS.inkSoft }}>{e.date} · by {e.by} · {e.size}</div>
            </div>
            <Pill tone="copper">{e.format}</Pill>
            <button style={{ background: "transparent", border: `1px solid ${COLORS.border}`, cursor: "pointer", color: COLORS.ink, padding: 7, borderRadius: 7 }}>
              <Download size={13} />
            </button>
          </div>
        ))}
      </Card>

      {/* spinner keyframes */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: 12, backgroundColor: COLORS.forest, color: ON_LIME, border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: fontBody, fontSize: 13 }}>
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
              <button onClick={onClose} style={{ flex: 1, padding: 12, backgroundColor: COLORS.forest, color: ON_LIME, border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: fontBody, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
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

function IRCChurchApp({ demo = false, onExitDemo = () => {} }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [activeCampus, setActiveCampus] = useState("all");
  const [themeMode, setThemeMode] = useState("dark");
  setActiveTheme(themeMode); // applied on every render before children read COLORS
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
  const addMinistry = ({ name, budget, leader = "", campusId }) => {
    const id = slugify(name);
    let uniqueId = id;
    let i = 2;
    while (ministries.some((m) => m.id === uniqueId)) uniqueId = `${id}-${i++}`;
    const idx = ministries.length;
    // If creating from "All" view without explicit campusId, default to HQ.
    const targetCampus = campusId || (activeCampus !== "all" ? activeCampus : (campuses.find((c) => c.isHQ)?.id ?? campuses[0]?.id));
    const ministry = {
      id: uniqueId, name, budget, spent: 0, leader, campusId: targetCampus,
      color: NEW_MINISTRY_PALETTE[idx % NEW_MINISTRY_PALETTE.length],
      icon: NEW_MINISTRY_ICONS[idx % NEW_MINISTRY_ICONS.length],
    };
    setMinistries((prev) => [...prev, ministry]);
    return uniqueId;
  };
  // Current user — drives role-aware UI. Switch via the topbar role picker
  // to demo what each role tier sees. In production this comes from auth.
  const [currentUser, setCurrentUser] = useState(USERS[0]); // default: Pastor Vladimir (HQ Admin)

  // Donation routing — high-level org strategy.
  // pooled = all donations land in HQ, satellites inherit
  // hybrid = mixed (some sources route per-campus, others pool)
  // independent = each campus collects its own
  const [routingMode, setRoutingMode] = useState("pooled");

  // Lifted donation connections — used by both Integrations page and the
  // Donation Routing panel in Settings.
  const [connections, setConnections] = useState(INITIAL_CONNECTIONS);
  const upsertConnection = (conn) => setConnections((prev) => {
    const idx = prev.findIndex((c) => c.id === conn.id);
    if (idx === -1) return [...prev, conn];
    const next = [...prev]; next[idx] = conn; return next;
  });
  const removeConnection = (id) => setConnections((prev) => prev.filter((c) => c.id !== id));

  // Auto-pin the campus filter for non-HQ roles. HQ can switch freely.
  useEffect(() => {
    if (currentUser.role !== ROLE_HQ && currentUser.campusId) {
      setActiveCampus(currentUser.campusId);
    } else if (currentUser.role === ROLE_HQ) {
      setActiveCampus("all");
    }
  }, [currentUser]);

  // Auto-redirect to dashboard if current page is not in this role's sidebar.
  useEffect(() => {
    const allowed = sidebarItemsForRole(currentUser.role).map((it) => it.id);
    if (!allowed.includes(activePage)) setActivePage("dashboard");
  }, [currentUser, activePage]);

  // Campuses — single source of truth. Edits + new campuses ripple to
  // CampusesPage, TopBar dropdown, IntegrationsPage routing, and beyond.
  const [campuses, setCampuses] = useState(INITIAL_CAMPUSES);
  const addCampus = ({ name, address, color }) => {
    const baseId = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `campus-${Date.now()}`;
    let id = baseId;
    let i = 2;
    while (campuses.some((c) => c.id === id)) id = `${baseId}-${i++}`;
    const idx = campuses.length;
    setCampuses((prev) => [...prev, {
      id, name: name.trim(), address: address.trim(),
      isHQ: false,
      short: name.trim().charAt(0).toUpperCase(),
      color: color || NEW_MINISTRY_PALETTE[idx % NEW_MINISTRY_PALETTE.length],
      donations: 0, expenses: 0, members: 0, ministries: 0,
    }]);
  };

  // Recurring payments — single source of truth for monthly overhead.
  // Calendar page edits flow back to Budget overhead, alerts, what-if, etc.
  const [recurringPayments, setRecurringPayments] = useState(INITIAL_RECURRING_PAYMENTS);
  const saveRecurringPayment = (p) => {
    setRecurringPayments((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      // Auto-tag new payments with the active campus (or HQ when in All view).
      const withCampus = p.campusId
        ? p
        : { ...p, campusId: activeCampus !== "all" ? activeCampus : (campuses.find((c) => c.isHQ)?.id ?? campuses[0]?.id) };
      if (idx === -1) return [...prev, withCampus];
      const next = [...prev];
      next[idx] = withCampus;
      return next;
    });
  };
  const deleteRecurringPayment = (id) => {
    setRecurringPayments((prev) => prev.filter((x) => x.id !== id));
  };

  // CAMPUS FILTER — when activeCampus is "all" everything aggregates;
  // when a specific campus is selected, finance views show its slice only.
  const filteredMinistries = useMemo(
    () => activeCampus === "all" ? ministries : ministries.filter((m) => m.campusId === activeCampus),
    [ministries, activeCampus]
  );
  const filteredRecurringPayments = useMemo(
    () => activeCampus === "all" ? recurringPayments : recurringPayments.filter((p) => p.campusId === activeCampus),
    [recurringPayments, activeCampus]
  );

  // Survival floor = essentials only (Facilities + People).
  // Operating overhead = filtered recurring payments.
  const operatingOverheadMo = useMemo(
    () => filteredRecurringPayments.reduce((s, p) => s + p.amount, 0),
    [filteredRecurringPayments]
  );
  const survivalFloorMo = useMemo(
    () => filteredRecurringPayments
      .filter((p) => p.category === "facilities" || p.category === "people")
      .reduce((s, p) => s + p.amount, 0),
    [filteredRecurringPayments]
  );

  // Per-campus derived stats — for CampusesPage cards.
  const campusStats = useMemo(() => campuses.map((c) => {
    const cMinistries = ministries.filter((m) => m.campusId === c.id);
    const cPayments = recurringPayments.filter((p) => p.campusId === c.id);
    const ministryBudget = cMinistries.reduce((s, m) => s + m.budget, 0);
    const ministrySpent = cMinistries.reduce((s, m) => s + m.spent, 0);
    const monthlyOverhead = cPayments.reduce((s, p) => s + p.amount, 0);
    return {
      ...c,
      ministryCount: cMinistries.length,
      paymentCount: cPayments.length,
      ministryBudget,
      ministrySpent,
      annualOverhead: monthlyOverhead * 12,
    };
  }), [campuses, ministries, recurringPayments]);

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
      type: "function", campus: "Bellevue", title: "Click title to edit",
      bio: "Click any name to rename.",
    }]);
  };

  const titles = {
    dashboard: { t: "Dashboard", s: "IRC Church · Fiscal Year 2025 overview" },
    donations: { t: "Donations", s: "All giving · all sources · all campuses" },
    expenses: { t: "Expenses", s: "Where the money goes" },
    budget: { t: "Budget", s: "Plan, monitor, stress-test — and stay on top of it" },
    smart: { t: "Smart Budget", s: "Mandatory vs extras coverage · paid event break-even · annual planner" },
    calendar: { t: "Calendar", s: "Recurring payments, scheduled events, and what's owed today" },
    ministries: { t: "Ministries", s: "Budget vs. actual for every department" },
    campuses: { t: "Campuses", s: "Main · Tacoma · New York" },
    administrators: { t: "Administrators", s: "Who oversees what — budgets that update as you reassign" },
    events: { t: "Events & Camps", s: "23 events · 3,901 attendees" },
    receipts: { t: "Receipts", s: "Snap, classify, sync — automatically" },
    activity: { t: "Activity", s: "Audit trail · every roll, return, budget change, and alert" },
    people: { t: "People & Roles", s: "Manage who can see and do what" },
    integrations: { t: "Integrations", s: "Stripe · Square · QuickBooks · and more" },
    reports: { t: "Reports", s: "Generate any report in one click" },
    settings: { t: "Settings", s: "Theme, account preferences, and billing" },
  };

  const content = useMemo(() => {
    const open = (m) => setReceiptModal({ open: true, ministry: m });
    switch (activePage) {
      case "dashboard": return <DashboardPage ministries={filteredMinistries} operatingOverheadMo={operatingOverheadMo} survivalFloorMo={survivalFloorMo} activeCampus={activeCampus} campuses={campuses} />;
      case "donations": return <DonationsPage />;
      case "expenses": return <ExpensesPage />;
      case "smart": return <SmartBudgetPage currentUser={currentUser} activeCampus={activeCampus} campuses={campuses} />;
      case "budget": return <BudgetPage
        ministries={filteredMinistries} updateMinistryBudget={updateMinistryBudget} logActivity={logActivity}
        recurringPayments={filteredRecurringPayments}
        operatingOverheadMo={operatingOverheadMo}
        survivalFloorMo={survivalFloorMo}
        currentUser={currentUser}
        activeCampus={activeCampus}
        campuses={campuses}
        connections={connections}
      />;
      case "calendar": return <CalendarPage
        recurringPayments={filteredRecurringPayments}
        savePayment={saveRecurringPayment}
        deletePayment={deleteRecurringPayment}
        activeCampus={activeCampus}
        campuses={campuses}
      />;
      case "ministries": return <MinistriesPage openReceiptModal={open} ministries={filteredMinistries} addMinistry={addMinistry} activeCampus={activeCampus} campuses={campuses} />;
      case "campuses": return <CampusesPage campuses={campusStats} addCampus={addCampus} setActiveCampus={setActiveCampus} />;
      case "administrators": return <AdministratorsPage
        ministries={ministries} admins={admins}
        renameMinistry={renameMinistry} updateMinistryBudget={updateMinistryBudget} addMinistry={addMinistry}
        renameAdmin={renameAdmin} updateAdminTitle={updateAdminTitle} addAdmin={addAdmin}
      />;
      case "events": return <EventsPage />;
      case "receipts": return <ReceiptsPage openReceiptModal={open} />;
      case "activity": return <ActivityPage activityLog={activityLog} />;
      case "people": return <PeoplePage currentUser={currentUser} users={USERS} campuses={campuses} ministries={ministries} admins={admins} />;
      case "integrations": return <IntegrationsPage campuses={campuses} />;
      case "reports": return <ReportsPage campuses={campuses} ministries={ministries} recurringPayments={recurringPayments} />;
      case "settings": return <SettingsPage
        themeMode={themeMode} setThemeMode={setThemeMode} onSignOut={onExitDemo}
        currentUser={currentUser} campuses={campuses}
        routingMode={routingMode} setRoutingMode={setRoutingMode}
        connections={connections} upsertConnection={upsertConnection}
      />;
      default: return <DashboardPage ministries={filteredMinistries} operatingOverheadMo={operatingOverheadMo} survivalFloorMo={survivalFloorMo} activeCampus={activeCampus} campuses={campuses} />;
    }
  }, [activePage, ministries, admins, activityLog, recurringPayments, operatingOverheadMo, survivalFloorMo, campuses, activeCampus, filteredMinistries, filteredRecurringPayments, campusStats, themeMode]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: COLORS.bg, fontFamily: fontBody, color: COLORS.ink }}>
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

      {demo && <DemoBanner onExit={onExitDemo} />}

      <div style={{ display: "flex", minHeight: demo ? "calc(100vh - 44px)" : "100vh" }}>

      <Sidebar activePage={activePage} setActivePage={setActivePage} currentUser={currentUser} />
      <main style={{ flex: 1, minWidth: 0 }}>
        <TopBar
          activeCampus={activeCampus}
          setActiveCampus={setActiveCampus}
          pageTitle={titles[activePage].t}
          pageSubtitle={titles[activePage].s}
          campuses={campuses}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          users={USERS}
        />
        {content}
      </main>

      {receiptModal.open && (
        <ReceiptModal ministry={receiptModal.ministry} onClose={() => setReceiptModal({ open: false, ministry: null })} />
      )}

      </div>
    </div>
  );
}

// ============================================================
// SAAS WRAPPER — Landing, Login, DemoBanner, Router shell
// ============================================================

const DemoBanner = ({ onExit }) => (
  <div style={{
    backgroundColor: "#000", color: COLORS.ink, padding: "10px 24px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    borderBottom: `1px solid ${COLORS.copper}40`, fontSize: 12, fontFamily: fontBody,
    position: "sticky", top: 0, zIndex: 50,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: COLORS.forest, boxShadow: `0 0 0 3px ${COLORS.forest}30` }} />
      <span style={{ fontWeight: 700, color: COLORS.forestText, textTransform: "uppercase", letterSpacing: 0.6, fontSize: 11 }}>Live demo</span>
      <span style={{ color: COLORS.inkSoft }}>·</span>
      <span style={{ color: COLORS.inkSoft }}>You're exploring real IRC Church 2025 data — feel free to click anything.</span>
    </div>
    <button onClick={onExit} style={{
      background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.ink,
      padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontFamily: fontBody, fontWeight: 600, fontSize: 11,
      display: "flex", alignItems: "center", gap: 6,
    }}>
      ← Exit demo
    </button>
  </div>
);

const StewardLogo = ({ inverse = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.forest,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: ON_LIME, fontFamily: fontDisplay, fontWeight: 700, fontSize: 18,
    }}>S</div>
    <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 700, color: inverse ? COLORS.bg : COLORS.ink, letterSpacing: -0.3 }}>Steward</div>
  </div>
);

// ----- LANDING -----------------------------------------------

const LANDING_FEATURES = [
  { title: "Donations",   icon: HandHeart,  body: "Stripe, Square, ACH, and cash — every gift in one ledger, auto-coded to the right ministry.",                       get color() { return COLORS.forestText; } },
  { title: "Budget",      icon: Target,     body: "Plan the year, monitor the month. Smart alerts before you slip. Stress-test against giving drops.",                  get color() { return COLORS.copper; } },
  { title: "Multi-campus",icon: Building2,  body: "Roll up Tacoma + NY + Main into one P&L. Per-campus budgets and admins, one source of truth.",                       get color() { return COLORS.amber; } },
  { title: "Audit trail", icon: Activity,   body: "Every roll, return, budget change, and notification logged. Board-ready CSV export in one click.",                   get color() { return COLORS.red; } },
  { title: "Scenarios",   icon: Sparkles,   body: "What-if sliders cascade through operating, surplus, and runway. Save scenarios for quarterly review.", color: "#A78BFA" },
  { title: "Forecasting", icon: TrendingUp, body: "12-month rolling forecast per ministry — past 6 actuals + next 6 projected from seasonal patterns.",  color: "#22D3EE" },
];

const PRICING = [
  { tier: "Starter", price: "$79", per: "/ month", desc: "For churches under 200 members.", features: ["1 campus", "5 ministries", "Stripe + Square", "Email support"], popular: false },
  { tier: "Growth", price: "$199", per: "/ month", desc: "Most popular — for established churches.", features: ["3 campuses", "Unlimited ministries", "All integrations", "Quarterly review", "Smart recommendations"], popular: true },
  { tier: "Enterprise", price: "Custom", per: "", desc: "For multi-site networks and denominations.", features: ["Unlimited campuses", "Custom integrations", "SSO + SAML", "Dedicated success manager", "SLA"], popular: false },
];

const Landing = ({ onLogin, onSignup, onDemo }) => {
  setActiveTheme("dark"); // marketing always renders dark
  return (
    <div style={{ backgroundColor: COLORS.bg, color: COLORS.ink, fontFamily: fontBody, minHeight: "100vh" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Manrope:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 30, backgroundColor: COLORS.bg + "F0", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${COLORS.borderSoft}`,
        padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <StewardLogo />
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a href="#features" style={{ color: COLORS.ink, fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Features</a>
          <a href="#pricing" style={{ color: COLORS.ink, fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Pricing</a>
          <a href="#churches" style={{ color: COLORS.ink, fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Churches</a>
          <button onClick={onLogin} style={{ background: "transparent", border: "none", color: COLORS.ink, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: fontBody }}>Log in</button>
          <button onClick={onSignup} style={{
            backgroundColor: COLORS.forest, color: ON_LIME, border: "none", padding: "10px 18px", borderRadius: 99,
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody,
          }}>
            Start free trial
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "80px 40px 60px", maxWidth: 1180, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", backgroundColor: COLORS.cream, borderRadius: 99, fontSize: 11, fontWeight: 700, color: COLORS.copper, letterSpacing: 0.5, textTransform: "uppercase" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: COLORS.forest }} />
          Trusted by 200+ churches
        </div>
        <h1 style={{ fontFamily: fontDisplay, fontSize: 76, fontWeight: 600, color: COLORS.ink, letterSpacing: -2.5, lineHeight: 1.02, margin: "26px 0 0", maxWidth: 920, marginLeft: "auto", marginRight: "auto" }}>
          Every dollar in your church,<br />
          finally <span style={{ fontFamily: fontSerif, fontStyle: "italic", color: COLORS.copper, fontWeight: 400 }}>accounted for.</span>
        </h1>
        <p style={{ fontSize: 18, color: COLORS.inkSoft, lineHeight: 1.5, marginTop: 22, maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
          Donations, budgets, ministries, receipts — connected to QuickBooks, watched by smart alerts, audited automatically. So pastors can lead without spreadsheets.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32 }}>
          <button onClick={onSignup} style={{ backgroundColor: COLORS.forest, color: ON_LIME, border: "none", padding: "16px 28px", borderRadius: 99, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: fontBody, boxShadow: `0 12px 32px ${COLORS.forest}30` }}>
            Start free trial
          </button>
          <button onClick={onDemo} style={{ backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, padding: "16px 28px", borderRadius: 99, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: fontBody }}>
            Try the live demo →
          </button>
        </div>
      </section>

      {/* DASHBOARD MOCKUP */}
      <section style={{ padding: "0 40px 100px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface, boxShadow: `0 40px 100px rgba(212,255,0,0.08)` }}>
          {/* browser chrome */}
          <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${COLORS.border}`, backgroundColor: COLORS.bg }}>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#FF5F57" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#FEBC2E" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#28C840" }} />
            </div>
            <div style={{ flex: 1, marginLeft: 16, padding: "5px 12px", backgroundColor: COLORS.cream, borderRadius: 6, fontSize: 11, color: COLORS.inkSoft, fontFamily: "ui-monospace, monospace", textAlign: "center" }}>
              app.steward.church/dashboard
            </div>
          </div>
          {/* preview body */}
          <div style={{ padding: 28 }}>
            <div style={{ fontFamily: fontSerif, fontSize: 22, fontStyle: "italic", color: COLORS.ink, marginBottom: 18 }}>Good morning, Pastor V.</div>
            {/* health card */}
            <div style={{ padding: 20, borderRadius: 12, backgroundColor: "rgba(212,255,0,0.06)", border: `1px solid ${COLORS.forest}40`, marginBottom: 18, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, backgroundColor: COLORS.forest, color: ON_LIME, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Gauge size={18} strokeWidth={2.4} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: COLORS.forestText, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>Budget Health · On track</div>
                <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: COLORS.ink, marginTop: 4 }}>
                  On pace to cover overhead with $162k to spare this month.
                </div>
              </div>
            </div>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
              {[
                { label: "Donations YTD", value: "$1.88M", color: COLORS.forestText },
                { label: "Expenses YTD", value: "$1.66M", color: COLORS.copper },
                { label: "Net savings", value: "$224k", color: COLORS.green },
                { label: "Year-end balance", value: "$926k", color: COLORS.ink },
              ].map((k, i) => (
                <div key={i} style={{ padding: 14, border: `1px solid ${COLORS.border}`, borderRadius: 9 }}>
                  <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{k.label}</div>
                  <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: k.color, marginTop: 4, letterSpacing: -0.5 }}>{k.value}</div>
                </div>
              ))}
            </div>
            {/* mini chart */}
            <div style={{ padding: 16, border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 10 }}>Monthly cash flow · 2025</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 70 }}>
                {[55, 50, 62, 70, 64, 58, 55, 60, 67, 70, 65, 95].map((h, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                    <div style={{ width: "100%", height: `${h}%`, backgroundColor: COLORS.forest, borderRadius: 2, opacity: 0.85 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES (dark) */}
      <section id="features" style={{ backgroundColor: COLORS.bg, padding: "100px 40px", borderTop: `1px solid ${COLORS.borderSoft}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>What's inside</div>
            <h2 style={{ fontFamily: fontDisplay, fontSize: 52, fontWeight: 600, color: COLORS.ink, letterSpacing: -1.5, marginTop: 10, lineHeight: 1.1 }}>
              Everything stewardship,<br />
              <span style={{ fontFamily: fontSerif, fontStyle: "italic", color: COLORS.copper, fontWeight: 400 }}>nothing else.</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {LANDING_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} style={{ padding: 24, backgroundColor: COLORS.surface, borderRadius: 14, border: `1px solid ${COLORS.border}`, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: f.color }} />
                  <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: f.color + "20", color: f.color, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 6, marginBottom: 14 }}>
                    <Icon size={17} />
                  </div>
                  <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 600, color: COLORS.ink }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 6, lineHeight: 1.55 }}>{f.body}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "100px 40px", borderTop: `1px solid ${COLORS.borderSoft}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 50 }}>
            <div style={{ fontSize: 11, color: COLORS.copper, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>Simple pricing</div>
            <h2 style={{ fontFamily: fontDisplay, fontSize: 48, fontWeight: 600, color: COLORS.ink, letterSpacing: -1.3, marginTop: 10, lineHeight: 1.1 }}>
              One price, every feature,<br />
              <span style={{ fontFamily: fontSerif, fontStyle: "italic", color: COLORS.copper, fontWeight: 400 }}>no surprises.</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, alignItems: "stretch" }}>
            {PRICING.map((p) => (
              <div key={p.tier} style={{
                padding: 28, borderRadius: 16,
                backgroundColor: p.popular ? COLORS.forest : COLORS.surface,
                color: p.popular ? COLORS.bg : COLORS.ink,
                border: p.popular ? "none" : `1px solid ${COLORS.border}`,
                transform: p.popular ? "translateY(-12px)" : "none",
                boxShadow: p.popular ? `0 20px 60px ${COLORS.forest}30` : "none",
                position: "relative",
              }}>
                {p.popular && (
                  <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", padding: "4px 12px", backgroundColor: COLORS.copper, color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                    Most popular
                  </div>
                )}
                <div style={{ fontSize: 12, color: p.popular ? "rgba(0,0,0,0.6)" : COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>{p.tier}</div>
                <div style={{ fontFamily: fontDisplay, fontSize: 48, fontWeight: 700, marginTop: 10, letterSpacing: -1.2, lineHeight: 1 }}>
                  {p.price}<span style={{ fontSize: 16, fontWeight: 500, color: p.popular ? "rgba(0,0,0,0.6)" : COLORS.inkSoft }}>{p.per}</span>
                </div>
                <div style={{ fontSize: 13, color: p.popular ? "rgba(0,0,0,0.7)" : COLORS.inkSoft, marginTop: 6, lineHeight: 1.5 }}>{p.desc}</div>
                <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
                  {p.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                      <Check size={14} strokeWidth={3} color={p.popular ? COLORS.bg : COLORS.forest} />
                      {f}
                    </div>
                  ))}
                </div>
                <button onClick={onSignup} style={{
                  width: "100%", marginTop: 26, padding: "12px 18px", borderRadius: 99,
                  border: p.popular ? "none" : `1px solid ${COLORS.border}`,
                  backgroundColor: p.popular ? COLORS.bg : "transparent",
                  color: p.popular ? COLORS.forest : COLORS.ink,
                  fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody,
                }}>
                  {p.tier === "Enterprise" ? "Talk to sales" : "Start free trial"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "60px 40px 100px" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: 56, borderRadius: 24,
          backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, textAlign: "center", position: "relative", overflow: "hidden",
          backgroundImage: `radial-gradient(circle at 20% 20%, ${COLORS.forest}25 0%, transparent 40%), radial-gradient(circle at 80% 80%, ${COLORS.copper}20 0%, transparent 40%)`,
        }}>
          <h2 style={{ fontFamily: fontDisplay, fontSize: 48, fontWeight: 600, color: COLORS.ink, letterSpacing: -1.3, lineHeight: 1.1, margin: 0 }}>
            Stop guessing about money.<br />
            <span style={{ fontFamily: fontSerif, fontStyle: "italic", color: COLORS.copper, fontWeight: 400 }}>Start leading with it.</span>
          </h2>
          <p style={{ fontSize: 16, color: COLORS.inkSoft, marginTop: 18, maxWidth: 540, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            14-day free trial. No credit card. Migrate from QuickBooks in under an hour.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 26 }}>
            <button onClick={onSignup} style={{ backgroundColor: COLORS.forest, color: ON_LIME, border: "none", padding: "16px 28px", borderRadius: 99, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: fontBody }}>
              Start free trial
            </button>
            <button onClick={onDemo} style={{ backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, padding: "16px 28px", borderRadius: 99, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: fontBody }}>
              Try the live demo →
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${COLORS.borderSoft}`, padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <StewardLogo />
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: COLORS.inkSoft }}>
          <span>© 2026 Steward · Built for the church</span>
          <span style={{ padding: "2px 7px", border: `1px solid ${COLORS.border}`, borderRadius: 4, fontWeight: 600 }}>SOC 2</span>
          <span style={{ padding: "2px 7px", border: `1px solid ${COLORS.border}`, borderRadius: 4, fontWeight: 600 }}>501(c)(3) friendly</span>
        </div>
      </footer>
    </div>
  );
};

// ----- LOGIN -------------------------------------------------

const Login = ({ onSubmit, onDemo, onSignup, onBack }) => {
  setActiveTheme("dark"); // login always renders dark
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const canSubmit = email.includes("@") && password.length >= 4;

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", backgroundColor: COLORS.bg, color: COLORS.ink, fontFamily: fontBody }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Manrope:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>

      {/* LEFT — auth form */}
      <div style={{ padding: 48, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onBack} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
            <StewardLogo />
          </button>
        </div>
        <div style={{ maxWidth: 420, width: "100%", margin: "auto 0", paddingTop: 40 }}>
          <h1 style={{ fontFamily: fontDisplay, fontSize: 44, fontWeight: 600, color: COLORS.ink, letterSpacing: -1.2, lineHeight: 1.05, margin: 0 }}>
            Welcome <span style={{ fontFamily: fontSerif, fontStyle: "italic", color: COLORS.copper, fontWeight: 400 }}>back.</span>
          </h1>
          <p style={{ fontSize: 14, color: COLORS.inkSoft, marginTop: 10, marginBottom: 28 }}>
            Sign in to manage your church's finances.
          </p>

          {/* SSO */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
            <button onClick={onSubmit} style={{ width: "100%", padding: "12px 16px", backgroundColor: COLORS.surface, color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: "#fff", color: "#000", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>G</span>
              Continue with Google
            </button>
            <button onClick={onSubmit} style={{ width: "100%", padding: "12px 16px", backgroundColor: COLORS.surface, color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{ width: 18, height: 18, borderRadius: 3, backgroundColor: "#0078D4", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>M</span>
              Continue with Microsoft
            </button>
          </div>

          {/* divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
            <span style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>or</span>
            <div style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
          </div>

          {/* email/password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourchurch.org"
                style={{ display: "block", width: "100%", padding: "12px 14px", marginTop: 4, fontSize: 14, fontFamily: fontBody, color: COLORS.ink, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) onSubmit(); }}
                style={{ display: "block", width: "100%", padding: "12px 14px", marginTop: 4, fontSize: 14, fontFamily: fontBody, color: COLORS.ink, backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              style={{
                width: "100%", marginTop: 8, padding: "13px 18px", borderRadius: 9, border: "none",
                backgroundColor: canSubmit ? COLORS.forest : COLORS.cream,
                color: canSubmit ? COLORS.bg : COLORS.inkSoft,
                fontWeight: 700, fontSize: 14, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: fontBody,
                boxShadow: canSubmit ? `0 10px 28px ${COLORS.forest}30` : "none",
              }}
            >
              Sign in
            </button>
          </div>

          {/* demo callout */}
          <button onClick={onDemo} style={{ width: "100%", marginTop: 18, padding: "12px 16px", backgroundColor: "#000", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={13} color={COLORS.copper} />
              Just exploring? Open demo
            </span>
            <span>→</span>
          </button>

          <div style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: COLORS.inkSoft }}>
            New to Steward?{" "}
            <button onClick={onSignup} style={{ background: "transparent", border: "none", color: COLORS.forestText, fontWeight: 700, cursor: "pointer", fontFamily: fontBody, padding: 0, fontSize: 13 }}>
              Start a free trial →
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: COLORS.inkSoft }}>© 2026 Steward · SOC 2 · GDPR</div>
      </div>

      {/* RIGHT — testimonial */}
      <div style={{
        backgroundColor: "#000", padding: 48, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between",
        backgroundImage: `radial-gradient(circle at 20% 30%, ${COLORS.forest}1f 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${COLORS.copper}1a 0%, transparent 50%)`,
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", backgroundColor: COLORS.cream, borderRadius: 99, fontSize: 11, fontWeight: 700, color: COLORS.copper, letterSpacing: 0.5, textTransform: "uppercase", alignSelf: "flex-start" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: COLORS.forest }} />
          200+ churches trust Steward
        </div>

        <div>
          <div style={{ fontFamily: fontSerif, fontStyle: "italic", fontSize: 38, color: COLORS.ink, lineHeight: 1.2, fontWeight: 400, letterSpacing: -1 }}>
            "We stopped guessing about money and started <span style={{ color: COLORS.forest }}>leading with it.</span>"
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 26 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: COLORS.forest, color: ON_LIME, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>PV</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>Pastor Vladimir</div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Senior Pastor · IRC Church · 1,500 members</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { label: "2025 donations", value: "$1.88M" },
            { label: "Ministries", value: "14" },
            { label: "Years on Steward", value: "3" },
          ].map((s, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 10, border: `1px solid ${COLORS.border}`, backgroundColor: "rgba(255,255,255,0.02)" }}>
              <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, color: COLORS.ink, marginTop: 4, letterSpacing: -0.5 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ----- ROUTER SHELL ------------------------------------------

// Simple hash-based routing. /#/login, /#/app, /#/demo, default = landing.
const parseRoute = () => {
  const h = (window.location.hash || "").replace(/^#\/?/, "");
  if (h === "login") return { route: "login", demo: false };
  if (h === "demo") return { route: "app", demo: true };
  if (h === "app") return { route: "app", demo: false };
  return { route: "landing", demo: false };
};
const setHash = (h) => { window.location.hash = h; };

export default function App() {
  const [{ route, demo }, setState] = useState(parseRoute());

  React.useEffect(() => {
    const handler = () => setState(parseRoute());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const goLanding = () => setHash("");
  const goLogin = () => setHash("/login");
  const goApp = () => setHash("/app");
  const goDemo = () => setHash("/demo");

  if (route === "login") {
    return <Login onSubmit={goApp} onDemo={goDemo} onSignup={goLogin} onBack={goLanding} />;
  }
  if (route === "app") {
    return <IRCChurchApp demo={demo} onExitDemo={goLanding} />;
  }
  return <Landing onLogin={goLogin} onSignup={goLogin} onDemo={goDemo} />;
}
