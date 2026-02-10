/**
 * Reusable Pagination Component
 * Works with API meta: { page, limit, total, totalPages }
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationProps {
  /** Either pass meta from API response, or individual values */
  meta?: PaginationMeta | null;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  /** Called when user selects a page */
  onPageChange: (page: number) => void;
  /** Label for the items, e.g. "complaints", "cases", "users" */
  itemLabel?: string;
  /** Show numbered page buttons (default true) */
  showPageNumbers?: boolean;
  /** Hide when only one page (default true) */
  hideWhenSinglePage?: boolean;
  className?: string;
}

export function Pagination({
  meta,
  page: pageProp,
  limit: limitProp,
  total: totalProp,
  totalPages: totalPagesProp,
  onPageChange,
  itemLabel = "items",
  showPageNumbers = true,
  hideWhenSinglePage = true,
  className,
}: PaginationProps) {
  const page = meta?.page ?? pageProp ?? 1;
  const limit = meta?.limit ?? limitProp ?? 20;
  const total = meta?.total ?? totalProp ?? 0;
  const totalPages = meta?.totalPages ?? totalPagesProp ?? 1;

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (hideWhenSinglePage && totalPages <= 1) {
    return null;
  }

  const maxNumberedPages = 5;
  const pageNumbers: number[] = [];
  if (totalPages <= maxNumberedPages) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else if (page <= 3) {
    for (let i = 1; i <= maxNumberedPages; i++) pageNumbers.push(i);
  } else if (page >= totalPages - 2) {
    for (let i = totalPages - 4; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    for (let i = page - 2; i <= page + 2; i++) pageNumbers.push(i);
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 pb-2 px-1",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span> {itemLabel}
      </p>
      <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-xl border-slate-200 hover:bg-orange-400 hover:border-slate-300 transition-colors flex items-center justify-center disabled:opacity-50"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        {showPageNumbers && (
          <div className="flex items-center justify-center gap-2 mx-0.5">
            {pageNumbers.map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-11 w-11 min-w-11 rounded-xl text-sm font-medium flex items-center justify-center transition-colors",
                  pageNum === page
                    ? "bg-primary text-primary-foreground border-0"
                    : "border-slate-200 hover:bg-orange-400 hover:border-slate-300",
                )}
                onClick={() => onPageChange(pageNum)}
                aria-label={`Page ${pageNum}`}
                aria-current={pageNum === page ? "page" : undefined}
              >
                {pageNum}
              </Button>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-xl border-slate-200 hover:bg-orange-400 hover:border-slate-300 transition-colors flex items-center justify-center disabled:opacity-50"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
