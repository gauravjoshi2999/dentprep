import { cn } from "@/lib/utils";

export function ToothMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-8 w-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-teal" />
      <path
        d="M10.2 8.5c2-1 3.7-.3 5.8.6 2.1-.9 3.8-1.6 5.8-.6 2.6 1.3 2.9 4.8 1.9 7.9-.6 1.9-1 3.3-1.3 5.6-.3 2.2-1.1 3.6-2.2 3.6-1.3 0-1.6-1.6-2-3.6-.3-1.4-.9-2.3-2.2-2.3s-1.9.9-2.2 2.3c-.4 2-.7 3.6-2 3.6-1.1 0-1.9-1.4-2.2-3.6-.3-2.3-.7-3.7-1.3-5.6-1-3.1-.7-6.6 1.9-7.9Z"
        className="fill-teal-foreground"
      />
    </svg>
  );
}

export function Brand({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ToothMark />
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-lg font-extrabold tracking-tight", light ? "text-navy-foreground" : "text-foreground")}>
          DentPrep
        </span>
        <span className={cn("text-[10px] font-semibold uppercase tracking-[0.14em]", light ? "text-navy-foreground/70" : "text-muted-foreground")}>
          UPSC Dental Surgeon
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