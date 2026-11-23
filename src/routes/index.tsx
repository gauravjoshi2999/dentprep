import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CalendarDays, ExternalLink, GraduationCap, HeartPulse, Menu, ShieldCheck, X } from "lucide-react";
import { Brand, ToothDiagram } from "@/components/app/brand";
import { ErrorBlock, LoadingBlock, Notice } from "@/components/app/common";
import { noticesQuery, subjectsQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "DentPrep — UPSC Dental Surgeon Preparation" },
      { name: "description", content: "Independent English-medium UPSC Dental Surgeon study, clinical revision and interview preparation." },
      { property: "og:title", content: "DentPrep — Learn. Practice. Interview. Succeed." },
      { property: "og:description", content: "Subject-wise BDS revision, clinical thinking and independent UPSC preparation." },
    ],
  }),
});

function Home() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const subjects = useQuery(subjectsQuery());
  const notices = useQuery(noticesQuery());
  const selected = subjects.data?.find((item) => item.slug === selectedSlug);
  const publishedLessonCount = subjects.data?.reduce((sum, item) => sum + item.lessons.length, 0) ?? 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <a href="#home" className="shrink-0" aria-label="DentPrep home"><Brand /></a>
          <nav aria-label="Primary" className="hidden gap-7 md:flex">
            <a className="text-sm font-semibold hover:text-teal" href="#subjects">Study subjects</a>
            <a className="text-sm font-semibold hover:text-teal" href="#notices">Official notices</a>
            <a className="text-sm font-semibold hover:text-teal" href="#about">About</a>
          </nav>
          <button aria-label="Toggle navigation" aria-controls="dentprep-mobile-nav" aria-expanded={menuOpen} type="button" className="rounded-lg border border-border p-2 md:hidden" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {menuOpen && <nav id="dentprep-mobile-nav" aria-label="Mobile navigation" className="flex flex-col border-t border-border p-3 md:hidden">
          {([["#subjects","Study subjects"],["#notices","Official notices"],["#about","About"]] as const).map(([url,label]) => (
            <a key={url} href={url} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-muted" onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
        </nav>}
      </header>

      <section id="home" className="overflow-hidden bg-hero text-navy-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-[1.12fr_0.88fr] lg:px-8 lg:py-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest"><GraduationCap className="h-4 w-4" /> English-medium dental preparation</p>
            <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">Study with clarity.<br /><span className="text-[#7ee2d0]">Interview with confidence.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">A structured learning hub for UPSC Dental Surgeon aspirants, combining BDS topics, clinical reasoning and professional interview readiness.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#subjects" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-[#17314b] shadow-lg hover:bg-[#e5faf5]">Browse subjects <ArrowRight className="h-4 w-4" /></a>
              <a href="#notices" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/35 px-5 py-3 font-bold text-white hover:bg-white/10">Official UPSC information <ExternalLink className="h-4 w-4" /></a>
            </div>
            <p className="mt-5 text-xs text-white/70">An independent study resource. Not affiliated with or endorsed by UPSC.</p>
          </div>
          <div className="mx-auto w-full max-w-sm rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-sm">
            <div className="rounded-[1.5rem] bg-white/10 p-4"><ToothDiagram className="mx-auto h-64 max-w-xs" /></div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white/10 p-3"><BookOpen className="mb-2 h-5 w-5 text-[#7ee2d0]" /><strong className="block">BDS foundations</strong><span className="text-xs text-white/65">Subject pathways</span></div>
              <div className="rounded-xl bg-white/10 p-3"><HeartPulse className="mb-2 h-5 w-5 text-[#7ee2d0]" /><strong className="block">Clinical thinking</strong><span className="text-xs text-white/65">Safety-first practice</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="subjects" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-teal">Learning library</p><h2 className="text-3xl font-extrabold">Explore the BDS subjects</h2><p className="mt-2 max-w-2xl text-muted-foreground">Choose a subject to explore its scope. Detailed lessons are published only after educational review.</p></div>
          {subjects.data && <span className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold">{subjects.data.length} subjects · {publishedLessonCount} published lessons</span>}
        </div>
        {subjects.isPending ? <LoadingBlock label="Loading subjects..." /> :
         subjects.isError ? <ErrorBlock error={subjects.error} onRetry={() => void subjects.refetch()} /> :
         subjects.data?.length ? <>
           <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
             {subjects.data.map((item, index) => <button key={item.id} type="button" aria-expanded={selectedSlug === item.slug} aria-controls="subject-detail" className={`group surface p-5 text-left transition hover:-translate-y-0.5 hover:border-teal/70 hover:shadow-elevated ${selectedSlug === item.slug ? "ring-2 ring-teal" : ""}`} onClick={() => setSelectedSlug((old) => old === item.slug ? null : item.slug)}>
               <div className="mb-4 flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-soft text-lg font-black text-secondary-foreground">{String(index + 1).padStart(2, "0")}</span><ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-teal" /></div>
               <h3 className="text-lg font-extrabold">{item.name}</h3><p className="mt-2 line-clamp-3 min-h-16 text-sm text-muted-foreground">{item.description}</p><p className="mt-4 text-xs font-semibold text-teal">{item.lessons.length ? `${item.lessons.length} published lessons` : "Curriculum outline"}</p>
             </button>)}
           </div>
           {selected && <div id="subject-detail" role="region" aria-label={`${selected.name} details`} className="surface mt-7 scroll-mt-28 p-6 sm:p-8">
             <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-teal">Subject details</p><h3 className="mt-1 text-2xl font-extrabold">{selected.name}</h3></div><button type="button" aria-label="Close subject" className="rounded-lg border border-border p-2" onClick={() => setSelectedSlug(null)}><X className="h-4 w-4" /></button></div>
             <p className="mt-3 max-w-3xl text-muted-foreground">{selected.description}</p>
             {selected.lessons.length ? <ul className="mt-6 grid gap-3 sm:grid-cols-2">{selected.lessons.map((lesson) => <li className="rounded-xl border border-border p-4" key={lesson.id}><strong className="block">{lesson.title}</strong><p className="mt-1 text-sm text-muted-foreground">{lesson.summary}</p><span className="mt-2 block text-xs text-teal">{lesson.est_minutes} min reading</span></li>)}</ul> : <div className="mt-5 rounded-xl bg-muted p-5 text-sm text-muted-foreground">Detailed lessons are undergoing clinical content review. Draft material is not available publicly.</div>}
           </div>}
         </> : <Notice title="No published subjects">Please check again after the curriculum is approved.</Notice>}
      </section>

      <section id="notices" className="scroll-mt-24 bg-muted/60 py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-8"><p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-teal">Verified links</p><h2 className="text-3xl font-extrabold">UPSC recruitment notices</h2><p className="mt-2 text-muted-foreground">Always confirm details against current UPSC notices and corrigenda.</p></div>
          {notices.isPending ? <LoadingBlock label="Loading official notices..." /> :
           notices.isError ? <ErrorBlock error={notices.error} onRetry={() => void notices.refetch()} /> :
           notices.data?.length ? <div className="grid gap-4 md:grid-cols-2">{notices.data.map((notice) => <article key={notice.id} className="surface p-6"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-soft px-3 py-1 text-xs font-bold text-secondary-foreground"><ShieldCheck className="h-4 w-4" /> Official source linked</div><h3 className="text-xl font-extrabold">{notice.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{notice.summary}</p><div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground"><span><CalendarDays className="mr-1 inline h-4 w-4" /> Verified: {notice.verified_on ?? "not recorded"}</span><span>{notice.advt_no ?? "Recruitment"}</span></div><a href={notice.official_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">Read UPSC notification <ExternalLink className="h-4 w-4" /></a></article>)}</div> : <Notice title="No published notices">Visit the official UPSC website for current information.</Notice>}
        </div>
      </section>

      <section id="about" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="surface p-7"><h2 className="text-2xl font-extrabold">Reliable preparation, without invented exam patterns</h2><p className="mt-3 max-w-3xl text-muted-foreground">The study library, practice questions, clinical scenarios and interview exercises are independent educational materials, not UPSC examination papers. They are released only after relevant review and verification.</p></div>
      </section>
      <footer className="border-t border-border px-5 py-8 text-center text-xs text-muted-foreground">© DentPrep · Independent UPSC Dental Surgeon preparation · Not endorsed by UPSC · Clinical education does not replace qualified professional supervision.</footer>
    </main>
  );
}
