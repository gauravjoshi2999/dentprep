import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { bookmarksQuery } from "@/lib/queries";
import { useUserId } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function BookmarkButton({ itemType, itemId, compact }: { itemType: "lesson" | "question" | "case"; itemId: string; compact?: boolean }) {
  const userId = useUserId();
  const qc = useQueryClient();
  const { data: bookmarks } = useQuery({ ...bookmarksQuery(userId), enabled: !!userId });
  const existing = bookmarks?.find((b) => b.item_type === itemType && b.item_id === itemId);
  const toggle = useMutation({
    mutationFn: async () => {
      if (existing) {
        const { error } = await supabase.from("bookmarks").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bookmarks").insert({ user_id: userId, item_type: itemType, item_id: itemId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookmarks", userId] });
      toast.success(existing ? "Removed from saved" : "Saved for later");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't update saved items"),
  });
  const label = existing ? "Remove from saved" : "Save";
  return (
    <Button
      type="button"
      variant={existing ? "soft" : "outline"}
      size={compact ? "icon" : "sm"}
      aria-pressed={!!existing}
      aria-label={label}
      disabled={!userId || toggle.isPending}
      onClick={() => toggle.mutate()}
    >
      {existing ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
      {!compact && (existing ? "Saved" : "Save")}
    </Button>
  );
}