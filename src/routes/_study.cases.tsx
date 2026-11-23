import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { casesQuery, caseQuery } from "@/lib/queries";
import { useState } from "react";
import { EmptyState, ErrorBlock, LoadingBlock, Notice, PageHeader } from "@/components/app/common";
import { Markdown } from "@/components/app/markdown";
import { BookmarkButton } from "@/components/app/bookmark-button";

export const Route = createFileRoute("/_study/cases")({ component: Cases });
function Cases() {
  const query = useQuery(casesQuery());
  const [slug, setSlug] = useState<string | null>(null);
  return (
    <>
      <PageHeader
        title="Clinical case library"
        description="Published educational scenarios for supervised learning and clinical reasoning."
      />
      <Notice className="mb-6">
        Scenarios are learning exercises and do not replace current local protocols or qualified
        clinical supervision.
      </Notice>
      {query.isPending ? (
        <LoadingBlock />
      ) : query.isError ? (
        <ErrorBlock error={query.error} />
      ) : query.data.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {query.data.map((c) => (
            <button
              className="surface p-5 text-left hover:border-teal"
              key={c.id}
              onClick={() => setSlug(c.slug)}
            >
              <h2 className="font-bold">{c.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {c.subjects?.name} · {c.difficulty}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="Scenarios awaiting clinical review">
          Draft cases remain private. Reviewed scenarios will appear here when published.
        </EmptyState>
      )}
      {slug && <CaseDetails slug={slug} />}
    </>
  );
}
function CaseDetails({ slug }: { slug: string }) {
  const query = useQuery(caseQuery(slug));
  if (query.isPending) return <LoadingBlock />;
  if (query.isError) return <ErrorBlock error={query.error} />;
  if (!query.data) return <EmptyState title="Case no longer available" />;
  const c = query.data;
  return (
    <article className="surface mt-6 p-5 sm:p-8">
      <PageHeader title={c.title} actions={<BookmarkButton itemType="case" itemId={c.id} />} />
      <Markdown>{c.presentation}</Markdown>
      <h3 className="mb-3 mt-6 font-bold">Learning points</h3>
      <ul className="list-disc space-y-2 pl-5 text-sm">
        {c.key_learning.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
      {c.red_flags.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-3 font-bold">Safety considerations</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {c.red_flags.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-6 text-xs text-muted-foreground">{c.references.join(" · ")}</p>
    </article>
  );
}
