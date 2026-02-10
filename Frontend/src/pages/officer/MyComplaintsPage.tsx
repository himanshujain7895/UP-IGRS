/**
 * My Complaints Page
 * Officer's assigned complaints listing page
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { complaintsService } from "@/services/complaints.service";
import { Complaint } from "@/types";
import { Pagination } from "@/components/ui/pagination";
import {
  Search,
  Eye,
  Loader2,
  AlertCircle,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

const MyComplaintsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
  const initialPage = isNaN(pageFromUrl) || pageFromUrl < 1 ? 1 : pageFromUrl;

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const updatePageAndUrl = (p: number) => {
    setPage(p);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(p));
      return next;
    });
  };

  useEffect(() => {
    loadComplaints();
  }, [statusFilter, priorityFilter, categoryFilter, page, searchTerm]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintsService.getMyComplaints({
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
        category:
          categoryFilter !== "all" ? (categoryFilter as any) : undefined,
        priority:
          priorityFilter !== "all" ? (priorityFilter as any) : undefined,
        search: searchTerm || undefined,
        page,
        limit,
      });

      // Response is PaginatedResponse<Complaint> with { success, data: Complaint[], meta: { total, page, limit, totalPages } }
      if (response && response.data) {
        setComplaints(response.data);
        setTotal(response.meta?.total ?? response.data.length);
        setTotalPages(response.meta?.totalPages ?? Math.ceil((response.meta?.total ?? response.data.length) / limit));
      } else {
        setComplaints([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error("Error loading complaints:", error);
      toast.error(error.message || "Failed to load complaints");
      setComplaints([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: {
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        dotColor: "bg-amber-500",
        label: "Pending",
      },
      "in-progress": {
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        dotColor: "bg-blue-500",
        label: "In Progress",
      },
      in_progress: {
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        dotColor: "bg-blue-500",
        label: "In Progress",
      },
      resolved: {
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        dotColor: "bg-emerald-500",
        label: "Resolved",
      },
      rejected: {
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        dotColor: "bg-red-500",
        label: "Rejected",
      },
    };
    const statusConfig =
      config[status as keyof typeof config] || config.pending;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
        {statusConfig.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      low: {
        textColor: "text-slate-600",
        label: "Low",
      },
      medium: {
        textColor: "text-amber-600",
        label: "Medium",
      },
      high: {
        textColor: "text-orange-600",
        label: "High",
      },
      urgent: {
        textColor: "text-red-600",
        label: "Urgent",
      },
    };
    const priorityConfig =
      config[priority as keyof typeof config] || config.medium;
    return (
      <span className={`text-xs font-medium ${priorityConfig.textColor}`}>
        {priorityConfig.label}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    return (
      <span className="text-xs font-medium text-slate-600 capitalize">
        {category}
      </span>
    );
  };

  const calculateRemainingTime = (complaint: Complaint) => {
    // Get arrival time (use this as the base for deadline calculation)
    const arrivalTime =
      (complaint as any).arrivalTime ||
      (complaint as any).arrival_time ||
      complaint.arrivalTime ||
      complaint.createdAt;

    if (!arrivalTime) return null;

    // Get time boundary (default 14 days as mentioned, but check complaint.timeBoundary)
    const timeBoundary = complaint.timeBoundary || 14; // Default 14 days

    // Calculate deadline from arrival date + timeBoundary
    const arrivalDate = new Date(arrivalTime);
    const deadline = new Date(arrivalDate);
    deadline.setDate(deadline.getDate() + timeBoundary);

    // Calculate remaining time
    const now = new Date();
    const remainingMs = deadline.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

    return {
      remainingDays,
      deadline,
      arrivalDate,
      timeBoundary,
      isOverdue: remainingDays < 0,
    };
  };

  const handleViewComplaint = (complaintId: string) => {
    navigate(`/officer/complaints/${complaintId}`);
  };

  // Calculate statistics
  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    inProgress: complaints.filter(
      (c) => c.status === "in_progress" || (c as any).status === "in-progress",
    ).length,
    overdue: complaints.filter((c) => {
      const rt = calculateRemainingTime(c);
      return rt && rt.isOverdue;
    }).length,
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Professional Header Section */}
      <div className="space-y-6">
        {/* Statistics Cards - compact on small screens */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 min-w-0">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-white dark:from-card dark:to-muted min-w-0 overflow-hidden">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wide mb-0.5 sm:mb-1 truncate">
                    Total Cases
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-foreground tabular-nums">
                    {stats.total}
                  </p>
                </div>
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg bg-slate-100 dark:bg-muted flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white dark:from-card dark:to-muted min-w-0 overflow-hidden">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-0.5 sm:mb-1 truncate">
                    Pending
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                    {stats.pending}
                  </p>
                </div>
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white dark:from-card dark:to-muted min-w-0 overflow-hidden">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-0.5 sm:mb-1 truncate">
                    In Progress
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                    {stats.inProgress}
                  </p>
                </div>
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-white dark:from-card dark:to-muted min-w-0 overflow-hidden">
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-0.5 sm:mb-1 truncate">
                    Overdue
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-red-700 dark:text-red-300 tabular-nums">
                    {stats.overdue}
                  </p>
                </div>
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filter & Search - collapsible, default closed */}
      <Card className="border-0 shadow-sm bg-white dark:bg-card min-w-0 overflow-hidden">
        <CardHeader
          role="button"
          tabIndex={0}
          aria-expanded={filtersOpen}
          aria-label={filtersOpen ? "Collapse filters" : "Expand filters"}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFiltersOpen((o) => !o);
            }
          }}
          className="py-3 sm:py-4 px-4 sm:px-6 border-b border-slate-100 dark:border-border cursor-pointer hover:bg-slate-50/50 dark:hover:bg-muted transition-colors"
          onClick={() => setFiltersOpen((o) => !o)}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Filter className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
              <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 dark:text-foreground">
                Filter & Search
              </CardTitle>
              {(!filtersOpen && (searchTerm || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all")) && (
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  (filters active)
                </span>
              )}
            </div>
            {filtersOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
            )}
          </div>
        </CardHeader>
        {filtersOpen && (
          <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by title, ID, or desc"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    updatePageAndUrl(1);
                  }}
                  className="pl-9 sm:pl-10 h-10 sm:h-11 border-slate-200 focus:border-primary focus:ring-primary text-sm"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  updatePageAndUrl(1);
                }}
              >
                <SelectTrigger className="h-10 sm:h-11 border-slate-200 focus:border-primary focus:ring-primary text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={(value) => {
                  setPriorityFilter(value);
                  updatePageAndUrl(1);
                }}
              >
                <SelectTrigger className="h-10 sm:h-11 border-slate-200 focus:border-primary focus:ring-primary text-sm">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  updatePageAndUrl(1);
                }}
              >
                <SelectTrigger className="h-10 sm:h-11 border-slate-200 focus:border-primary focus:ring-primary text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="roads">Roads & Infrastructure</SelectItem>
                  <SelectItem value="water">Water Supply</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="documents">
                    Documents & Certificates
                  </SelectItem>
                  <SelectItem value="health">Health Services</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Complaints List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : complaints.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-foreground mb-2">
              No Complaints Found
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                ? "No complaints match your current filters. Try adjusting your search criteria."
                : "You don't have any assigned complaints at this time."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-foreground">
                Assigned Cases
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {total} {total === 1 ? "case" : "cases"} found
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {complaints.map((complaint) => {
              const complaintId = complaint.id || complaint._id;
              const remainingTime = calculateRemainingTime(complaint);
              const arrivalTime =
                (complaint as any).arrivalTime ||
                (complaint as any).arrival_time ||
                complaint.arrivalTime ||
                complaint.createdAt;
              const assignedTime =
                (complaint as any).assignedTime ||
                (complaint as any).assigned_time ||
                complaint.assignedTime ||
                arrivalTime;

              return (
                <Card
                  key={complaintId}
                  className="group border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm hover:shadow-lg hover:border-slate-300 dark:hover:border-border transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => handleViewComplaint(complaintId || "")}
                >
                  <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6 space-y-2">
                    {/* Top Row: ID, Status, Priority - tighter gap */}
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      {complaint.complaint_id && (
                        <span className="text-[11px] sm:text-xs font-mono font-medium text-slate-500 dark:text-muted-foreground bg-slate-50 dark:bg-muted px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md shrink-0">
                          {complaint.complaint_id}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {getPriorityBadge(complaint.priority)}
                      </div>
                    </div>

                    {/* Title */}
                    <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 dark:text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 mt-0.5">
                      {complaint.title}
                    </CardTitle>

                    {/* Description (MLC's message text) - smaller font */}
                    <CardDescription className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {complaint.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6 space-y-3">
                    {/* Progress Section */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                          Case Progress
                        </span>
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-900 dark:text-foreground shrink-0">
                          {(() => {
                            const steps = [
                              complaint.createdAt ? 1 : 0,
                              (complaint as any).drafted_letter ||
                              complaint.drafted_letter
                                ? 1
                                : 0,
                              complaint.isOfficerAssigned ||
                              (complaint as any).is_officer_assigned
                                ? 1
                                : 0,
                              (complaint as any).officerRemarks ||
                              (complaint as any).officer_remarks ||
                              complaint.officerFeedback
                                ? 1
                                : 0,
                              complaint.isComplaintClosed ||
                              (complaint as any).is_closed ||
                              (complaint as any).closingDetails
                                ? 1
                                : 0,
                            ];
                            const completed = steps.reduce((a, b) => a + b, 0);
                            return `${completed}/5`;
                          })()}{" "}
                          Steps Completed
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-emerald-500 rounded-full transition-all duration-700"
                          style={{
                            width: `${(() => {
                              const steps = [
                                complaint.createdAt ? 1 : 0,
                                (complaint as any).drafted_letter ||
                                complaint.drafted_letter
                                  ? 1
                                  : 0,
                                complaint.isOfficerAssigned ||
                                (complaint as any).is_officer_assigned
                                  ? 1
                                  : 0,
                                (complaint as any).officerRemarks ||
                                (complaint as any).officer_remarks ||
                                complaint.officerFeedback
                                  ? 1
                                  : 0,
                                complaint.isComplaintClosed ||
                                (complaint as any).is_closed ||
                                (complaint as any).closingDetails
                                  ? 1
                                  : 0,
                              ];
                              const completed = steps.reduce(
                                (a, b) => a + b,
                                0,
                              );
                              return (completed / 5) * 100;
                            })()}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div className="flex items-center gap-2 py-1.5 border-y border-slate-100 dark:border-border">
                      <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wide">
                        Category
                      </span>
                      <span className="text-slate-300 dark:text-slate-500">•</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize">
                        {complaint.category}
                      </span>
                    </div>

                    {/* Timeline Information */}
                    <div className="space-y-1.5 sm:space-y-2 pt-0.5">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs gap-2">
                        <span className="text-slate-500 dark:text-slate-300 font-medium shrink-0">
                          Arrived
                        </span>
                        <span className="text-slate-900 dark:text-foreground font-semibold text-right truncate min-w-0">
                          {arrivalTime
                            ? new Date(arrivalTime).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "N/A"}
                        </span>
                      </div>
                      {assignedTime && assignedTime !== arrivalTime && (
                        <div className="flex items-center justify-between text-[10px] sm:text-xs gap-2">
                          <span className="text-slate-500 dark:text-slate-300 font-medium shrink-0">
                            Assigned
                          </span>
                          <span className="text-slate-900 dark:text-foreground font-semibold text-right truncate min-w-0">
                            {new Date(assignedTime).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      )}
                      {/* Deadline Date */}
                      {remainingTime && (
                        <div className="flex items-center justify-between text-[10px] sm:text-xs gap-2">
                          <span className="text-slate-500 dark:text-slate-300 font-medium shrink-0">
                            Deadline
                          </span>
                          <span
                            className={`font-semibold ${
                              remainingTime.isOverdue
                                ? "text-red-600 dark:text-red-400"
                                : remainingTime.remainingDays <= 3
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-slate-900 dark:text-foreground"
                            }`}
                          >
                            {remainingTime.deadline.toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                            {remainingTime.isOverdue && (
                              <span className="ml-1.5 text-red-500">⚠</span>
                            )}
                          </span>
                        </div>
                      )}
                      {remainingTime && (
                        <div
                          className={`flex items-center justify-between text-[10px] sm:text-xs font-semibold pt-1 border-t border-slate-100 dark:border-border ${
                            remainingTime.isOverdue
                              ? "text-red-600 dark:text-red-400"
                              : remainingTime.remainingDays <= 3
                                ? "text-orange-600 dark:text-orange-400"
                                : "text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <span>
                            {remainingTime.isOverdue
                              ? "Overdue by"
                              : "Time remaining"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {Math.abs(remainingTime.remainingDays)}{" "}
                            {Math.abs(remainingTime.remainingDays) === 1
                              ? "day"
                              : "days"}
                            {remainingTime.isOverdue && (
                              <span className="text-red-500">⚠</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewComplaint(complaintId || "");
                        }}
                        className="w-full text-xs font-medium border-slate-200 hover:border-primary hover:bg-primary hover:text-white transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 mr-2" />
                        View Case Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={updatePageAndUrl}
            itemLabel="cases"
            className="pt-2"
          />
        </>
      )}
    </div>
  );
};

export default MyComplaintsPage;
