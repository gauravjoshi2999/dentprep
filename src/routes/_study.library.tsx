import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search, HeartPulse, Layers, Users, ArrowRight, Stethoscope } from "lucide-react";
import { AppHero } from "@/components/app/app-hero";
import { useAuth } from "@/lib/auth";
import { progressQuery } from "@/lib/queries";
import { subjectsQuery } from "@/lib/queries";
import { EmptyState, ErrorBlock, LoadingBlock, Notice } from "@/components/app/common";

export const Route = createFileRoute("/_study/library")({
  component: Library,
  head: () => ({ meta: [{ title: "BDS study library — DentPrep" }] }),
});
function Library() {
  const subjects = useQuery(subjectsQuery());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const { user } = useAuth();
  const progress = useQuery({ ...progressQuery(user?.id ?? ""), enabled: !!user });
  const categories = ["All", "Clinical", "Basics", "Public Health"] as const;
  const categoryOf = (name: string) => /public health|community/i.test(name) ? "Public Health" : /anatomy|physiology|biochem|microbiol|pharmacolog|general medicine|general surgery/i.test(name) ? "Basics" : "Clinical";
  const visible = subjects.data?.filter((s) =>
    (category === "All" || categoryOf(s.name) === category) &&
    `${s.name} ${s.description} ${s.lessons.map((l) => l.title).join(" ")}`.toLowerCase().includes(search.trim().toLowerCase()),
  ) ?? [];
  const featured = subjects.data?.flatMap((s) => s.lessons.map((l) => ({ ...l, subjectSlug: s.slug, subjectName: s.name })))[0];
  return (
    <>
      <AppHero eyebrow="Learn with clarity" title="BDS study library" description="Explore reviewed lessons and clinical learning paths. Your progress is saved to your account." />
      <label className="mb-6 flex max-w-xl items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="search"
          aria-label="Search subjects and lessons"
          className="study-input"
          placeholder="Search subjects or lessons"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2" aria-label="Subject categories">
        {categories.map((c) => (
          <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition ${category === c ? "bg-teal text-teal-foreground" : "bg-card text-muted-foreground ring-1 ring-border hover:bg-muted"}`}>{c}</button>
        ))}
      </div>
      {subjects.data && <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-extrabold">Study Library</h2><span className="text-sm font-semibold text-teal">{visible.length} {visible.length === 1 ? "Subject" : "Subjects"}</span></div>}
      {featured && <Link to="/lesson/$subjectSlug/$lessonSlug" params={{ subjectSlug: featured.subjectSlug, lessonSlug: featured.slug }} className="mb-6 flex items-center gap-4 rounded-2xl bg-hero p-5 text-white shadow-elevated sm:p-6"><span className="rounded-xl bg-white/10 p-3"><Stethoscope className="h-8 w-8 text-[#9df3e1]" /></span><div className="min-w-0 flex-1"><span className="text-xs font-bold uppercase tracking-widest text-[#9df3e1]">Featured reviewed lesson</span><h3 className="mt-1 font-extrabold">{featured.title}</h3><p className="mt-1 text-xs text-white/70">{featured.subjectName} · {featured.est_minutes} min</p></div><ArrowRight className="h-5 w-5 shrink-0" /></Link>}
      {subjects.isPending ? (
        <LoadingBlock />
      ) : subjects.isError ? (
        <ErrorBlock error={subjects.error} onRetry={() => void subjects.refetch()} />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {visible.map((s) => (
              <section key={s.id} className="surface bg-teal-soft/20 p-5 transition hover:border-teal/70 sm:p-6">
                <div className="mb-3 flex items-start gap-3">
                  <span className="rounded-xl bg-teal-soft p-2.5 text-secondary-foreground">
                    {categoryOf(s.name) === "Public Health" ? <Users className="h-5 w-5" /> : categoryOf(s.name) === "Basics" ? <Layers className="h-5 w-5" /> : <HeartPulse className="h-5 w-5" />}
                  </span>
                  <div>
                    <h2 className="text-xl font-bold">{s.name}</h2>
                    <p className="mt-1 text-xs font-semibold text-teal">
                      {s.lessons.length} published lessons
                    </p>
                  </div>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">{s.description}</p>
                {user && s.lessons.length > 0 && (() => {
                  const completed = s.lessons.filter((l) => progress.data?.some((p) => p.lesson_id === l.id && p.status === "completed")).length;
                  const percent = Math.round(100 * completed / s.lessons.length);
                  return <div className="mb-4"><div className="flex justify-between text-xs font-semibold"><span>{completed}/{s.lessons.length} lessons completed</span><span>{percent}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-teal" style={{ width: `${percent}%` }} /></div></div>;
                })()}
                {s.lessons.length ? (
                  <ul className="divide-y divide-border">
                    {s.lessons
                      .filter(
                        (l) =>
                          !search ||
                          `${s.name} ${l.title}`.toLowerCase().includes(search.toLowerCase()),
                      )
                      .map((l) => (
                        <li key={l.id}>
                          <Link
                            to="/lesson/$subjectSlug/$lessonSlug"
                            params={{ subjectSlug: s.slug, lessonSlug: l.slug }}
                            className="block rounded-lg py-3 hover:bg-muted"
                          >
                            <strong>{l.title}</strong>
                            <p className="mt-1 text-sm text-muted-foreground">{l.summary}</p>
                            <span className="mt-2 block text-xs text-teal">
                              {l.est_minutes} min · Read lesson →
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <Notice title="Lessons awaiting review">
                    The curriculum outline is available. Detailed clinical lessons will appear here
                    after review.
                  </Notice>
                )}
              </section>
            ))}
          {!visible.length && (
            <EmptyState title="No matching subjects">
              Try a different subject or topic name.
            </EmptyState>
          )}
        </div>
      )}
    </>
  );
}
