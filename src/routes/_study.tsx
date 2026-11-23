import { createFileRoute } from "@tanstack/react-router";
import { StudyShell } from "@/components/app/study-shell";

export const Route = createFileRoute("/_study")({ ssr: false, component: StudyShell });
