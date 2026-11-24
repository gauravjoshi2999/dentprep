import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ZodError } from "zod";
import { toast } from "sonner";
import { useUserId } from "@/lib/auth";
import {
  loadContentEvidence,
  saveContentEvidence,
  parsePreparationInput,
  type CurriculumEntityType,
  type ContentEvidenceSnapshot,
  type EvidenceSource,
} from "@/lib/curriculum-evidence";
import { Button } from "@/components/ui/button";
import { ErrorBlock, LoadingBlock, Notice } from "@/components/app/common";

const blankSource = (): EvidenceSource => ({
  citation: "",
  edition: "",
  section: "",
  url: null,
  checked_on: null,
});
export function CurriculumEvidenceEditor({
  entityType,
  entityId,
  onClose,
}: {
  entityType: CurriculumEntityType;
  entityId: string;
  onClose: () => void;
}) {
  const userId = useUserId();
  const qc = useQueryClient();
  const key = ["admin-curriculum-evidence", userId, entityType, entityId];
  const query = useQuery({
    queryKey: key,
    queryFn: () => loadContentEvidence(entityType, entityId),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
  // A reload is explicit; background focus refresh must not discard an unsaved preparation form.
  if (query.isPending || query.isFetching)
    return (
      <div className="mb-6">
        <LoadingBlock label="Loading curriculum preparation…" />
        <Button variant="outline" onClick={onClose}>
          Close preparation
        </Button>
      </div>
    );
  if (query.isError)
    return (
      <div className="mb-6">
        <ErrorBlock error={query.error} onRetry={() => void query.refetch()} />
        <Button className="mt-3" variant="outline" onClick={onClose}>
          Close preparation
        </Button>
      </div>
    );
  return (
    <PreparationForm
      key={`${query.data.current_fingerprint}:${query.data.current_version}`}
      data={query.data}
      onClose={onClose}
      reload={() => void query.refetch()}
      saved={() => void qc.invalidateQueries({ queryKey: key })}
    />
  );
}
function PreparationForm({
  data,
  onClose,
  reload,
  saved,
}: {
  data: ContentEvidenceSnapshot;
  onClose: () => void;
  reload: () => void;
  saved: () => void;
}) {
  const initial = data.latest?.evidence;
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [outcomes, setOutcomes] = useState(initial?.outcomes.join("\n") ?? "");
  const [sources, setSources] = useState<EvidenceSource[]>(initial?.sources ?? [blankSource()]);
  const [note, setNote] = useState(initial?.note ?? "");
  const [conflict, setConflict] = useState<string | null>(null);
  const request = useRef<{ id: string; fingerprint: string } | null>(null);
  const editable =
    ["draft", "in_review"].includes(data.entity.status) &&
    data.publication_locked &&
    !!data.entity.subject_id;
  const save = useMutation({
    mutationFn: async () => {
      const evidence = parsePreparationInput(
        {
          unit,
          topic,
          outcomes: outcomes
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          sources,
          note,
        },
        data.server_today,
      );
      const fingerprint = JSON.stringify(evidence);
      const id =
        request.current?.fingerprint === fingerprint ? request.current.id : crypto.randomUUID();
      request.current = { id, fingerprint };
      return saveContentEvidence(id, data, evidence);
    },
    onSuccess: () => {
      toast.success("Preparation saved; independent clinical review is still pending");
      saved();
    },
    onError: (error) => {
      const message =
        error instanceof ZodError
          ? (error.issues[0]?.message ?? "Check the preparation fields")
          : error.message;
      if (message.includes("Content changed") || message.includes("Preparation version changed"))
        setConflict(message);
      toast.error(message);
    },
  });
  const disabled = save.isPending || !!conflict || !editable;
  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }
  function updateSource(index: number, field: keyof EvidenceSource, value: string) {
    setSources((old) =>
      old.map((s, i) =>
        i === index
          ? { ...s, [field]: field === "url" || field === "checked_on" ? value || null : value }
          : s,
      ),
    );
  }
  return (
    <section className="surface mb-6 p-5 sm:p-6" aria-label="Curriculum and source preparation">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold">Curriculum &amp; source preparation</h2>
          <p className="mt-1 break-words text-sm text-muted-foreground">{data.entity.title}</p>
        </div>
        <Button variant="outline" disabled={save.isPending} onClick={onClose}>
          Close preparation
        </Button>
      </div>
      <Notice className="mb-4" title="Preparation record, not clinical approval">
        Map this draft to a unit, topic, learning outcomes and source editions. Citation details and
        check dates are entered by the editor; they do not verify academic correctness or reviewer
        credentials. Preparation records do not publish content or certify professional review.
      </Notice>
      <p role="status" className="mb-4 text-sm font-semibold">
        {data.mapping_state === "missing"
          ? "No preparation record yet"
          : data.mapping_state === "stale"
            ? "Draft changed — recheck the previous preparation"
            : "Matches current draft"}{" "}
        · Latest preparation revision: {data.current_version}
      </p>
      {!editable && (
        <Notice className="mb-4" tone="warning">
          Preparation can be saved only for an assigned subject in draft/in-review while the
          publication safety lock is active. Restore/edit the draft first.
        </Notice>
      )}
      {conflict && (
        <div role="alert" className="mb-4">
          <Notice tone="warning" title="Latest draft required">
            {conflict} Your form has not overwritten any earlier record.
          </Notice>
        </div>
      )}
      <Button
        className="mb-5 h-auto max-w-full whitespace-normal"
        variant="outline"
        disabled={save.isPending}
        onClick={reload}
      >
        Reload latest (discard form changes)
      </Button>
      <form onSubmit={submit}>
        <fieldset disabled={disabled} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Curriculum unit
              <input
                className="study-input"
                required
                maxLength={160}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Curriculum topic
              <input
                className="study-input"
                required
                maxLength={160}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Learning outcomes (one per line)
            <textarea
              className="study-input min-h-28"
              required
              value={outcomes}
              onChange={(e) => setOutcomes(e.target.value)}
            />
            <span className="text-xs font-normal text-muted-foreground">
              Record 1–20 distinct outcomes for this item. A mapping is not proof of syllabus
              coverage or learner mastery.
            </span>
          </label>
          {sources.map((source, index) => (
            <fieldset key={index} className="grid gap-4 rounded-xl border border-border p-4">
              <legend className="px-1 text-sm font-bold">Reference {index + 1}</legend>
              <label className="grid gap-2 text-sm font-semibold">
                Citation {index + 1}
                <input
                  className="study-input"
                  required
                  maxLength={500}
                  value={source.citation}
                  onChange={(e) => updateSource(index, "citation", e.target.value)}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Edition or version {index + 1}
                  <input
                    className="study-input"
                    required
                    maxLength={160}
                    value={source.edition}
                    onChange={(e) => updateSource(index, "edition", e.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Page or section {index + 1}
                  <input
                    className="study-input"
                    required
                    maxLength={300}
                    value={source.section}
                    onChange={(e) => updateSource(index, "section", e.target.value)}
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                Source URL {index + 1}
                <input
                  className="study-input"
                  type="url"
                  placeholder="Optional HTTPS link; print references may leave this blank"
                  maxLength={2048}
                  value={source.url ?? ""}
                  onChange={(e) => updateSource(index, "url", e.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Source checked on {index + 1}
                <input
                  className="study-input"
                  type="date"
                  max={data.server_today}
                  value={source.checked_on ?? ""}
                  onChange={(e) => updateSource(index, "checked_on", e.target.value)}
                />
                <span className="text-xs font-normal text-muted-foreground">
                  Optional editor-recorded date. Leave blank when unknown; independent verification
                  is still pending.
                </span>
              </label>
              {sources.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSources((old) => old.filter((_, i) => i !== index))}
                >
                  Remove reference {index + 1}
                </Button>
              )}
            </fieldset>
          ))}
          {sources.length < 10 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setSources((old) => [...old, blankSource()])}
            >
              Add reference
            </Button>
          )}
          <label className="grid gap-2 text-sm font-semibold">
            Preparation note
            <textarea
              className="study-input min-h-20"
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={disabled}>
            {save.isPending ? "Saving preparation…" : "Save preparation revision"}
          </Button>
        </fieldset>
      </form>
      <details className="mt-6 border-t border-border pt-4">
        <summary className="cursor-pointer font-bold">Preparation history (latest 20)</summary>
        <p className="mt-2 text-xs text-muted-foreground">
          Earlier revisions are retained. History records editor preparation, not professional
          approval.
        </p>
        {!data.history.length ? (
          <p className="mt-3 text-sm">No earlier preparation records.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {data.history.map((record) => (
              <li key={record.id} className="rounded-lg bg-muted p-3 text-sm">
                <details>
                  <summary className="cursor-pointer font-semibold">
                    Preparation revision {record.version} ·{" "}
                    {new Date(record.created_at).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                    })}
                  </summary>
                  <p className="mt-2">
                    {record.evidence.unit} → {record.evidence.topic}
                  </p>
                  <ul className="my-2 list-disc pl-5">
                    {record.evidence.outcomes.map((outcome) => (
                      <li key={outcome}>{outcome}</li>
                    ))}
                  </ul>
                  {record.evidence.sources.map((source, i) => (
                    <p key={i} className="mb-2 break-words">
                      {source.citation} · {source.edition} · {source.section} · Check date:{" "}
                      {source.checked_on ?? "not recorded"}
                      {source.url && (
                        <>
                          {" "}
                          ·{" "}
                          <a
                            className="text-teal underline"
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Reference link
                          </a>
                        </>
                      )}
                    </p>
                  ))}
                  {record.evidence.note && <p>{record.evidence.note}</p>}
                </details>
              </li>
            ))}
          </ol>
        )}
      </details>
    </section>
  );
}
