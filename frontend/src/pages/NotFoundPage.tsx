import { SearchX } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";
import { LinkButton } from "../components/ui/LinkButton";

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <EmptyState
        icon={<SearchX className="h-6 w-6" />}
        title="Page not found"
        description="The page may have moved, or the address may be incorrect."
        action={
          <LinkButton to="/">Back to home</LinkButton>
        }
      />
    </div>
  );
}
