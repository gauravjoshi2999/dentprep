import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
export function PwaTools() {
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  useEffect(() => {
    if (
      "serviceWorker" in navigator &&
      (import.meta.env.PROD || import.meta.env["VITE_ENABLE_PWA"] === "true")
    ) {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          /* Online learning continues when offline support is unavailable. */
        });
    }
    const capture = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
      <a href="/offline.html" className="font-semibold text-teal underline underline-offset-4">
        Offline notes on this device
      </a>
      {install && (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await install.prompt();
            await install.userChoice;
            setInstall(null);
          }}
        >
          Install DentPrep
        </Button>
      )}
    </div>
  );
}
