import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ClaimedReviewerProfile = Pick<
  Tables<"clinical_reviewer_profiles">,
  "owner_user_id" | "claimed_name" | "claimed_qualification" | "claimed_registration" | "consent_confirmed"
>;

/** One-time self-reported profile. This form cannot credential-verify or certify a doctor. */
export function ReviewerProfileEditor({
  userId,
  existing,
  onSaved,
  onCancel,
}: {
  userId: string;
  existing: ClaimedReviewerProfile | null;
  onSaved: (profile: ClaimedReviewerProfile) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(existing?.claimed_name ?? "");
  const [qualification, setQualification] = useState(existing?.claimed_qualification ?? "");
  const [registration, setRegistration] = useState(existing?.claimed_registration ?? "");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const valid = name.trim().length >= 2 && qualification.trim().length >= 3 &&
    registration.trim().length >= 3 && consent;

  const save = async () => {
    if (!valid || saving) return;
    setError("");
    setSaving(true);
    try {
      const { data, error: dbError } = await supabase.from("clinical_reviewer_profiles")
        .upsert({
          owner_user_id: userId,
          claimed_name: name.trim(),
          claimed_qualification: qualification.trim(),
          claimed_registration: registration.trim(),
          consent_confirmed: true,
        }, { onConflict: "owner_user_id" })
        .select("owner_user_id,claimed_name,claimed_qualification,claimed_registration,consent_confirmed")
        .single();
      if (dbError) throw dbError;
      if (!data || data.owner_user_id !== userId) throw new Error("Missing saved profile receipt");
      onSaved(data);
    } catch {
      setError("Reviewer profile save नहीं हुआ। Login और database permissions जाँचें।");
    } finally {
      setSaving(false);
    }
  };

  return (
    <fieldset className="rounded-xl border border-border bg-muted/40 p-4">
      <legend className="px-2 text-sm font-bold">Step 1 — डॉक्टर की जानकारी सिर्फ एक बार</legend>
      <p className="mb-3 text-sm text-muted-foreground">
        यही एक प्रोफाइल आगे के सभी subjects के review में अपने आप आएगी।
        बदलाव होने पर प्रोफाइल edit कर सकते हैं। जानकारी अभी independently verified नहीं है।
      </p>
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm font-semibold">
          Doctor's name
          <input aria-label="Doctor's name" className="study-input" value={name} maxLength={160}
            onChange={e => setName(e.target.value)} placeholder="Senior reviewer का नाम" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          MDS qualification / relevant specialty
          <input aria-label="MDS qualification / relevant specialty" className="study-input" value={qualification}
            maxLength={160} onChange={e => setQualification(e.target.value)}
            placeholder="Degree और specialty (जैसे MDS Oral Surgery)" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Dental council and registration number
          <input aria-label="Dental council and registration number" className="study-input"
            value={registration} maxLength={160} onChange={e => setRegistration(e.target.value)}
            placeholder="Council + registration" />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
            aria-label="Consent to save reviewer profile" className="mt-1 h-4 w-4 accent-teal" />
          <span>डॉक्टर की सहमति से ये विवरण भविष्य की feedback submissions में reuse करूँगा/करूँगी;
            patient-identifiable details नहीं डालूँगा/डालूँगी।</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!valid || saving} onClick={() => void save()}
            className="rounded-lg bg-teal px-4 py-2.5 text-sm font-bold text-teal-foreground disabled:opacity-50">
            {saving ? "Saving…" : existing ? "Update reviewer profile" : "Save reviewer profile once"}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="rounded-lg border border-border px-4 py-2.5 text-sm">Cancel</button>
          )}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    </fieldset>
  );
}
