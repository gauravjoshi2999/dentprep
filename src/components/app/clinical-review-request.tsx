import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ClipboardCopy, ClipboardCheck, MessageSquareText, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  reviewQuestions, REVIEW_CHOICES, serializeGuidedReview,
  type ReviewAnswer,
} from "@/lib/clinical-review-questions";
import { ReviewerProfileEditor, type ClaimedReviewerProfile } from "./reviewer-profile-editor";

type Recommendation = "changes_requested" | "needs_more_evidence" | "suitable_for_formal_review";
type Answer = { answer: ReviewAnswer; note: string };

export function ClinicalReviewRequest({
  subject,
  subjectSlug,
  sourceId,
  sourceTitle,
  sourceEdition,
  sourceUrl,
}: {
  subject: string;
  subjectSlug: string;
  sourceId: string;
  sourceTitle: string;
  sourceEdition: string;
  sourceUrl: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profileKey = ["dentprep-reviewer-profile", user?.id ?? "guest"];
  const [open, setOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [locator, setLocator] = useState("");
  const [summary, setSummary] = useState("");
  const [decision, setDecision] = useState<Recommendation>("changes_requested");
  const [reviewedToday, setReviewedToday] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{ id: string; status: string } | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const requestId = useRef<string | null>(null);
  const questions = reviewQuestions(sourceId);

  const profileQuery = useQuery({
    queryKey: profileKey,
    enabled: open && !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error: queryError } = await supabase.from("clinical_reviewer_profiles")
        .select("owner_user_id,claimed_name,claimed_qualification,claimed_registration,consent_confirmed")
        .eq("owner_user_id", user?.id ?? "")
        .maybeSingle();
      if (queryError) throw queryError;
      return data;
    },
  });
  const profile = profileQuery.data ?? null;

  const answeredCount = questions.filter(q => !!answers[q.id]?.answer).length;
  const missingReasons = questions.filter(q => {
    const a = answers[q.id];
    return a?.answer && a.answer !== "ok" && a.note.trim().length < 8;
  });
  const complete = answeredCount === questions.length && missingReasons.length === 0;
  const note = complete
    ? serializeGuidedReview(sourceTitle, sourceEdition, locator, questions, answers, summary)
    : "";
  const canSubmit = !!user && !!profile && profile.consent_confirmed && complete &&
    locator.trim().length >= 5 && reviewedToday && note.length >= 20 &&
    note.length <= 5000 && !pending && !receipt;

  const invalidateForm = () => {
    requestId.current = null;
    setError("");
    setReceipt(null);
    setCopyState("idle");
  };
  const updateAnswer = (id: string, change: Partial<Answer>) => {
    setAnswers(previous => ({
      ...previous,
      [id]: { answer: previous[id]?.answer ?? "ok", note: previous[id]?.note ?? "", ...change },
    }));
    invalidateForm();
  };

  async function submit() {
    if (!canSubmit || !profile || !user) return;
    setPending(true);
    setError("");
    try {
      requestId.current ??= crypto.randomUUID();
      const { data, error: insertError } = await supabase.from("clinical_feedback_submissions")
        .insert({
          submitted_by: user.id,
          client_submission_id: requestId.current,
          source_id: sourceId,
          subject_slug: subjectSlug,
          source_title: sourceTitle,
          source_edition: sourceEdition,
          source_url: sourceUrl,
          claimed_reviewer_name: profile.claimed_name,
          claimed_qualification: profile.claimed_qualification,
          claimed_registration: profile.claimed_registration,
          recommendation: decision,
          feedback: note,
        })
        .select("id,status")
        .single();
      if (insertError) throw insertError;
      if (!data || data.status !== "pending_verification") throw new Error("No pending receipt");
      setReceipt({ id: data.id, status: data.status });
    } catch {
      setError("Feedback submit की पुष्टि नहीं हो सकी। Login/permissions जाँचें। कोई clinical approval नहीं दिया गया है।");
    } finally {
      setPending(false);
    }
  }

  async function copyWorksheet() {
    const lines = [
      "DENTPREP GUIDED DENTAL REVIEW · NOT A CLINICAL SIGN-OFF",
      `Subject: ${subject}`,
      `Publisher reference under review: ${sourceTitle}`,
      `Edition: ${sourceEdition}`,
      `Source URL: ${sourceUrl}`,
      `Reviewer: ${profile?.claimed_name ?? "(one-time profile not yet saved)"}`,
      `Exact page/section: ${locator || "(please specify)"}`,
      ...questions.map((q, i) => {
        const a = answers[q.id];
        return `Q${i + 1}. ${q.question}\nAnswer: ${a?.answer ?? "NOT ANSWERED"}\nReason: ${a?.note ?? ""}`;
      }),
      `Other corrections: ${summary}`,
      "Source reading feedback only. Does not cover unpublished DentPrep lesson/MCQ/case content.",
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  const showProfileForm = !!user && (editingProfile || (!profile && !profileQuery.isPending && !profileQuery.isError));

  return (
    <section className="mt-5 rounded-xl border border-border p-4" aria-label={`Senior dentist guided feedback for ${subject}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-2 text-left text-sm font-bold text-teal"
      >
        <span className="flex items-center gap-2">
          <MessageSquareText className="h-4 w-4" /> Doctor guided feedback · {subject}
        </span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-5">
          <section className="rounded-xl bg-muted/60 p-4" aria-label="Exact reference under review">
            <h3 className="font-bold">डॉक्टर को किसका review करना है?</h3>
            <p className="mt-1 text-sm"><strong>Subject:</strong> {subject}</p>
            <p className="mt-1 text-sm"><strong>Document:</strong> {sourceTitle}</p>
            <p className="mt-1 text-sm"><strong>Version:</strong> {sourceEdition}</p>
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
              className="mt-2 block break-all text-sm font-semibold text-teal underline">
              Original publisher reference खोलें
            </a>
            <p className="mt-2 text-sm text-muted-foreground">
              महत्वपूर्ण: अभी केवल इस official source reading का review है।
              Unpublished DentPrep lesson, MCQ या case का actual draft यहाँ उपलब्ध नहीं है;
              उसके लिए अलग exact-version clinical review जरूरी है।
            </p>
          </section>

          {!user && (
            <p className="text-sm"><Link to="/login" className="font-bold text-teal underline">Sign in</Link> करें ताकि reviewer profile और feedback securely save हो।</p>
          )}
          {user && profileQuery.isPending && <p className="text-sm">Saved reviewer profile खोज रहे हैं…</p>}
          {user && profileQuery.isError && (
            <p role="alert" className="text-sm text-destructive">
              Reviewer profile load नहीं हो सका। Database permissions जाँचें। आगे submit अभी बंद है।
            </p>
          )}
          {showProfileForm && (
            <ReviewerProfileEditor
              userId={user!.id}
              existing={profile}
              onSaved={(saved: ClaimedReviewerProfile) => {
                queryClient.setQueryData(profileKey, saved);
                setEditingProfile(false);
                invalidateForm();
              }}
              onCancel={profile ? () => setEditingProfile(false) : undefined}
            />
          )}
          {profile && !editingProfile && (
            <section className="rounded-xl border border-border p-4" aria-label="Saved reviewer profile">
              <h3 className="font-bold">Step 1 — डॉक्टर की Saved Profile</h3>
              <p className="mt-1 text-sm"><strong>{profile.claimed_name}</strong> · {profile.claimed_qualification}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                यह नाम हर नए subject पर अपने-आप आएगा। Registration independently verify होना बाकी है।
              </p>
              <button type="button" className="mt-2 text-sm font-bold text-teal underline"
                onClick={() => setEditingProfile(true)}>Edit reviewer profile</button>
            </section>
          )}

          <fieldset className="rounded-xl border border-border p-4">
            <legend className="px-2 text-sm font-bold">Step 2 — डॉक्टर से जरूरी सवाल ({answeredCount}/{questions.length})</legend>
            <p className="mb-4 text-sm text-muted-foreground">
              हर प्रश्न में एक उत्तर चुनें। 'सुधार', 'प्रमाण नहीं' या 'लागू नहीं' पर कारण लिखना जरूरी है।
              जवाबों में वास्तविक patient details या prescription शामिल न करें।
            </p>
            <label className="mb-4 grid gap-1 text-sm font-semibold">
              Original source का exact page, heading या section
              <input className="study-input" aria-label="Exact source section or page"
                value={locator} maxLength={180}
                onChange={e => { setLocator(e.target.value); invalidateForm(); }}
                placeholder="उदाहरण: Page 2 / Clinical pathway / Section 1.3" />
            </label>
            <div className="space-y-4">
              {questions.map((question, index) => {
                const result = answers[question.id];
                const needsNote = result?.answer && result.answer !== "ok";
                return (
                  <fieldset key={question.id} data-review-question={question.id} className="rounded-xl border border-border bg-muted/30 p-3">
                    <legend className="px-1 text-sm font-bold">{`Q${index + 1}. ${question.question}`}</legend>
                    <p className="mb-2 text-xs text-muted-foreground">{question.section} · {question.guidance}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {REVIEW_CHOICES.map(choice => (
                        <label key={choice.id} className="flex items-center gap-1.5 text-sm">
                          <input type="radio" name={`${sourceId}-${question.id}`}
                            value={choice.id}
                            checked={result?.answer === choice.id}
                            onChange={() => updateAnswer(question.id, { answer: choice.id })}
                            className="accent-teal" />
                          {choice.label}
                        </label>
                      ))}
                    </div>
                    <label className="mt-3 grid gap-1 text-xs font-semibold">
                      {needsNote ? "कौन सा सुधार/प्रमाण/कारण? (जरूरी)" : "Specific source section / note (optional)"}
                      <textarea aria-label={`Q${index + 1} reviewer note`} className="study-input min-h-16"
                        value={result?.note ?? ""} maxLength={150}
                        onChange={e => updateAnswer(question.id, { note: e.target.value })}
                        placeholder="Reference section, concern, specific correction…" />
                    </label>
                    {needsNote && (result?.note.trim().length ?? 0) < 8 && (
                      <p className="mt-1 text-xs text-destructive">कम से कम 8 अक्षरों में कारण लिखें।</p>
                    )}
                  </fieldset>
                );
              })}
            </div>
            <label className="mt-4 grid gap-1 text-sm font-semibold">
              कोई और सुधार, छूटा topic या सलाह?
              <textarea value={summary} maxLength={350} className="study-input min-h-20"
                onChange={e => { setSummary(e.target.value); invalidateForm(); }}
                placeholder="यदि सब ठीक है तो खाली छोड़ सकते हैं" />
            </label>
          </fieldset>

          <fieldset className="rounded-xl border border-border p-4">
            <legend className="px-2 text-sm font-bold">Step 3 — निष्कर्ष और Submit</legend>
            <label className="grid gap-1 text-sm font-semibold">
              Doctor की recommendation (यह automatic approval नहीं है)
              <select className="study-input" aria-label="Review recommendation" value={decision}
                onChange={e => { setDecision(e.target.value as Recommendation); invalidateForm(); }}>
                <option value="changes_requested">सुधार जरूरी</option>
                <option value="needs_more_evidence">अधिक source evidence चाहिए</option>
                <option value="suitable_for_formal_review">Formal independent review के लिए तैयार</option>
              </select>
            </label>
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-teal" checked={reviewedToday}
                onChange={e => { setReviewedToday(e.target.checked); invalidateForm(); }}
                aria-label="Doctor reviewed this exact source" />
              <span>डॉक्टर ने इस reference/version पर आज feedback दिया है और इन जवाबों को submit करने की सहमति दी है।</span>
            </label>
            <p className="mt-3 text-xs text-muted-foreground">
              {questions.length - answeredCount} सवाल बचे हैं · {missingReasons.length} जवाबों में कारण बाकी है।
              Submission केवल Pending verification बनेगा। कोई clinical lesson automatically publish नहीं होगा।
            </p>
            {note.length > 5000 && <p role="alert" className="text-sm text-destructive">Feedback बहुत बड़ा है; कुछ notes छोटे करें।</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {user ? (
                <button type="button" disabled={!canSubmit} onClick={() => void submit()}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-bold text-teal-foreground disabled:cursor-not-allowed disabled:opacity-50">
                  <Send className="h-4 w-4" /> {pending ? "Submitting…" : receipt ? "Feedback submitted" : "Submit completed feedback"}
                </button>
              ) : (
                <Link to="/login" className="rounded-lg bg-teal px-4 py-2.5 text-sm font-bold text-teal-foreground">Sign in to submit</Link>
              )}
              <button type="button" onClick={() => void copyWorksheet()}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold">
                {copyState === "copied" ? <ClipboardCheck className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                Copy full question sheet
              </button>
            </div>
            {receipt && <p role="status" className="mt-3 text-sm font-semibold text-teal">
              Feedback received · Pending independent verification · Receipt {receipt.id}
            </p>}
            {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
            {copyState === "copied" && <p role="status" className="mt-2 text-xs">सवालों की कॉपी तैयार है। Copy करना submission नहीं है।</p>}
            {copyState === "error" && <p role="alert" className="mt-2 text-xs">Clipboard unavailable; form को सीधे submit कर सकते हैं।</p>}
          </fieldset>
        </div>
      )}
    </section>
  );
}
