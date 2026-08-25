import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  "https://undwcofbyhtkxtbvncln.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZHdjb2ZieWh0a3h0YnZuY2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MDMwMzcsImV4cCI6MjEwMzE3OTAzN30.5-7_UfidC6MUsdrMz_fR-SdRiXLENrkagsF6mkeLTWM"
);

// ─── STORAGE (Supabase) ────────────────────────────────────────────────────────
async function loadAgentsFromDb() {
  const { data, error } = await supabase.from("agents").select("*");
  if (error || !data) return [];
  return data.map(row => ({
    id: row.id,
    name: row.name,
    email: row.email || "",
    phone: row.phone || "",
    pfaNumber: row.pfa_number || "",
    fieldTrainer: row.field_trainer || "",
    orgAdmin: row.org_admin || "",
    startDate: row.start_date,
    lastActivityAt: row.last_activity_at,
    progress: row.progress || {},
  }));
}
async function upsertAgentDb(agent) {
  const row = {
    id: agent.id,
    name: agent.name,
    email: agent.email || null,
    phone: agent.phone || null,
    pfa_number: agent.pfaNumber || null,
    field_trainer: agent.fieldTrainer || null,
    org_admin: agent.orgAdmin || null,
    start_date: agent.startDate || null,
    last_activity_at: agent.lastActivityAt || null,
    progress: agent.progress || {},
  };
  try { await supabase.from("agents").upsert(row); } catch {}
}
async function deleteAgentDb(id) {
  try { await supabase.from("agents").delete().eq("id", id); } catch {}
}

async function loadAdminsFromDb() {
  try {
    const { data, error } = await supabase.from("admins").select("*");
    if (error || !data || data.length === 0) return [{ name: "Linda Cao", pin: "victory2026" }];
    return data.map(r => ({ name: r.name, pin: r.pin }));
  } catch {
    return [{ name: "Linda Cao", pin: "victory2026" }];
  }
}

async function loadKV(table) {
  const out = {};
  try {
    const { data, error } = await supabase.from(table).select("*");
    if (!error && data) data.forEach(r => { out[r.key] = r.value; });
  } catch {}
  return out;
}
async function saveKV(table, key, value) {
  try { await supabase.from(table).upsert({ key, value }); } catch {}
}

async function loadKeyedResources(table) {
  const out = {};
  try {
    const { data, error } = await supabase.from(table).select("*");
    if (!error && data) data.forEach(r => { out[r.key] = { name: r.name, url: r.url }; });
  } catch {}
  return out;
}
// Uploads a real File object to Supabase Storage and returns its public URL —
// no base64/data: URL conversion needed, so previews and downloads just work.
async function uploadToStorage(file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("victory-files").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("victory-files").getPublicUrl(path);
  return data.publicUrl;
}
async function saveKeyedResource(table, key, name, url) {
  try { await supabase.from(table).upsert({ key, name: name || null, url }); } catch {}
}


// ─── PHASES ───────────────────────────────────────────────────────────────────
const PHASES = [
  {
    id: "welcome", vosStep: null, label: "Welcome", title: "Learn It. Do It. Duplicate It.",
    emoji: "🏆", color: "#D4AF37", darkBg: "#1a1400", type: "welcome", steps: [],
  },
  {
    id: "documents", vosStep: "REFERENCE LIBRARY", label: "Documents", title: "The Documents",
    emoji: "📁", color: "#3B82F6", darkBg: "#0c1a2e",
    description: "Copies as issued — download or open any of these, any time.",
    type: "documents", steps: [],
  },
  {
    id: "training1", vosStep: "STEP 1 · LEARN THE PRODUCT — Training 1", label: "Training 1", title: "Introduction to the Industry",
    emoji: "📘", color: "#8B5CF6", darkBg: "#150d2e",
    description: "Same day or within 48 hours of joining. Learn the product, the brochure, and who we help.",
    type: "training",
    steps: [
      { id: "t1_recap_header", type: "header", label: "Recap of Meeting 1 with CFT" },
      { id: "t1_onboarding3step", label: "Victory Onboarding 3 Step System", type: "check" },
      { id: "t1_brochure", label: "Walk Through Living Life Defender Brochure", type: "check" },
      { id: "t1_video_en", label: "First 30 Days — Product Training (English)", type: "check" },
      { id: "t1_video_vn", label: "First 30 Days — Product Training (Vietnamese)", type: "check" },
      { id: "t1_podcast", label: "The Victory Podcast Series", type: "check" },
      { id: "t1_serena_ep01", label: "Listen to Serena's Podcast Ep01 Welcome Board", type: "link", linkKey: "t1_serena_ep01_link" },
      { id: "t1_videos_header", type: "header", label: "Watch These 3 Onboarding Videos" },
      { id: "t1_industry", label: "Our Industry, Product, and Advantages", type: "link", linkKey: "t1_industry_link" },
      { id: "t1_comp", label: "The Compensation: How We Get Paid", type: "link", linkKey: "t1_comp_link" },
      { id: "t1_leads", label: "Our System of Leads", type: "link", linkKey: "t1_leads_link" },
    ],
  },
  {
    id: "training2", vosStep: "STEP 2 · LEARN THE SYSTEM — Training 2", label: "Training 2", title: "Learn the Victory System",
    emoji: "💵", color: "#10B981", darkBg: "#0a1f15",
    description: "Within 48–72 hours of product training. Learn the Victory System and the 3-3-30.",
    type: "training",
    steps: [
      { id: "t2_recap_header", type: "header", label: "Recap of Meeting 2 with CFT" },
      { id: "t2_stages", label: "The Victory System — 3 Stages", type: "check" },
      { id: "t2_onboarding3step", label: "Victory Onboarding — The 3-Step System & Product Training", type: "check" },
      { id: "t2_manual", label: "Victory 30-Day Field Training Manual", type: "check" },
      { id: "t2_calculator", label: "New Wave Compensation — Agent Income Calculator", type: "check" },
      { id: "t2_fortunelist", label: "Victory Fortune List Workbook", type: "check" },
      { id: "t2_reftraining_header", type: "header", label: "Reference Call Training" },
      { id: "t2_scriptsfile", label: "Scripts and Memory Jogger", type: "file", fileKey: "t2_scripts_file" },
      { id: "t2_refcall1", label: "Booked Reference Call 1", type: "calendly", calendlyKey: "t2_refcall1_cft" },
      { id: "t2_refcall2", label: "Booked Reference Call 2", type: "calendly", calendlyKey: "t2_refcall2_cft" },
      { id: "t2_refcall3", label: "Booked Reference Call 3", type: "calendly", calendlyKey: "t2_refcall3_cft" },
    ],
  },
  {
    id: "contactlist", vosStep: "STEP 2 · LEARN THE SYSTEM — Field Prep", label: "Fortune List", title: "Fortune List & Top 25",
    emoji: "📇", color: "#F59E0B", darkBg: "#1f1200",
    description: "Load their Fortune List, or build it together in the meeting.",
    type: "fortunelist",
    steps: [],
  },
  {
    id: "training3", vosStep: "STEP 3 · FIELD TRAINING — Training 3", label: "Training 3", title: "Financial Check-Up & Field Training",
    emoji: "🤝", color: "#EF4444", darkBg: "#1f0a0a",
    description: "This is where the learning becomes real experience. I do, you watch — 3-3-30.",
    type: "training",
    steps: [
      { id: "t3_recap_header", type: "header", label: "Recap of Meeting 3 with CFT" },
      { id: "t3_onboarding3step", label: "The Victory Onboarding — The 3 Step System & Product Training", type: "check" },
      { id: "t3_checkup", label: "Personal Financial Check-Up", type: "check" },
      { id: "t3_systembuilder_header", type: "header", label: "System Builder Tracker" },
      { id: "t3_tracker_header", type: "header", label: "Stage 01 · 3-3-30 Tracker" },
      { id: "t3_sale1", label: "Training Sales 1", type: "sales_field", calendlyKey: "t3_sale1_cft" },
      { id: "t3_sale2", label: "Training Sales 2", type: "sales_field", calendlyKey: "t3_sale2_cft" },
      { id: "t3_sale3", label: "Training Sales 3", type: "sales_field", calendlyKey: "t3_sale3_cft" },
      { id: "t3_recruit1", label: "Personal Recruit 1", type: "sales_field", calendlyKey: "t3_recruit1_cft" },
      { id: "t3_recruit2", label: "Personal Recruit 2", type: "sales_field", calendlyKey: "t3_recruit2_cft" },
      { id: "t3_recruit3", label: "Personal Recruit 3", type: "sales_field", calendlyKey: "t3_recruit3_cft" },
      { id: "t3_pfd60_header", type: "header", label: "Let's Push 2 More for Provisional Field Director 60%" },
      { id: "t3_sale4", label: "Training Sales 4", type: "sales_field", calendlyKey: "t3_sale4_cft" },
      { id: "t3_recruit4", label: "Personal Recruit 4", type: "sales_field", calendlyKey: "t3_recruit4_cft" },
      { id: "t3_sale5", label: "Training Sales 5", type: "sales_field", calendlyKey: "t3_sale5_cft" },
      { id: "t3_recruit5", label: "Personal Recruit 5", type: "sales_field", calendlyKey: "t3_recruit5_cft" },
    ],
  },
  {
    id: "fasttrack", vosStep: "3-3-30 · FAST TRACK", label: "3-3-30", title: "Fast Track Milestone",
    emoji: "🥇", color: "#D4AF37", darkBg: "#1a1400",
    description: "20 years of proven track record in building agency owners. Stage 01 → 02 → 03, all inside 30 days.",
    type: "fasttrack", steps: [],
  },
  {
    id: "licensing", vosStep: "FINAL STEP · LICENSING", label: "Licensing", title: "Licensing & Reimbursement",
    emoji: "📜", color: "#06B6D4", darkBg: "#041f26",
    description: "Complete your licensing requirements and claim your reimbursement.",
    type: "checklist",
    steps: [
      { id: "l_studymat", label: "Study Materials Obtained", type: "check", linkKey: "l_studymat_link" },
      { id: "l_examsched", label: "Resident-State Exam Scheduled", type: "check", linkKey: "l_examsched_link" },
      { id: "l_bgcheck", label: "Fingerprinting / Background Check Complete", type: "check", linkKey: "l_bgcheck_link" },
      { id: "l_exampass", label: "Exam Passed — Certificate Instructions Followed", type: "check", linkKey: "l_exampass_link" },
      { id: "l_license", label: "State License Obtained — License # & NPN Issued", type: "check", linkKey: "l_license_link" },
      { id: "l_eo", label: "Errors & Omissions Purchased via PFA Circle", type: "check", linkKey: "l_eo_link" },
      { id: "l_nlg", label: "Appointed with National Life Group — Agent Writing Code Issued", type: "check", linkKey: "l_nlg_link" },
      { id: "l_nonres", label: "Non-Resident Licenses Applied (if applicable)", type: "check", linkKey: "l_nonres_link" },
      { id: "l_reimb", label: "Congratulations 5-5-30 🎉 $750 Reimbursement Received", type: "check", note: "Licensed agents paid on the training sales does not count." },
    ],
  },
];

const DOCS = [
  { id: "doc_website", type: "LINK", title: "Victory Team Website — vfVictory.com", desc: "Official Victory team site. Login is not stored here — request access personally from your CFT or QFD.", tags: [] },
  { id: "doc_stages", type: "PNG", title: "The Victory System — 3 Stages", desc: "The one-page stage graphic. Stage 1 (3-3-30) → Stage 2 (Supervised Production) → Stage 3 (Certified Field Trainer).", tags: [] },
  { id: "doc_onboarding", type: "DOCX", title: "Victory Onboarding — The 3-Step System & Product Training", desc: "Serena's memo. The source document for these three meetings.", tags: [] },
  { id: "doc_manual", type: "PDF", title: "Victory 30-Day Field Training Manual", desc: "First-30-days checklist, licensing steps, the contact list, the scripts and memory jogger. Runs Weeks 1–4.", tags: [] },
  { id: "doc_calculator", type: "XLSX", title: "New Wave Compensation — Agent Income Calculator", desc: "The full spreadsheet model. The calculator built into Meeting 2 runs the same maths — this is the file itself.", tags: [] },
  { id: "doc_fortunelist", type: "XLSX", title: "Victory Fortune List Workbook — 100 Names, With a Printable Form", desc: "Sheet1 scores and prioritizes as they type. Print Form is 100 numbered blank rows. How To is a plain-English walkthrough with the memory joggers.", tags: [] },
  { id: "doc_lld", type: "PDF", title: "Living Life Defender — Indexed Universal Life Insurance", desc: "The consumer brochure taught in Meeting 1. Issued by Life Insurance Company of the Southwest, exclusively distributed by PFA.", tags: [] },
  { id: "doc_checkup", type: "PDF", title: "Personal Financial Check-Up", desc: "Control / Protect / Build / Grow, plus the client checklist. Marked for agents' use only.", tags: ["AGENT USE ONLY"] },
  { id: "doc_video_en", type: "VIDEO", title: "First 30 Days — Product Training (English)", desc: "The 3 Victory videos assigned as homework in Meeting 1.", tags: [] },
  { id: "doc_video_vn", type: "VIDEO", title: "First 30 Days — Product Training (Vietnamese)", desc: "The same product training in Vietnamese. Use whichever the recruit is most comfortable in.", tags: [] },
  { id: "doc_podcast", type: "AUDIO", title: "The Victory Podcast", desc: "Subscribed to in Meeting 1. One episode on the drive in.", tags: [] },
  { id: "doc_lld_riders", type: "PDF", title: "Living Life Defender — Exclusive Riders Only for PFA", desc: "The five riders you get only through PFA, on two pages: Combo MultiChoice, Gap Protector, Extended Hospital Stay, Unemployment Waiver, Guaranteed Flex.", tags: [], section: "bonus" },
  { id: "doc_stronger_together", type: "PDF", title: "Stronger Together — The Advantage of Selling National Life Group Through PFA", desc: "One page on why this company: exclusive product access, dedicated PFA underwriting, and the agency's record at NLG.", tags: [], section: "bonus" },
  { id: "doc_carrier_comparison", type: "PDF", title: "2026 Living Benefits Lineup — Carrier Comparison", desc: "How National Life Group's Accelerated Benefit Riders compare with ten other carriers — triggers, maximum acceleration, benefit type and payment method.", tags: ["AGENT USE ONLY"], section: "bonus" },
];

const RESPONSIVE_CSS = `
  :root {
  --fs-9: 9.0px;
  --fs-9-5: 9.5px;
  --fs-10: 10.0px;
  --fs-10-5: 10.5px;
  --fs-11: 11.0px;
  --fs-11-5: 11.5px;
  --fs-12: 12.0px;
  --fs-12-5: 12.5px;
  --fs-13: 13.0px;
  --fs-13-5: 13.5px;
  --fs-14: 14.0px;
  --fs-16: 16.0px;
  --fs-17: 17.0px;
  --fs-20: 20.0px;
  --fs-21: 21.0px;
  --fs-22: 22.0px;
  --fs-26: 26.0px;
  --fs-34: 34.0px;
  --fs-36: 36.0px;
  --fs-42: 42.0px;
  --fs-46: 46.0px;
  --mw-440: 440px;
  --mw-580: 580px;
  --mw-620: 620px;
  --mw-640: 640px;
  --mw-820: 820px;
  }
  @media (min-width: 900px) {
    :root {
    --fs-9: 11.5px;
    --fs-9-5: 12.0px;
    --fs-10: 13.0px;
    --fs-10-5: 13.5px;
    --fs-11: 14.0px;
    --fs-11-5: 14.5px;
    --fs-12: 15.5px;
    --fs-12-5: 16.0px;
    --fs-13: 16.5px;
    --fs-13-5: 17.5px;
    --fs-14: 18.0px;
    --fs-16: 20.5px;
    --fs-17: 22.0px;
    --fs-20: 25.5px;
    --fs-21: 27.0px;
    --fs-22: 28.0px;
    --fs-26: 33.5px;
    --fs-34: 43.5px;
    --fs-36: 46.0px;
    --fs-42: 54.0px;
    --fs-46: 59.0px;
    --mw-440: 660px;
    --mw-580: 870px;
    --mw-620: 930px;
    --mw-640: 960px;
    --mw-820: 1230px;
    }
  }
`;

const ADMINS = [
  { name: "Linda Cao", pin: "victory2026" },
];
const TRAINER_PIN = "cft2026";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getPhaseProgress(phase, progress) {
  const pp = progress[phase.id] || {};
  if (phase.type === "welcome") return progress.welcome_seen ? 100 : 0;
  if (phase.type === "documents") return null;
  if (phase.type === "fortunelist") return null;
  if (phase.type === "fasttrack") {
    const s1 = pp.stage1Sales || []; const r1 = pp.stage1Recruits || [];
    const s2 = pp.stage2Sales || [];
    const s3done = [pp.stage3Recruit, pp.stage3Target, pp.stage3In30].filter(Boolean).length;
    const num =
      s1.filter(x => x?.name).length +
      r1.filter(x => x?.name).length +
      s2.filter(x => x?.name).length +
      (pp.stage2Exam ? 1 : 0) +
      s3done;
    return Math.round((num / 11) * 100);
  }
  const countable = phase.steps.filter(s => s.type !== "header");
  const total = countable.length; if (!total) return 0;
  const done = countable.filter(s => {
    const sp = pp[s.id];
    if (s.type === "appt_tracker") return (sp?.count || 0) >= s.target;
    if (s.type === "appt_category") return s.categories.every((_, ci) => sp?.categories?.[ci]);
    if (s.type === "sales_tracker") return (sp?.sales || []).filter(Boolean).length >= s.target;
    if (s.type === "sales_field") return !!(sp?.calendlyBooked || sp?.fieldDateTime);
    return !!sp;
  }).length;
  return Math.round((done / total) * 100);
}

function getOverallProgress(agent) {
  const p = agent.progress || {};
  const pcts = PHASES.map(ph => getPhaseProgress(ph, p)).filter(pct => pct !== null);
  return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
}

function getDaysLeft(agent) {
  if (!agent.startDate) return null;
  const deadline = new Date(new Date(agent.startDate).getTime() + 30 * 24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)));
}

function getLastActivity(agent) {
  if (!agent.progress) return null;
  const ts = agent.lastActivityAt;
  if (!ts) return null;
  const days = Math.floor((new Date() - new Date(ts)) / (1000 * 60 * 60 * 24));
  return days;
}

function getStatusColor(days) {
  if (days === null) return "rgba(255,255,255,0.3)";
  if (days > 10) return "#10B981";
  if (days > 5) return "#F59E0B";
  return "#EF4444";
}

function getStatusLabel(daysLeft, pct, inactiveDays) {
  if (pct === 100) return { label: "Complete 🏆", color: "#D4AF37" };
  if (inactiveDays !== null && inactiveDays >= 3) return { label: "⚠️ Inactive", color: "#EF4444" };
  if (daysLeft === null) return { label: "No start date", color: "rgba(255,255,255,0.3)" };
  if (daysLeft === 0) return { label: "⛔ Overdue", color: "#EF4444" };
  if (daysLeft <= 5) return { label: "🔴 At Risk", color: "#EF4444" };
  if (daysLeft <= 10) return { label: "🟡 Watch", color: "#F59E0B" };
  return { label: "🟢 On Track", color: "#10B981" };
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Ic = {
  check: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  video: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  cal: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  shield: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  upload: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  file: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  link: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  plus: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
  user: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  search: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  teams: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function Bar({ pct, color = "#D4AF37", h = 7 }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: h, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 99, transition: "width 0.5s ease", boxShadow: `0 0 8px ${color}55` }} />
    </div>
  );
}

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────
function Countdown({ startDate }) {
  const daysLeft = getDaysLeft({ startDate });
  const pct = daysLeft !== null ? Math.max(0, Math.min(100, ((30 - daysLeft) / 30) * 100)) : 0;
  const sc = getStatusColor(daysLeft);
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 14px", border: `1px solid ${sc}33` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: "var(--fs-11)", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>30-Day Fast Track</span>
        <span style={{ fontSize: "var(--fs-12)", fontWeight: 800, color: sc }}>{daysLeft !== null ? `${daysLeft} days left` : "No start date"}</span>
      </div>
      <Bar pct={pct} color={sc} h={5} />
    </div>
  );
}

// ─── AGENT AVATAR ─────────────────────────────────────────────────────────────
function Avatar({ name, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #0B1B36, #D4AF37)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 800, flexShrink: 0, color: "#fff" }}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

// ─── LINK FIELD (explicit Save, no reliance on blur) ──────────────────────────
function LinkField({ value, onSave, placeholder, color = "#3B82F6" }) {
  const [val, setVal] = useState(value || "");
  const [justSaved, setJustSaved] = useState(false);
  return (
    <div style={{ display: "flex", gap: 6, flex: 1, minWidth: 140 }}>
      <input
        value={val}
        onChange={e => { setVal(e.target.value); setJustSaved(false); }}
        placeholder={placeholder}
        style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "6px 10px", color: "#fff", fontSize: "var(--fs-11-5)", boxSizing: "border-box" }}
      />
      <button
        onClick={() => { onSave(val); setJustSaved(true); }}
        style={{ background: justSaved ? "#10B981" : color, border: "none", borderRadius: 7, padding: "6px 12px", color: "#fff", fontSize: "var(--fs-11-5)", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
      >
        {justSaved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}

// ─── FILE PREVIEW (renders via a blob: URL, not the raw data: URL) ───────────
function FilePreview({ file }) {
  if (!file?.url) return null;
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name || file.url || "");
  const isPdf = /\.pdf$/i.test(file.name || file.url || "");

  if (isImage) return <img src={file.url} alt={file.name} style={{ width: "100%", borderRadius: 8, display: "block" }} />;
  if (isPdf) return <iframe src={file.url} title={file.name} style={{ width: "100%", height: 420, border: "none", borderRadius: 8, background: "#fff" }} />;
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 12, color: "rgba(255,255,255,0.4)", fontSize: "var(--fs-11-5)" }}>
      Preview isn't available for this file type ({file.name}), but you can{" "}
      <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6" }}>open it directly</a>.
    </div>
  );
}

// ─── WELCOME PHASE ────────────────────────────────────────────────────────────
function WelcomePhase({ agent, onComplete }) {
  return (
    <div style={{ maxWidth: "var(--mw-580)", margin: "0 auto", padding: "0 16px 40px" }}>
      <div style={{ background: "linear-gradient(135deg, #1a1400, #2d2000)", borderRadius: 20, padding: 28, border: "1px solid #D4AF3744", marginBottom: 14 }}>
        <div style={{ fontSize: "var(--fs-42)", textAlign: "center", marginBottom: 14 }}>🏆</div>
        <h2 style={{ color: "#D4AF37", fontSize: "var(--fs-21)", fontWeight: 800, textAlign: "center", margin: "0 0 4px" }}>
          Welcome, {agent.name.split(" ")[0]}!
        </h2>
        <p style={{ color: "#D4AF37", fontSize: "var(--fs-11)", textAlign: "center", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 20px" }}>
          Dream the Change · Team Victory
        </p>
        <div style={{ color: "rgba(255,255,255,0.82)", fontSize: "var(--fs-14)", lineHeight: 1.75 }}>
          <p style={{ margin: "0 0 12px" }}>Starting your own business, no matter the industry, is never easy. Most take years to build — but you're not doing it alone.</p>
          <p style={{ margin: "0 0 12px" }}>Our goal is simple: give you a clear path from <strong style={{ color: "#D4AF37" }}>learning the product</strong> → <strong style={{ color: "#D4AF37" }}>understanding the system</strong> → <strong style={{ color: "#D4AF37" }}>working with real clients in the field.</strong></p>
          <p style={{ margin: 0 }}>This is a blueprint to help you become independent and scale your own agency. Welcome to Team Victory.</p>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 18, marginBottom: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontWeight: 700, color: "#fff", fontSize: "var(--fs-14)", marginBottom: 14 }}>What you're committing to:</div>
        {[
          { icon: "👥", title: "Recruiting (if you want to expand)", desc: "Not mandatory to grow — but if you want to build, always be on the lookout for talent." },
          { icon: "🧭", title: "Leadership", desc: "Lead by example, think big, keep things simple. Your people watch your every step." },
          { icon: "🔁", title: "System", desc: "Commit to duplicating the system, and having your team do the same, with speed." },
          { icon: "☀️", title: "Positivity & Optimism", desc: "People prefer to be around positive, motivated people. Set the example. Smile." },
          { icon: "🏗️", title: "Duplication", desc: "Keep duplicating yourself by running the pure system to build your CFT factory." },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 12, paddingBottom: i < 4 ? 12 : 0, marginBottom: i < 4 ? 12 : 0, borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <div style={{ fontSize: "var(--fs-22)", flexShrink: 0 }}>{item.icon}</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "var(--fs-13)", marginBottom: 2 }}>{item.title}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "var(--fs-12)", lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(212,175,55,0.08)", borderRadius: 12, padding: 14, marginBottom: 18, border: "1px solid #D4AF3733" }}>
        <div style={{ color: "#D4AF37", fontWeight: 700, fontSize: "var(--fs-12)", marginBottom: 5 }}>🎯 The Simple Flow</div>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "var(--fs-13)", lineHeight: 1.6 }}>
          <strong style={{ color: "#fff" }}>1. Product</strong> → learn what we do and how we help clients. <strong style={{ color: "#fff" }}>2. System</strong> → learn how we build the business and duplicate it. <strong style={{ color: "#fff" }}>3. Field</strong> → apply the knowledge with real people, real conversations.
        </div>
      </div>

      <button onClick={onComplete} style={{ width: "100%", padding: "15px 0", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #D4AF37, #B8962E)", color: "#000", fontWeight: 800, fontSize: "var(--fs-16)", boxShadow: "0 6px 20px #D4AF3755" }}>
        Learn It. Do It. Let's Go! 🚀
      </button>
    </div>
  );
}

// ─── FORTUNE LIST CHECK-IN ─────────────────────────────────────────────────────
function FortuneListCheckin({ progress, onUpdate }) {
  const count = progress.fortuneListCount || 0;
  const [draft, setDraft] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  function countLines(text) {
    return text.split("\n").map(l => l.trim()).filter(Boolean).length;
  }
  function saveCount(n) {
    onUpdate({ ...progress, fortuneListCount: n, fortuneCheckinAt: new Date().toISOString() });
  }
  function handleCsvUpload(e) {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = String(ev.target.result).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      saveCount(lines.length);
      setSavedMsg(`Loaded ${lines.length} names from CSV — only the count was saved.`);
    };
    reader.readAsText(f);
  }
  function handleSaveDraft() {
    const n = countLines(draft);
    saveCount(n);
    setDraft("");
    setSavedMsg(`Saved: ${n} names — text cleared for privacy.`);
  }

  const categories = ["Family", "Work now", "Work before", "School", "Church / temple", "Neighbours", "Kids' activities", "Gym / sport", "Services", "Friends of friends"];

  return (
    <div style={{ background: "#0c1a2e", borderRadius: 14, padding: 16, marginBottom: 16, border: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
        <div style={{ fontSize: "var(--fs-12)", fontWeight: 800, color: "#fff", letterSpacing: 0.5, textTransform: "uppercase" }}>📋 Fortune List Check-In</div>
        <span style={{ fontSize: "var(--fs-11)", fontWeight: 700, color: count > 0 ? "#10B981" : "rgba(255,255,255,0.4)" }}>{count > 0 ? `${count} names counted` : "No check-in yet"}</span>
      </div>
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "var(--fs-11-5)", lineHeight: 1.6, margin: "0 0 12px" }}>
        Load their Fortune List, or build it together here. <strong style={{ color: "#fff" }}>Names, phone numbers, and emails are never saved</strong> — only the count, so this record can be shared without carrying anybody's contact details.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, background: "#0B1B36", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: "#fff", fontSize: "var(--fs-12)", fontWeight: 700 }}>
          {Ic.upload(12, "#fff")} Load a Fortune List CSV
          <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleCsvUpload} />
        </label>
        {count > 0 && (
          <button onClick={() => { saveCount(0); setSavedMsg(""); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 14px", color: "rgba(255,255,255,0.5)", fontSize: "var(--fs-12)", cursor: "pointer" }}>Clear the check-in</button>
        )}
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12 }}>
        <div style={{ fontSize: "var(--fs-12)", fontWeight: 700, color: "#fff", marginBottom: 8 }}>Build the 100 — do it together</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {categories.map(c => (
            <button key={c} type="button" onClick={() => setDraft(d => d + (d && !d.endsWith("\n") ? "\n" : "") + `— ${c} —\n`)}
              style={{ fontSize: "var(--fs-10-5)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 99, padding: "4px 10px", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>{c}</button>
          ))}
        </div>
        <textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder={"One name per line.\nMum\nDanny from the gym\nTuan - old job\n..."} rows={5}
          style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: "var(--fs-12-5)", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{ fontSize: "var(--fs-11)", color: "rgba(255,255,255,0.4)" }}>{countLines(draft)} names</span>
          <button onClick={handleSaveDraft} disabled={!draft.trim()} style={{ background: "#D4AF37", color: "#000", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: "var(--fs-12)", cursor: draft.trim() ? "pointer" : "default", opacity: draft.trim() ? 1 : 0.5 }}>Save Count</button>
        </div>
      </div>
      {savedMsg && <div style={{ marginTop: 10, fontSize: "var(--fs-11-5)", color: "#10B981" }}>{savedMsg}</div>}
    </div>
  );
}

const sheetCellStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5, padding: "5px 7px", color: "#fff", fontSize: "var(--fs-12)", boxSizing: "border-box", fontFamily: "inherit" };

// ─── FORTUNE LIST SHEET (50-line keying grid) ─────────────────────────────────
function FortuneListSheet({ progress, onUpdate }) {
  const rows = Array.from({ length: 100 }, (_, i) => progress.sheetRows?.[i] || { name: "", phone: "", o: false, l: false, r: false, notes: "" });
  function updateCell(i, field, value) {
    const next = rows.map((row, idx) => idx === i ? { ...row, [field]: value } : row);
    onUpdate({ ...progress, sheetRows: next });
  }
  const filledCount = rows.filter(r => r.name.trim()).length;

  return (
    <div style={{ background: "#0c1a2e", borderRadius: 14, padding: 16, marginBottom: 16, border: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
        <div style={{ fontSize: "var(--fs-12)", fontWeight: 800, color: "#fff", letterSpacing: 0.5, textTransform: "uppercase" }}>📝 Fortune List — Key It In Live</div>
        <span style={{ fontSize: "var(--fs-11)", color: "rgba(255,255,255,0.4)" }}>{filledCount}/100 filled</span>
      </div>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "var(--fs-11)", margin: "0 0 10px", lineHeight: 1.5 }}>Don't think — just let the names flow. Type the name, their number, mark <strong style={{ color: "#fff" }}>O</strong> for Opportunity, <strong style={{ color: "#fff" }}>L</strong> for Life, <strong style={{ color: "#fff" }}>R</strong> for Retirement, and jot a quick note.</p>
      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "var(--fs-11-5)", fontStyle: "italic", margin: "0 0 12px" }}>
        "Every name on this list is someone you can introduce to a solution that could genuinely change their life."
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--fs-12)", minWidth: 560 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "rgba(255,255,255,0.4)" }}>
              <th style={{ width: 26, padding: "4px 6px", fontWeight: 600 }}>#</th>
              <th style={{ padding: "4px 6px", fontWeight: 600 }}>Name</th>
              <th style={{ padding: "4px 6px", width: 130, fontWeight: 600 }}>Phone Number</th>
              <th style={{ width: 30, padding: "4px 4px", fontWeight: 600, textAlign: "center" }}>O</th>
              <th style={{ width: 30, padding: "4px 4px", fontWeight: 600, textAlign: "center" }}>L</th>
              <th style={{ width: 30, padding: "4px 4px", fontWeight: 600, textAlign: "center" }}>R</th>
              <th style={{ padding: "4px 6px", fontWeight: 600 }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "2px 6px", color: "rgba(255,255,255,0.3)" }}>{i + 1}</td>
                <td style={{ padding: "2px 2px" }}><input value={r.name} onChange={e => updateCell(i, "name", e.target.value)} style={sheetCellStyle} /></td>
                <td style={{ padding: "2px 2px" }}><input value={r.phone} onChange={e => updateCell(i, "phone", e.target.value)} style={sheetCellStyle} /></td>
                <td style={{ padding: "2px 2px", textAlign: "center" }}><input type="checkbox" checked={!!r.o} onChange={e => updateCell(i, "o", e.target.checked)} /></td>
                <td style={{ padding: "2px 2px", textAlign: "center" }}><input type="checkbox" checked={!!r.l} onChange={e => updateCell(i, "l", e.target.checked)} /></td>
                <td style={{ padding: "2px 2px", textAlign: "center" }}><input type="checkbox" checked={!!r.r} onChange={e => updateCell(i, "r", e.target.checked)} /></td>
                <td style={{ padding: "2px 2px" }}><input value={r.notes} onChange={e => updateCell(i, "notes", e.target.value)} style={sheetCellStyle} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PHASE CONTENT ────────────────────────────────────────────────────────────
function PhaseContent({ phase, progress, fullProgress, onUpdate, videos, files, links, calendlyLinks, isAdmin, canUploadFiles, onUploadVideo, onUploadFile, onUpdateLink, onUpdateCalendly }) {
  const [local, setLocal] = useState(progress || {});
  const [expandedFileStep, setExpandedFileStep] = useState(null);

  function toggle(stepId) {
    const u = { ...local, [stepId]: !local[stepId] };
    setLocal(u); onUpdate(u);
  }
  function updateStep(stepId, data) {
    const u = { ...local, [stepId]: data };
    setLocal(u); onUpdate(u);
  }

  if (phase.type === "documents") return <DocumentsView files={files} links={links} isAdmin={isAdmin} onUploadFile={onUploadFile} onUpdateLink={onUpdateLink} />;
  if (phase.type === "fortunelist") return (
    <div style={{ maxWidth: "var(--mw-620)", margin: "0 auto", padding: "0 16px 40px" }}>
      <FortuneListSheet progress={local} onUpdate={d => { setLocal(d); onUpdate(d); }} />
      <FortuneListCheckin progress={local} onUpdate={d => { setLocal(d); onUpdate(d); }} />
    </div>
  );
  if (phase.type === "fasttrack") return <FastTrackView progress={local} onUpdate={d => { setLocal(d); onUpdate(d); }} fullProgress={fullProgress} />;

  const countableSteps = phase.steps.filter(s => s.type !== "header");
  const totalCheckable = countableSteps.length;
  const completedCount = countableSteps.filter(s => {
    const p = local[s.id];
    if (s.type === "appt_tracker") return (p?.count || 0) >= s.target;
    if (s.type === "appt_category") return s.categories.every((_, ci) => p?.categories?.[ci]);
    if (s.type === "sales_tracker") return (p?.sales || []).filter(Boolean).length >= s.target;
    if (s.type === "sales_field") return !!(p?.calendlyBooked || p?.fieldDateTime);
    return !!p;
  }).length;
  const pct = totalCheckable > 0 ? Math.round((completedCount / totalCheckable) * 100) : 0;

  return (
    <div style={{ maxWidth: "var(--mw-620)", margin: "0 auto", padding: "0 16px 40px" }}>
      <div style={{ background: phase.darkBg, borderRadius: 16, padding: 18, marginBottom: 14, border: `1px solid ${phase.color}33` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: "var(--fs-26)" }}>{phase.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--fs-10)", color: phase.color, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>{phase.vosStep}</div>
            <div style={{ fontSize: "var(--fs-17)", fontWeight: 800, color: "#fff" }}>{phase.title}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "var(--fs-26)", fontWeight: 800, color: phase.color }}>{pct}%</div>
            <div style={{ fontSize: "var(--fs-10)", color: "rgba(255,255,255,0.4)" }}>{completedCount}/{totalCheckable}</div>
          </div>
        </div>
        <Bar pct={pct} color={phase.color} />
        {phase.description && <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "var(--fs-12)", margin: "8px 0 0", lineHeight: 1.6 }}>{phase.description}</p>}
      </div>

      {phase.steps.map(step => {
        if (step.type === "header") {
          return (
            <div key={step.id} style={{ color: phase.color, fontSize: "var(--fs-12)", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", margin: "16px 2px 8px" }}>
              {step.label}
            </div>
          );
        }
        const done = (() => {
          const p = local[step.id];
          if (step.type === "appt_tracker") return (p?.count || 0) >= step.target;
          if (step.type === "appt_category") return step.categories.every((_, ci) => p?.categories?.[ci]);
          if (step.type === "sales_tracker") return (p?.sales || []).filter(Boolean).length >= step.target;
          if (step.type === "sales_field") return !!(p?.calendlyBooked || p?.fieldDateTime);
          return !!p;
        })();

        return (
          <div key={step.id} style={{ background: done ? `${phase.darkBg}cc` : "rgba(255,255,255,0.04)", borderRadius: 12, marginBottom: 8, border: `1px solid ${done ? phase.color + "44" : "rgba(255,255,255,0.08)"}`, overflow: "hidden" }}>

            {step.type === "check" && (
              <div>
                <div onClick={() => toggle(step.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", cursor: "pointer" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${done ? phase.color : "rgba(255,255,255,0.2)"}`, background: done ? phase.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {done && Ic.check(13, "#000")}
                  </div>
                  <span style={{ color: done ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.88)", fontSize: "var(--fs-13)", flex: 1, textDecoration: done ? "line-through" : "none" }}>{step.label}</span>
                  {step.url && !done && <a href={step.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: "var(--fs-11)", color: phase.color, textDecoration: "none", background: `${phase.color}18`, padding: "3px 8px", borderRadius: 6, flexShrink: 0 }}>Open ↗</a>}
                  {step.linkKey && links[step.linkKey] && <a href={links[step.linkKey]} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: "var(--fs-11)", color: phase.color, textDecoration: "none", background: `${phase.color}18`, padding: "3px 8px", borderRadius: 6, flexShrink: 0 }}>Open ↗</a>}
                </div>
                {step.linkKey && isAdmin && (
                  <div style={{ padding: "0 14px 12px" }}>
                    <LinkField value={links[step.linkKey]} onSave={v => onUpdateLink(step.linkKey, v)} placeholder="Paste a reference link for this step..." />
                  </div>
                )}
                {step.note && (
                  <div style={{ padding: "0 14px 12px", color: "rgba(255,255,255,0.35)", fontSize: "var(--fs-11)", fontStyle: "italic" }}>({step.note})</div>
                )}
              </div>
            )}

            {step.type === "video" && (
              <div style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: done ? phase.color : `${phase.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {Ic.video(14, done ? "#000" : phase.color)}
                  </div>
                  <span style={{ color: done ? "rgba(255,255,255,0.5)" : "#fff", fontSize: "var(--fs-13)", fontWeight: 600, flex: 1 }}>{step.label}</span>
                  {done && Ic.check(16, phase.color)}
                </div>
                {videos[step.videoKey]?.url ? (
                  <>
                    <video controls style={{ width: "100%", borderRadius: 8, maxHeight: 210, background: "#000", display: "block" }} src={videos[step.videoKey].url} />
                    {!done && <button onClick={() => toggle(step.id)} style={{ marginTop: 8, width: "100%", padding: "9px 0", borderRadius: 8, border: "none", background: phase.color, color: "#000", fontWeight: 700, fontSize: "var(--fs-13)", cursor: "pointer" }}>Mark as Watched ✓</button>}
                    {isAdmin && (
                      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${phase.color}44`, borderRadius: 8, padding: 8, cursor: "pointer", color: phase.color, fontSize: "var(--fs-11-5)", fontWeight: 600, marginTop: 8 }}>
                        {Ic.upload(12, phase.color)} Replace video
                        <input type="file" accept="video/*" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) onUploadVideo(step.videoKey, f); }} />
                      </label>
                    )}
                  </>
                ) : (
                  <>
                    {isAdmin ? (
                      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: `1.5px dashed ${phase.color}44`, borderRadius: 8, padding: 16, cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: "var(--fs-12)" }}>
                        {Ic.upload(13, "rgba(255,255,255,0.3)")} Upload video for this step
                        <input type="file" accept="video/*" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) onUploadVideo(step.videoKey, f); }} />
                      </label>
                    ) : (
                      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 14, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "var(--fs-12)" }}>Training video coming soon</div>
                    )}
                    {!done && <button onClick={() => toggle(step.id)} style={{ marginTop: 8, width: "100%", padding: "8px 0", borderRadius: 8, border: `1px solid ${phase.color}44`, background: "transparent", color: phase.color, fontWeight: 600, fontSize: "var(--fs-12)", cursor: "pointer" }}>Mark Complete (no video yet)</button>}
                  </>
                )}
              </div>
            )}

            {step.type === "file" && (
              <div style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: done ? phase.color : `${phase.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {Ic.file(14, done ? "#000" : phase.color)}
                  </div>
                  <span style={{ color: done ? "rgba(255,255,255,0.5)" : "#fff", fontSize: "var(--fs-13)", fontWeight: 600, flex: 1 }}>{step.label}</span>
                  {done && Ic.check(16, phase.color)}
                </div>
                {files[step.fileKey] ? (
                  <>
                    <button onClick={() => setExpandedFileStep(expandedFileStep === step.id ? null : step.id)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, padding: "10px 12px", textAlign: "left", color: phase.color, fontSize: "var(--fs-12-5)", fontWeight: 600, marginBottom: 8, cursor: "pointer" }}>
                      {Ic.file(14, phase.color)} {files[step.fileKey].name || "Uploaded file"} — {expandedFileStep === step.id ? "hide" : "view"}
                    </button>
                    {expandedFileStep === step.id && (
                      <div style={{ marginBottom: 8 }}>
                        <FilePreview file={files[step.fileKey]} />
                      </div>
                    )}
                    {canUploadFiles && (
                      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${phase.color}44`, borderRadius: 8, padding: 8, cursor: "pointer", color: phase.color, fontSize: "var(--fs-11-5)", fontWeight: 600, marginBottom: 8 }}>
                        {Ic.upload(12, phase.color)} Replace file
                        <input type="file" accept=".pdf,image/*,.doc,.docx" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) onUploadFile(step.fileKey, f); }} />
                      </label>
                    )}
                  </>
                ) : (
                  canUploadFiles ? (
                    <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: `1.5px dashed ${phase.color}44`, borderRadius: 8, padding: 16, cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: "var(--fs-12)", marginBottom: 8 }}>
                      {Ic.upload(13, "rgba(255,255,255,0.3)")} Upload the completed Check-Up
                      <input type="file" accept=".pdf,image/*,.doc,.docx" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) onUploadFile(step.fileKey, f); }} />
                    </label>
                  ) : (
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 14, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "var(--fs-12)", marginBottom: 8 }}>Nothing uploaded yet</div>
                  )
                )}
                {files[step.fileKey] && !done && <button onClick={() => toggle(step.id)} style={{ width: "100%", padding: "8px 0", borderRadius: 8, border: "none", background: phase.color, color: "#000", fontWeight: 700, fontSize: "var(--fs-13)", cursor: "pointer" }}>Mark Complete ✓</button>}
                {!files[step.fileKey] && !done && <button onClick={() => toggle(step.id)} style={{ width: "100%", padding: "8px 0", borderRadius: 8, border: `1px solid ${phase.color}44`, background: "transparent", color: phase.color, fontWeight: 600, fontSize: "var(--fs-12)", cursor: "pointer" }}>Mark Complete (no file yet)</button>}
              </div>
            )}

            {step.type === "link" && (
              <div style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: done ? phase.color : `${phase.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {Ic.link(14, done ? "#000" : phase.color)}
                  </div>
                  <span style={{ color: done ? "rgba(255,255,255,0.5)" : "#fff", fontSize: "var(--fs-13)", fontWeight: 600, flex: 1 }}>{step.label}</span>
                  {done && Ic.check(16, phase.color)}
                </div>
                {isAdmin && (
                  <div style={{ marginBottom: 8 }}>
                    <LinkField value={links[step.linkKey]} onSave={v => onUpdateLink(step.linkKey, v)} placeholder="Paste link (podcast, course, chat, etc.)..." color={phase.color} />
                  </div>
                )}
                {links[step.linkKey]
                  ? <a href={links[step.linkKey]} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: phase.color, color: "#000", padding: "10px 0", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: "var(--fs-13)" }}>{Ic.link(14, "#000")} Open Link</a>
                  : <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 10, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "var(--fs-12)" }}>{isAdmin ? "Add the link above" : "Link coming soon"}</div>
                }
                {!done && <button onClick={() => toggle(step.id)} style={{ marginTop: 8, width: "100%", padding: "8px 0", borderRadius: 8, border: `1px solid ${phase.color}44`, background: "transparent", color: phase.color, fontWeight: 600, fontSize: "var(--fs-12)", cursor: "pointer" }}>Mark Complete ✓</button>}
              </div>
            )}

            {step.type === "calendly" && (
              <div style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: done ? phase.color : `${phase.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {Ic.cal(14, done ? "#000" : phase.color)}
                  </div>
                  <span style={{ color: done ? "rgba(255,255,255,0.5)" : "#fff", fontSize: "var(--fs-13)", fontWeight: 600, flex: 1 }}>{step.label}</span>
                  {done && Ic.check(16, phase.color)}
                </div>
                {isAdmin && (
                  <div style={{ marginBottom: 8 }}>
                    <LinkField value={calendlyLinks[step.calendlyKey]} onSave={v => onUpdateCalendly(step.calendlyKey, v)} placeholder="Paste Calendly link..." color={phase.color} />
                  </div>
                )}
                {calendlyLinks[step.calendlyKey]
                  ? <a href={calendlyLinks[step.calendlyKey]} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: phase.color, color: "#000", padding: "10px 0", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: "var(--fs-13)" }}>{Ic.cal(14, "#000")} Book on Calendly</a>
                  : <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 10, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "var(--fs-12)" }}>{isAdmin ? "Add your Calendly link above" : "Booking link coming soon"}</div>
                }
                {!done && <button onClick={() => toggle(step.id)} style={{ marginTop: 8, width: "100%", padding: "8px 0", borderRadius: 8, border: `1px solid ${phase.color}44`, background: "transparent", color: phase.color, fontWeight: 600, fontSize: "var(--fs-12)", cursor: "pointer" }}>Mark as Booked ✓</button>}
              </div>
            )}

            {step.type === "sales_field" && (
              <div style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: done ? phase.color : `${phase.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {Ic.cal(14, done ? "#000" : phase.color)}
                  </div>
                  <span style={{ color: done ? "rgba(255,255,255,0.5)" : "#fff", fontSize: "var(--fs-13)", fontWeight: 600, flex: 1 }}>{step.label}</span>
                  {done && Ic.check(16, phase.color)}
                </div>

                <div style={{ fontSize: "var(--fs-10-5)", color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Book Ahead</div>
                {isAdmin && (
                  <div style={{ marginBottom: 8 }}>
                    <LinkField value={calendlyLinks[step.calendlyKey]} onSave={v => onUpdateCalendly(step.calendlyKey, v)} placeholder="Paste Calendly link..." color={phase.color} />
                  </div>
                )}
                {calendlyLinks[step.calendlyKey] ? (
                  <a href={calendlyLinks[step.calendlyKey]} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: phase.color, color: "#000", padding: "9px 0", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: "var(--fs-12-5)", marginBottom: 6 }}>{Ic.cal(13, "#000")} Book on Calendly</a>
                ) : (
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 9, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "var(--fs-11-5)", marginBottom: 6 }}>{isAdmin ? "Add your Calendly link above" : "Booking link coming soon"}</div>
                )}
                {!local[step.id]?.calendlyBooked && (
                  <button onClick={() => updateStep(step.id, { ...local[step.id], calendlyBooked: true })} style={{ width: "100%", padding: "7px 0", borderRadius: 8, border: `1px solid ${phase.color}44`, background: "transparent", color: phase.color, fontWeight: 600, fontSize: "var(--fs-11-5)", cursor: "pointer" }}>Mark as Booked ✓</button>
                )}
                {local[step.id]?.calendlyBooked && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: `${phase.color}18`, borderRadius: 8, padding: "7px 10px" }}>
                    <span style={{ fontSize: "var(--fs-11-5)", color: phase.color, fontWeight: 700 }}>✓ Booked on Calendly</span>
                    <button onClick={() => updateStep(step.id, { ...local[step.id], calendlyBooked: false })} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "var(--fs-11)", cursor: "pointer" }}>undo</button>
                  </div>
                )}

                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "var(--fs-10-5)", fontWeight: 700, margin: "10px 0" }}>— OR —</div>

                <div style={{ fontSize: "var(--fs-10-5)", color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Scheduled on Field</div>
                <input
                  type="datetime-local"
                  value={local[step.id]?.fieldDateTime || ""}
                  onChange={e => updateStep(step.id, { ...local[step.id], fieldDateTime: e.target.value })}
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#fff", fontSize: "var(--fs-12)", boxSizing: "border-box" }}
                />
                {local[step.id]?.fieldDateTime && (
                  <div style={{ fontSize: "var(--fs-11)", color: phase.color, fontWeight: 700, marginTop: 6 }}>✓ Logged in the field</div>
                )}
              </div>
            )}

            {step.type === "appt_category" && (
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: "var(--fs-13)", fontWeight: 600, color: "#fff", marginBottom: 10 }}>{step.label}</div>
                {step.categories.map((cat, ci) => {
                  const catDone = local[step.id]?.categories?.[ci];
                  return (
                    <div key={ci} onClick={() => { const prev = local[step.id] || { categories: {} }; updateStep(step.id, { categories: { ...prev.categories, [ci]: !catDone } }); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: ci < step.categories.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", cursor: "pointer" }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${catDone ? phase.color : "rgba(255,255,255,0.2)"}`, background: catDone ? phase.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {catDone && Ic.check(11, "#000")}
                      </div>
                      <span style={{ color: catDone ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)", fontSize: "var(--fs-13)", textDecoration: catDone ? "line-through" : "none" }}>{cat}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {pct === 100 && (
        <div style={{ textAlign: "center", padding: 18, color: phase.color, fontWeight: 700, fontSize: "var(--fs-14)" }}>
          {phase.emoji} Phase Complete — Keep Rising! 🏆
        </div>
      )}
    </div>
  );
}

// ─── DOCUMENTS VIEW ───────────────────────────────────────────────────────────
function DocumentsView({ files, links, isAdmin, onUploadFile, onUpdateLink }) {
  const [expandedId, setExpandedId] = useState(null);
  return (
    <div style={{ maxWidth: "var(--mw-640)", margin: "0 auto", padding: "0 16px 40px" }}>
      <div style={{ background: "#0c1a2e", borderRadius: 16, padding: 18, marginBottom: 14, border: "1px solid #3B82F633" }}>
        <div style={{ fontSize: "var(--fs-17)", fontWeight: 800, color: "#fff" }}>📁 The Documents</div>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "var(--fs-12)", margin: "6px 0 0", lineHeight: 1.6 }}>Reference library for onboarding a new agent — download or open any of these, any time.</p>
      </div>

      {DOCS.map((doc, i) => {
        const file = files[doc.id];
        const link = links[doc.id];
        const showBonusBanner = doc.section === "bonus" && DOCS[i - 1]?.section !== "bonus";
        const isExpanded = expandedId === doc.id;
        return (
          <div key={doc.id}>
            {showBonusBanner && (
              <div style={{ background: "linear-gradient(135deg, #8a6a1f, #D4AF37)", borderRadius: 12, padding: "14px 16px", marginTop: 16, marginBottom: 8 }}>
                <div style={{ color: "#1a1400", fontWeight: 800, fontSize: "var(--fs-13)", marginBottom: 5, letterSpacing: 0.5 }}>🏅 BONUS — WHY PFA</div>
                <div style={{ color: "#1a1400", fontSize: "var(--fs-12)", lineHeight: 1.6, opacity: 0.85 }}>The Recruiting Edge: what you can offer that nobody else can.</div>
              </div>
            )}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 14, marginBottom: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flexShrink: 0, width: 48, height: 24, borderRadius: 6, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", fontSize: "var(--fs-9)", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: 0.5 }}>{doc.type}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "var(--fs-13-5)", marginBottom: 3 }}>{doc.title}</div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "var(--fs-12)", lineHeight: 1.55, marginBottom: 7 }}>{doc.desc}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {doc.tags.map(t => <span key={t} style={{ fontSize: "var(--fs-9-5)", fontWeight: 700, color: "#D4AF37", background: "#D4AF3718", padding: "2px 7px", borderRadius: 99 }}>{t}</span>)}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              {file ? (
                <button onClick={() => setExpandedId(isExpanded ? null : doc.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#3B82F6", color: "#fff", padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: "var(--fs-12-5)" }}>{Ic.upload(12, "#fff")} {isExpanded ? "Hide" : "View"}</button>
              ) : link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#3B82F6", color: "#fff", padding: "7px 14px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: "var(--fs-12-5)" }}>{Ic.link(12, "#fff")} Open</a>
              ) : (
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "var(--fs-12)" }}>{isAdmin ? "Not added yet — attach below" : "Coming soon"}</div>
              )}

              {isExpanded && file && (
                <div style={{ marginTop: 10 }}>
                  <FilePreview file={file} />
                </div>
              )}

              {isAdmin && (
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 7, padding: "6px 10px", cursor: "pointer", color: "rgba(255,255,255,0.55)", fontSize: "var(--fs-11-5)", flexShrink: 0 }}>
                    {Ic.upload(12, "rgba(255,255,255,0.5)")} {file ? "Replace file" : "Attach file"}
                    <input type="file" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) onUploadFile(doc.id, f); }} />
                  </label>
                  <LinkField value={link} onSave={v => onUpdateLink(doc.id, v)} placeholder="...or paste a link" />
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}

// ─── FAST TRACK VIEW (3-3-30) ─────────────────────────────────────────────────
function FastTrackView({ progress, onUpdate, fullProgress }) {
  const stage1Sales = progress.stage1Sales || Array(3).fill({ name: "", tp: "" });
  const stage1Recruits = progress.stage1Recruits || Array(3).fill({ name: "" });
  const stage1BonusSales = progress.stage1BonusSales || Array(2).fill({ name: "", tp: "" });
  const stage1BonusRecruits = progress.stage1BonusRecruits || Array(2).fill({ name: "", pfa: "" });
  const stage2Sales = progress.stage2Sales || Array(3).fill({ name: "", tp: "" });
  const stage2Exam = !!progress.stage2Exam;
  const stage3Recruit = !!progress.stage3Recruit;
  const stage3Target = !!progress.stage3Target;
  const stage3In30 = !!progress.stage3In30;

  const s1SalesDone = stage1Sales.filter(s => s?.name).length;
  const s1RecruitsDone = stage1Recruits.filter(r => r?.name).length;
  const s1TP = stage1Sales.reduce((sum, s) => sum + (parseInt(s?.tp) || 0), 0) + stage1BonusSales.reduce((sum, s) => sum + (parseInt(s?.tp) || 0), 0);
  const s1Complete = s1SalesDone >= 3 && s1RecruitsDone >= 3;
  const s1BonusSalesDone = stage1BonusSales.filter(s => s?.name).length;
  const s1BonusRecruitsDone = stage1BonusRecruits.filter(r => r?.name).length;

  const s2SalesDone = stage2Sales.filter(s => s?.name).length;
  const s2TP = stage2Sales.reduce((sum, s) => sum + (parseInt(s?.tp) || 0), 0);
  const s2Complete = s2SalesDone >= 3 && stage2Exam;

  const s3Complete = stage3Recruit && stage3Target && stage3In30;

  const overallDone = s1SalesDone + s1RecruitsDone + s2SalesDone + (stage2Exam ? 1 : 0) + [stage3Recruit, stage3Target, stage3In30].filter(Boolean).length;
  const pct = Math.round((overallDone / 11) * 100);

  function set(field, value) { onUpdate({ ...progress, [field]: value }); }

  const stageCard = (num, title, subtitle, complete, unlockLabel, children) => (
    <div style={{ background: complete ? "linear-gradient(135deg, #1a1400, #2d2000)" : "rgba(255,255,255,0.04)", borderRadius: 14, padding: 16, marginBottom: 10, border: `1px solid ${complete ? "#D4AF3744" : "rgba(255,255,255,0.07)"}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: complete ? "#D4AF37" : "rgba(255,255,255,0.08)", color: complete ? "#000" : "#D4AF37", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--fs-13)", flexShrink: 0 }}>
          {complete ? "✓" : num}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--fs-10)", color: "#D4AF37", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Stage 0{num}</div>
          <div style={{ fontWeight: 800, color: "#fff", fontSize: "var(--fs-14)" }}>{title}</div>
        </div>
      </div>
      {subtitle && <div style={{ fontSize: "var(--fs-11-5)", color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>{subtitle}</div>}
      {children}
      {complete && <div style={{ marginTop: 10, fontSize: "var(--fs-11)", fontWeight: 700, color: "#D4AF37", background: "#D4AF3718", borderRadius: 8, padding: "6px 10px", textAlign: "center" }}>🔓 {unlockLabel}</div>}
    </div>
  );

  return (
    <div style={{ maxWidth: "var(--mw-620)", margin: "0 auto", padding: "0 16px 40px" }}>
      <div style={{ background: "linear-gradient(135deg, #1a1400, #2d2000)", borderRadius: 16, padding: 20, marginBottom: 14, border: "1px solid #D4AF3744" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: "var(--fs-34)", fontWeight: 800, color: "#D4AF37" }}>{pct}%</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "var(--fs-12)" }}>through the full 3-3-30 → Certified Field Trainer path</div>
        </div>
        <Bar pct={pct} color="#D4AF37" h={10} />
      </div>

      {stageCard(1, "3-3-30", "3 training sales — I do, you watch · 3 personal recruits — I do, you watch · all inside 30 days", s1Complete, "$15,000 target hit — ready for Supervised Production",
        <>
          {s1TP > 0 && (
            <div style={{ fontSize: "var(--fs-12)", fontWeight: 700, marginBottom: 8, color: s1TP >= 15000 ? "#10B981" : "#F59E0B" }}>
              🎯 {s1TP.toLocaleString()} TP toward $15,000 {s1TP >= 15000 ? "✓ Goal Met" : `(need ${(15000 - s1TP).toLocaleString()} more)`}
            </div>
          )}
          <div style={{ fontSize: "var(--fs-12)", fontWeight: 700, color: "#fff", marginBottom: 8 }}>💼 Training Sales ({s1SalesDone}/3)</div>
          {stage1Sales.map((sale, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
              <input value={sale?.name || ""} onChange={e => { const s = [...stage1Sales]; s[i] = { ...s[i], name: e.target.value }; set("stage1Sales", s); }} placeholder="Client name" style={{ flex: 2, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#fff", fontSize: "var(--fs-12)" }} />
              <input value={sale?.tp || ""} type="number" onChange={e => { const s = [...stage1Sales]; s[i] = { ...s[i], tp: e.target.value }; set("stage1Sales", s); }} placeholder="TP" style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#D4AF37", fontSize: "var(--fs-12)", fontWeight: 700 }} />
            </div>
          ))}
          <div style={{ fontSize: "var(--fs-12)", fontWeight: 700, color: "#fff", margin: "10px 0 8px" }}>👥 Personal Recruits ({s1RecruitsDone}/3)</div>
          {stage1Recruits.map((rec, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
              <input value={rec?.name || ""} onChange={e => { const r = [...stage1Recruits]; r[i] = { ...r[i], name: e.target.value }; set("stage1Recruits", r); }} placeholder="Recruit name" style={{ flex: 2, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#fff", fontSize: "var(--fs-12)" }} />
              <input value={rec?.pfa || ""} onChange={e => { const r = [...stage1Recruits]; r[i] = { ...r[i], pfa: e.target.value }; set("stage1Recruits", r); }} placeholder="PFA#" style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#D4AF37", fontSize: "var(--fs-12)", fontWeight: 700 }} />
            </div>
          ))}

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed rgba(255,255,255,0.12)" }}>
            <div style={{ fontSize: "var(--fs-10)", color: "#D4AF37", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>Stage 01 Bonus</div>
            <div style={{ fontWeight: 800, color: "#fff", fontSize: "var(--fs-13)", marginBottom: 4 }}>2-2-30</div>
            <div style={{ fontSize: "var(--fs-11-5)", color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Go for 2 more training sales and 2 more recruits to hit contract level 60% PFD.</div>

            <div style={{ fontSize: "var(--fs-12)", fontWeight: 700, color: "#fff", marginBottom: 8 }}>💼 Training Sales ({s1BonusSalesDone}/2)</div>
            {stage1BonusSales.map((sale, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                <input value={sale?.name || ""} onChange={e => { const s = [...stage1BonusSales]; s[i] = { ...s[i], name: e.target.value }; set("stage1BonusSales", s); }} placeholder="Client name" style={{ flex: 2, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#fff", fontSize: "var(--fs-12)" }} />
                <input value={sale?.tp || ""} type="number" onChange={e => { const s = [...stage1BonusSales]; s[i] = { ...s[i], tp: e.target.value }; set("stage1BonusSales", s); }} placeholder="TP" style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#D4AF37", fontSize: "var(--fs-12)", fontWeight: 700 }} />
              </div>
            ))}

            <div style={{ fontSize: "var(--fs-12)", fontWeight: 700, color: "#fff", margin: "10px 0 8px" }}>👥 Personal Recruits ({s1BonusRecruitsDone}/2)</div>
            {stage1BonusRecruits.map((rec, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                <input value={rec?.name || ""} onChange={e => { const r = [...stage1BonusRecruits]; r[i] = { ...r[i], name: e.target.value }; set("stage1BonusRecruits", r); }} placeholder="Recruit name" style={{ flex: 2, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#fff", fontSize: "var(--fs-12)" }} />
                <input value={rec?.pfa || ""} onChange={e => { const r = [...stage1BonusRecruits]; r[i] = { ...r[i], pfa: e.target.value }; set("stage1BonusRecruits", r); }} placeholder="PFA#" style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#D4AF37", fontSize: "var(--fs-12)", fontWeight: 700 }} />
              </div>
            ))}
          </div>
        </>
      )}

      {stageCard(2, "Supervised Production", "3 additional sales — you do, I watch · pass the certification exam", s2Complete, "Cleared to sell independently",
        <>
          <div style={{ fontSize: "var(--fs-12)", fontWeight: 700, color: "#fff", marginBottom: 8 }}>💼 Additional Sales ({s2SalesDone}/3){s2TP > 0 && <span style={{ color: s2TP >= 9000 ? "#10B981" : "#F59E0B", fontWeight: 700 }}> · {s2TP.toLocaleString()} TP {s2TP >= 9000 ? "✓" : `(need ${(9000 - s2TP).toLocaleString()} more)`}</span>}</div>
          {stage2Sales.map((sale, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
              <input value={sale?.name || ""} onChange={e => { const s = [...stage2Sales]; s[i] = { ...s[i], name: e.target.value }; set("stage2Sales", s); }} placeholder="Client name" style={{ flex: 2, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#fff", fontSize: "var(--fs-12)" }} />
              <input value={sale?.tp || ""} type="number" onChange={e => { const s = [...stage2Sales]; s[i] = { ...s[i], tp: e.target.value }; set("stage2Sales", s); }} placeholder="TP" style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 10px", color: "#D4AF37", fontSize: "var(--fs-12)", fontWeight: 700 }} />
            </div>
          ))}
          <div onClick={() => set("stage2Exam", !stage2Exam)} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, cursor: "pointer" }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${stage2Exam ? "#D4AF37" : "rgba(255,255,255,0.2)"}`, background: stage2Exam ? "#D4AF37" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {stage2Exam && Ic.check(11, "#000")}
            </div>
            <span style={{ color: stage2Exam ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)", fontSize: "var(--fs-13)" }}>Certification exam passed</span>
          </div>
        </>
      )}

      {stageCard(3, "Certified Field Trainer", "Take one recruit through their own 3-3-30 · they hit $15,000 · complete it in 30 days", s3Complete, "Access to the Victory Leads Network",
        <>
          {[
            ["stage3Recruit", "Took one recruit through their own 3-3-30", stage3Recruit],
            ["stage3Target", "Recruit hit $15,000 under your training", stage3Target],
            ["stage3In30", "Recruit completed it in 30 days", stage3In30],
          ].map(([field, label, val]) => (
            <div key={field} onClick={() => set(field, !val)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", cursor: "pointer" }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${val ? "#D4AF37" : "rgba(255,255,255,0.2)"}`, background: val ? "#D4AF37" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {val && Ic.check(11, "#000")}
              </div>
              <span style={{ color: val ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)", fontSize: "var(--fs-13)" }}>{label}</span>
            </div>
          ))}
        </>
      )}

      <div style={{ textAlign: "center", padding: "10px 4px", color: "rgba(255,255,255,0.3)", fontSize: "var(--fs-11-5)", fontStyle: "italic" }}>
        "You are not a leader because you produce. You are a leader because someone else can now produce because of you."
      </div>
    </div>
  );
}

// ─── AGENT PORTAL ─────────────────────────────────────────────────────────────
function AgentPortal({ agent, videos, files, links, calendlyLinks, isAdmin, isTrainer, onBack, onProgressUpdate, onUpdateStartDate, onUploadVideo, onUploadFile, onUpdateLink, onUpdateCalendly }) {
  const [activePhase, setActivePhase] = useState(0);
  const progress = agent.progress || {};
  const welcomeSeen = !!progress.welcome_seen;
  const currentAgent = agent;

  function handleWelcomeDone() {
    onProgressUpdate(agent.id, { ...progress, welcome_seen: true });
    setActivePhase(1);
  }
  function handlePhaseUpdate(phaseId, pp) {
    onProgressUpdate(agent.id, { ...progress, [phaseId]: pp });
  }

  const active = PHASES[activePhase];

  return (
    <div>
      {(isAdmin || isTrainer) && (
        <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "#fff", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: "var(--fs-12)" }}>← Back</button>
          <Avatar name={currentAgent.name} size={30} />
          <div style={{ fontWeight: 700, color: "#fff", fontSize: "var(--fs-13)" }}>{currentAgent.name}</div>
        </div>
      )}

      {currentAgent.startDate && (
        <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {(isAdmin || isTrainer) ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <label style={{ fontSize: "var(--fs-11)", color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>Fast Track Start Date:</label>
              <input
                type="date"
                value={new Date(currentAgent.startDate).toISOString().slice(0, 10)}
                onChange={e => { if (e.target.value) onUpdateStartDate(currentAgent.id, new Date(e.target.value + "T00:00:00").toISOString()); }}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 7, padding: "5px 9px", color: "#fff", fontSize: "var(--fs-12)" }}
              />
            </div>
          ) : (
            <div style={{ fontSize: "var(--fs-11)", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>
              Fast Track Start Date: <span style={{ color: "#fff", fontWeight: 700 }}>{new Date(currentAgent.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          )}
          <Countdown startDate={currentAgent.startDate} />
          {(() => {
            const combinedIds = ["training1", "training2", "training3", "licensing"];
            const combinedPhases = PHASES.filter(p => combinedIds.includes(p.id));
            const combinedPct = Math.round(combinedPhases.reduce((sum, p) => sum + getPhaseProgress(p, progress), 0) / combinedPhases.length);
            return (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: "var(--fs-11)", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>Fast Track Progression</span>
                  <span style={{ fontSize: "var(--fs-12)", fontWeight: 800, color: "#D4AF37" }}>{combinedPct}%</span>
                </div>
                <Bar pct={combinedPct} color="#D4AF37" h={5} />
              </div>
            );
          })()}
        </div>
      )}

      <div style={{ display: "flex", overflowX: "auto", padding: "8px 10px", gap: 5, borderBottom: "1px solid rgba(255,255,255,0.07)", scrollbarWidth: "none" }}>
        {PHASES.map((ph, i) => {
          const pct = getPhaseProgress(ph, progress);
          const isActive = activePhase === i;
          return (
            <button key={ph.id} onClick={() => setActivePhase(i)} style={{ flexShrink: 0, padding: "6px 11px", borderRadius: 18, border: `1.5px solid ${isActive ? ph.color : "rgba(255,255,255,0.09)"}`, background: isActive ? `${ph.color}20` : "transparent", color: isActive ? ph.color : "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: "var(--fs-11)", fontWeight: isActive ? 700 : 500, display: "flex", alignItems: "center", gap: 4 }}>
              <span>{ph.emoji}</span><span>{ph.label}</span>{pct === 100 && <span style={{ color: ph.color }}>✓</span>}
            </button>
          );
        })}
      </div>

      <div style={{ paddingTop: 18 }}>
        {activePhase === 0 && !welcomeSeen ? (
          <WelcomePhase agent={currentAgent} onComplete={handleWelcomeDone} />
        ) : (
          <PhaseContent
            phase={active}
            progress={progress[active.id] || {}}
            fullProgress={progress}
            onUpdate={pp => handlePhaseUpdate(active.id, pp)}
            videos={videos}
            files={files}
            links={links}
            calendlyLinks={calendlyLinks}
            isAdmin={isAdmin || isTrainer}
            canUploadFiles={true}
            onUploadVideo={onUploadVideo}
            onUploadFile={onUploadFile}
            onUpdateLink={onUpdateLink}
            onUpdateCalendly={onUpdateCalendly}
          />
        )}
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({ agents, trainers, onSelectAgent, onAddAgent, onDeleteAgent, isTrainerView, trainerName, adminName, onOpenDocuments }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTrainer, setFilterTrainer] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", pfaNumber: "", fieldTrainer: trainerName || "" });

  const myAgents = isTrainerView
    ? agents.filter(a => a.fieldTrainer?.trim().toLowerCase() === trainerName?.trim().toLowerCase())
    : agents.filter(a => (a.orgAdmin || ADMINS[0].name) === adminName);

  const filtered = useMemo(() => {
    let list = [...myAgents];
    if (search) list = list.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase()) || a.fieldTrainer?.toLowerCase().includes(search.toLowerCase()));
    if (filterTrainer !== "all") list = list.filter(a => a.fieldTrainer === filterTrainer);
    if (filterStatus !== "all") {
      list = list.filter(a => {
        const days = getDaysLeft(a);
        const pct = getOverallProgress(a);
        const inactive = getLastActivity(a);
        if (filterStatus === "complete") return pct === 100;
        if (filterStatus === "atrisk") return days !== null && days <= 5 && pct < 100;
        if (filterStatus === "inactive") return inactive !== null && inactive >= 3;
        if (filterStatus === "ontrack") return days !== null && days > 10 && pct < 100;
        return true;
      });
    }
    list.sort((a, b) => {
      if (sortBy === "pct") return getOverallProgress(b) - getOverallProgress(a);
      if (sortBy === "days") return (getDaysLeft(a) || 999) - (getDaysLeft(b) || 999);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "recent") return new Date(b.startDate || 0) - new Date(a.startDate || 0);
      return 0;
    });
    return list;
  }, [myAgents, search, filterStatus, filterTrainer, sortBy]);

  const totalAgents = myAgents.length;
  const atRisk = myAgents.filter(a => { const d = getDaysLeft(a); return d !== null && d <= 5 && getOverallProgress(a) < 100; }).length;
  const inactive = myAgents.filter(a => { const i = getLastActivity(a); return i !== null && i >= 3; }).length;

  function handleAdd() {
    if (!form.name.trim()) return;
    onAddAgent({ id: Date.now().toString(), ...form, name: form.name.trim(), fieldTrainer: form.fieldTrainer?.trim() || "", orgAdmin: isTrainerView ? (agents.find(a => a.fieldTrainer?.trim().toLowerCase() === trainerName?.trim().toLowerCase())?.orgAdmin || ADMINS[0].name) : adminName, startDate: new Date().toISOString(), progress: {} });
    setForm({ name: "", email: "", phone: "", pfaNumber: "", fieldTrainer: trainerName || "" });
    setShowAdd(false);
  }

  const uniqueTrainers = [...new Set(myAgents.map(a => a.fieldTrainer).filter(Boolean))];

  return (
    <div style={{ maxWidth: "var(--mw-820)", margin: "0 auto", padding: "0 14px 40px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Total Agents", value: totalAgents, color: "#D4AF37" },
          { label: "🟢 On Track", value: myAgents.filter(a => { const d = getDaysLeft(a); return d !== null && d > 10 && getOverallProgress(a) < 100; }).length, color: "#10B981" },
          { label: "🔴 At Risk", value: atRisk, color: "#EF4444" },
          { label: "⚠️ Inactive", value: inactive, color: "#F59E0B" },
        ].map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", border: `1px solid ${s.color}22`, textAlign: "center" }}>
            <div style={{ fontSize: "var(--fs-22)", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "var(--fs-11)", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 160, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.1)" }}>
          {Ic.search(14, "rgba(255,255,255,0.3)")}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..." style={{ background: "none", border: "none", color: "#fff", fontSize: "var(--fs-13)", outline: "none", flex: 1 }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: "var(--fs-12)", cursor: "pointer" }}>
          <option value="all">All Status</option>
          <option value="ontrack">🟢 On Track</option>
          <option value="atrisk">🔴 At Risk</option>
          <option value="inactive">⚠️ Inactive 3+ days</option>
          <option value="complete">🏆 Complete</option>
        </select>
        {!isTrainerView && uniqueTrainers.length > 0 && (
          <select value={filterTrainer} onChange={e => setFilterTrainer(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: "var(--fs-12)", cursor: "pointer" }}>
            <option value="all">All Trainers</option>
            {uniqueTrainers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: "var(--fs-12)", cursor: "pointer" }}>
          <option value="name">Sort: Name</option>
          <option value="pct">Sort: % Complete</option>
          <option value="days">Sort: Days Left</option>
          <option value="recent">Sort: Newest</option>
        </select>
        <button onClick={() => setShowAdd(s => !s)} style={{ display: "flex", alignItems: "center", gap: 5, background: "#D4AF37", color: "#000", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: "var(--fs-13)", flexShrink: 0 }}>
          {Ic.plus(14, "#000")} Add Agent
        </button>
        <button onClick={onOpenDocuments} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: "var(--fs-13)", flexShrink: 0 }}>
          📁 Documents & Resources
        </button>
      </div>

      {showAdd && (
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 16, marginBottom: 14, border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontWeight: 700, color: "#D4AF37", fontSize: "var(--fs-13)", marginBottom: 12 }}>New Agent Registration</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[
              ["Full Name *", "name", "text"],
              ["Email Address", "email", "email"],
              ["Phone Number", "phone", "tel"],
              ["PFA# (optional)", "pfaNumber", "text"],
              ["Field Trainer / CFT", "fieldTrainer", "text"],
            ].map(([placeholder, field, type]) => (
              <input key={field} value={form[field]} type={type} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 11px", color: "#fff", fontSize: "var(--fs-13)", gridColumn: field === "fieldTrainer" ? "1 / -1" : "auto" }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleAdd} style={{ flex: 1, background: "#D4AF37", color: "#000", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 700, cursor: "pointer", fontSize: "var(--fs-13)" }}>Add Agent</button>
            <button onClick={() => setShowAdd(false)} style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer", fontSize: "var(--fs-13)" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ fontSize: "var(--fs-12)", color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>{filtered.length} of {totalAgents} agent{totalAgents !== 1 ? "s" : ""}</div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 50, color: "rgba(255,255,255,0.25)" }}>
          <div style={{ fontSize: "var(--fs-36)", marginBottom: 10 }}>👥</div>
          <div style={{ fontSize: "var(--fs-14)", fontWeight: 600 }}>{totalAgents === 0 ? "No agents yet" : "No agents match your filters"}</div>
        </div>
      )}

      {filtered.map(agent => {
        const pct = getOverallProgress(agent);
        const daysLeft = getDaysLeft(agent);
        const inactiveDays = getLastActivity(agent);
        const { label: statusLabel, color: statusColor } = getStatusLabel(daysLeft, pct, inactiveDays);
        const sc = getStatusColor(daysLeft);

        return (
          <div key={agent.id} onClick={() => onSelectAgent(agent)}
            style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 14, marginBottom: 9, border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <Avatar name={agent.name} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "var(--fs-14)", color: "#fff", marginBottom: 1 }}>{agent.name}</div>
                <div style={{ fontSize: "var(--fs-11)", color: "rgba(255,255,255,0.4)" }}>
                  {agent.fieldTrainer ? `CFT: ${agent.fieldTrainer}` : agent.email || "No email"}
                  {agent.pfaNumber ? ` · PFA# ${agent.pfaNumber}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div style={{ fontSize: "var(--fs-20)", fontWeight: 800, color: "#D4AF37" }}>{pct}%</div>
                <div style={{ fontSize: "var(--fs-10)", fontWeight: 700, color: statusColor, background: `${statusColor}18`, padding: "2px 7px", borderRadius: 99 }}>{statusLabel}</div>
              </div>
              {confirmDeleteId === agent.id ? (
                <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => { onDeleteAgent(agent.id); setConfirmDeleteId(null); }}
                    style={{ background: "#EF4444", border: "none", borderRadius: 6, padding: "6px 9px", cursor: "pointer", color: "#fff", fontSize: "var(--fs-11)", fontWeight: 700 }}>Delete</button>
                  <button onClick={() => setConfirmDeleteId(null)}
                    style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 6, padding: "6px 9px", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: "var(--fs-11)" }}>Cancel</button>
                </div>
              ) : (
                <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(agent.id); }}
                  style={{ background: "rgba(255,60,60,0.1)", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer", flexShrink: 0 }}>
                  {Ic.trash(13)}
                </button>
              )}
            </div>
            <Bar pct={pct} color="#D4AF37" h={5} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {PHASES.slice(1).map(ph => {
                  const phPct = getPhaseProgress(ph, agent.progress || {});
                  return phPct === 100 ? (
                    <span key={ph.id} style={{ fontSize: "var(--fs-10)", color: ph.color, background: `${ph.color}18`, padding: "2px 6px", borderRadius: 99 }}>{ph.emoji} {ph.label}</span>
                  ) : null;
                })}
              </div>
              {daysLeft !== null && <span style={{ fontSize: "var(--fs-11)", color: sc, fontWeight: 700, flexShrink: 0 }}>{daysLeft}d left</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("loading");
  const [agents, setAgents] = useState([]);
  const [admins, setAdmins] = useState([{ name: "Linda Cao", pin: "victory2026" }]);
  const [videos, setVideos] = useState({});
  const [files, setFiles] = useState({});
  const [links, setLinks] = useState({});
  const [calendlyLinks, setCalendlyLinks] = useState({});
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showDocsHub, setShowDocsHub] = useState(false);
  const [loginMode, setLoginMode] = useState("admin");
  const [adminName, setAdminName] = useState("");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState("");
  const [agentInput, setAgentInput] = useState("");
  const [agentError, setAgentError] = useState(false);
  const [trainerName, setTrainerName] = useState("");
  const [trainerPin, setTrainerPin] = useState("");
  const [trainerError, setTrainerError] = useState(false);
  const [currentTrainer, setCurrentTrainer] = useState("");

  useEffect(() => {
    async function init() {
      const [a, adm, v, f, l, c] = await Promise.all([
        loadAgentsFromDb(),
        loadAdminsFromDb(),
        loadKeyedResources("app_videos"),
        loadKeyedResources("app_files"),
        loadKV("app_links"),
        loadKV("calendly_links"),
      ]);
      setAgents(a);
      setAdmins(adm);
      setVideos(v);
      setFiles(f);
      setLinks(l);
      setCalendlyLinks(c);
      setView("login");
    }
    init();
  }, []);

  async function persistAgent(agent) {
    setAgents(prev => prev.map(a => a.id === agent.id ? agent : a));
    await upsertAgentDb(agent);
  }
  async function addAgent(agent) {
    setAgents(prev => [...prev, agent]);
    await upsertAgentDb(agent);
  }
  async function removeAgent(id) {
    setAgents(prev => prev.filter(a => a.id !== id));
    await deleteAgentDb(id);
  }
  async function persistVideo(k, file) {
    try {
      const url = await uploadToStorage(file);
      const entry = { name: file.name, url };
      setVideos(prev => ({ ...prev, [k]: entry }));
      await saveKeyedResource("app_videos", k, file.name, url);
    } catch (e) { console.error("Video upload failed", e); }
  }
  async function persistFile(k, file) {
    try {
      const url = await uploadToStorage(file);
      const entry = { name: file.name, url };
      setFiles(prev => ({ ...prev, [k]: entry }));
      await saveKeyedResource("app_files", k, file.name, url);
    } catch (e) { console.error("File upload failed", e); }
  }
  async function persistLink(k, value) {
    setLinks(prev => ({ ...prev, [k]: value }));
    await saveKV("app_links", k, value);
  }
  async function persistCalendlyLink(k, value) {
    setCalendlyLinks(prev => ({ ...prev, [k]: value }));
    await saveKV("calendly_links", k, value);
  }

  function handleAdminLogin() {
    const match = admins.find(a => a.name.toLowerCase() === adminName.trim().toLowerCase() && a.pin === pin);
    if (match) { setCurrentAdmin(match.name); setView("admin"); setPinError(false); }
    else setPinError(true);
  }

  function handleTrainerLogin() {
    const hasAgents = agents.some(a => a.fieldTrainer?.trim().toLowerCase() === trainerName.trim().toLowerCase());
    const pinOk = trainerPin === TRAINER_PIN || admins.some(a => a.pin === trainerPin);
    if (trainerName.trim() && (hasAgents || pinOk)) {
      setCurrentTrainer(trainerName.trim());
      setView("trainer");
      setTrainerError(false);
    } else setTrainerError(true);
  }

  function handleAgentLogin() {
    const found = agents.find(a =>
      a.name.toLowerCase() === agentInput.trim().toLowerCase() ||
      a.email?.toLowerCase() === agentInput.trim().toLowerCase()
    );
    if (found) { setSelectedAgent(found); setView("agent"); setAgentError(false); }
    else setAgentError(true);
  }

  function handleProgressUpdate(agentId, newProgress) {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    const updated = { ...agent, progress: newProgress, lastActivityAt: new Date().toISOString() };
    persistAgent(updated);
    if (selectedAgent?.id === agentId) setSelectedAgent(updated);
  }

  function handleStartDateUpdate(agentId, newStartDate) {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    const updated = { ...agent, startDate: newStartDate };
    persistAgent(updated);
    if (selectedAgent?.id === agentId) setSelectedAgent(updated);
  }

  const shell = (children) => (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #080d1a 0%, #0c1525 60%, #080d1a 100%)", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{RESPONSIVE_CSS}</style>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(8,13,26,0.97)", backdropFilter: "blur(14px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #0B1B36, #D4AF37)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {Ic.shield(15, "#fff")}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "var(--fs-13)", color: "#fff", letterSpacing: 0.3 }}>Victory</div>
            <div style={{ fontSize: "var(--fs-9)", color: "#D4AF37", letterSpacing: 2, textTransform: "uppercase" }}>Agent Training Portal</div>
          </div>
        </div>
        {view !== "login" && view !== "loading" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {view === "trainer" && <span style={{ fontSize: "var(--fs-11)", color: "rgba(255,255,255,0.4)" }}>CFT: {currentTrainer}</span>}
            {view === "admin" && <span style={{ fontSize: "var(--fs-11)", color: "rgba(255,255,255,0.4)" }}>Admin: {currentAdmin}</span>}
            <button onClick={() => { setView("login"); setSelectedAgent(null); setPin(""); setAdminName(""); setCurrentAdmin(""); setAgentInput(""); setTrainerName(""); setTrainerPin(""); setCurrentTrainer(""); }} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: "var(--fs-12)" }}>Sign Out</button>
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );

  if (view === "loading") return shell(<div style={{ textAlign: "center", paddingTop: 80, color: "rgba(255,255,255,0.3)" }}>Loading...</div>);

  if (view === "login") return shell(
    <div style={{ maxWidth: "var(--mw-440)", margin: "32px auto", padding: "0 18px" }}>
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div style={{ fontSize: "var(--fs-46)", marginBottom: 10 }}>🏆</div>
        <div style={{ fontSize: "var(--fs-22)", fontWeight: 800, color: "#fff" }}>Dream the Change</div>
        <div style={{ fontSize: "var(--fs-12)", color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Team Victory · Agent Training Portal</div>
      </div>

      <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, marginBottom: 18, gap: 4 }}>
        {[["admin", "Admin"], ["trainer", "Trainer / CFT"], ["agent", "Agent"]].map(([mode, label]) => (
          <button key={mode} onClick={() => setLoginMode(mode)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer", fontSize: "var(--fs-12)", fontWeight: 600, background: loginMode === mode ? "#D4AF37" : "transparent", color: loginMode === mode ? "#000" : "rgba(255,255,255,0.4)" }}>
            {label}
          </button>
        ))}
      </div>

      {loginMode === "admin" && (
        <div style={{ background: "rgba(212,175,55,0.06)", borderRadius: 16, padding: 20, border: "1px solid rgba(212,175,55,0.18)" }}>
          <div style={{ fontWeight: 700, fontSize: "var(--fs-14)", color: "#D4AF37", marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>{Ic.shield(14, "#D4AF37")} Admin Access</div>
          <div style={{ fontSize: "var(--fs-12)", color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>Full access to your own roster — videos, files, Calendly links. Each admin only sees their own agents.</div>
          <input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Your full name"
            style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: `1px solid ${pinError ? "#ef4444" : "rgba(255,255,255,0.12)"}`, borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: "var(--fs-13)", marginBottom: 8, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <input type="password" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdminLogin()} placeholder="Admin PIN"
              style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: `1px solid ${pinError ? "#ef4444" : "rgba(255,255,255,0.12)"}`, borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: "var(--fs-13)" }} />
            <button onClick={handleAdminLogin} style={{ background: "#D4AF37", color: "#000", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, cursor: "pointer", fontSize: "var(--fs-13)" }}>Enter</button>
          </div>
          {pinError && <div style={{ color: "#ef4444", fontSize: "var(--fs-12)", marginTop: 6 }}>Name or PIN not recognized</div>}
        </div>
      )}

      {loginMode === "trainer" && (
        <div style={{ background: "rgba(59,130,246,0.06)", borderRadius: 16, padding: 20, border: "1px solid rgba(59,130,246,0.18)" }}>
          <div style={{ fontWeight: 700, fontSize: "var(--fs-14)", color: "#3B82F6", marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>{Ic.teams(14, "#3B82F6")} Trainer / CFT Access</div>
          <div style={{ fontSize: "var(--fs-12)", color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>See and manage your assigned agents only</div>
          <input value={trainerName} onChange={e => setTrainerName(e.target.value)} placeholder="Your full name (as assigned to agents)"
            style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: `1px solid ${trainerError ? "#ef4444" : "rgba(255,255,255,0.12)"}`, borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: "var(--fs-13)", marginBottom: 8, boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <input type="password" value={trainerPin} onChange={e => setTrainerPin(e.target.value)} onKeyDown={e => e.key === "Enter" && handleTrainerLogin()} placeholder="Trainer PIN"
              style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: `1px solid ${trainerError ? "#ef4444" : "rgba(255,255,255,0.12)"}`, borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: "var(--fs-13)" }} />
            <button onClick={handleTrainerLogin} style={{ background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, cursor: "pointer", fontSize: "var(--fs-13)" }}>Enter</button>
          </div>
          {trainerError && <div style={{ color: "#ef4444", fontSize: "var(--fs-12)", marginTop: 6 }}>Name not found or incorrect PIN</div>}
        </div>
      )}

      {loginMode === "agent" && (
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 20, border: "1px solid rgba(255,255,255,0.09)" }}>
          <div style={{ fontWeight: 700, fontSize: "var(--fs-14)", color: "#fff", marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>{Ic.user(14, "#fff")} Agent Access</div>
          <div style={{ fontSize: "var(--fs-12)", color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>Enter your name or email to access your training journey</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={agentInput} onChange={e => setAgentInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAgentLogin()} placeholder="Your name or email"
              style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: `1px solid ${agentError ? "#ef4444" : "rgba(255,255,255,0.12)"}`, borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: "var(--fs-13)" }} />
            <button onClick={handleAgentLogin} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, cursor: "pointer", fontSize: "var(--fs-13)" }}>Go</button>
          </div>
          {agentError && <div style={{ color: "#ef4444", fontSize: "var(--fs-12)", marginTop: 6 }}>Not found — ask your trainer to add you first</div>}
        </div>
      )}
    </div>
  );

  if ((view === "admin" || view === "trainer") && showDocsHub) return shell(
    <div style={{ paddingTop: 18 }}>
      <div style={{ padding: "0 14px", marginBottom: 4 }}>
        <button onClick={() => setShowDocsHub(false)} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "#fff", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 12 }}>← Back</button>
      </div>
      <DocumentsView files={files} links={links} isAdmin={true} onUploadFile={(k, f) => persistFile(k, f)} onUpdateLink={(k, u) => persistLink(k, u)} />
    </div>
  );

  if ((view === "admin" || view === "trainer") && !selectedAgent) return shell(
    <div style={{ paddingTop: 18 }}>
      <AdminDashboard
        agents={agents}
        trainers={[...new Set(agents.map(a => a.fieldTrainer).filter(Boolean))]}
        onSelectAgent={a => setSelectedAgent(a)}
        onAddAgent={a => addAgent(a)}
        onDeleteAgent={id => removeAgent(id)}
        isTrainerView={view === "trainer"}
        trainerName={currentTrainer}
        adminName={currentAdmin}
        onOpenDocuments={() => setShowDocsHub(true)}
      />
    </div>
  );

  if ((view === "admin" || view === "trainer") && selectedAgent) {
    const agent = agents.find(a => a.id === selectedAgent.id) || selectedAgent;
    return shell(
      <AgentPortal
        agent={agent} videos={videos} files={files} links={links} calendlyLinks={calendlyLinks}
        isAdmin={view === "admin"} isTrainer={view === "trainer"}
        onBack={() => setSelectedAgent(null)}
        onProgressUpdate={handleProgressUpdate}
        onUpdateStartDate={handleStartDateUpdate}
        onUploadVideo={(k, d) => persistVideo(k, d)}
        onUploadFile={(k, d) => persistFile(k, d)}
        onUpdateLink={(k, u) => persistLink(k, u)}
        onUpdateCalendly={(k, u) => persistCalendlyLink(k, u)}
      />
    );
  }

  if (view === "agent") {
    const agent = agents.find(a => a.id === selectedAgent.id) || selectedAgent;
    return shell(
      <AgentPortal
        agent={agent} videos={videos} files={files} links={links} calendlyLinks={calendlyLinks}
        isAdmin={false} isTrainer={false}
        onBack={() => {}}
        onProgressUpdate={handleProgressUpdate}
        onUploadVideo={() => {}}
        onUploadFile={(k, d) => persistFile(k, d)}
        onUpdateLink={() => {}}
        onUpdateCalendly={() => {}}
      />
    );
  }

  return null;
}
