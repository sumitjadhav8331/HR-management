import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { PaginationState } from "@/lib/types";
import { buildPageHref, cn } from "@/lib/utils";

export function Pagination({
  pathname,
  searchParams,
  pagination,
}: {
  pathname: string;
  searchParams: URLSearchParams;
  pagination: PaginationState;
}) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <p className="text-sm text-muted-foreground">
        Page {pagination.page} of {pagination.totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={buildPageHref(pathname, searchParams, pagination.page - 1)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            pagination.page <= 1 ? "pointer-events-none opacity-50" : "",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Link>
        <Link
          href={buildPageHref(pathname, searchParams, pagination.page + 1)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            pagination.page >= pagination.totalPages
              ? "pointer-events-none opacity-50"
              : "",
          )}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
