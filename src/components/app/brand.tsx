import { cn } from "@/lib/utils";

/** Decorative logo, aria-hidden; not an anatomical teaching illustration. */
export function ToothMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("h-10 w-10", className)} fill="none">
      <path
        d="M9 14c-2.7 3.3-1.5 7.8-.1 12.2.9 2.8 1.2 8.5 4.3 8.5 3.2 0 2.6-9.2 6.9-9.2 4.2 0 3.7 9.2 6.9 9.2 3.1 0 3.4-5.7 4.3-8.5 1.4-4.4 2.6-8.9-.1-12.2-3.2-4.1-7.6-2.6-11.1-1.2-3.5-1.4-7.9-2.9-11.1 1.2Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m6 9 14-6 14 6-14 6L6 9Z"
        fill="#29d8c1"
        stroke="#29d8c1"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M12 12.5v4.5c4.5 3.5 11.5 3.5 16 0v-4.5"
        stroke="#29d8c1"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M34 9v8" stroke="#29d8c1" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5",
        light ? "text-white" : "text-navy",
        className,
      )}
    >
      <ToothMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-extrabold tracking-tight">
          Dent<span className="text-teal">Prep</span>
        </span>
        <span
          className={cn(
            "mt-1 text-[9px] font-semibold tracking-[0.03em]",
            light ? "text-white/80" : "text-muted-foreground",
          )}
        >
          UPSC Dental Surgeon Preparation
        </span>
      </span>
    </span>
  );
}
