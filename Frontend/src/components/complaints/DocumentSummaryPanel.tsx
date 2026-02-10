/**
 * Document Summary Panel
 * Fetches and displays document summary history; allows generating new summary with optional user prompt.
 * Modern, mobile-first UI with clear hierarchy and smart states.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText,
  Loader2,
  Sparkles,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { aiService } from "@/services/ai.service";
import { DocumentSummaryRecord } from "@/types";
import { toast } from "sonner";

interface DocumentSummaryPanelProps {
  complaintId: string;
  className?: string;
}

export default function DocumentSummaryPanel({
  complaintId,
  className = "",
}: DocumentSummaryPanelProps) {
  const [summaries, setSummaries] = useState<DocumentSummaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [useComplaintContext, setUseComplaintContext] = useState(true);

  const fetchSummaries = useCallback(async () => {
    if (!complaintId) return;
    setLoading(true);
    try {
      const res = await aiService.listDocumentSummaries(complaintId);
      const data = res?.data ?? res;
      const list = Array.isArray((data as any)?.summaries)
        ? (data as any).summaries
        : [];
      setSummaries(list);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load summaries");
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  const handleGenerate = async () => {
    if (!complaintId) return;
    setGenerating(true);
    try {
      const res = await aiService.summarizeDocuments(complaintId, {
        useComplaintContext,
        user_prompt: userPrompt.trim() || undefined,
      });
      const data = res?.data ?? res;
      const summary = (data as any)?.summary;
      if (summary != null) {
        toast.success("Summary generated and saved");
        setUserPrompt("");
        await fetchSummaries();
      } else {
        toast.error("No summary in response");
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.error?.message ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to generate summary";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card
      className={`overflow-hidden border border-border/80 bg-card shadow-sm sm:shadow-md ${className}`}
    >
      <CardHeader className="pb-3 pt-5 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
            <FileText className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <CardTitle className="text-base font-semibold tracking-tight sm:text-lg">
            Document summaries
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 px-4 pb-5 sm:px-6">
        {/* Generate CTA — pill-style, mobile-friendly */}
        <Accordion
          type="single"
          collapsible
          className="w-full overflow-hidden rounded-xl border border-border/80 bg-muted/20 shadow-sm"
        >
          <AccordionItem value="generate" className="border-none">
            <AccordionTrigger className="min-h-[52px] px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]>svg]:rotate-180">
              <span className="flex items-center gap-3 text-left">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  Generate user-doc summary
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-1">
              <div className="space-y-4">
                <div>
                  <Textarea
                    id="user-prompt"
                    placeholder="Add optional instruction for the AI..."
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    rows={2}
                    className="min-h-[72px] resize-none rounded-lg border-border/80 text-sm focus-visible:ring-primary/30"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm transition-colors hover:bg-muted/30">
                  <input
                    type="checkbox"
                    checked={useComplaintContext}
                    onChange={(e) => setUseComplaintContext(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary/40"
                  />
                  <span className="text-foreground">
                    Use complaint context (title, description, area)
                  </span>
                </label>
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="h-11 w-full gap-2 rounded-lg bg-primary font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] sm:w-auto"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 shrink-0" />
                      Generate summary
                    </>
                  )}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Summary history */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">
              Summary history
            </span>
            <button
              type="button"
              onClick={fetchSummaries}
              disabled={loading}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh
            </button>
          </div>

          <div className="scrollbar-visible max-h-[280px] overflow-x-hidden pr-1 md:max-h-[min(60vh,420px)]">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-xl border border-border/60 bg-muted/30"
                    aria-hidden
                  />
                ))}
              </div>
            ) : summaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 py-10 px-4 text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  No summaries yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Generate one above to get started.
                </p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {summaries.map((s) => (
                  <AccordionItem
                    key={s.id}
                    value={s.id}
                    className="rounded-xl border border-border/70 bg-background/80 shadow-sm transition-shadow hover:shadow-md data-[state=open]:shadow-md"
                  >
                    <AccordionTrigger className="min-h-[56px] px-4 py-3 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                      <div className="flex flex-wrap items-center gap-2 text-left">
                        <span className="text-sm font-semibold text-foreground">
                          {formatDate(s.created_at)}
                        </span>
                        <Badge
                          variant="secondary"
                          className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary"
                        >
                          {s.document_count} doc
                          {s.document_count !== 1 ? "s" : ""}
                        </Badge>
                        {s.use_complaint_context && (
                          <Badge
                            variant="outline"
                            className="rounded-full border-border/80 text-xs font-medium text-muted-foreground"
                          >
                            With context
                          </Badge>
                        )}
                        {s.user_prompt && (
                          <span
                            className="inline-flex max-w-[180px] items-center gap-1 truncate text-xs text-muted-foreground sm:max-w-[240px]"
                            title={s.user_prompt}
                          >
                            <MessageSquare className="h-3 w-3 shrink-0" />
                            Custom prompt
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0">
                      {s.user_prompt && (
                        <div className="mb-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs">
                          <span className="font-medium text-muted-foreground">
                            Instruction:{" "}
                          </span>
                          <span className="text-foreground">
                            {s.user_prompt}
                          </span>
                        </div>
                      )}
                      <div className="rounded-lg border border-border/60 bg-muted/5 p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground overflow-scroll md:line-clamp-none line-height-1">
                          {s.summary}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
