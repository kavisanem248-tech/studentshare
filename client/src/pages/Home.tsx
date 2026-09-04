import { createElement, useEffect, useMemo, useState, type ElementType } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownToLine,
  ArrowLeft,
  BookOpen,
  BookOpenCheck,
  Check,
  ChevronRight,
  Clipboard,
  CloudUpload,
  Download,
  FileText,
  Filter,
  Github,
  GraduationCap,
  LayoutDashboard,
  Library,
  Link2,
  Loader2,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  Tag,
  Trash2,
  TrendingUp,
  Upload,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";

type PdfCardData = {
  id: number;
  title: string;
  unit: string;
  fileSize: number;
  fileUrl: string;
  viewCount: number;
  downloadCount: number;
  createdAt: Date | string;
  subjectName: string | null;
  uploaderName: string | null;
  tags?: string | null;
  description?: string | null;
};

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subjects", label: "Subjects", icon: Library },
  { href: "/browse", label: "Browse PDFs", icon: Search },
  { href: "/upload", label: "Upload PDF", icon: CloudUpload },
  { href: "/uploads", label: "My uploads", icon: FileText },
];

const subjectsFallback = [
  { name: "Data Structures", code: "CS 201", tone: "blue" },
  { name: "Java Programming", code: "CS 203", tone: "violet" },
  { name: "Database Management", code: "CS 305", tone: "amber" },
  { name: "Computer Networks", code: "CS 308", tone: "rose" },
  { name: "Operating Systems", code: "CS 310", tone: "teal" },
  { name: "Mathematics", code: "MATH 101", tone: "indigo" },
];

function formatBytes(bytes = 0) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
}

function initials(name?: string | null) {
  return (name || "Student").split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#f8f9fc]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 lg:px-10">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-slate-950 text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] transition-transform group-hover:-rotate-3">
              <BookOpenCheck className="h-5 w-5" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-[17px] font-bold tracking-[-0.03em] text-slate-950">StudentShare</span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Find. Share. Learn.</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.slice(1, 3).map(item => (
              <Link key={item.href} href={item.href} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${location === item.href ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-950"}`}>
                {item.label}
              </Link>
            ))}
            <Link href="/upload" className="ml-2 inline-flex items-center gap-2 rounded-full bg-[#3457e5] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(52,87,229,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#2849d7] active:scale-[.98]">
              <Plus className="h-4 w-4" /> Upload PDF
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} aria-label="Toggle theme" className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white hover:text-slate-950 sm:flex">
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            <button aria-label="Open navigation" onClick={() => setMenuOpen(value => !value)} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-white lg:hidden">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {user ? (
              <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
                <Link href="/profile" className="flex items-center gap-2 rounded-full pl-1 pr-3 transition-colors hover:bg-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dfe5ff] text-xs font-extrabold text-[#3457e5]">{initials(user.name)}</span>
                  <span className="max-w-[100px] truncate text-sm font-bold text-slate-700">{user.name || "Student"}</span>
                </Link>
                <button onClick={logout} aria-label="Sign out" className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-800"><LogOut className="h-4 w-4" /></button>
              </div>
            ) : (
              <button onClick={() => startLogin()} className="hidden rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 sm:block">Log in</button>
            )}
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden">
            <div className="grid gap-1">
              {navLinks.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${location === item.href ? "bg-[#eef1ff] text-[#3457e5]" : "text-slate-600 hover:bg-slate-50"}`}>
                  <item.icon className="h-4 w-4" /> {item.label}
                </Link>
              ))}
              {!user && <button onClick={() => startLogin()} className="mt-2 flex items-center gap-3 rounded-xl bg-slate-950 px-3 py-3 text-left text-sm font-bold text-white"><UserRound className="h-4 w-4" /> Log in</button>}
              {user && <button onClick={logout} className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-rose-600"><LogOut className="h-4 w-4" /> Sign out</button>}
            </div>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-200 bg-white px-5 py-10 lg:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-slate-900"><BookOpenCheck className="h-4 w-4" /> StudentShare <span className="font-sans font-normal text-slate-400">· Built for curious minds</span></div>
          <div className="flex items-center gap-5"><Link href="/browse" className="hover:text-slate-950">Browse library</Link><Link href="/subjects" className="hover:text-slate-950">Subjects</Link><a href="mailto:hello@studentshare.app" className="hover:text-slate-950">Contact</a></div>
        </div>
      </footer>
    </div>
  );
}

function PdfCard({ pdf, compact = false }: { pdf: PdfCardData; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    await navigator.clipboard?.writeText(`${window.location.origin}/studentshare/pdf/${pdf.id}`);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <article className={`group rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,23,42,0.09)] ${compact ? "" : "sm:p-5"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#fff0e7] text-[#ed6b3d]"><FileText className="h-5 w-5" /></span>
        <button onClick={copyLink} aria-label="Copy PDF link" className="rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-700">{copied ? <Check className="h-4 w-4 text-emerald-500" /> : <MoreHorizontal className="h-4 w-4" />}</button>
      </div>
      <Link href={`/studentshare/pdf/${pdf.id}`} className="mt-4 block">
        <div className="line-clamp-2 min-h-[48px] font-display text-[17px] font-bold leading-6 tracking-[-0.02em] text-slate-900 group-hover:text-[#3457e5]">{pdf.title}</div>
        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#3457e5]"><span>{pdf.subjectName || "General"}</span><span className="h-1 w-1 rounded-full bg-slate-300" /><span className="text-slate-400">{pdf.unit}</span></div>
      </Link>
      {!compact && pdf.description && <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-500">{pdf.description}</p>}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
        <span>{formatBytes(pdf.fileSize)} · {formatDate(pdf.createdAt)}</span>
        <span className="flex items-center gap-2"><span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {pdf.downloadCount || 0}</span><span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> {pdf.viewCount || 0}</span></span>
      </div>
      <div className="mt-4 flex gap-2">
        <Link href={`/studentshare/pdf/${pdf.id}`} className="flex-1 rounded-xl bg-slate-950 px-3 py-2.5 text-center text-xs font-bold text-white transition-colors hover:bg-[#3457e5]">View PDF</Link>
        <button onClick={() => window.open(`/api/pdfs/${pdf.id}/download`, "_blank")} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"><Download className="h-4 w-4" /> <span className="hidden xl:inline">Download</span></button>
        <button onClick={copyLink} aria-label="Copy PDF link" className="rounded-xl border border-slate-200 px-3 py-2.5 text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"><Link2 className="h-4 w-4" /></button>
      </div>
    </article>
  );
}

export function LandingPage() {
  const { user } = useAuth();
  const { data: subjects = [] } = trpc.subjects.list.useQuery();
  const { data: recent } = trpc.dashboard.recent.useQuery();
  const displaySubjects = subjects.length ? subjects.slice(0, 6) : subjectsFallback;
  useEffect(() => { document.title = "StudentShare – Find and Share Study Materials"; }, []);

  return (
    <AppShell>
      <section className="relative overflow-hidden bg-[#f8f9fc] px-5 pb-20 pt-14 lg:px-10 lg:pb-28 lg:pt-20">
        <div className="pointer-events-none absolute -right-24 top-8 h-[520px] w-[520px] rounded-full bg-[#dfe5ff]/55 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-[300px] w-[400px] rounded-full bg-[#ffe2d6]/35 blur-3xl" />
        <div className="relative mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-[1.06fr_.94fr] lg:items-center lg:gap-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cfd6ff] bg-white/75 px-3 py-2 text-xs font-bold text-[#3457e5] shadow-sm"><Sparkles className="h-3.5 w-3.5" /> The open study library for students</div>
            <h1 className="font-display text-[clamp(3.1rem,6.8vw,6.5rem)] font-bold leading-[.95] tracking-[-0.075em] text-slate-950">Find the notes<br /><span className="text-[#3457e5]">you need.</span><br />Share what<br /><span className="relative inline-block">you know.<span className="absolute -bottom-2 left-1 h-1.5 w-[90%] rounded-full bg-[#f39871]" /></span></h1>
            <p className="mt-8 max-w-lg text-lg leading-8 text-slate-500">A simple platform for students to share and discover study materials — one useful PDF at a time.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={user ? "/browse" : "/login"} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3457e5] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(52,87,229,0.22)] transition-all hover:-translate-y-1 hover:bg-[#2849d7] active:scale-[.98]">Browse notes <ArrowDownToLine className="h-4 w-4 rotate-[-45deg]" /></Link>
              <Link href="/upload" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300"><CloudUpload className="h-4 w-4" /> Upload a PDF</Link>
            </div>
            <div className="mt-10 flex items-center gap-3 text-xs font-semibold text-slate-400"><div className="flex -space-x-2"><span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f8f9fc] bg-[#d9eff1] text-[10px] font-black text-[#177d83]">AM</span><span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f8f9fc] bg-[#ffe0d2] text-[10px] font-black text-[#c65a38]">RK</span><span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f8f9fc] bg-[#e6dcff] text-[10px] font-black text-[#7355d5]">SJ</span></div><span>Shared by students, for students</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-[560px] lg:mr-0">
            <div className="relative rounded-[34px] bg-[#15234a] p-3 shadow-[0_32px_80px_rgba(21,35,74,0.23)] rotate-[2deg] transition-transform duration-500 hover:rotate-0">
              <div className="rounded-[26px] border border-white/10 bg-[#1b2d5d] p-5 sm:p-7">
                <div className="flex items-center justify-between border-b border-white/10 pb-5"><div className="flex items-center gap-2 text-white"><span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white text-[#15234a]"><BookOpenCheck className="h-4 w-4" /></span><span className="font-display font-bold">Study space</span></div><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.15em] text-[#b8c5ff]">This week</span></div>
                <div className="grid grid-cols-2 gap-3 py-6"><div className="rounded-2xl bg-white/10 p-4"><p className="text-[11px] font-semibold text-[#b8c5ff]">Notes found</p><p className="mt-2 font-display text-3xl font-bold text-white">2,480</p><p className="mt-1 text-[10px] font-semibold text-[#7ce0b1]">+18.4% this week</p></div><div className="rounded-2xl bg-[#f39871] p-4"><p className="text-[11px] font-semibold text-[#6c2b1d]">Shared by peers</p><p className="mt-2 font-display text-3xl font-bold text-[#3f1f19]">382</p><p className="mt-1 text-[10px] font-semibold text-[#6c2b1d]">and counting</p></div></div>
                <div className="rounded-2xl bg-[#f4f6ff] p-4"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-bold text-slate-700">Popular this week</span><span className="text-[10px] font-bold text-[#3457e5]">View all</span></div>{["Data Structures", "Database Management", "Operating Systems"].map((label, index) => <div key={label} className="mb-3 flex items-center gap-3 last:mb-0"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${index === 0 ? "bg-[#dfe5ff] text-[#3457e5]" : index === 1 ? "bg-[#ffe2d6] text-[#dd7148]" : "bg-[#dbf1e9] text-[#17815e]"}`}><FileText className="h-4 w-4" /></span><span className="flex-1 text-xs font-bold text-slate-700">{label}</span><span className="text-[10px] font-semibold text-slate-400">{[124, 98, 76][index]} notes</span></div>)}</div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[0_16px_30px_rgba(15,23,42,0.1)] sm:-left-10"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dbf1e9] text-[#16815e]"><Check className="h-4 w-4" /></span><div><p className="text-xs font-bold text-slate-900">One less late night</p><p className="text-[10px] font-medium text-slate-400">Your future self says thanks</p></div></div>
          </div>
        </div>
      </section>
      <section className="border-y border-slate-200/80 bg-white px-5 py-12 lg:px-10">
        <div className="mx-auto max-w-[1400px]"><div className="mb-6 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#3457e5]">Explore by subject</p><h2 className="mt-2 font-display text-2xl font-bold tracking-[-.04em] text-slate-950">Start with what you’re learning.</h2></div><Link href="/subjects" className="hidden items-center gap-1 text-sm font-bold text-[#3457e5] sm:flex">All subjects <ChevronRight className="h-4 w-4" /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{displaySubjects.map((subject, index) => <Link href={`/browse?subject=${("id" in subject ? subject.id : "")}`} key={subject.name} className="group rounded-2xl border border-slate-200 bg-[#fbfbfd] p-4 transition-all hover:-translate-y-1 hover:border-[#cfd6ff] hover:bg-[#f4f6ff]"><div className={`mb-8 flex h-8 w-8 items-center justify-center rounded-[10px] text-xs font-black ${["bg-[#dfe5ff] text-[#3457e5]", "bg-[#e8dfff] text-[#7b53d3]", "bg-[#ffe8d2] text-[#d17536]", "bg-[#ffe0e5] text-[#cd4c68]", "bg-[#d9eff1] text-[#177d83]", "bg-[#e3e6ff] text-[#5e67d8]"][index % 6]}`}>{String(index + 1).padStart(2, "0")}</div><p className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-slate-800 group-hover:text-[#3457e5]">{subject.name}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">{subject.code || "Subject"}</p></Link>)}</div></div>
      </section>
      <section className="bg-[#f8f9fc] px-5 py-16 lg:px-10"><div className="mx-auto max-w-[1400px]"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#3457e5]">Fresh from the community</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-.05em] text-slate-950">Worth a look.</h2></div><Link href="/browse" className="inline-flex items-center gap-2 text-sm font-bold text-[#3457e5]">See all notes <ChevronRight className="h-4 w-4" /></Link></div>{recent?.items?.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recent.items.slice(0, 3).map(pdf => <PdfCard key={pdf.id} pdf={pdf as PdfCardData} />)}</div> : <div className="mt-7 rounded-[24px] border border-dashed border-slate-300 bg-white p-10 text-center"><FileText className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-display font-bold text-slate-700">Your library is waiting for its first notes.</p><p className="mt-1 text-sm text-slate-400">Be the first to share something useful with your classmates.</p></div>}</div></section>
      <section className="bg-[#15234a] px-5 py-16 text-white lg:px-10"><div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-8 sm:flex-row sm:items-center"><div><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f39871] text-[#4b2218]"><Zap className="h-5 w-5" /></div><h2 className="max-w-xl font-display text-3xl font-bold tracking-[-.05em] sm:text-4xl">The best study materials are the ones we share.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-[#b8c5e9]">Upload your notes, help a classmate, and make the next exam a little less overwhelming.</p></div><Link href="/upload" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#15234a] transition-all hover:-translate-y-1">Share a PDF <ArrowDownToLine className="h-4 w-4 rotate-[-45deg]" /></Link></div></section>
    </AppShell>
  );
}

function DashboardPage() {
  const { user, loading } = useAuth();
  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, { enabled: Boolean(user) });
  const { data: recent } = trpc.dashboard.recent.useQuery();
  const { data: popular } = trpc.dashboard.popular.useQuery();
  if (loading) return <LoadingPage />;
  if (!user) return <AuthPrompt />;
  return <AppShell><div className="mx-auto max-w-[1400px] px-5 py-10 lg:px-10 lg:py-14"><PageTitle eyebrow="Your study space" title={`Welcome, ${user.name?.split(" ")[0] || "Student"}.`} description="Pick up where you left off, or find something useful for your next study session." action={<Link href="/upload" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3457e5] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#2849d7]"><Plus className="h-4 w-4" /> Upload notes</Link>} /><div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Your uploads", stats?.uploads || 0, FileText, "bg-[#dfe5ff] text-[#3457e5]"], ["Total downloads", stats?.downloads || 0, Download, "bg-[#ffe2d6] text-[#d86d44]"], ["Your subjects", stats?.subjects || 0, Library, "bg-[#dbf1e9] text-[#17815e]"], ["Your views", stats?.views || 0, TrendingUp, "bg-[#e8dfff] text-[#7651d0]"]].map(([label, value, Icon, colors]) => <div key={String(label)} className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.03)]"><div className="flex items-center justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors}`}>{createElement(Icon as ElementType, { className: "h-5 w-5" })}</span><MoreHorizontal className="h-4 w-4 text-slate-300" /></div><p className="mt-6 font-display text-3xl font-bold tracking-[-.05em] text-slate-950">{String(value)}</p><p className="mt-1 text-sm font-semibold text-slate-400">{String(label)}</p></div>)}</div><div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_.85fr]"><section><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#3457e5]">Recently added</p><h2 className="mt-1 font-display text-xl font-bold tracking-[-.04em]">Fresh notes for you</h2></div><Link href="/browse" className="text-sm font-bold text-[#3457e5]">View library</Link></div><div className="grid gap-4 sm:grid-cols-2">{recent?.items?.slice(0, 4).map(pdf => <PdfCard key={pdf.id} pdf={pdf as PdfCardData} compact />)}{!recent?.items?.length && <EmptyState title="No notes yet" description="Upload your first PDF and it will show up here." action="Upload a PDF" href="/upload" />}</div></section><section><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#3457e5]">Popular right now</p><h2 className="mt-1 font-display text-xl font-bold tracking-[-.04em]">What students are opening</h2></div><div className="rounded-[22px] border border-slate-200/80 bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">{popular?.items?.slice(0, 5).map((pdf, index) => <Link href={`/studentshare/pdf/${pdf.id}`} key={pdf.id} className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-[#f5f6ff]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0e7] text-xs font-black text-[#ed6b3d]">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{pdf.title}</span><span className="mt-1 block text-xs text-slate-400">{pdf.subjectName || "General"} · {pdf.downloadCount || 0} downloads</span></span><ChevronRight className="h-4 w-4 text-slate-300" /></Link>)}{!popular?.items?.length && <div className="p-6 text-center text-sm text-slate-400">Popular notes will appear here once the library grows.</div>}</div></section></div></div></AppShell>;
}

function BrowsePage() {
  const [location, setLocation] = useLocation();
  const query = new URLSearchParams(location.split("?")[1] || "");
  const [search, setSearch] = useState(query.get("q") || "");
  const [subjectId, setSubjectId] = useState(query.get("subject") || "all");
  const [unit, setUnit] = useState("all");
  const [sort, setSort] = useState<"latest" | "downloads" | "views" | "az">("latest");
  const input = useMemo(() => ({ q: search || undefined, subjectId: subjectId === "all" ? undefined : Number(subjectId), unit: unit === "all" ? undefined : unit, sort, page: 1 }), [search, subjectId, unit, sort]);
  const { data, isLoading } = trpc.pdfs.list.useQuery(input);
  const { data: subjects = [] } = trpc.subjects.list.useQuery();
  const clear = () => { setSearch(""); setSubjectId("all"); setUnit("all"); setSort("latest"); setLocation("/browse"); };
  return <AppShell><div className="mx-auto max-w-[1400px] px-5 py-10 lg:px-10 lg:py-14"><PageTitle eyebrow="The library" title="Browse study materials" description="Search by topic, filter by subject, and find the notes that make the next chapter click." /><div className="mt-8 rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-[0_12px_32px_rgba(15,23,42,0.05)]"><div className="flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === "Enter") setLocation(`/browse?q=${encodeURIComponent(search)}`); }} placeholder="Search notes, subjects, topics..." className="h-12 rounded-xl border-0 bg-[#f6f7fb] pl-11 pr-4 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-[#cfd6ff]" /></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex"><select value={subjectId} onChange={event => setSubjectId(event.target.value)} className="h-12 rounded-xl border-0 bg-[#f6f7fb] px-3 text-sm font-semibold text-slate-600 outline-none"><option value="all">All subjects</option>{subjects.map(subject => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select><select value={unit} onChange={event => setUnit(event.target.value)} className="h-12 rounded-xl border-0 bg-[#f6f7fb] px-3 text-sm font-semibold text-slate-600 outline-none"><option value="all">All units</option>{[1, 2, 3, 4, 5].map(item => <option key={item}>Unit {item}</option>)}<option>Other</option></select><select value={sort} onChange={event => setSort(event.target.value as typeof sort)} className="col-span-2 h-12 rounded-xl border-0 bg-[#f6f7fb] px-3 text-sm font-semibold text-slate-600 outline-none sm:col-span-1"><option value="latest">Latest</option><option value="downloads">Most downloaded</option><option value="views">Most viewed</option><option value="az">A–Z</option></select></div></div></div><div className="mt-8 flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{isLoading ? "Looking through the library..." : `${data?.total || 0} notes found`}</p><button onClick={clear} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-[#3457e5]"><X className="h-3.5 w-3.5" /> Clear filters</button></div>{isLoading ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[280px] animate-pulse rounded-[22px] bg-slate-200/70" />)}</div> : data?.items?.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data.items.map(pdf => <PdfCard key={pdf.id} pdf={pdf as PdfCardData} />)}</div> : <EmptyState title="No notes found" description="Try another subject or search term." action="Browse all notes" href="/browse" />}</div></AppShell>;
}

function SubjectsPage() {
  const { user } = useAuth();
  const { data: subjects = [], refetch } = trpc.subjects.list.useQuery();
  const createSubject = trpc.subjects.create.useMutation({ onSuccess: () => { toast.success("Subject added"); refetch(); setShowForm(false); }, onError: error => toast.error(error.message) });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", department: "", semester: "" });
  return <AppShell><div className="mx-auto max-w-[1400px] px-5 py-10 lg:px-10 lg:py-14"><PageTitle eyebrow="Your curriculum" title="Subjects" description="Find your course, or add one that is missing from the library." action={user ? <Button onClick={() => setShowForm(value => !value)} className="gap-2 rounded-full bg-[#3457e5] font-bold hover:bg-[#2849d7]"><Plus className="h-4 w-4" /> Add subject</Button> : <Button onClick={() => startLogin()} className="rounded-full bg-slate-950 font-bold">Log in to add</Button>} />{showForm && <form onSubmit={event => { event.preventDefault(); createSubject.mutate(form); }} className="mt-8 rounded-[24px] border border-[#cfd6ff] bg-[#f4f6ff] p-5"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Input required placeholder="Subject name *" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="h-11 rounded-xl border-white bg-white" /><Input placeholder="Code (optional)" value={form.code} onChange={event => setForm({ ...form, code: event.target.value })} className="h-11 rounded-xl border-white bg-white" /><Input placeholder="Department" value={form.department} onChange={event => setForm({ ...form, department: event.target.value })} className="h-11 rounded-xl border-white bg-white" /><Input placeholder="Semester" value={form.semester} onChange={event => setForm({ ...form, semester: event.target.value })} className="h-11 rounded-xl border-white bg-white" /></div><div className="mt-4 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-full">Cancel</Button><Button type="submit" disabled={createSubject.isPending} className="rounded-full bg-[#3457e5] font-bold">{createSubject.isPending ? "Adding..." : "Add subject"}</Button></div></form>}<div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{subjects.map((subject, index) => <Link href={`/browse?subject=${subject.id}`} key={subject.id} className="group rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.03)] transition-all hover:-translate-y-1 hover:border-[#cfd6ff] hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)]"><div className="flex items-center justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-[14px] text-sm font-black ${["bg-[#dfe5ff] text-[#3457e5]", "bg-[#e8dfff] text-[#7b53d3]", "bg-[#ffe8d2] text-[#d17536]", "bg-[#ffe0e5] text-[#cd4c68]"][index % 4]}`}>{String(index + 1).padStart(2, "0")}</span><ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-[#3457e5]" /></div><h3 className="mt-7 font-display text-lg font-bold tracking-[-.03em] text-slate-900 group-hover:text-[#3457e5]">{subject.name}</h3><p className="mt-2 text-xs font-bold uppercase tracking-[.14em] text-slate-400">{subject.code || "Open subject"}</p><p className="mt-5 text-sm text-slate-500">{subject.department || "Student-created collection"}</p></Link>)}{!subjects.length && <EmptyState title="No subjects yet" description="Be the first to add a course to StudentShare." action="Add a subject" href="/subjects" />}</div></div></AppShell>;
}

function UploadPage({ editId }: { editId?: number }) {
  const { user } = useAuth();
  const { data: subjects = [] } = trpc.subjects.list.useQuery();
  const { data: existing } = trpc.pdfs.get.useQuery({ id: editId! }, { enabled: Boolean(editId) });
  const utils = trpc.useUtils();
  const upload = trpc.pdfs.upload.useMutation({ onSuccess: async result => { toast.success(result.message); await Promise.all([utils.pdfs.list.invalidate(), utils.uploads.mine.invalidate(), utils.dashboard.stats.invalidate(), utils.dashboard.recent.invalidate(), utils.dashboard.popular.invalidate()]); setFile(null); setFileData(""); setLocation(`/studentshare/pdf/${result.id}`); }, onError: error => toast.error(error.message) });
  const update = trpc.pdfs.update.useMutation({ onSuccess: () => { toast.success("PDF details updated"); setLocation(`/studentshare/pdf/${editId}`); }, onError: error => toast.error(error.message) });
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState("");
  const [form, setForm] = useState({ title: "", subjectId: "", unit: "Unit 1", description: "", tags: "", academicYear: "2025–26", semester: "" });
  useEffect(() => { if (existing) setForm({ title: existing.title, subjectId: String(existing.subjectId), unit: existing.unit, description: existing.description || "", tags: existing.tags || "", academicYear: existing.academicYear || "", semester: existing.semester || "" }); }, [existing]);
  if (!user) return <AuthPrompt />;
  const isEdit = Boolean(editId);
  const onFile = (selected: File | null) => { if (!selected) return; if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) { toast.error("Only PDF files are allowed."); return; } if (selected.size > 20 * 1024 * 1024) { toast.error("This PDF exceeds the maximum allowed size."); return; } setFile(selected); const reader = new FileReader(); reader.onload = () => setFileData(String(reader.result).split(",")[1] || ""); reader.readAsDataURL(selected); };
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!form.subjectId) { toast.error("Choose a subject first."); return; } if (isEdit) { update.mutate({ id: editId!, title: form.title, subjectId: Number(form.subjectId), unit: form.unit, description: form.description, tags: form.tags, academicYear: form.academicYear, semester: form.semester }); return; } if (!file || !fileData) { toast.error("Add a PDF to continue."); return; } upload.mutate({ ...form, subjectId: Number(form.subjectId), fileName: file.name, fileType: file.type || "application/pdf", fileSize: file.size, fileData }); };
  return <AppShell><div className="mx-auto max-w-4xl px-5 py-10 lg:px-10 lg:py-14"><PageTitle eyebrow={isEdit ? "Edit details" : "Share with your classmates"} title={isEdit ? "Edit PDF details" : "Upload a study PDF"} description={isEdit ? "Keep the file, just tidy up the metadata." : "Add context so other students can find and use your notes."} /><form onSubmit={submit} className="mt-9 grid gap-6 lg:grid-cols-[1fr_300px]"><div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7"><div className="grid gap-5"><label className="grid gap-2 text-sm font-bold text-slate-700">PDF title <Input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="e.g. Graph Algorithms — Lecture 04" className="h-12 rounded-xl border-slate-200 font-normal" /></label><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-slate-700">Subject <select required value={form.subjectId} onChange={event => setForm({ ...form, subjectId: event.target.value })} className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-[#3457e5]"><option value="">Choose subject</option>{subjects.map(subject => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></label><label className="grid gap-2 text-sm font-bold text-slate-700">Unit<select value={form.unit} onChange={event => setForm({ ...form, unit: event.target.value })} className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-[#3457e5]"><option>Unit 1</option><option>Unit 2</option><option>Unit 3</option><option>Unit 4</option><option>Unit 5</option><option>Other</option></select></label></div><label className="grid gap-2 text-sm font-bold text-slate-700">Description <Textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="What will another student find in this PDF?" className="min-h-[110px] rounded-xl border-slate-200 font-normal" /></label><div className="grid gap-5 sm:grid-cols-3"><label className="grid gap-2 text-sm font-bold text-slate-700">Tags <Input value={form.tags} onChange={event => setForm({ ...form, tags: event.target.value })} placeholder="graphs, revision" className="h-11 rounded-xl border-slate-200 font-normal" /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Academic year <Input value={form.academicYear} onChange={event => setForm({ ...form, academicYear: event.target.value })} placeholder="2025–26" className="h-11 rounded-xl border-slate-200 font-normal" /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Semester <Input value={form.semester} onChange={event => setForm({ ...form, semester: event.target.value })} placeholder="Semester 4" className="h-11 rounded-xl border-slate-200 font-normal" /></label></div></div><div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center"><Link href={isEdit ? `/studentshare/pdf/${editId}` : "/browse"} className="text-center text-sm font-bold text-slate-500 hover:text-slate-900">Cancel</Link><Button type="submit" disabled={upload.isPending || update.isPending} className="gap-2 rounded-full bg-[#3457e5] px-6 font-bold hover:bg-[#2849d7]">{upload.isPending || update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? <Check className="h-4 w-4" /> : <CloudUpload className="h-4 w-4" />}{isEdit ? "Save changes" : "Upload PDF"}</Button></div></div>{!isEdit && <div className="grid content-start gap-5"><label htmlFor="pdf-file" className="group cursor-pointer rounded-[24px] border-2 border-dashed border-[#bfc9f9] bg-[#f4f6ff] p-6 text-center transition-colors hover:border-[#3457e5] hover:bg-[#eef1ff]"><input id="pdf-file" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={event => onFile(event.target.files?.[0] || null)} /><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#3457e5] shadow-sm"><Upload className="h-6 w-6 transition-transform group-hover:-translate-y-1" /></span><p className="mt-4 text-sm font-bold text-slate-800">{file ? file.name : "Drop your PDF here"}</p><p className="mt-1 text-xs leading-5 text-slate-500">{file ? `${formatBytes(file.size)} ready to upload` : "or click to browse · PDF up to 20 MB"}</p>{file && <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#dbf1e9] px-3 py-1.5 text-xs font-bold text-[#16815e]"><Check className="h-3.5 w-3.5" /> Ready</span>}</label><div className="rounded-[22px] border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-sm font-bold text-slate-800"><ShieldCheck className="h-4 w-4 text-[#3457e5]" /> Keep it useful</div><ul className="mt-4 grid gap-3 text-xs leading-5 text-slate-500"><li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> Use a clear, searchable title.</li><li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> Add a subject and unit.</li><li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> Only share material you can share.</li></ul></div></div>}</form></div></AppShell>;
}

function PdfViewerPage() {
  const [, params] = useRoute("/studentshare/pdf/:id");
  const id = Number(params?.id);
  const { user } = useAuth();
  const { data: pdf, isLoading } = trpc.pdfs.get.useQuery({ id }, { enabled: Boolean(id) });
  const view = trpc.pdfs.view.useMutation();
  const download = trpc.pdfs.download.useMutation({ onSuccess: result => { toast.success("Download started"); window.open(result.url, "_blank"); }, onError: error => toast.error(error.message) });
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("Wrong content");
  const [reportDescription, setReportDescription] = useState("");
  const report = trpc.pdfs.report.useMutation({ onSuccess: () => { toast.success("Thanks — your report was submitted"); setReportOpen(false); }, onError: error => toast.error(error.message) });
  useEffect(() => { if (pdf) { document.title = `${pdf.title} · StudentShare`; view.mutate({ id }); } }, [pdf?.id]);
  if (isLoading) return <LoadingPage />;
  if (!pdf) return <AppShell><div className="mx-auto max-w-3xl px-5 py-24 text-center"><FileText className="mx-auto h-10 w-10 text-slate-300" /><h1 className="mt-5 font-display text-2xl font-bold">PDF not found</h1><p className="mt-2 text-slate-500">This material may have been removed or the link is broken.</p><Link href="/browse" className="mt-6 inline-flex rounded-full bg-[#3457e5] px-5 py-3 text-sm font-bold text-white">Back to library</Link></div></AppShell>;
  const share = async () => { const url = window.location.href; if (navigator.share) await navigator.share({ title: pdf.title, url }); else { await navigator.clipboard?.writeText(url); toast.success("Link copied!"); } };
  return <AppShell><div className="mx-auto max-w-[1400px] px-5 py-8 lg:px-10 lg:py-12"><Link href="/browse" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back to library</Link><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]"><div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#e9ecf3] shadow-[0_18px_44px_rgba(15,23,42,0.08)]"><div className="flex items-center justify-between bg-[#15234a] px-5 py-4 text-white"><div className="flex min-w-0 items-center gap-3"><FileText className="h-5 w-5 shrink-0 text-[#f39871]" /><span className="truncate text-sm font-bold">{pdf.fileName}</span></div><Badge className="hidden bg-white/10 text-[#d9e0ff] sm:inline-flex">PDF preview</Badge></div><iframe src={`/api/pdfs/${id}/file`} title={pdf.title} className="h-[680px] w-full bg-white" /></div><aside className="grid content-start gap-4"><div className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"><div className="flex items-start justify-between gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#fff0e7] text-[#ed6b3d]"><FileText className="h-6 w-6" /></span><span className="rounded-full bg-[#f4f6ff] px-3 py-1.5 text-xs font-bold text-[#3457e5]">{pdf.unit}</span></div><h1 className="mt-5 font-display text-2xl font-bold leading-8 tracking-[-.04em] text-slate-950">{pdf.title}</h1><p className="mt-2 text-sm font-semibold text-[#3457e5]">{pdf.subjectName || "General"}</p><div className="mt-6 grid grid-cols-2 gap-3 border-y border-slate-100 py-5"><div><p className="text-xs text-slate-400">Uploaded by</p><p className="mt-1 truncate text-sm font-bold text-slate-800">{pdf.uploaderName || "Student"}</p></div><div><p className="text-xs text-slate-400">Uploaded</p><p className="mt-1 text-sm font-bold text-slate-800">{formatDate(pdf.createdAt)}</p></div><div><p className="text-xs text-slate-400">File size</p><p className="mt-1 text-sm font-bold text-slate-800">{formatBytes(pdf.fileSize)}</p></div><div><p className="text-xs text-slate-400">Downloads</p><p className="mt-1 text-sm font-bold text-slate-800">{pdf.downloadCount || 0}</p></div></div>{pdf.description && <p className="mt-5 text-sm leading-6 text-slate-500">{pdf.description}</p>}<div className="mt-6 grid gap-2"><Button onClick={() => download.mutate({ id })} className="h-11 gap-2 rounded-xl bg-[#3457e5] font-bold hover:bg-[#2849d7]"><Download className="h-4 w-4" /> Download PDF</Button><Button onClick={share} variant="outline" className="h-11 gap-2 rounded-xl border-slate-200 font-bold"><Share2 className="h-4 w-4" /> Share PDF</Button></div><button onClick={() => user ? setReportOpen(value => !value) : startLogin()} className="mt-5 flex w-full items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-600"><ShieldCheck className="h-3.5 w-3.5" /> Report a problem</button>{reportOpen && <div className="mt-4 rounded-2xl bg-[#fff7f4] p-4"><select value={reason} onChange={event => setReason(event.target.value)} className="h-10 w-full rounded-lg border border-[#f5d4c7] bg-white px-3 text-xs font-semibold text-slate-700"><option>Wrong content</option><option>Duplicate file</option><option>Copyright issue</option><option>Inappropriate content</option><option>Malware/suspicious file</option><option>Other</option></select><Textarea value={reportDescription} onChange={event => setReportDescription(event.target.value)} placeholder="Optional details" className="mt-2 min-h-[70px] rounded-lg border-[#f5d4c7] bg-white text-xs" /><Button onClick={() => report.mutate({ pdfId: id, reason, description: reportDescription })} disabled={report.isPending} className="mt-2 h-9 w-full rounded-lg bg-rose-600 text-xs font-bold hover:bg-rose-700">Submit report</Button></div>}</div></aside></div></div></AppShell>;
}

function MyUploadsPage() {
  const { user } = useAuth();
  const { data: uploads = [], isLoading, refetch } = trpc.uploads.mine.useQuery(undefined, { enabled: Boolean(user) });
  const utils = trpc.useUtils();
  const remove = trpc.pdfs.remove.useMutation({ onSuccess: async () => { toast.success("PDF deleted"); await Promise.all([utils.uploads.mine.invalidate(), utils.pdfs.list.invalidate(), utils.dashboard.stats.invalidate(), utils.dashboard.recent.invalidate(), utils.dashboard.popular.invalidate()]); refetch(); }, onError: error => toast.error(error.message) });
  if (!user) return <AuthPrompt />;
  return <AppShell><div className="mx-auto max-w-[1400px] px-5 py-10 lg:px-10 lg:py-14"><PageTitle eyebrow="Your contributions" title="My uploads" description="Keep your shared materials tidy and up to date." action={<Link href="/upload" className="inline-flex items-center gap-2 rounded-full bg-[#3457e5] px-5 py-3 text-sm font-bold text-white hover:bg-[#2849d7]"><Plus className="h-4 w-4" /> Upload PDF</Link>} />{isLoading ? <div className="mt-8 h-64 animate-pulse rounded-[24px] bg-slate-200" /> : uploads.length ? <div className="mt-8 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]"><div className="hidden grid-cols-[1.6fr_1fr_.5fr_.5fr_130px] gap-4 border-b border-slate-100 bg-[#fbfbfd] px-6 py-4 text-xs font-bold uppercase tracking-[.12em] text-slate-400 sm:grid"><span>Material</span><span>Subject</span><span>Views</span><span>Downloads</span><span /></div>{uploads.map(pdf => <div key={pdf.id} className="grid gap-3 border-b border-slate-100 px-5 py-5 last:border-0 sm:grid-cols-[1.6fr_1fr_.5fr_.5fr_130px] sm:items-center sm:gap-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0e7] text-[#ed6b3d]"><FileText className="h-5 w-5" /></span><div className="min-w-0"><Link href={`/studentshare/pdf/${pdf.id}`} className="block truncate text-sm font-bold text-slate-900 hover:text-[#3457e5]">{pdf.title}</Link><span className="mt-1 block text-xs text-slate-400">{formatDate(pdf.createdAt)} · {formatBytes(pdf.fileSize)}</span></div></div><div className="text-sm font-semibold text-[#3457e5]">{pdf.subjectName || "General"}<span className="ml-2 text-xs text-slate-400">{pdf.unit}</span></div><div className="text-sm font-semibold text-slate-600">{pdf.viewCount || 0}</div><div className="text-sm font-semibold text-slate-600">{pdf.downloadCount || 0}</div><div className="flex items-center gap-2"><Link href={`/edit/${pdf.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:border-[#cfd6ff] hover:text-[#3457e5]"><Pencil className="h-3.5 w-3.5" /> Edit</Link><button onClick={() => { if (window.confirm("Delete this PDF? This action cannot be undone.")) remove.mutate({ id: pdf.id }); }} aria-label="Delete PDF" className="rounded-lg p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div></div>)}</div> : <EmptyState title="You haven't uploaded anything yet." description="Share a useful lecture, cheat sheet, or revision guide." action="Upload your first PDF" href="/upload" />}</div></AppShell>;
}

function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, refetch } = trpc.profile.get.useQuery(undefined, { enabled: Boolean(user) });
  const update = trpc.profile.update.useMutation({ onSuccess: () => { toast.success("Profile updated"); refetch(); }, onError: error => toast.error(error.message) });
  const [name, setName] = useState("");
  useEffect(() => { if (profile) setName(profile.name || ""); }, [profile?.id]);
  if (!user) return <AuthPrompt />;
  return <AppShell><div className="mx-auto max-w-4xl px-5 py-10 lg:px-10 lg:py-14"><PageTitle eyebrow="Your account" title="Profile" description="A little about the student behind the notes." /><div className="mt-9 grid gap-6 md:grid-cols-[240px_1fr]"><div className="rounded-[24px] bg-[#15234a] p-6 text-white"><span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#dfe5ff] font-display text-2xl font-bold text-[#3457e5]">{initials(user.name)}</span><h2 className="mt-6 font-display text-xl font-bold">{user.name || "Student"}</h2><p className="mt-1 break-all text-sm text-[#b8c5e9]">{user.email}</p><div className="mt-8 border-t border-white/10 pt-5"><p className="text-xs text-[#b8c5e9]">Member since</p><p className="mt-1 text-sm font-bold">{profile?.createdAt ? formatDate(profile.createdAt) : "—"}</p></div></div><div className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"><h2 className="font-display text-xl font-bold tracking-[-.03em]">Personal details</h2><p className="mt-1 text-sm text-slate-500">Keep your display name current.</p><form onSubmit={event => { event.preventDefault(); update.mutate({ name }); }} className="mt-7 grid gap-5"><label className="grid gap-2 text-sm font-bold text-slate-700">Full name<Input value={name} onChange={event => setName(event.target.value)} className="h-12 rounded-xl font-normal" /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Email address<Input value={user.email || ""} disabled className="h-12 rounded-xl bg-slate-50 font-normal text-slate-400" /></label><div className="flex justify-end"><Button disabled={update.isPending} className="rounded-full bg-[#3457e5] px-5 font-bold hover:bg-[#2849d7]">Save changes</Button></div></form></div></div><div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">{[[profile?.uploads || 0, "Uploads"], [profile?.downloads || 0, "Downloads"], [profile?.views || 0, "Views"], [profile?.subjects || 0, "Subjects"]].map(([value, label]) => <div className="rounded-[20px] border border-slate-200/80 bg-white p-5" key={String(label)}><p className="font-display text-2xl font-bold text-slate-950">{String(value)}</p><p className="mt-1 text-xs font-bold uppercase tracking-[.12em] text-slate-400">{label}</p></div>)}</div></div></AppShell>;
}

function AdminPage() {
  const { user } = useAuth();
  const { data, refetch } = trpc.admin.stats.useQuery(undefined, { enabled: user?.role === "admin" });
  const resolve = trpc.admin.resolveReport.useMutation({ onSuccess: () => { toast.success("Report updated"); refetch(); } });
  const remove = trpc.admin.removePdf.useMutation({ onSuccess: () => { toast.success("PDF removed"); refetch(); } });
  if (!user) return <AuthPrompt />;
  if (user.role !== "admin") return <AppShell><div className="mx-auto max-w-2xl px-5 py-24 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-slate-300" /><h1 className="mt-5 font-display text-2xl font-bold">Admin access required</h1><p className="mt-2 text-slate-500">This area is only available to StudentShare admins.</p></div></AppShell>;
  return <AppShell><div className="mx-auto max-w-[1400px] px-5 py-10 lg:px-10 lg:py-14"><PageTitle eyebrow="Moderation workspace" title="Admin dashboard" description="Keep the student library helpful, safe, and easy to navigate." action={<span className="inline-flex items-center gap-2 rounded-full bg-[#dbf1e9] px-4 py-2 text-xs font-bold text-[#16815e]"><ShieldCheck className="h-4 w-4" /> Protected</span>} /><div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[[data?.students || 0, "Students", Users], [data?.pdfs || 0, "PDFs", FileText], [data?.subjects || 0, "Subjects", Library], [data?.downloads || 0, "Downloads", Download]].map(([value, label, Icon]) => <div key={String(label)} className="rounded-[22px] border border-slate-200/80 bg-white p-5">{createElement(Icon as ElementType, { className: "h-5 w-5 text-[#3457e5]" })}<p className="mt-5 font-display text-3xl font-bold tracking-[-.05em]">{String(value)}</p><p className="mt-1 text-sm font-semibold text-slate-400">{String(label)}</p></div>)}</div><div className="mt-9 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-[24px] border border-slate-200/80 bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#3457e5]">Recent activity</p><h2 className="mt-1 font-display text-xl font-bold">Latest uploads</h2></div><TrendingUp className="h-5 w-5 text-slate-300" /></div><div className="mt-5 grid gap-2">{data?.recentUploads?.map(pdf => <div key={pdf.id} className="flex items-center gap-3 rounded-xl bg-[#fbfbfd] p-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff0e7] text-[#ed6b3d]"><FileText className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{pdf.title}</p><p className="mt-1 text-xs text-slate-400">{pdf.subjectName || "General"} · {pdf.uploaderName || "Student"}</p></div><span className="text-xs text-slate-400">{formatDate(pdf.createdAt)}</span></div>)}{!data?.recentUploads?.length && <p className="py-8 text-center text-sm text-slate-400">No uploads yet.</p>}</div></div><div className="rounded-[24px] border border-slate-200/80 bg-white p-6"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#d86d44]">Needs review</p><h2 className="mt-1 font-display text-xl font-bold">Reports</h2></div><div className="mt-5 grid gap-3">{data?.reports?.map(report => <div key={report.id} className="rounded-xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">{report.pdfTitle || `PDF #${report.pdfId}`}</p><p className="mt-1 text-xs font-semibold text-rose-500">{report.reason}</p></div><Badge className={report.status === "open" ? "bg-[#fff0e7] text-[#d86d44]" : "bg-[#dbf1e9] text-[#16815e]"}>{report.status}</Badge></div>{report.description && <p className="mt-3 text-xs leading-5 text-slate-500">{report.description}</p>}{report.status === "open" && <div className="mt-3 flex gap-2"><button onClick={() => resolve.mutate({ id: report.id, status: "resolved" })} className="rounded-lg bg-[#dbf1e9] px-3 py-2 text-xs font-bold text-[#16815e]">Resolve</button><button onClick={() => { if (window.confirm("Remove this reported PDF?")) remove.mutate({ id: report.pdfId }); }} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">Remove PDF</button></div>}</div>)}{!data?.reports?.length && <p className="py-8 text-center text-sm text-slate-400">No reports. Nice work.</p>}</div></div></div></div></AppShell>;
}

function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "signup"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(mode === "login" ? { email: form.email, password: form.password } : form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Authentication failed.");
      toast.success(mode === "login" ? "Welcome back" : "Account created");
      setLocation("/dashboard");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return <AppShell><section className="mx-auto flex max-w-xl flex-col items-center px-5 py-14 text-center lg:py-20"><span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#dfe5ff] text-[#3457e5]"><BookOpenCheck className="h-8 w-8" /></span><p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-[#3457e5]">StudentShare</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.06em] text-slate-950">{mode === "login" ? "Welcome back." : "Join the study circle."}</h1><p className="mt-4 max-w-md text-sm leading-6 text-slate-500">{mode === "login" ? "Log in to upload, save, and keep your study materials in one place." : "Create your student profile to share notes and discover better ways to learn."}</p><form onSubmit={submit} className="mt-8 grid w-full gap-4 rounded-[24px] border border-slate-200/80 bg-white p-5 text-left shadow-[0_12px_32px_rgba(15,23,42,0.05)] sm:p-7">{mode === "signup" && <label className="grid gap-2 text-sm font-bold text-slate-700">Full name<Input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Your name" className="h-12 rounded-xl font-normal" /></label>}<label className="grid gap-2 text-sm font-bold text-slate-700">Email address<Input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" className="h-12 rounded-xl font-normal" /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Password<Input required minLength={8} type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" className="h-12 rounded-xl font-normal" /></label>{mode === "signup" && <label className="grid gap-2 text-sm font-bold text-slate-700">Confirm password<Input required minLength={8} type="password" value={form.confirmPassword} onChange={event => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Repeat your password" className="h-12 rounded-xl font-normal" /></label>}{error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-600">{error}</p>}<Button type="submit" disabled={submitting} className="h-12 rounded-xl bg-[#3457e5] text-sm font-bold hover:bg-[#2849d7]">{submitting ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}</Button><div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.14em] text-slate-300"><span className="h-px flex-1 bg-slate-100" /> or <span className="h-px flex-1 bg-slate-100" /></div><button type="button" onClick={() => startLogin()} className="h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:border-slate-300">Continue with Google / OAuth</button></form><p className="mt-5 text-xs text-slate-400">{mode === "login" ? "New here? " : "Already have an account? "}<Link href={mode === "login" ? "/signup" : "/login"} className="font-bold text-[#3457e5]">{mode === "login" ? "Create an account" : "Log in"}</Link></p></section></AppShell>;
}

function AuthPrompt() {
  return <AppShell><div className="mx-auto max-w-xl px-5 py-24 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dfe5ff] text-[#3457e5]"><UserRound className="h-6 w-6" /></span><h1 className="mt-6 font-display text-3xl font-bold tracking-[-.05em]">Sign in to continue</h1><p className="mt-3 text-sm leading-6 text-slate-500">Your uploads, subjects, and profile live behind a secure account.</p><button onClick={() => startLogin()} className="mt-7 rounded-full bg-[#3457e5] px-6 py-3 text-sm font-bold text-white hover:bg-[#2849d7]">Sign in to StudentShare</button></div></AppShell>;
}

function EmptyState({ title, description, action, href }: { title: string; description: string; action: string; href: string }) {
  return <div className="col-span-full rounded-[24px] border border-dashed border-slate-300 bg-white p-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f6ff] text-[#3457e5]"><FileText className="h-5 w-5" /></div><h3 className="mt-4 font-display text-lg font-bold text-slate-800">{title}</h3><p className="mt-2 text-sm text-slate-500">{description}</p><Link href={href} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#3457e5] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#2849d7]">{action} <ChevronRight className="h-3.5 w-3.5" /></Link></div>;
}

function LoadingPage() {
  return <AppShell><div className="mx-auto max-w-[1400px] animate-pulse px-5 py-14 lg:px-10"><div className="h-10 w-72 rounded-xl bg-slate-200" /><div className="mt-3 h-5 w-96 rounded-lg bg-slate-200" /><div className="mt-10 grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 rounded-[22px] bg-slate-200" />)}</div></div></AppShell>;
}

export default LandingPage;
export { AppShell, AuthPage, AuthPrompt, BrowsePage, DashboardPage, AdminPage, MyUploadsPage, PdfViewerPage, ProfilePage, SubjectsPage, UploadPage };
