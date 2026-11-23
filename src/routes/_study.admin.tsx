import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useUserId } from "@/lib/auth";
import { isAdminQuery } from "@/lib/queries";
import { adminQuestionOptions, adminSaveQuestion } from "@/lib/admin-api";
import { RequireUser } from "@/components/app/study-shell";
import { EmptyState, ErrorBlock, LoadingBlock, Notice, PageHeader } from "@/components/app/common";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_study/admin")({
  component: () => (
    <RequireUser>
      <AdminGate />
    </RequireUser>
  ),
  head: () => ({
    meta: [
      { title: "Content administration — DentPrep" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});
type Kind = "lessons" | "questions" | "clinical_cases";
type Content = Tables<"lessons"> | Tables<"questions"> | Tables<"clinical_cases">;
function AdminGate() {
  const id = useUserId();
  const role = useQuery(isAdminQuery(id));
  if (role.isPending) return <LoadingBlock label="Checking content permissions…" />;
  if (!role.data)
    return (
      <EmptyState title="Administrator access required">
        Your account does not have permission to edit educational content.
      </EmptyState>
    );
  return <Admin />;
}
function Admin() {
  const userId = useUserId();
  const qc = useQueryClient();
  const [kind, setKind] = useState<Kind>("lessons");
  const [selected, setSelected] = useState<Content | "new" | null>(null);
  const content = useQuery({
    queryKey: ["admin-content", userId, kind],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(kind)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Content[];
    },
  });
  const subjects = useQuery({
    queryKey: ["admin-subjects", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id,name").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const reviews = useQuery({
    queryKey: ["admin-review-trail", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_reviews")
        .select("id,entity_type,from_status,to_status,note,created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });
  const archive = useMutation({
    mutationFn: async (row: Content) => {
      const { error } = await supabase
        .from(kind)
        .update({ status: row.status === "archived" ? "draft" : "archived" })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries();
      toast.success("Content status updated");
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <>
      <PageHeader
        title="Content administration"
        description="Create original drafts, edit educational content and submit it for professional review."
      />
      <Notice className="mb-6" title="Publication requires a separate clinical review">
        This editor saves draft or in-review content only. A status-change record is an audit trail;
        it does not certify medical review. Existing clinical drafts remain unpublished.
      </Notice>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {(
          [
            ["lessons", "Study notes"],
            ["questions", "MCQs"],
            ["clinical_cases", "Clinical scenarios"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant={kind === id ? "default" : "outline"}
            onClick={() => {
              setKind(id);
              setSelected(null);
            }}
          >
            {label}
          </Button>
        ))}
        <Button variant="soft" onClick={() => setSelected("new")}>
          Add draft
        </Button>
      </div>
      {selected && subjects.data && (
        <ContentEditor
          key={`${kind}-${selected === "new" ? "new" : selected.id}`}
          kind={kind}
          row={selected === "new" ? null : selected}
          subjects={subjects.data}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            void qc.invalidateQueries();
          }}
        />
      )}
      {content.isPending || subjects.isPending ? (
        <LoadingBlock />
      ) : content.isError || subjects.isError ? (
        <ErrorBlock error={content.error ?? subjects.error} />
      ) : (
        <div className="grid gap-3">
          {content.data?.map((row) => (
            <section
              key={row.id}
              className="surface flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
            >
              <div>
                <span className="mb-2 inline-block rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase">
                  {row.status.replaceAll("_", " ")}
                </span>
                <h2 className="font-bold">{"title" in row ? row.title : row.stem}</h2>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" onClick={() => setSelected(row)}>
                  Edit draft
                </Button>
                <Button
                  variant="ghost"
                  disabled={archive.isPending}
                  onClick={() => archive.mutate(row)}
                >
                  {row.status === "archived" ? "Restore as draft" : "Archive"}
                </Button>
              </div>
            </section>
          ))}
        </div>
      )}
      <section className="surface mt-7 p-5">
        <h2 className="mb-4 text-xl font-bold">Recent workflow changes</h2>
        {reviews.isPending ? (
          <LoadingBlock />
        ) : reviews.isError ? (
          <ErrorBlock error={reviews.error} />
        ) : (
          <ul className="divide-y divide-border text-sm">
            {reviews.data.map((r) => (
              <li key={r.id} className="py-3">
                <strong className="capitalize">{r.entity_type}</strong> ·{" "}
                {r.from_status ?? "Created"} → {r.to_status}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} ·{" "}
                  {r.note}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
function ContentEditor({
  kind,
  row,
  subjects,
  onClose,
  onSaved,
}: {
  kind: Kind;
  row: Content | null;
  subjects: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const lesson = row && "notes_md" in row ? row : null;
  const question = row && "stem" in row ? row : null;
  const clinicalCase = row && "presentation" in row ? row : null;
  const [title, setTitle] = useState(row ? ("title" in row ? row.title : row.stem) : "");
  const [subject, setSubject] = useState(row?.subject_id ?? subjects[0]?.id ?? "");
  const [slug, setSlug] = useState(row && "slug" in row ? row.slug : "");
  const [summary, setSummary] = useState(lesson?.summary ?? "");
  const [body, setBody] = useState(
    lesson?.notes_md ?? question?.explanation ?? clinicalCase?.presentation ?? "",
  );
  const [references, setReferences] = useState(
    lesson?.references.join("\n") ??
      question?.source_note ??
      clinicalCase?.references.join("\n") ??
      "",
  );
  const [points, setPoints] = useState(
    lesson?.high_yield.join("\n") ?? clinicalCase?.key_learning.join("\n") ?? "",
  );
  const [redFlags, setRedFlags] = useState(clinicalCase?.red_flags.join("\n") ?? "");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    question?.difficulty ?? clinicalCase?.difficulty ?? "medium",
  );
  const [status, setStatus] = useState<"draft" | "in_review">(
    row?.status === "in_review" ? "in_review" : "draft",
  );
  const [optionValues, setOptionValues] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const options = useQuery({
    queryKey: ["admin-options", question?.id],
    enabled: !!question,
    queryFn: () => adminQuestionOptions(question!.id),
  });
  // Existing option text is used until the editor explicitly changes it; existing option ids are preserved.
  const [editedOptions, setEditedOptions] = useState(false);
  const currentOptions =
    editedOptions || !question ? optionValues : (options.data?.map((o) => o.body) ?? optionValues);
  const correctIndex =
    editedOptions || !question ? correct : (options.data?.findIndex((o) => o.is_correct) ?? 0);
  const lines = (s: string) =>
    s
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
  const save = useMutation({
    mutationFn: async () => {
      const id = row?.id ?? crypto.randomUUID();
      if (!subject || !title.trim() || !body.trim())
        throw new Error("Subject, title and content are required.");
      if (kind !== "questions" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
        throw new Error("Use a unique lowercase slug with hyphens.");
      if (kind === "lessons") {
        const { error } = await supabase.from("lessons").upsert({
          id,
          subject_id: subject,
          title: title.trim(),
          slug,
          summary: summary.trim(),
          notes_md: body,
          high_yield: lines(points),
          references: lines(references),
          status,
          reviewed_on: null,
          review_note: "Updated draft; professional review required.",
        });
        if (error) throw error;
      } else if (kind === "clinical_cases") {
        const { error } = await supabase.from("clinical_cases").upsert({
          id,
          subject_id: subject,
          title: title.trim(),
          slug,
          presentation: body,
          key_learning: lines(points),
          red_flags: lines(redFlags),
          references: lines(references),
          difficulty,
          status,
        });
        if (error) throw error;
      } else {
        if (
          currentOptions.length !== 4 ||
          currentOptions.some((o) => !o.trim()) ||
          correctIndex < 0 ||
          correctIndex > 3
        )
          throw new Error("Provide four answer options and choose one correct answer.");
        // The database validates permissions and all four options in one transaction.
        await adminSaveQuestion(
          {
            id,
            subject_id: subject,
            stem: title.trim(),
            explanation: body,
            source_note: references,
            difficulty,
            status,
          },
          currentOptions.map((body, i) => ({
            body: body.trim(),
            is_correct: i === correctIndex,
            ...(options.data?.[i] ? { id: options.data[i]!.id } : {}),
          })),
        );
      }
    },
    onSuccess: () => {
      toast.success("Draft saved");
      onSaved();
    },
    onError: (e) => toast.error(e.message),
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }
  function changeOption(i: number, value: string) {
    setOptionValues(currentOptions.map((o, n) => (n === i ? value : o)));
    setCorrect(correctIndex);
    setEditedOptions(true);
  }
  return (
    <form className="surface mb-7 grid gap-4 border-teal/40 p-5 sm:p-7" onSubmit={submit}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{row ? "Edit content draft" : "New content draft"}</h2>
        <Button variant="ghost" type="button" disabled={save.isPending} onClick={onClose}>
          Close
        </Button>
      </div>
      {row?.status === "published" && (
        <Notice tone="warning">
          Saving this edit returns the content to draft or review. It must be reviewed again before
          publication.
        </Notice>
      )}
      <label className="grid gap-2 text-sm font-semibold">
        {kind === "questions" ? "Question stem" : "Title"}
        <input
          className="study-input"
          value={title}
          maxLength={1000}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Subject
          <select
            className="study-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {kind !== "questions" ? (
          <label className="grid gap-2 text-sm font-semibold">
            URL slug
            <input
              className="study-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              maxLength={150}
            />
          </label>
        ) : (
          <label className="grid gap-2 text-sm font-semibold">
            Difficulty
            <select
              className="study-input"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        )}
      </div>
      {kind === "lessons" && (
        <label className="grid gap-2 text-sm font-semibold">
          Summary
          <textarea
            className="study-input"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={3000}
          />
        </label>
      )}
      <label className="grid gap-2 text-sm font-semibold">
        {kind === "lessons"
          ? "Study notes (Markdown)"
          : kind === "questions"
            ? "Answer explanation"
            : "Case presentation"}
        <textarea
          className="study-input min-h-56"
          value={body}
          maxLength={100000}
          required
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      {kind === "questions" &&
        (options.isPending && !!question ? (
          <LoadingBlock label="Loading answer options…" />
        ) : options.isError ? (
          <ErrorBlock error={options.error} />
        ) : (
          <fieldset className="grid gap-3">
            <legend className="mb-2 font-bold">Answer options · select the correct answer</legend>
            {[0, 1, 2, 3].map((i) => (
              <label key={i} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correct-option"
                  aria-label={`Option ${String.fromCharCode(65 + i)} is correct`}
                  checked={correctIndex === i}
                  onChange={() => {
                    setOptionValues(currentOptions);
                    setCorrect(i);
                    setEditedOptions(true);
                  }}
                />
                <input
                  className="study-input"
                  aria-label={`Answer option ${String.fromCharCode(65 + i)}`}
                  value={currentOptions[i] ?? ""}
                  maxLength={3000}
                  required
                  onChange={(e) => changeOption(i, e.target.value)}
                />
              </label>
            ))}
          </fieldset>
        ))}
      {kind !== "questions" && (
        <label className="grid gap-2 text-sm font-semibold">
          Key learning points (one per line)
          <textarea
            className="study-input min-h-24"
            value={points}
            maxLength={15000}
            onChange={(e) => setPoints(e.target.value)}
          />
        </label>
      )}
      {kind === "clinical_cases" && (
        <label className="grid gap-2 text-sm font-semibold">
          Safety considerations (one per line)
          <textarea
            className="study-input min-h-24"
            value={redFlags}
            maxLength={15000}
            onChange={(e) => setRedFlags(e.target.value)}
          />
        </label>
      )}
      <label className="grid gap-2 text-sm font-semibold">
        References and source notes (one per line)
        <textarea
          className="study-input min-h-24"
          value={references}
          maxLength={15000}
          onChange={(e) => setReferences(e.target.value)}
        />
      </label>
      <label className="grid max-w-xs gap-2 text-sm font-semibold">
        Workflow status
        <select
          className="study-input"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="draft">Draft</option>
          <option value="in_review">Submit for professional review</option>
        </select>
      </label>
      <Button
        size="lg"
        type="submit"
        disabled={
          save.isPending ||
          (kind === "questions" && !!question && (options.isPending || options.isError))
        }
      >
        {save.isPending ? "Saving draft…" : "Save draft content"}
      </Button>
    </form>
  );
}
