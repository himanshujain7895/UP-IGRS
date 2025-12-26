/**
 * Officer Complaint Detail Page
 * Simplified complaint view for officers
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, AlertCircle, Mail, Phone, MapPin, FileText } from "lucide-react";
import { complaintsService } from "@/services/complaints.service";
import { Complaint } from "@/types";
import { toast } from "sonner";

const OfficerComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadComplaint();
    }
  }, [id]);

  const loadComplaint = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await complaintsService.getComplaintById(id);
      setComplaint(data);
    } catch (error: any) {
      console.error("Error loading complaint:", error);
      toast.error(error.message || "Failed to load complaint");
      navigate("/officer");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: {
        variant: "destructive" as const,
        label: "Pending",
      },
      "in-progress": {
        variant: "default" as const,
        label: "In Progress",
      },
      in_progress: {
        variant: "default" as const,
        label: "In Progress",
      },
      resolved: {
        variant: "default" as const,
        label: "Resolved",
      },
      rejected: {
        variant: "secondary" as const,
        label: "Rejected",
      },
    };
    const statusConfig =
      config[status as keyof typeof config] || config.pending;
    return (
      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Complaint not found</p>
        <Button onClick={() => navigate("/officer")} className="mt-4">
          Back to My Complaints
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-gray-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 p-6 border-b border-gray-300">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/officer")}
                className="text-gray-700 hover:bg-gray-300 mt-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {complaint.title}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    variant="outline"
                    className="bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300"
                  >
                    <span className="text-xs font-mono">
                      {complaint.id || complaint._id || "N/A"}
                    </span>
                  </Badge>
                  {getStatusBadge(complaint.status)}
                  {getPriorityBadge(complaint.priority)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Complaint Information */}
      <Card className="border-gray-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-300 rounded-lg">
              <FileText className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-2xl text-gray-900">
                Complaint Information
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Complete details and metadata
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Description Section */}
          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-500 rounded-lg">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <label className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Description
              </label>
            </div>
            <p className="text-foreground leading-relaxed pl-8">
              {complaint.description}
            </p>
          </div>

          {/* Category & Classification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-green-500 rounded-lg">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Category
                  </label>
                </div>
                <p className="text-base font-semibold text-foreground capitalize pl-8">
                  {complaint.category}
                </p>
                {complaint.subCategory && (
                  <p className="text-sm text-muted-foreground pl-8 mt-1">
                    {complaint.subCategory}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-purple-500 rounded-lg">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Submitted Date
                  </label>
                </div>
                <p className="text-base font-semibold text-foreground pl-8">
                  {new Date(complaint.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-muted-foreground pl-8 mt-1">
                  {new Date(complaint.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-500 rounded-lg">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-lg border border-orange-200">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                    Submitted By
                  </label>
                  <p className="text-sm font-semibold text-foreground">
                    {complaint.contactName}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-orange-200">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                    Phone
                  </label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-primary" />
                    <p className="text-sm font-semibold text-foreground">
                      {complaint.contactPhone}
                    </p>
                  </div>
                </div>
                {complaint.contactEmail && (
                  <div className="p-3 bg-white rounded-lg border border-orange-200">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                      Email
                    </label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-primary" />
                      <p className="text-sm font-semibold text-foreground">
                        {complaint.contactEmail}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500 rounded-lg">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-base">Location</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {typeof complaint.location === "string" ? (
                <div className="p-4 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-foreground">
                    {complaint.location}
                  </p>
                </div>
              ) : complaint.location ? (
                <div className="space-y-3">
                  {complaint.location.address && (
                    <div className="p-4 bg-white rounded-lg border border-blue-200">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                        Address
                      </label>
                      <p className="text-sm font-medium text-foreground">
                        {complaint.location.address}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {complaint.location.city && (
                      <div className="p-3 bg-white rounded-lg border border-blue-200">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          City
                        </label>
                        <p className="text-sm font-semibold text-foreground">
                          {complaint.location.city}
                        </p>
                      </div>
                    )}
                    {complaint.location.state && (
                      <div className="p-3 bg-white rounded-lg border border-blue-200">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          State
                        </label>
                        <p className="text-sm font-semibold text-foreground">
                          {complaint.location.state}
                        </p>
                      </div>
                    )}
                    {complaint.location.pincode && (
                      <div className="p-3 bg-white rounded-lg border border-blue-200">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Pincode
                        </label>
                        <p className="text-sm font-semibold text-foreground">
                          {complaint.location.pincode}
                        </p>
                      </div>
                    )}
                    {complaint.districtName && (
                      <div className="p-3 bg-white rounded-lg border border-blue-200">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          District
                        </label>
                        <p className="text-sm font-semibold text-foreground">
                          {complaint.districtName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm text-muted-foreground">
                    No location information available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment Information */}
          {complaint.isOfficerAssigned && (
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500 rounded-lg">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-base">Assignment Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {complaint.assignedTime && (
                    <div className="p-3 bg-white rounded-lg border border-blue-200">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                        Assigned On
                      </label>
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(complaint.assignedTime).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {complaint.timeBoundary && (
                    <div className="p-3 bg-white rounded-lg border border-blue-200">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                        Time Boundary
                      </label>
                      <p className="text-sm font-semibold text-foreground">
                        {complaint.timeBoundary} days
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfficerComplaintDetailPage;

