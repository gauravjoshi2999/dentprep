import {
  Baby, Brain, Braces, Crown, Drill, Landmark, Layers, Microscope, Pill, ScanLine, Scissors, ShieldCheck, Siren, Stethoscope, Users, BookOpen,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  scan: ScanLine, scissors: Scissors, drill: Drill, layers: Layers, crown: Crown, align: Braces, baby: Baby, users: Users,
  microscope: Microscope, stethoscope: Stethoscope, pill: Pill, brain: Brain, siren: Siren, shield: ShieldCheck, landmark: Landmark,
};

export function SubjectIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICONS[icon] ?? BookOpen;
  return (
    <span className={cn("inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-secondary-foreground", className)}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}