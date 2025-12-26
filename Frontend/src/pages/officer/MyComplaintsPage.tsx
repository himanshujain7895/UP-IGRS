/**
 * My Complaints Page
 * Officer's assigned complaints listing page
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const MyComplaintsPage: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  useEffect(() => {
    loadComplaints();
  }, [statusFilter, priorityFilter, categoryFilter, page, searchTerm]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintsService.getMyComplaints({
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
        category: categoryFilter !== "all" ? (categoryFilter as any) : undefined,
        priority: priorityFilter !== "all" ? (priorityFilter as any) : undefined,
        search: searchTerm || undefined,
        page,
        limit,
      });
      
      // Response is PaginatedResponse<Complaint> with { success, data: Complaint[], meta: { total, page, limit, totalPages } }
      if (response && response.data) {
        setComplaints(response.data);
        setTotal(response.meta?.total || response.data.length);
      } else {
        setComplaints([]);
        setTotal(0);
      }
    } catch (error: any) {
      console.error("Error loading complaints:", error);
      toast.error(error.message || "Failed to load complaints");
      setComplaints([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: {
        variant: "destructive" as const,
        icon: Clock,
        label: "Pending",
      },
      "in-progress": {
        variant: "default" as const,
        icon: AlertCircle,
        label: "In Progress",
      },
      in_progress: {
        variant: "default" as const,
        icon: AlertCircle,
        label: "In Progress",
      },
      resolved: {
        variant: "default" as const,
        icon: CheckCircle,
        label: "Resolved",
      },
      rejected: {
        variant: "secondary" as const,
        icon: XCircle,
        label: "Rejected",
      },
    };
    const statusConfig =
      config[status as keyof typeof config] || config.pending;
    const Icon = statusConfig.icon;
    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      low: { variant: "secondary" as const, label: "Low" },
      medium: { variant: "default" as const, label: "Medium" },
      high: { variant: "destructive" as const, label: "High" },
      urgent: { variant: "destructive" as const, label: "Urgent" },
    };
    const priorityConfig =
      config[priority as keyof typeof config] || config.medium;
    return (
      <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>
    );
  };

  const handleViewComplaint = (complaintId: string) => {
    navigate(`/officer/complaints/${complaintId}`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Complaints</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage your assigned complaints
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
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
                setPage(1);
              }}
            >
              <SelectTrigger>
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
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="roads">Roads & Infrastructure</SelectItem>
                <SelectItem value="water">Water Supply</SelectItem>
                <SelectItem value="electricity">Electricity</SelectItem>
                <SelectItem value="documents">Documents & Certificates</SelectItem>
                <SelectItem value="health">Health Services</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Complaints List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : complaints.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Complaints Found
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "You don't have any assigned complaints yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {complaints.map((complaint) => (
              <Card
                key={complaint.id || complaint._id}
                className="border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() =>
                  handleViewComplaint(complaint.id || complaint._id || "")
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {complaint.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {complaint.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusBadge(complaint.status)}
                      {getPriorityBadge(complaint.priority)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="capitalize">{complaint.category}</span>
                      {complaint.subCategory && (
                        <>
                          <span>•</span>
                          <span>{complaint.subCategory}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewComplaint(complaint.id || complaint._id || "");
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} complaints
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyComplaintsPage;

