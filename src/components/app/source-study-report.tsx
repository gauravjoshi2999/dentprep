import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { ALL_STUDY_COURSES, STUDY_COURSES, STUDY_COURSE_BY_ID } from "@/lib/study-course";
import { questOverviewQuery } from "@/lib/quest-progress";
import { ErrorBlock } from "@/components/app/common";

export function SourceStudyReport() {
  const { user } = useAuth();
  const report = useQuery(questOverviewQuery(user?.id ?? ""));
  const rows = report.data ?? [];
  const chapters = rows.filter((row) => !row.required_course_id);
  const wrong = chapters.flatMap((row) => {
    const course = STUDY_COURSE_BY_ID.get(row.course_id);
    return course
      ? row.first_choices.flatMap((choice, index) =>
          course.units[index]?.answer !== choice ? [{ course, unit: course.units[index]! }] : [],
        )
      : [];
  });
  const completed = chapters.filter((row) => row.completed_at).length;
  const recall = rows.filter((row) => row.required_course_id);
  return (
    <section className="surface mb-6 p-5 sm:p-6" aria-label="Source chapter study report">
      <h2 className="text-xl font-extrabold">Your chapter results</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        First choices, corrected practice and next-day recall are separate. These small practice
        samples do not measure clinical competence or predict UPSC selection.
      </p>
      {!user ? (
        <p className="mt-4">
          <Link to="/login" className="font-bold text-teal">
            Sign in to save and revisit your results
          </Link>
        </p>
      ) : report.isPending ? (
        <p role="status" className="mt-4">
          Loading chapter results…
        </p>
      ) : report.isError ? (
        <ErrorBlock error={report.error} onRetry={() => void report.refetch()} />
      ) : (
        <>
          <p className="mt-4 font-bold text-teal">
            {completed}/{STUDY_COURSES.length} available chapters completed ·{" "}
            {recall.filter((row) => row.completed_at).length}/{recall.length} next-day recalls
            completed
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Saved chapter checkpoints and next-day retrieval, by subject and content version
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3">Subject</th>
                  <th className="p-3">Challenges completed</th>
                  <th className="p-3">First correct / attempted</th>
                  <th className="p-3">Next-day recall</th>
                </tr>
              </thead>
              <tbody>
                {STUDY_COURSES.map((course) => {
                  const row = chapters.find((item) => item.course_id === course.id);
                  const later = recall.find((item) => item.required_course_id === course.id);
                  return (
                    <tr key={course.id} className="border-b border-border">
                      <td className="p-3">
                        <Link
                          to="/start"
                          search={{ course: course.id }}
                          className="font-semibold text-teal"
                        >
                          {course.subject}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          v{course.version}
                        </span>
                      </td>
                      <td className="p-3">
                        {row?.next_step ?? 0}/{course.units.length}
                      </td>
                      <td className="p-3">
                        {row?.first_choices.length
                          ? `${row.first_correct}/${row.first_choices.length}`
                          : "Not attempted"}
                      </td>
                      <td className="p-3">
                        {later?.completed_at ? (
                          <Link
                            to="/start"
                            search={{ course: later.course_id }}
                            className="text-teal underline"
                          >
                            {later.first_correct}/{later.total_steps} first correct · review
                          </Link>
                        ) : later?.available ? (
                          <Link
                            to="/start"
                            search={{ course: later.course_id }}
                            className="font-bold text-teal"
                          >
                            Recall due →
                          </Link>
                        ) : later?.available_at ? (
                          `Unlocks ${new Date(later.available_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`
                        ) : (
                          "Complete chapter first"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <details className="mt-5">
            <summary className="cursor-pointer font-bold">
              Revise first-attempt mistakes ({wrong.length})
            </summary>
            {wrong.length ? (
              <ul className="mt-3 space-y-2">
                {wrong.map(({ course, unit }) => (
                  <li key={`${course.id}:${unit.id}`}>
                    <Link
                      className="text-sm font-semibold text-teal underline"
                      to="/start"
                      search={{ course: course.id, review: unit.id }}
                    >
                      {course.subject} · {unit.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No first-attempt mistakes recorded. Complete fresh and delayed questions to gather
                more evidence.
              </p>
            )}
          </details>
        </>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        {ALL_STUDY_COURSES.filter((course) => course.kind === "chapter").length} introductory
        subject chapters are available. This is not complete BDS curriculum coverage. Retention
        currently provides one fresh next-day check per chapter; longer-term retention needs further
        question sets.
      </p>
    </section>
  );
}
