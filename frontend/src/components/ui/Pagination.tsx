import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  page: number;
  hasNext: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, hasNext, onPageChange }: PaginationProps) {
  if (page === 1 && !hasNext) {
    return null;
  }

  return (
    <nav
      className="mt-8 flex items-center justify-between border-t border-warm-200 pt-5"
      aria-label="Pagination"
    >
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        leftIcon={<ChevronLeft className="h-4 w-4" />}
      >
        Previous
      </Button>
      <span className="text-sm font-medium text-neutral-600">Page {page}</span>
      <Button
        variant="secondary"
        size="sm"
        disabled={!hasNext}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
