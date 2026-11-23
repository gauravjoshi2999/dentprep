-- Apply after the compatible cycle UI is live. Preserve checkbox updates and history reads.
BEGIN;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.study_plans FROM PUBLIC,anon,authenticated;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.study_tasks FROM PUBLIC,anon,authenticated;
REVOKE INSERT(active,created_at,daily_hours,goals,id,length_days,start_date,user_id,weak_subject_ids),UPDATE(active,created_at,daily_hours,goals,id,length_days,start_date,user_id,weak_subject_ids) ON public.study_plans FROM PUBLIC,anon,authenticated;
REVOKE INSERT(day_index,done,done_at,id,lesson_id,minutes,plan_id,subject_id,task_date,task_type,title,user_id),UPDATE(day_index,done,done_at,id,lesson_id,minutes,plan_id,subject_id,task_date,task_type,title,user_id) ON public.study_tasks FROM PUBLIC,anon,authenticated;
GRANT UPDATE(done,done_at) ON public.study_tasks TO authenticated;
COMMIT;
