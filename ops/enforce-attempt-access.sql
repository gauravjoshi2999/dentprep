-- Contract phase: apply only after the compatible main release is verified live.
-- No rows are changed. Trusted admin review uses the permission-checked RPC.
BEGIN;
REVOKE SELECT ON public.questions,public.test_answers FROM PUBLIC,anon,authenticated;
-- Remove any existing per-column grants too; a table-level REVOKE alone cannot do so.
REVOKE SELECT(explanation,source_note) ON public.questions FROM PUBLIC,anon,authenticated;
REVOKE SELECT(is_correct) ON public.test_answers FROM PUBLIC,anon,authenticated;
GRANT SELECT(id,subject_id,topic,stem,difficulty,status,created_at,updated_at) ON public.questions TO anon,authenticated;
GRANT SELECT(id,attempt_id,user_id,question_id,selected_option_id,answered_at) ON public.test_answers TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
