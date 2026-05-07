import React, { useState, useMemo } from "react";
import {
  LayoutDashboard, HandHeart, Receipt, Users, Building2, Calendar,
  FileText, Plug, Settings, Search, Bell, ChevronDown, Plus, Upload,
  CheckCircle2, AlertCircle, Clock, TrendingUp, TrendingDown, DollarSign,
  Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Filter, Download,
  CreditCard, Banknote, Shield, UserPlus, Mail, MoreVertical, Eye,
  Edit3, Trash2, ChevronRight, Camera, Paperclip, X, Check, Lock,
  Sparkles, Activity, Church, MapPin, BarChart3, PieChart as PieIcon,
  RefreshCw, Link2, ExternalLink, Globe
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, AreaChart, Area, LineChart, Line, CartesianGrid, Legend
} from "recharts";

// ============================================================
// DESIGN TOKENS
// ============================================================
const COLORS = {
  bg: "#FAF6EE",
  surface: "#FFFFFF",
  ink: "#1A1F1C",
  inkSoft: "#5A6660",
  forest: "#1F3A34",
  forestDeep: "#152724",
  copper: "#B8855E",
  copperSoft: "#E8C9A8",
  cream: "#F4ECDC",
  border: "#E5DDC9",
  borderSoft: "#EFE7D6",
  green: "#2D6A4F",
  red: "#A4392F",
  amber: "#C97B2F",
};

const fontDisplay = `'Fraunces', 'Times New Roman', serif`;
const fontBody = `'Plus Jakarta Sans', -apple-system, sans-serif`;

// ============================================================
// REAL 2025 DATA FROM IRC CHURCH FINANCIAL STATEMENT
// ============================================================
const DONATIONS_2025 = [
  { name: "Tithes & Offering", value: 1407005.03, color: "#1F3A34" },
  { name: "Month of Giving", value: 148302.69, color: "#2D6A4F" },
  { name: "Events Registration", value: 115976.22, color: "#B8855E" },
  { name: "Legacy", value: 108297.28, color: "#52796F" },
  { name: "New York Campus", value: 44000.00, color: "#84A98C" },
  { name: "Tacoma Campus", value: 24262.53, color: "#9B7B5A" },
  { name: "Merch", value: 13426.61, color: "#C97B2F" },
  { name: "Building Fund", value: 7136.05, color: "#D4A373" },
  { name: "Kids Ministry", value: 7154.06, color: "#A98467" },
  { name: "Single Mothers", value: 5393.11, color: "#E8C9A8" },
  { name: "Pastor's Blessing", value: 1748.75, color: "#CCC5A8" },
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
  { id: "worship", name: "Worship", spent: 17625.73, budget: 22000, leader: "Anna K.", campus: "main", color: "#1F3A34", icon: "♪" },
  { id: "technical", name: "Technical", spent: 33531.65, budget: 38000, leader: "Mark D.", campus: "main", color: "#2D6A4F", icon: "⚙" },
  { id: "video", name: "Video", spent: 5547.85, budget: 8000, leader: "Sergei P.", campus: "main", color: "#52796F", icon: "▶" },
  { id: "light-screen", name: "Light & Screen", spent: 2019.90, budget: 3500, leader: "Tom B.", campus: "main", color: "#84A98C", icon: "✦" },
  { id: "media", name: "Media", spent: 6590.64, budget: 9000, leader: "Lana V.", campus: "main", color: "#B8855E", icon: "◈" },
  { id: "kids", name: "Kids Ministry", spent: 16850.34, budget: 20000, leader: "Maria R.", campus: "main", color: "#C97B2F", icon: "✧" },
  { id: "teens", name: "Teens", spent: 5615.34, budget: 8000, leader: "David O.", campus: "main", color: "#D4A373", icon: "♦" },
  { id: "youth", name: "Youth", spent: 9161.67, budget: 12000, leader: "Eli T.", campus: "main", color: "#9B7B5A", icon: "▲" },
  { id: "single-mom", name: "Single Moms", spent: 6073.25, budget: 8000, leader: "Olga S.", campus: "main", color: "#A98467", icon: "♥" },
  { id: "deaf", name: "Deaf & Hard of Hearing", spent: 3082.89, budget: 5000, leader: "Ruth M.", campus: "main", color: "#52796F", icon: "✋" },
  { id: "legacy", name: "Legacy", spent: 2124.07, budget: 4000, leader: "John W.", campus: "main", color: "#1F3A34", icon: "✚" },
  { id: "services", name: "Sun/Fri Services & Care", spent: 57334.39, budget: 65000, leader: "Pastor Vlad", campus: "main", color: "#2D6A4F", icon: "✟" },
  { id: "target", name: "Target Outreach", spent: 11518.67, budget: 15000, leader: "Anna K.", campus: "main", color: "#B8855E", icon: "◎" },
  { id: "merch", name: "Merch", spent: 13178.36, budget: 14000, leader: "Sasha L.", campus: "main", color: "#C97B2F", icon: "◇" },
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
    neutral: { bg: "#F4ECDC", color: "#5A6660" },
    success: { bg: "#DDEDE0", color: "#2D6A4F" },
    warn: { bg: "#FBE8D0", color: "#C97B2F" },
    danger: { bg: "#F4D9D5", color: "#A4392F" },
    forest: { bg: "#1F3A34", color: "#FAF6EE" },
    copper: { bg: "#E8C9A8", color: "#7A4F2E" },
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
    { id: "ministries", label: "Ministries", icon: Users },
    { id: "campuses", label: "Campuses", icon: Building2 },
    { id: "events", label: "Events & Camps", icon: Calendar },
    { id: "receipts", label: "Receipts", icon: Paperclip },
    { id: "people", label: "People & Roles", icon: Shield },
    { id: "integrations", label: "Integrations", icon: Plug },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  return (
    <aside style={{
      width: 248, backgroundColor: COLORS.forestDeep, color: COLORS.cream,
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
            <div style={{ fontSize: 10, color: "rgba(244,236,220,0.6)", letterSpacing: 1.5, textTransform: "uppercase" }}>Steward · v1.0</div>
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
                color: active ? COLORS.forestDeep : "rgba(244,236,220,0.85)",
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
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.cream }}>Elena Volkov</div>
            <div style={{ fontSize: 11, color: "rgba(244,236,220,0.55)" }}>Finance Admin</div>
          </div>
          <Settings size={15} style={{ color: "rgba(244,236,220,0.55)", cursor: "pointer" }} />
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
              backgroundColor: COLORS.forest, color: COLORS.cream, border: "none",
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

        <button style={{ position: "relative", border: "none", background: COLORS.surface, padding: 9, borderRadius: 10, cursor: "pointer", border: `1px solid ${COLORS.border}` }}>
          <Bell size={16} color={COLORS.ink} />
          <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", backgroundColor: COLORS.red }} />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// DASHBOARD PAGE
// ============================================================

const DashboardPage = () => {
  const kpis = [
    { label: "Total Donations '25", value: fmt(TOTAL_DONATIONS), trend: "+12.4%", icon: HandHeart, tone: "forest" },
    { label: "Total Expenses '25", value: fmt(TOTAL_EXPENSES), trend: "88.05% of donations", icon: Receipt, tone: "copper" },
    { label: "Net Savings", value: fmt(TOTAL_SAVINGS), trend: "11.95% retained", icon: PiggyBank, tone: "green" },
    { label: "Year-End Balance", value: fmt(BALANCE_END), trend: `+${fmt(BALANCE_END - BALANCE_START)} YoY`, icon: Wallet, tone: "ink" },
  ];

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 24 }}>
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
                  color: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center"
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
                labelStyle={{ color: COLORS.cream }}
                itemStyle={{ color: COLORS.cream }}
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
              <Tooltip formatter={(v) => fmtShort(v)} contentStyle={{ backgroundColor: COLORS.forestDeep, border: "none", borderRadius: 10, fontSize: 12, color: COLORS.cream }} />
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
              <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{MINISTRIES.length} active ministries</div>
            </div>
            <button style={{ background: "transparent", border: `1px solid ${COLORS.border}`, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, cursor: "pointer", color: COLORS.ink }}>
              View all →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MINISTRIES.slice(0, 8).map((m) => {
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
      <Card style={{ padding: 24, backgroundColor: COLORS.forestDeep, color: COLORS.cream, border: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 500, fontStyle: "italic" }}>Camps & retreats, 2025</div>
            <div style={{ fontSize: 13, color: "rgba(244,236,220,0.7)" }}>23 events · {fmt(247906.01)} spent · {fmt(115976.22)} recovered via registration</div>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(244,236,220,0.6)", letterSpacing: 0.4, textTransform: "uppercase" }}>Net cost</div>
              <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 500, letterSpacing: -0.5 }}>{fmt(131929.79)}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {EVENTS_CAMPS.slice(0, 12).map((e, i) => (
            <div key={i} style={{ padding: "12px 14px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 12 }}>
              <div style={{ fontWeight: 600 }}>{e.name}</div>
              <div style={{ color: "rgba(244,236,220,0.6)", fontSize: 11, marginTop: 2 }}>{e.attendees} attended</div>
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
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.forest, color: COLORS.cream, border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, fontWeight: 600, cursor: "pointer" }}>
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
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ backgroundColor: COLORS.forestDeep, border: "none", borderRadius: 10, fontSize: 12, color: COLORS.cream }} />
            <Bar dataKey="value" fill={COLORS.forest} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

// ============================================================
// MINISTRIES PAGE
// ============================================================

const MinistriesPage = ({ openReceiptModal }) => {
  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {MINISTRIES.map((m) => {
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
// EVENTS PAGE
// ============================================================

const EventsPage = () => {
  const typeColor = {
    camp: COLORS.forest, retreat: COLORS.green, conference: COLORS.copper,
    school: COLORS.amber, event: "#52796F", meeting: COLORS.inkSoft,
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
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.forest, color: COLORS.cream, border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, fontWeight: 600, cursor: "pointer" }}>
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
        padding: 32, backgroundColor: COLORS.forestDeep, color: COLORS.cream, border: "none",
        backgroundImage: `radial-gradient(circle at 80% 20%, rgba(184,133,94,0.15) 0%, transparent 50%)`
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 28, fontWeight: 500, fontStyle: "italic", letterSpacing: -0.5 }}>Snap a receipt, we'll do the rest.</div>
            <div style={{ fontSize: 13, color: "rgba(244,236,220,0.75)", marginTop: 6, maxWidth: 540 }}>
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
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.forest, color: COLORS.cream, border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: fontBody, fontWeight: 600, cursor: "pointer" }}>
            <UserPlus size={14} /> Invite member
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 80px", gap: 12, padding: "8px 14px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>
          <div>Member</div><div>Role</div><div>Access level</div><div>Campus</div><div>Last active</div>
        </div>
        {TEAM.map((p, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 80px", gap: 12, padding: 14, borderBottom: `1px solid ${COLORS.borderSoft}`, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: COLORS.forest, color: COLORS.cream, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{p.avatar}</div>
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

const IntegrationsPage = () => {
  const integrations = [
    {
      name: "Stripe", logo: "S", color: "#635BFF", connected: true,
      desc: "Online giving via website & mobile. Auto-imports donations every 15 min.",
      stats: { synced: "4,287 donations YTD", lastSync: "2 min ago", amount: fmt(1124400) },
      perms: ["Read all charges", "Read customer info", "Webhook on charge.succeeded"],
    },
    {
      name: "Square", logo: "■", color: "#000000", connected: true,
      desc: "In-person giving via Square readers. Sun & Fri service offerings.",
      stats: { synced: "2,104 transactions", lastSync: "8 min ago", amount: fmt(583200) },
      perms: ["Read payments", "Read locations (3)", "Read items (offerings)"],
    },
    {
      name: "QuickBooks Online", logo: "Q", color: "#2CA01C", connected: true,
      desc: "Two-way accounting sync. Donations → income, receipts → expenses, classes per ministry.",
      stats: { synced: "8,924 records", lastSync: "1h ago", amount: "67 unsynced" },
      perms: ["Read & write accounts", "Manage classes (ministries)", "Manage customers (donors)"],
    },
    {
      name: "Google Workspace", logo: "G", color: "#4285F4", connected: false,
      desc: "Single sign-on for ministry leaders. Calendar sync for events & camps.",
      stats: null, perms: [],
    },
    {
      name: "Mailchimp", logo: "M", color: "#FFE01B", connected: false,
      desc: "Auto-segment donors for thank-you emails, year-end giving statements.",
      stats: null, perms: [],
    },
    {
      name: "Planning Center", logo: "P", color: "#4099FF", connected: false,
      desc: "Sync member directory, attendance, and check-in for kids ministry.",
      stats: null, perms: [],
    },
  ];

  return (
    <div style={{ padding: "32px 36px", display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{ padding: 24, backgroundColor: COLORS.cream, border: `1px solid ${COLORS.copperSoft}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.copper, color: COLORS.forestDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 500, color: COLORS.ink, fontStyle: "italic" }}>Everything connected, everything automated.</div>
            <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 4 }}>Square + Stripe push donations in. QuickBooks gets the books. Your team gets time back.</div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {integrations.map((int, i) => (
          <Card key={i} style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, backgroundColor: int.color,
                color: int.color === "#FFE01B" ? "#000" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 22,
              }}>{int.logo}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div style={{ fontFamily: fontDisplay, fontSize: 19, fontWeight: 600, color: COLORS.ink }}>{int.name}</div>
                  {int.connected ? (
                    <Pill tone="success"><span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: COLORS.green, marginRight: 2 }} /> Connected</Pill>
                  ) : (
                    <Pill tone="neutral">Not connected</Pill>
                  )}
                </div>
                <div style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5 }}>{int.desc}</div>
              </div>
            </div>

            {int.connected && int.stats && (
              <div style={{ padding: 14, backgroundColor: COLORS.bg, borderRadius: 10, marginBottom: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Last sync</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>{int.stats.lastSync}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>Records</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>{int.stats.synced}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>YTD</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginTop: 2 }}>{int.stats.amount}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: COLORS.inkSoft, lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: COLORS.ink, textTransform: "uppercase", letterSpacing: 0.4 }}>Permissions granted</div>
                  {int.perms.map((p, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Lock size={10} color={COLORS.green} /> {p}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              {int.connected ? (
                <>
                  <button style={{ flex: 1, padding: "9px 14px", backgroundColor: COLORS.forest, color: COLORS.cream, border: "none", borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <RefreshCw size={12} /> Sync now
                  </button>
                  <button style={{ padding: "9px 14px", backgroundColor: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: fontBody }}>
                    Configure
                  </button>
                </>
              ) : (
                <button style={{ flex: 1, padding: "10px 14px", backgroundColor: COLORS.copper, color: COLORS.forestDeep, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: fontBody, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Link2 size={13} /> Connect {int.name}
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
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
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: 12, backgroundColor: COLORS.forest, color: COLORS.cream, border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: fontBody, fontSize: 13 }}>
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
              <button onClick={onClose} style={{ flex: 1, padding: 12, backgroundColor: COLORS.forest, color: COLORS.cream, border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: fontBody, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
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

  const titles = {
    dashboard: { t: "Dashboard", s: "IRC Church · Fiscal Year 2025 overview" },
    donations: { t: "Donations", s: "All giving · all sources · all campuses" },
    expenses: { t: "Expenses", s: "Where the money goes" },
    ministries: { t: "Ministries", s: "Budget vs. actual for every department" },
    campuses: { t: "Campuses", s: "Main · Tacoma · New York" },
    events: { t: "Events & Camps", s: "23 events · 3,901 attendees" },
    receipts: { t: "Receipts", s: "Snap, classify, sync — automatically" },
    people: { t: "People & Roles", s: "Manage who can see and do what" },
    integrations: { t: "Integrations", s: "Stripe · Square · QuickBooks · and more" },
    reports: { t: "Reports", s: "Generate any report in one click" },
  };

  const content = useMemo(() => {
    const open = (m) => setReceiptModal({ open: true, ministry: m });
    switch (activePage) {
      case "dashboard": return <DashboardPage />;
      case "donations": return <DonationsPage />;
      case "expenses": return <ExpensesPage />;
      case "ministries": return <MinistriesPage openReceiptModal={open} />;
      case "campuses": return <CampusesPage />;
      case "events": return <EventsPage />;
      case "receipts": return <ReceiptsPage openReceiptModal={open} />;
      case "people": return <PeoplePage />;
      case "integrations": return <IntegrationsPage />;
      case "reports": return <ReportsPage />;
      default: return <DashboardPage />;
    }
  }, [activePage]);

  return (
    <div style={{
      display: "flex", minHeight: "100vh", backgroundColor: COLORS.bg,
      fontFamily: fontBody, color: COLORS.ink,
    }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500;1,9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
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
