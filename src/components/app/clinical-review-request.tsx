import { useState } from "react";
import { ClipboardCopy, ClipboardCheck, MessageSquareText } from "lucide-react";

/**
 * A portable clinical-review worksheet, NOT a clinical approval or submission.
 * No reviewer personal data is written to DentPrep, localStorage or URL.
 * A trusted administrator must verify credentials, source/claim coverage and
 * the applicable release gates before any clinical material is published.
 */
export function ClinicalReviewRequest({
  subject,
  sourceTitle,
  sourceUrl,
}: {
  subject: string;
  sourceTitle: string;
  sourceUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [reviewer, setReviewer] = useState("");
  const [qualification, setQualification] = useState("");
  const [registration, setRegistration] = useState("");
  const [decision, setDecision] = useState("changes_requested");
  const [feedback, setFeedback] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const handleCopy = async () => {
    const packet = [
      "DENTPREP — CLINICAL SOURCE REVIEW REQUEST (UNVERIFIED)",
      `Subject: ${subject}`,
      `Reference: ${sourceTitle}`,
      `Publisher URL: ${sourceUrl}`,
      `Reviewer: ${reviewer.trim() || "NOT PROVIDED"}`,
      `Qualification / specialty: ${qualification.trim() || "NOT PROVIDED"}`,
      `Registration council and number: ${registration.trim() || "NOT PROVIDED"}`,
      `Proposed decision (NOT VERIFIED): ${decision}`,
      `Review comments / citation or claim corrections: ${feedback.trim() || "NOT PROVIDED"}`,
      "Required follow-up: verify reviewer identity and relevant specialty, exact item/version, claim-level sources, accuracy and 20 educational checks in the authorized admin workflow.",
      "Copying this worksheet does not submit, authorize, approve, or publish clinical content.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(packet);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-border p-4" aria-label="Senior MDS clinical review request">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left text-sm font-bold text-teal"
      >
        <span className="flex items-center gap-2"><MessageSquareText className="h-4 w-4" /> Prepare senior MDS feedback form</span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Use this worksheet while studying with a senior dentist. It is not a verified MDS sign-off,
            and no feedback is automatically sent or saved. Do not enter patient-identifiable information.
          </p>
          <label className="block text-sm font-semibold">Reviewer's name
            <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} className="study-input mt-1 w-full" placeholder="As stated by reviewer" />
          </label>
          <label className="block text-sm font-semibold">Qualification and relevant specialty
            <input value={qualification} onChange={(e) => setQualification(e.target.value)} className="study-input mt-1 w-full" placeholder="e.g. MDS (specialty)" />
          </label>
          <label className="block text-sm font-semibold">Registration council and number
            <input value={registration} onChange={(e) => setRegistration(e.target.value)} className="study-input mt-1 w-full" placeholder="For independent verification" />
          </label>
          <label className="block text-sm font-semibold">Review recommendation
            <select value={decision} onChange={(e) => setDecision(e.target.value)} className="study-input mt-1 w-full">
              <option value="changes_requested">Changes requested</option>
              <option value="needs_more_evidence">Needs additional source evidence</option>
              <option value="suitable_for_formal_review">Suitable for formal approval review</option>
            </select>
          </label>
          <label className="block text-sm font-semibold">Specific corrections and source sections
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} className="study-input mt-1 min-h-28 w-full" placeholder="Claim, page/section, correction and rationale. No patient details." />
          </label>
          <button type="button" onClick={() => void handleCopy()} className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-bold text-teal-foreground">
            {copyState === "copied" ? <ClipboardCheck className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            Copy review worksheet
          </button>
          {copyState === "copied" && <p role="status" className="text-xs">Copied. Share with an authorized DentPrep content administrator for verified review.</p>}
          {copyState === "error" && <p role="alert" className="text-xs">Clipboard access failed. Please use a secure method to share feedback.</p>}
        </div>
      )}
    </div>
  );
}
