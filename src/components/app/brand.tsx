import { cn } from "@/lib/utils";

export function ToothMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("h-10 w-10", className)} fill="none">
      <path d="M9 14c-2.7 3.3-1.5 7.8-.1 12.2.9 2.8 1.2 8.5 4.3 8.5 3.2 0 2.6-9.2 6.9-9.2 4.2 0 3.7 9.2 6.9 9.2 3.1 0 3.4-5.7 4.3-8.5 1.4-4.4 2.6-8.9-.1-12.2-3.2-4.1-7.6-2.6-11.1-1.2-3.5-1.4-7.9-2.9-11.1 1.2Z" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m6 9 14-6 14 6-14 6L6 9Z" fill="#29d8c1" stroke="#29d8c1" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M12 12.5v4.5c4.5 3.5 11.5 3.5 16 0v-4.5" stroke="#29d8c1" strokeWidth="2" strokeLinecap="round" />
      <path d="M34 9v8" stroke="#29d8c1" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", light ? "text-white" : "text-navy", className)}>
      <ToothMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-extrabold tracking-tight">
          Dent<span className="text-teal">Prep</span>
        </span>
        <span className={cn("mt-1 text-[9px] font-semibold tracking-[0.03em]", light ? "text-white/80" : "text-muted-foreground")}>
          UPSC Dental Surgeon Preparation
        </span>
      </span>
    </span>
  );
}

/** Labelled tooth cross-section — an informative diagram used on the landing and study pages. */
export function ToothDiagram({ className }: { className?: string }) {
  const label = "fill-current text-[9px] font-semibold";
  return (
    <figure className={cn("text-navy-foreground", className)}>
      <svg viewBox="0 0 240 260" role="img" aria-labelledby="tooth-diagram-title" className="h-full w-full">
        <title id="tooth-diagram-title">Cross-section of a molar showing enamel, dentin, pulp, periodontal ligament, cementum and alveolar bone</title>
        <path d="M40 150 Q120 135 200 150 L210 250 L30 250 Z" className="fill-current opacity-10" />
        <path d="M70 40c18-12 32-6 50 2 18-8 32-14 50-2 20 14 18 46 10 72-6 20-8 40-12 70-3 22-10 34-18 34-10 0-13-16-16-36-2-14-6-24-14-24s-12 10-14 24c-3 20-6 36-16 36-8 0-15-12-18-34-4-30-6-50-12-70-8-26-10-58 10-72Z" className="fill-current opacity-95" />
        <path d="M80 52c14-8 26-4 40 2 14-6 26-10 40-2 14 10 12 36 6 56-5 16-7 32-10 56-2 16-6 26-12 26-6 0-9-12-11-28-2-12-6-20-13-20s-11 8-13 20c-2 16-5 28-11 28-6 0-10-10-12-26-3-24-5-40-10-56-6-20-8-46 6-56Z" className="fill-teal opacity-60" />
        <path d="M104 74c6-4 10-2 16 1 6-3 10-5 16-1 6 5 5 18 2 28l-6 28c-2 10-4 34-8 34s-5-8-6-18c-1-8-3-12-4-12s-3 4-4 12c-1 10-2 18-6 18s-6-24-8-34l-6-28c-3-10-4-23 2-28Z" className="fill-destructive opacity-70" />
        <g className={label}>
          <line x1="70" y1="48" x2="20" y2="30" className="stroke-current" strokeWidth="1" /><text x="4" y="24">Enamel</text>
          <line x1="88" y1="90" x2="20" y2="92" className="stroke-current" strokeWidth="1" /><text x="2" y="88">Dentin</text>
          <line x1="128" y1="96" x2="214" y2="70" className="stroke-current" strokeWidth="1" /><text x="198" y="64">Pulp</text>
          <line x1="168" y1="180" x2="214" y2="168" className="stroke-current" strokeWidth="1" /><text x="186" y="160">PDL &amp; cementum</text>
          <line x1="60" y1="210" x2="20" y2="226" className="stroke-current" strokeWidth="1" /><text x="2" y="240">Alveolar bone</text>
        </g>
      </svg>
    </figure>
  );
}