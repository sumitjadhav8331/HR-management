import { Badge } from "@/components/ui/badge";

export function StatusBadge({ value }: { value?: string | null }) {
  const normalized = value?.toLowerCase?.() ?? "unknown";

  if (["active", "joined", "completed", "done", "interested"].includes(normalized)) {
    return <Badge variant="success">{normalized.replaceAll("_", " ")}</Badge>;
  }

  if (
    ["follow up", "follow_up", "pending", "medium", "high", "urgent"].includes(
      normalized,
    )
  ) {
    return <Badge variant="warning">{normalized.replaceAll("_", " ")}</Badge>;
  }

  if (["left", "not joined", "not_joined", "not interested", "not_interested"].includes(normalized)) {
    return <Badge variant="destructive">{normalized.replaceAll("_", " ")}</Badge>;
  }

  return <Badge variant="outline">{normalized.replaceAll("_", " ")}</Badge>;
}
