-- ===== Enums =====
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.content_status AS ENUM ('draft', 'in_review', 'published', 'archived');
CREATE TYPE public.difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- ===== Shared trigger: updated_at =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== Profiles =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  college text,
  state text,
  target_date date,
  daily_hours numeric(4,1) NOT NULL DEFAULT 2,
  goals text[] NOT NULL DEFAULT '{}',
  weak_subject_ids uuid[] NOT NULL DEFAULT '{}',
  onboarded boolean NOT NULL DEFAULT false,
  theme text NOT NULL DEFAULT 'light',
  voice_consent boolean NOT NULL DEFAULT false,
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
          NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== Roles =====
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ===== Content: subjects =====
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  short_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'tooth',
  sort_order int NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  objectives text[] NOT NULL DEFAULT '{}',
  notes_md text NOT NULL DEFAULT '',
  high_yield text[] NOT NULL DEFAULT '{}',
  clinical_example text NOT NULL DEFAULT '',
  viva_prompts text[] NOT NULL DEFAULT '{}',
  "references" text[] NOT NULL DEFAULT '{}',
  reviewed_on date,
  review_note text NOT NULL DEFAULT '',
  est_minutes int NOT NULL DEFAULT 15,
  sort_order int NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id, slug)
);
CREATE INDEX lessons_subject_idx ON public.lessons(subject_id);

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic text NOT NULL DEFAULT 'General',
  stem text NOT NULL,
  difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  explanation text NOT NULL DEFAULT '',
  source_note text NOT NULL DEFAULT 'Original DentPrep practice question',
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX questions_subject_idx ON public.questions(subject_id);

CREATE TABLE public.answer_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  label text NOT NULL,
  body text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX answer_options_q_idx ON public.answer_options(question_id);

CREATE TABLE public.clinical_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  presentation text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_learning text[] NOT NULL DEFAULT '{}',
  red_flags text[] NOT NULL DEFAULT '{}',
  "references" text[] NOT NULL DEFAULT '{}',
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.recruitment_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  advt_no text,
  vacancy_no text,
  posts int,
  summary text NOT NULL DEFAULT '',
  key_facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  official_url text NOT NULL,
  source_url text,
  published_on date,
  opens_on date,
  closing_at timestamptz,
  verified_on date,
  verification_note text NOT NULL DEFAULT '',
  is_official boolean NOT NULL DEFAULT true,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.content_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  citation text NOT NULL,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_sources_entity_idx ON public.content_sources(entity_type, entity_id);

CREATE TABLE public.content_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  from_status public.content_status,
  to_status public.content_status NOT NULL,
  note text NOT NULL DEFAULT '',
  reviewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_reviews_entity_idx ON public.content_reviews(entity_type, entity_id);

-- Grants for content
GRANT SELECT ON public.subjects, public.lessons, public.questions, public.answer_options, public.clinical_cases, public.recruitment_notices, public.content_sources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects, public.lessons, public.questions, public.answer_options, public.clinical_cases, public.recruitment_notices, public.content_sources TO authenticated;
GRANT SELECT, INSERT ON public.content_reviews TO authenticated;
GRANT ALL ON public.subjects, public.lessons, public.questions, public.answer_options, public.clinical_cases, public.recruitment_notices, public.content_sources, public.content_reviews TO service_role;

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reviews ENABLE ROW LEVEL SECURITY;

-- Public read of published content; admin full access
CREATE POLICY "Published subjects readable" ON public.subjects FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins read subjects" ON public.subjects FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write subjects" ON public.subjects FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Published lessons readable" ON public.lessons FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins read lessons" ON public.lessons FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write lessons" ON public.lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Published questions readable" ON public.questions FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins read questions" ON public.questions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write questions" ON public.questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Options of published questions readable" ON public.answer_options FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND q.status = 'published'));
CREATE POLICY "Admins read options" ON public.answer_options FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write options" ON public.answer_options FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Published cases readable" ON public.clinical_cases FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins read cases" ON public.clinical_cases FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write cases" ON public.clinical_cases FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Published notices readable" ON public.recruitment_notices FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admins read notices" ON public.recruitment_notices FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write notices" ON public.recruitment_notices FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sources readable" ON public.content_sources FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write sources" ON public.content_sources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read reviews" ON public.content_reviews FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add reviews" ON public.content_reviews FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND reviewer_id = auth.uid());

CREATE TRIGGER subjects_updated BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER lessons_updated BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER questions_updated BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER cases_updated BEFORE UPDATE ON public.clinical_cases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER notices_updated BEFORE UPDATE ON public.recruitment_notices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Automatic review trail on status change
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.content_reviews (entity_type, entity_id, from_status, to_status, note, reviewer_id)
    VALUES (TG_ARGV[0], NEW.id, CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END, NEW.status,
            CASE WHEN TG_OP = 'INSERT' THEN 'Created' ELSE 'Status changed' END, auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER subjects_status_log AFTER INSERT OR UPDATE OF status ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.log_status_change('subject');
CREATE TRIGGER lessons_status_log AFTER INSERT OR UPDATE OF status ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.log_status_change('lesson');
CREATE TRIGGER questions_status_log AFTER INSERT OR UPDATE OF status ON public.questions FOR EACH ROW EXECUTE FUNCTION public.log_status_change('question');
CREATE TRIGGER cases_status_log AFTER INSERT OR UPDATE OF status ON public.clinical_cases FOR EACH ROW EXECUTE FUNCTION public.log_status_change('case');
CREATE TRIGGER notices_status_log AFTER INSERT OR UPDATE OF status ON public.recruitment_notices FOR EACH ROW EXECUTE FUNCTION public.log_status_change('notice');

-- ===== Private user data =====
CREATE TABLE public.attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('practice','daily','revision','custom','subject','mock')),
  title text NOT NULL DEFAULT 'Practice',
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  question_ids uuid[] NOT NULL DEFAULT '{}',
  total int NOT NULL DEFAULT 0,
  answered int NOT NULL DEFAULT 0,
  correct int NOT NULL DEFAULT 0,
  score_pct numeric(5,2),
  timed boolean NOT NULL DEFAULT false,
  time_limit_sec int,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted')),
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  duration_sec int
);
CREATE INDEX attempts_user_idx ON public.attempts(user_id, started_at DESC);

CREATE TABLE public.test_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id uuid REFERENCES public.answer_options(id) ON DELETE SET NULL,
  is_correct boolean NOT NULL DEFAULT false,
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);
CREATE INDEX test_answers_user_idx ON public.test_answers(user_id);

GRANT SELECT, DELETE ON public.attempts, public.test_answers TO authenticated;
GRANT ALL ON public.attempts, public.test_answers TO service_role;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own attempts read" ON public.attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own attempts delete" ON public.attempts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own answers read" ON public.test_answers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own answers delete" ON public.test_answers FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('general','clinical','emergency','full_mock','english')),
  duration_min int NOT NULL DEFAULT 15 CHECK (duration_min IN (5,15,30)),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  question_count int NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
CREATE INDEX interview_sessions_user_idx ON public.interview_sessions(user_id, started_at DESC);

CREATE TABLE public.interview_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall numeric(4,1),
  summary text NOT NULL DEFAULT '',
  strengths text[] NOT NULL DEFAULT '{}',
  improvements text[] NOT NULL DEFAULT '{}',
  improved_answer text NOT NULL DEFAULT '',
  revision_topics text[] NOT NULL DEFAULT '{}',
  safety_flags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_requests_user_idx ON public.ai_requests(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions, public.interview_feedback TO authenticated;
GRANT SELECT, INSERT ON public.ai_requests TO authenticated;
GRANT ALL ON public.interview_sessions, public.interview_feedback, public.ai_requests TO service_role;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own sessions all" ON public.interview_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own feedback all" ON public.interview_feedback FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own ai requests read" ON public.ai_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own ai requests insert" ON public.ai_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('lesson','question','case')),
  item_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);

CREATE TABLE public.study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  length_days int NOT NULL CHECK (length_days IN (7,15,30)),
  start_date date NOT NULL,
  daily_hours numeric(4,1) NOT NULL DEFAULT 2,
  goals text[] NOT NULL DEFAULT '{}',
  weak_subject_ids uuid[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.study_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  day_index int NOT NULL,
  task_date date NOT NULL,
  task_type text NOT NULL CHECK (task_type IN ('lesson','practice','revision','interview','case','test')),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  title text NOT NULL,
  minutes int NOT NULL DEFAULT 30,
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz
);
CREATE INDEX study_tasks_user_date_idx ON public.study_tasks(user_id, task_date);

CREATE TABLE public.topic_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE public.revision_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  interval_days int NOT NULL DEFAULT 1,
  repetitions int NOT NULL DEFAULT 0,
  lapses int NOT NULL DEFAULT 0,
  last_result boolean,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

CREATE TABLE public.daily_activity (
  user_id uuid NOT NULL,
  day date NOT NULL,
  actions int NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, day)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks, public.study_plans, public.study_tasks, public.topic_progress, public.revision_schedule, public.daily_activity TO authenticated;
GRANT ALL ON public.bookmarks, public.study_plans, public.study_tasks, public.topic_progress, public.revision_schedule, public.daily_activity TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own bookmarks" ON public.bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own plans" ON public.study_plans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own tasks" ON public.study_tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own topic progress" ON public.topic_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own revision" ON public.revision_schedule FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own activity" ON public.daily_activity FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== RPCs =====
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.daily_activity (user_id, day, actions)
  VALUES (auth.uid(), (now() AT TIME ZONE 'Asia/Kolkata')::date, 1)
  ON CONFLICT (user_id, day) DO UPDATE SET actions = public.daily_activity.actions + 1;
END; $$;

CREATE OR REPLACE FUNCTION public.start_attempt(p_mode text, p_title text, p_subject_id uuid, p_question_ids uuid[], p_time_limit_sec int)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_ids uuid[];
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT array_agg(q.id ORDER BY array_position(p_question_ids, q.id)) INTO v_ids
  FROM public.questions q WHERE q.id = ANY(p_question_ids) AND q.status = 'published';
  IF v_ids IS NULL OR array_length(v_ids, 1) = 0 THEN RAISE EXCEPTION 'No published questions selected'; END IF;
  IF array_length(v_ids, 1) > 100 THEN RAISE EXCEPTION 'Too many questions'; END IF;
  INSERT INTO public.attempts (user_id, mode, title, subject_id, question_ids, total, timed, time_limit_sec)
  VALUES (auth.uid(), p_mode, left(coalesce(p_title, 'Practice'), 120), p_subject_id, v_ids, array_length(v_ids, 1),
          p_time_limit_sec IS NOT NULL AND p_time_limit_sec > 0, NULLIF(p_time_limit_sec, 0))
  RETURNING id INTO v_id;
  PERFORM public.log_activity();
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.record_answer(p_attempt_id uuid, p_question_id uuid, p_option_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.attempts; v_correct boolean; v_correct_id uuid; v_expl text;
BEGIN
  SELECT * INTO a FROM public.attempts WHERE id = p_attempt_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  IF a.status <> 'in_progress' THEN RAISE EXCEPTION 'Attempt already submitted'; END IF;
  IF NOT (p_question_id = ANY(a.question_ids)) THEN RAISE EXCEPTION 'Question not in this attempt'; END IF;
  IF a.mode IN ('practice','daily','revision') AND EXISTS (SELECT 1 FROM public.test_answers WHERE attempt_id = p_attempt_id AND question_id = p_question_id) THEN
    RAISE EXCEPTION 'Already answered';
  END IF;
  SELECT is_correct INTO v_correct FROM public.answer_options WHERE id = p_option_id AND question_id = p_question_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Option does not belong to question'; END IF;
  INSERT INTO public.test_answers (attempt_id, user_id, question_id, selected_option_id, is_correct)
  VALUES (p_attempt_id, auth.uid(), p_question_id, p_option_id, v_correct)
  ON CONFLICT (attempt_id, question_id) DO UPDATE SET selected_option_id = EXCLUDED.selected_option_id, is_correct = EXCLUDED.is_correct, answered_at = now();
  IF a.mode IN ('practice','daily','revision') THEN
    SELECT id INTO v_correct_id FROM public.answer_options WHERE question_id = p_question_id AND is_correct LIMIT 1;
    SELECT explanation INTO v_expl FROM public.questions WHERE id = p_question_id;
    RETURN jsonb_build_object('is_correct', v_correct, 'correct_option_id', v_correct_id, 'explanation', v_expl);
  END IF;
  RETURN jsonb_build_object('saved', true);
END; $$;

CREATE OR REPLACE FUNCTION public.submit_attempt(p_attempt_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.attempts; v_answered int; v_correct int; v_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date; r record;
BEGIN
  SELECT * INTO a FROM public.attempts WHERE id = p_attempt_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF;
  IF a.status = 'submitted' THEN
    RETURN jsonb_build_object('total', a.total, 'answered', a.answered, 'correct', a.correct, 'score_pct', a.score_pct);
  END IF;
  SELECT count(*), count(*) FILTER (WHERE is_correct) INTO v_answered, v_correct FROM public.test_answers WHERE attempt_id = p_attempt_id;
  UPDATE public.attempts SET status = 'submitted', answered = v_answered, correct = v_correct,
    score_pct = CASE WHEN total > 0 THEN round(100.0 * v_correct / total, 2) ELSE 0 END,
    submitted_at = now(), duration_sec = GREATEST(0, EXTRACT(EPOCH FROM (now() - started_at))::int)
  WHERE id = p_attempt_id;
  -- Spaced repetition update
  FOR r IN SELECT question_id, is_correct FROM public.test_answers WHERE attempt_id = p_attempt_id LOOP
    IF r.is_correct THEN
      UPDATE public.revision_schedule SET
        repetitions = repetitions + 1,
        interval_days = CASE WHEN repetitions = 0 THEN 3 WHEN repetitions = 1 THEN 7 ELSE LEAST(60, interval_days * 2) END,
        due_date = v_today + (CASE WHEN repetitions = 0 THEN 3 WHEN repetitions = 1 THEN 7 ELSE LEAST(60, interval_days * 2) END),
        last_result = true, updated_at = now()
      WHERE user_id = auth.uid() AND question_id = r.question_id;
    ELSE
      INSERT INTO public.revision_schedule (user_id, question_id, due_date, interval_days, repetitions, lapses, last_result)
      VALUES (auth.uid(), r.question_id, v_today + 1, 1, 0, 1, false)
      ON CONFLICT (user_id, question_id) DO UPDATE SET due_date = v_today + 1, interval_days = 1, repetitions = 0,
        lapses = public.revision_schedule.lapses + 1, last_result = false, updated_at = now();
    END IF;
  END LOOP;
  PERFORM public.log_activity();
  SELECT * INTO a FROM public.attempts WHERE id = p_attempt_id;
  RETURN jsonb_build_object('total', a.total, 'answered', a.answered, 'correct', a.correct, 'score_pct', a.score_pct);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_usage_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  RETURN jsonb_build_object(
    'users', (SELECT count(*) FROM public.profiles),
    'onboarded', (SELECT count(*) FROM public.profiles WHERE onboarded),
    'active_7d', (SELECT count(DISTINCT user_id) FROM public.daily_activity WHERE day >= current_date - 7),
    'attempts', (SELECT count(*) FROM public.attempts WHERE status = 'submitted'),
    'answers', (SELECT count(*) FROM public.test_answers),
    'avg_score', (SELECT round(avg(score_pct), 1) FROM public.attempts WHERE status = 'submitted'),
    'interviews', (SELECT count(*) FROM public.interview_sessions),
    'interviews_completed', (SELECT count(*) FROM public.interview_sessions WHERE status = 'completed'),
    'lessons_completed', (SELECT count(*) FROM public.topic_progress WHERE status = 'completed'),
    'plans', (SELECT count(*) FROM public.study_plans),
    'bookmarks', (SELECT count(*) FROM public.bookmarks)
  );
END; $$;

REVOKE EXECUTE ON FUNCTION public.start_attempt(text, text, uuid, uuid[], int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_answer(uuid, uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_attempt(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_usage_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_activity() FROM anon;