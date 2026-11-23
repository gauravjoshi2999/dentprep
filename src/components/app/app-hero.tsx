import type { ReactNode } from "react";
import { Brand, ToothDiagram } from "./brand";

type AppHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  actions?: ReactNode;
};

/** Shared compact clinical-navy hero, with an original accessible dental diagram. */
export function AppHero({ eyebrow, title, description, actions }: AppHeroProps) {
  return (
    <section className="relative mb-7 overflow-hidden rounded-[1.75rem] bg-hero px-5 py-7 text-navy-foreground shadow-elevated sm:px-8 sm:py-9">
      <div className="pointer-events-none absolute -right-16 -top-12 h-56 w-56 rounded-full border border-white/10 bg-teal/15 sm:right-10" aria-hidden="true" />
      <div className="relative flex items-center justify-between gap-3">
        <Brand light />
        <ToothDiagram className="h-24 w-24 shrink-0 opacity-80 sm:h-32 sm:w-32" />
      </div>
      <div className="relative mt-1 max-w-2xl">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9df3e1]">{eyebrow}</p>
        <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">{description}</p>
        {actions && <div className="mt-5 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </section>
  );
}
