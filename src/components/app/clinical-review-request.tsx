import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ClipboardCheck, ClipboardCopy, MessageSquareText, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

type Recommendation = "changes_requested" | "needs_more_evidence" | "suitable_for_formal_review";

/**
 * Stores a CLAIMED professional opinion in a private, RLS-protected intake table.
 * Not a signature, authenticated professional identity, independent clinical review,
 * certification or permission to publish a clinical lesson.
 */
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
  const [open, setOpen] = useState(false);
  const [reviewer, setReviewer] = useState("");
  const [qualification, setQualification] = useState("");
  const [registration, setRegistration] = useState("");
  const [decision, setDecision] = useState<Recommendation>("changes_requested");
  const [feedback, setFeedback] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{ id: string; status: string } | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const requestId = useRef<string | null>(null);

  const valid =
    reviewer.trim().length >= 2 && qualification.trim().length >= 3 &&
    registration.trim().length >= 3 && feedback.trim().length >= 20 && consent;

  function editField(change: () => void) {
    change();
    requestId.current = null;
    setReceipt(null);
    setError("");
    setCopyState("idle");
  }

  const packet = () => [
    "DENTPREP — UNVERIFIED DENTAL REVIEW FEEDBACK (NOT APPROVAL)",
    `Subject: ${subject}`,
    `Reference: ${sourceTitle}`,
    `Edition: ${sourceEdition}`,
    `Publisher URL: ${sourceUrl}`,
    `Claimed reviewer: ${reviewer.trim() || "NOT PROVIDED"}`,
    `Claimed qualification / specialty: ${qualification.trim() || "NOT PROVIDED"}`,
    `Claimed council registration: ${registration.trim() || "NOT PROVIDED"}`,
    `Recommendation (not an approval): ${decision}`,
    `Source-specific correction: ${feedback.trim() || "NOT PROVIDED"}`,
    "Before publishing: independently verify reviewer identity, registration and specialty; match exact lesson/item version; resolve claims and complete all required academic gates.",
    "This worksheet never certifies content or changes its publication status.",
  ].join("\n");

  async function copyWorksheet() {
    try {
      await navigator.clipboard.writeText(packet());
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  async function submitFeedback() {
    if (!user || !valid || pending || receipt) return;
    setPending(true);
    setError("");
    try {
      // Stable on retries: duplicate POSTs are not separate reviewer decisions.
      requestId.current ??= crypto.randomUUID();
      const { data, error: insertError } = await supabase
        .from("clinical_feedback_submissions")
        .insert({
          submitted_by: user.id,
          client_submission_id: requestId.current,
          source_id: sourceId,
          subject_slug: subjectSlug,
          source_title: sourceTitle,
          source_edition: sourceEdition,
          source_url: sourceUrl,
          claimed_reviewer_name: reviewer.trim(),
          claimed_qualification: qualification.trim(),
          claimed_registration: registration.trim(),
          recommendation: decision,
          feedback: feedback.trim(),
        })
        .select("id,status")
        .single();
      if (insertError) throw insertError;
      if (!data || data.status !== "pending_verification") {
        throw new Error("The receipt did not confirm pending verification.");
      }
      setReceipt({ id: data.id, status: data.status });
    } catch {
      // Avoid showing internal database errors, keys or authentication details.
      setError("Submission could not be confirmed. Check your sign-in and try again. No clinical approval has been issued.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-5 rounded-xl border border-border p-4" aria-label={`Senior MDS feedback for ${subject}`}>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left text-sm font-bold text-teal"
      >
        <span className="flex items-center gap-2"><MessageSquareText className="h-4 w-4" /> Submit senior dentist feedback</span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            A signed-in learner may submit feedback from a consenting dental reviewer. Details below
            are self-reported, stored privately and automatically marked Pending verification.
            This is not a verified MDS sign-off; clinical lessons remain blocked until separate approval.
            Do not enter any patient name, photo, records or other patient-identifiable information.
          </p>
          <label className="block text-sm font-semibold">
            Claimed reviewer's name
            <input className="study-input mt-1 w-full" value={reviewer} maxLength={160}
              onChange={e => editField(() => setReviewer(e.target.value))} placeholder="Name provided by the reviewer" />
          </label>
          <label className="block text-sm font-semibold">
            Qualification and specialty
            <input className="study-input mt-1 w-full" value={qualification} maxLength={160}
              onChange={e => editField(() => setQualification(e.target.value))} placeholder="For example: MDS (Oral Surgery)" />
          </label>
          <label className="block text-sm font-semibold">
            Council registration for private verification
            <input className="study-input mt-1 w-full" value={registration} maxLength={160}
              onChange={e => editField(() => setRegistration(e.target.value))} placeholder="Council and registration number" />
          </label>
          <label className="block text-sm font-semibold">
            Recommendation
            <select className="study-input mt-1 w-full" value={decision}
              onChange={e => editField(() => setDecision(e.target.value as Recommendation))}>
              <option value="changes_requested">Changes requested</option>
              <option value="needs_more_evidence">Need additional evidence</option>
              <option value="suitable_for_formal_review">Suitable for formal independent review</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Corrections, claim IDs and exact source sections
            <textarea className="study-input mt-1 min-h-28 w-full" value={feedback} maxLength={5000}
              onChange={e => editField(() => setFeedback(e.target.value))}
              placeholder="At least 20 characters. Include exact source section, issue and correction. No patient details." />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-teal" checked={consent}
              onChange={e => editField(() => setConsent(e.target.checked))} />
            <span>I have the reviewer's consent to submit these details, and this feedback contains no patient information.</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {user ? (
              <button type="button" disabled={!valid || pending || !!receipt}
                onClick={() => void submitFeedback()}
                className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-bold text-teal-foreground disabled:cursor-not-allowed disabled:opacity-50">
                <Send className="h-4 w-4" /> {pending ? "Submitting…" : receipt ? "Feedback submitted" : "Submit feedback"}
              </button>
            ) : (
              <Link to="/login" className="rounded-lg bg-teal px-4 py-2.5 text-sm font-bold text-teal-foreground">
                Sign in to submit
              </Link>
            )}
            <button type="button" onClick={() => void copyWorksheet()}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-bold">
              {copyState === "copied" ? <ClipboardCheck className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
              Copy worksheet
            </button>
          </div>
          {receipt && (
            <p role="status" className="text-sm font-semibold text-teal">
              Feedback received · Pending independent verification · Receipt {receipt.id}
            </p>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {copyState === "copied" && <p role="status" className="text-xs">Worksheet copied. Copying is not submission or approval.</p>}
          {copyState === "error" && <p role="alert" className="text-xs">Clipboard unavailable. Use Submit after sign-in.</p>}
        </div>
      )}
    </section>
  );
}
