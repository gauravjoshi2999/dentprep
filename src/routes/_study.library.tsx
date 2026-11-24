import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search, HeartPulse, Layers, Users, ArrowRight, Stethoscope } from "lucide-react";
import { AppHero } from "@/components/app/app-hero";
import { useAuth } from "@/lib/auth";
import { progressQuery } from "@/lib/queries";
import { subjectsQuery } from "@/lib/queries";
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/app/common";
import { PrimarySourceReading } from "@/components/app/primary-source-reading";
import {
  FIRST_DENTAL_READING,
  SECOND_DENTAL_READING,
  THIRD_DENTAL_READING,
  FOURTH_DENTAL_READING,
  FIFTH_DENTAL_READING,
  SIXTH_DENTAL_READING,
  SEVENTH_DENTAL_READING,
  EIGHTH_DENTAL_READING,
  ALL_DENTAL_READINGS,
} from "@/lib/primary-reading";
import { STUDY_BRIEF_BY_SLUG, SUBJECT_STUDY_BRIEFS } from "@/lib/subject-study-briefs";
import { SubjectStudyChecklist } from "@/components/app/subject-study-checklist";
import { PUBLIC_HEALTH_COURSE } from "@/lib/study-course";

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
  const categoryOf = (name: string) =>
    SUBJECT_STUDY_BRIEFS.find((brief) => brief.name === name)?.category ??
    (/public health|community/i.test(name)
      ? "Public Health"
      : /anatomy|physiology|biochem|microbiol|pharmacolog|general medicine|general surgery/i.test(
            name,
          )
        ? "Basics"
        : "Clinical");
  const visible =
    subjects.data?.filter(
      (s) =>
        (category === "All" || categoryOf(s.name) === category) &&
        `${s.name} ${s.description} ${s.lessons.map((l) => l.title).join(" ")} ${
          STUDY_BRIEF_BY_SLUG.get(s.slug)
            ?.chapters.map((c) => c.title)
            .join(" ") ?? ""
        }`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    ) ?? [];
  const featured = subjects.data?.flatMap((s) =>
    s.lessons.map((l) => ({ ...l, subjectSlug: s.slug, subjectName: s.name })),
  )[0];
  const showReference =
    (category === "All" || category === "Clinical") &&
    `${FIRST_DENTAL_READING.subject} ${FIRST_DENTAL_READING.title} ${FIRST_DENTAL_READING.publisher}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());

  const showOralSurgeryReading =
    (category === "All" || category === "Clinical") &&
    `${SECOND_DENTAL_READING.subject} ${SECOND_DENTAL_READING.title} ${SECOND_DENTAL_READING.publisher}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
  const showPublicHealthReading =
    (category === "All" || category === "Public Health") &&
    `${THIRD_DENTAL_READING.subject} ${THIRD_DENTAL_READING.title} ${THIRD_DENTAL_READING.publisher}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());

  const showEndodonticsReading =
    (category === "All" || category === "Clinical") &&
    `${FOURTH_DENTAL_READING.subject} ${FOURTH_DENTAL_READING.title} ${FOURTH_DENTAL_READING.publisher}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());

  const showPeriodontologyReading =
    (category === "All" || category === "Clinical") &&
    `${FIFTH_DENTAL_READING.subject} ${FIFTH_DENTAL_READING.title} ${FIFTH_DENTAL_READING.publisher}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());

  const showProsthodonticsReading =
    (category === "All" || category === "Clinical") &&
    `${SIXTH_DENTAL_READING.subject} ${SIXTH_DENTAL_READING.title} ${SIXTH_DENTAL_READING.publisher}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());

  const showPediatricReading =
    (category === "All" || category === "Clinical") &&
    `${SEVENTH_DENTAL_READING.subject} ${SEVENTH_DENTAL_READING.title} ${SEVENTH_DENTAL_READING.publisher}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());

  const showOrthodonticsReading =
    (category === "All" || category === "Clinical") &&
    `${EIGHTH_DENTAL_READING.subject} ${EIGHTH_DENTAL_READING.title} ${EIGHTH_DENTAL_READING.publisher}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());

  const extraReadings = ALL_DENTAL_READINGS.slice(8).filter((source) => {
    const brief = STUDY_BRIEF_BY_SLUG.get(source.subjectSlug);
    return (
      (category === "All" || brief?.category === category) &&
      `${source.subject} ${source.title} ${source.publisher} ${brief?.chapters.map((c) => c.title).join(" ") ?? ""}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    );
  });

  return (
    <>
      <AppHero
        eyebrow="Your study desk"
        title="BDS study library"
        description="UPSC Dental Surgeon preparation: learn one concept, solve a challenge, read the explanation and keep moving through your BDS subjects."
      />
      <section aria-label="Available study paths" className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link
          to="/start"
          search={{ course: "ph-frequency" }}
          className="surface border-teal/40 bg-teal-soft/40 p-5 transition hover:border-teal"
        >
          <strong className="block">Public Health Dentistry · Chapter 1</strong>
          <span className="mt-2 block text-sm text-muted-foreground">
            {PUBLIC_HEALTH_COURSE.title} · 4 lessons + 4 fresh challenges
          </span>
          <span className="mt-3 block text-sm font-bold text-teal">Start chapter →</span>
        </Link>
        <Link to="/interviews" className="surface p-5 transition hover:border-teal">
          <strong className="block">Interview communication</strong>
          <span className="mt-2 block text-sm text-muted-foreground">
            Rehearse clear English answers and reflect on your structure.
          </span>
          <span className="mt-3 block text-sm font-bold text-teal">Open practice →</span>
        </Link>
      </section>
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
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition ${category === c ? "bg-teal text-teal-foreground" : "bg-card text-muted-foreground ring-1 ring-border hover:bg-muted"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <a
        href="#study-guides"
        className="mb-5 inline-block text-sm font-bold text-teal underline underline-offset-4"
      >
        Jump to 15 subject study guides ↓
      </a>
      {subjects.data && (
        <div className="mb-4 flex items-center justify-between">
          <h2 id="study-guides" className="scroll-mt-6 text-xl font-extrabold">
            Study Library
          </h2>
          <span className="text-sm font-semibold text-teal">
            {visible.length} {visible.length === 1 ? "Subject" : "Subjects"} · 15 guided study paths
          </span>
        </div>
      )}
      {featured && (
        <Link
          to="/lesson/$subjectSlug/$lessonSlug"
          params={{ subjectSlug: featured.subjectSlug, lessonSlug: featured.slug }}
          className="mb-6 flex items-center gap-4 rounded-2xl bg-hero p-5 text-white shadow-elevated sm:p-6"
        >
          <span className="rounded-xl bg-white/10 p-3">
            <Stethoscope className="h-8 w-8 text-[#9df3e1]" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#9df3e1]">
              Featured lesson
            </span>
            <h3 className="mt-1 font-extrabold">{featured.title}</h3>
            <p className="mt-1 text-xs text-white/70">
              {featured.subjectName} · {featured.est_minutes} min
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0" />
        </Link>
      )}
      {subjects.isPending ? (
        <LoadingBlock />
      ) : subjects.isError ? (
        <ErrorBlock error={subjects.error} onRetry={() => void subjects.refetch()} />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {visible.map((s) => (
            <section
              key={s.id}
              className="surface bg-teal-soft/20 p-5 transition hover:border-teal/70 sm:p-6"
            >
              <div className="mb-3 flex items-start gap-3">
                <span className="rounded-xl bg-teal-soft p-2.5 text-secondary-foreground">
                  {categoryOf(s.name) === "Public Health" ? (
                    <Users className="h-5 w-5" />
                  ) : categoryOf(s.name) === "Basics" ? (
                    <Layers className="h-5 w-5" />
                  ) : (
                    <HeartPulse className="h-5 w-5" />
                  )}
                </span>
                <div>
                  <h2 className="text-xl font-bold">{s.name}</h2>
                  <p className="mt-1 text-xs font-semibold text-teal">
                    {s.lessons.length
                      ? `${s.lessons.length} lessons available`
                      : s.slug === PUBLIC_HEALTH_COURSE.subject_slug
                        ? "Chapter 1 ready · 4 lessons"
                        : "Guided topics and source reading"}
                  </p>
                </div>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{s.description}</p>
              {s.slug === PUBLIC_HEALTH_COURSE.subject_slug && (
                <Link
                  to="/start"
                  search={{ course: "ph-frequency" }}
                  className="mb-4 inline-flex rounded-xl bg-teal px-4 py-3 text-sm font-bold text-teal-foreground"
                >
                  Learn prevalence and incidence →
                </Link>
              )}
              {(() => {
                const brief = STUDY_BRIEF_BY_SLUG.get(s.slug);
                const source = ALL_DENTAL_READINGS.find((item) => item.subjectSlug === s.slug);
                return brief && source ? (
                  <SubjectStudyChecklist
                    brief={brief}
                    sourceAnchor={
                      source.id === FIRST_DENTAL_READING.id
                        ? "primary-reading"
                        : `source-reading-${source.id}`
                    }
                  />
                ) : null;
              })()}
              {user &&
                s.lessons.length > 0 &&
                (() => {
                  const completed = s.lessons.filter((l) =>
                    progress.data?.some((p) => p.lesson_id === l.id && p.status === "completed"),
                  ).length;
                  const percent = Math.round((100 * completed) / s.lessons.length);
                  return (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>
                          {completed}/{s.lessons.length} lessons completed
                        </span>
                        <span>{percent}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-teal"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
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
                <p className="text-sm text-muted-foreground">
                  Explore the guided topics and original references for this subject.
                </p>
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
      {(subjects.isError || (subjects.isSuccess && subjects.data?.length === 0)) && (
        <section aria-label="Standalone study guides" className="mt-6">
          <h2 className="text-xl font-extrabold">15 guided subject paths available</h2>
          <p className="mb-5 mt-2 text-sm text-muted-foreground">
            The approved lesson catalogue is not available, but you can still study these
            publisher-linked topic guides. Session checkmarks are not saved or scored.
          </p>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {SUBJECT_STUDY_BRIEFS.filter(
              (brief) =>
                (category === "All" || brief.category === category) &&
                `${brief.name} ${brief.chapters.map((c) => c.title).join(" ")}`
                  .toLowerCase()
                  .includes(search.trim().toLowerCase()),
            ).map((brief) => {
              const source = ALL_DENTAL_READINGS.find((item) => item.subjectSlug === brief.slug);
              return source ? (
                <article key={brief.slug} className="surface p-5">
                  <h3 className="text-lg font-extrabold">{brief.name}</h3>
                  <p className="mt-1 text-xs text-teal">Guided topics and source reading</p>
                  <SubjectStudyChecklist
                    brief={brief}
                    sourceAnchor={
                      source.id === FIRST_DENTAL_READING.id
                        ? "primary-reading"
                        : `source-reading-${source.id}`
                    }
                  />
                </article>
              ) : null;
            })}
          </div>
        </section>
      )}
      <section aria-label="Original source readings" className="mt-9">
        <h2 className="mb-2 text-xl font-extrabold">Official source reading · 15 subjects</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Keep the original references alongside your notes. Check the publisher, edition, section
          and date as you move through each subject.
        </p>
        {showReference && <PrimarySourceReading />}
        {showOralSurgeryReading && <PrimarySourceReading source={SECOND_DENTAL_READING} />}
        {showEndodonticsReading && <PrimarySourceReading source={FOURTH_DENTAL_READING} />}
        {showPeriodontologyReading && <PrimarySourceReading source={FIFTH_DENTAL_READING} />}
        {showProsthodonticsReading && <PrimarySourceReading source={SIXTH_DENTAL_READING} />}
        {showPediatricReading && <PrimarySourceReading source={SEVENTH_DENTAL_READING} />}
        {showOrthodonticsReading && <PrimarySourceReading source={EIGHTH_DENTAL_READING} />}
        {showPublicHealthReading && <PrimarySourceReading source={THIRD_DENTAL_READING} />}
        {extraReadings.map((source) => (
          <PrimarySourceReading key={source.id} source={source} />
        ))}
      </section>
    </>
  );
}
