/**
 * Officer Complaint Detail Page
 * Comprehensive complaint view for officers with improved UI
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  ExternalLink,
  Image as ImageIcon,
  Tag,
  Globe,
  MessageSquare,
  MessageCircle,
  Settings,
  AlertTriangle,
  StickyNote,
  Upload,
  X,
  Download,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Minus,
} from "lucide-react";
import { complaintsService } from "@/services/complaints.service";
import {
  Complaint,
  ComplaintNote,
  ComplaintDocument,
  OfficerNote,
  OfficerAttachment,
  ComplaintExtensionRequest,
} from "@/types";
import { toast } from "sonner";
import { uploadService } from "@/services/upload.service";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * ImagePreview Component
 * Loads and displays image previews using presigned URLs
 */
const ImagePreview: React.FC<{ fileUrl: string; alt: string }> = ({
  fileUrl,
  alt,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        const url = await uploadService.getPresignedViewUrl(fileUrl);
        if (mounted) {
          setPreviewUrl(url);
        }
      } catch (err) {
        console.error("Error loading image preview:", err);
        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [fileUrl]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#011a60]/50" />
      </div>
    );
  }

  if (error || !previewUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-[#011a60]/50">
        <ImageIcon className="w-12 h-12 mb-2" />
        <span className="text-xs">Preview unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={previewUrl}
      alt={alt}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      onError={() => setError(true)}
    />
  );
};

const OfficerComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [extensionReason, setExtensionReason] = useState("");
  const [extensionDays, setExtensionDays] = useState<number>(7);
  const [closingRemarks, setClosingRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState<ComplaintNote[]>([]);
  const [notes, setNotes] = useState<OfficerNote[]>([]);
  const [adminDocuments, setAdminDocuments] = useState<ComplaintDocument[]>([]);
  const [attachments, setAttachments] = useState<OfficerAttachment[]>([]);
  const [extensionRequests, setExtensionRequests] = useState<
    ComplaintExtensionRequest[]
  >([]);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<"inward" | "outward">("inward");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<"inward" | "outward">(
    "inward"
  );
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (id) {
      loadComplaint();
    }
  }, [id]);

  const loadComplaint = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await complaintsService.getOfficerComplaintDetail(id);
      setComplaint(data.complaint);
      setAdminNotes(data.adminNotes || []);
      setNotes(data.officerNotes || []);
      setAdminDocuments(data.adminDocuments || []);
      setAttachments(data.officerAttachments || []);
      setExtensionRequests(data.extensionRequests || []);
    } catch (error: any) {
      console.error("Error loading complaint:", error);
      toast.error(error.message || "Failed to load complaint");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const closingDetails: any =
    complaint &&
    ((complaint as any).closingDetails ||
      (complaint as any).closing_details ||
      (complaint as Complaint).closingDetails);
  const isComplaintClosed =
    (complaint as any)?.isComplaintClosed ??
    (complaint as any)?.is_closed ??
    (complaint as any)?.isClosed ??
    (closingDetails?.closedAt ? true : false);
  const closingAttachments =
    (closingDetails?.attachments as any[] | undefined) || [];
  const closedAt =
    closingDetails?.closedAt || (closingDetails as any)?.closed_at || undefined;
  const closingRemarksValue = closingDetails?.remarks;

  const getStatusBadge = (status: string) => {
    const config = {
      pending: {
        bgColor: "bg-yellow-500",
        textColor: "text-white",
        icon: Clock,
        label: "Pending",
      },
      "in-progress": {
        bgColor: "bg-orange-500",
        textColor: "text-white",
        icon: AlertCircle,
        label: "In Progress",
      },
      in_progress: {
        bgColor: "bg-orange-500",
        textColor: "text-white",
        icon: AlertCircle,
        label: "In Progress",
      },
      resolved: {
        bgColor: "bg-green-500",
        textColor: "text-white",
        icon: CheckCircle,
        label: "Resolved",
      },
      rejected: {
        bgColor: "bg-red-700",
        textColor: "text-white",
        icon: XCircle,
        label: "Rejected",
      },
    };
    const statusConfig =
      config[status as keyof typeof config] || config.pending;
    const Icon = statusConfig.icon;
    return (
      <Badge
        className={`flex items-center gap-1 ${statusConfig.bgColor} ${statusConfig.textColor} border-0`}
      >
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      low: {
        iconColor: "text-green-600",
        label: "Low",
      },
      medium: {
        iconColor: "text-yellow-500",
        label: "Medium",
      },
      high: {
        iconColor: "text-orange-500",
        label: "High",
      },
      urgent: {
        iconColor: "text-red-700",
        label: "Urgent",
      },
    };
    const priorityConfig =
      config[priority as keyof typeof config] || config.medium;
    return (
      <Badge
        variant="outline"
        className="flex items-center gap-1 bg-transparent border-0 text-foreground text-white"
      >
        <Tag className={`w-3 h-3 ${priorityConfig.iconColor}`} />
        {priorityConfig.label}
      </Badge>
    );
  };

  const handleRequestExtension = async () => {
    if (!id || !extensionReason.trim() || !extensionDays) {
      toast.error("Please provide days and a reason for extension");
      return;
    }

    try {
      setActionLoading(true);
      await complaintsService.requestExtension(id, {
        days: extensionDays,
        reason: extensionReason.trim(),
      });
      toast.success("Extension request submitted");
      setShowExtensionDialog(false);
      setExtensionReason("");
      setExtensionDays(7);
      await loadComplaint();
    } catch (error: any) {
      console.error("Error requesting extension:", error);
      toast.error(error.message || "Failed to request extension");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseComplaint = async () => {
    if (!id || !closingRemarks.trim()) {
      toast.error("Please provide closing remarks");
      return;
    }

    try {
      setActionLoading(true);
      await complaintsService.closeComplaint(id, {
        remarks: closingRemarks.trim(),
      });
      toast.success("Complaint closed successfully");
      setShowCloseDialog(false);
      setClosingRemarks("");
      await loadComplaint();
    } catch (error: any) {
      console.error("Error closing complaint:", error);
      toast.error(error.message || "Failed to close complaint");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!id || !newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      setIsAddingNote(true);
      await complaintsService.addOfficerNote({
        complaintId: id,
        note: newNote.trim(),
        type: noteType,
      });
      toast.success("Note added successfully");
      setNewNote("");
      setNoteType("inward");
      await loadComplaint();
    } catch (error: any) {
      console.error("Error adding note:", error);
      toast.error(error.message || "Failed to add note");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleUploadFile = async () => {
    if (!id || !selectedFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      setIsUploadingFile(true);

      // Upload file to S3
      const isImage = selectedFile.type.startsWith("image/");
      const uploadResult = isImage
        ? await uploadService.uploadImage(selectedFile)
        : await uploadService.uploadDocument(selectedFile);

      // Add officer attachment record with S3 URL
      await complaintsService.addOfficerAttachment({
        complaintId: id,
        attachmentType: documentType,
        fileUrl: uploadResult.url,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
      });

      toast.success("File uploaded successfully");
      setSelectedFile(null);
      setFilePreview(null);
      setDocumentType("inward");
      // Reset file input
      const fileInput = document.getElementById(
        "file-upload-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      await loadComplaint();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const isImageFile = (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const getFileExtension = (url: string): string => {
    const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    return match ? match[1].toLowerCase() : "";
  };

  const getFileTypeLabel = (url: string): string => {
    const ext = getFileExtension(url);
    const typeMap: Record<string, string> = {
      pdf: "PDF Document",
      doc: "Word Document",
      docx: "Word Document",
      xls: "Excel Document",
      xlsx: "Excel Document",
      txt: "Text Document",
      jpg: "Image",
      jpeg: "Image",
      png: "Image",
      gif: "Image",
      webp: "Image",
    };
    return typeMap[ext] || "Document";
  };

  const handleViewDocument = async (fileUrl: string) => {
    if (!fileUrl) return;
    try {
      const viewUrl = await uploadService.getPresignedViewUrl(fileUrl);
      window.open(viewUrl, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast.error(error.message || "Failed to open document");
    }
  };

  const parseDateValue = (value?: string | Date | null) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatTimelineDate = (date: Date) => {
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const buildOfficerTimeline = () => {
    if (!complaint) return [];

    const events: Array<{
      id: string;
      title: string;
      date: Date;
      description?: string;
      badge?: { text: string; className: string };
      icon: React.ReactNode;
      iconBg: string;
    }> = [];

    const createdAt = parseDateValue(
      (complaint as any).created_at || complaint.createdAt
    );
    const arrivalTime = parseDateValue(
      (complaint as any).arrivalTime ||
        (complaint as any).arrival_time ||
        complaint.arrivalTime
    );
    const assignedTime = parseDateValue(
      (complaint as any).assignedTime ||
        (complaint as any).assigned_time ||
        complaint.assignedTime
    );
    const timeBoundary = complaint.timeBoundary || 7;
    const deadlineBase = arrivalTime || assignedTime || createdAt;

    if (createdAt) {
      events.push({
        id: "created",
        title: "Complaint submitted",
        date: createdAt,
        icon: <FileText className="w-4 h-4 text-[#011a60]" />,
        iconBg: "bg-[#011a60]/10",
      });
    }

    if (assignedTime) {
      events.push({
        id: "assigned",
        title: "Assigned to officer",
        date: assignedTime,
        icon: <User className="w-4 h-4 text-indigo-700" />,
        iconBg: "bg-indigo-100",
      });
    }

    if (arrivalTime) {
      events.push({
        id: "arrival",
        title: "Arrived to officer",
        date: arrivalTime,
        icon: <Clock className="w-4 h-4 text-blue-700" />,
        iconBg: "bg-blue-100",
      });
    }

    if (deadlineBase) {
      const deadline = new Date(deadlineBase);
      deadline.setDate(deadline.getDate() + timeBoundary);
      events.push({
        id: "deadline",
        title: `Deadline (${timeBoundary} days)`,
        date: deadline,
        description: "Time boundary completion date",
        badge: {
          text: "Deadline",
          className: "bg-slate-100 text-slate-700",
        },
        icon: <Calendar className="w-4 h-4 text-slate-700" />,
        iconBg: "bg-slate-100",
      });

      const compareDate = parseDateValue(closedAt) || new Date();
      if (compareDate.getTime() > deadline.getTime()) {
        const overdueDays = Math.ceil(
          (compareDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)
        );
        events.push({
          id: "overdue",
          title: "Overdue",
          date: compareDate,
          description: `${overdueDays} ${
            overdueDays === 1 ? "day" : "days"
          } past deadline`,
          badge: {
            text: "Overdue",
            className: "bg-red-100 text-red-700",
          },
          icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
          iconBg: "bg-red-100",
        });
      } else if (!isComplaintClosed) {
        const remainingDays = Math.ceil(
          (deadline.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        events.push({
          id: "remaining",
          title: "Time remaining",
          date: compareDate,
          description: `${remainingDays} ${
            remainingDays === 1 ? "day" : "days"
          } remaining until deadline`,
          badge: {
            text: "On track",
            className: "bg-emerald-100 text-emerald-700",
          },
          icon: <CheckCircle className="w-4 h-4 text-emerald-700" />,
          iconBg: "bg-emerald-100",
        });
      }
    }

    notes.forEach((note) => {
      const noteDate = parseDateValue(note.createdAt);
      if (!noteDate) return;
      const isInward = note.type === "inward";
      events.push({
        id: `note-${note._id}`,
        title: isInward ? "Inward note added" : "Outward note added",
        date: noteDate,
        description: note.content,
        badge: {
          text: isInward ? "Inward" : "Outward",
          className: isInward
            ? "bg-blue-100 text-blue-700"
            : "bg-green-100 text-green-700",
        },
        icon: isInward ? (
          <ArrowDownCircle className="w-4 h-4 text-blue-600" />
        ) : (
          <ArrowUpCircle className="w-4 h-4 text-green-600" />
        ),
        iconBg: isInward ? "bg-blue-100" : "bg-green-100",
      });
    });

    attachments.forEach((doc) => {
      const attachmentDate = parseDateValue(doc.createdAt);
      if (!attachmentDate) return;
      const isInward = doc.attachmentType === "inward";
      events.push({
        id: `attachment-${doc._id}`,
        title: isInward
          ? "Inward document uploaded"
          : "Outward document uploaded",
        date: attachmentDate,
        description: doc.fileName,
        badge: {
          text: isInward ? "Inward" : "Outward",
          className: isInward
            ? "bg-blue-100 text-blue-700"
            : "bg-green-100 text-green-700",
        },
        icon: <Upload className="w-4 h-4 text-[#011a60]" />,
        iconBg: "bg-[#011a60]/10",
      });
    });

    extensionRequests.forEach((request) => {
      const requestedAt = parseDateValue(request.createdAt);
      if (requestedAt) {
        events.push({
          id: `extension-request-${request._id}`,
          title: "Extension requested",
          date: requestedAt,
          description: `${request.daysRequested} ${
            request.daysRequested === 1 ? "day" : "days"
          } requested${request.reason ? ` • ${request.reason}` : ""}`,
          badge: {
            text: request.status === "pending" ? "Pending" : "Requested",
            className:
              request.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-orange-100 text-orange-700",
          },
          icon: <Clock className="w-4 h-4 text-orange-600" />,
          iconBg: "bg-orange-100",
        });
      }

      const decidedAt = parseDateValue(request.decidedAt);
      if (decidedAt && request.status !== "pending") {
        const isApproved = request.status === "approved";
        events.push({
          id: `extension-${request._id}-${request.status}`,
          title: isApproved ? "Extension approved" : "Extension rejected",
          date: decidedAt,
          description: request.notes,
          badge: {
            text: isApproved ? "Approved" : "Rejected",
            className: isApproved
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700",
          },
          icon: isApproved ? (
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          ),
          iconBg: isApproved ? "bg-emerald-100" : "bg-red-100",
        });
      }
    });

    closingAttachments.forEach((attachment, index) => {
      const uploadedAt = parseDateValue(
        attachment.uploadedAt || (attachment as any).uploaded_at || closedAt
      );
      if (!uploadedAt) return;
      events.push({
        id: `closing-attachment-${index}`,
        title: "Closing document uploaded",
        date: uploadedAt,
        description:
          attachment.fileName ||
          (attachment as any).file_name ||
          `Attachment ${index + 1}`,
        badge: {
          text: "Closing proof",
          className: "bg-slate-100 text-slate-700",
        },
        icon: <Upload className="w-4 h-4 text-[#011a60]" />,
        iconBg: "bg-[#011a60]/10",
      });
    });

    const closedAtDate = parseDateValue(closedAt);
    if (closedAtDate) {
      events.push({
        id: "closed",
        title: "Complaint closed",
        date: closedAtDate,
        description: closingRemarksValue,
        badge: {
          text: "Closed",
          className: "bg-emerald-100 text-emerald-700",
        },
        icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
        iconBg: "bg-emerald-100",
      });
    }

    return events
      .filter((event) => event.date)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const timelineEvents = buildOfficerTimeline();

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
        <Button onClick={() => navigate(-1)} className="mt-4">
          Back to My Complaints
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden min-w-0">
      {/* Header */}
      <Card className="border-[#011a60]/30 shadow-lg overflow-hidden min-w-0">
        <CardHeader className="bg-gradient-to-r from-[#011a60] via-[#023a9f] to-[#011a60] text-white p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/20 mt-0.5 shrink-0 text-xs sm:text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2 shrink-0" />
                Back
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3 line-clamp-3 break-words">
                  {complaint.title}
                </h1>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-white text-xs sm:text-sm">
                  {getStatusBadge(complaint.status)}
                  {getPriorityBadge(complaint.priority)}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content with Tabs */}
      <Card className="border-[#011a60]/30 shadow-lg min-w-0 overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Complaint Information</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Dropdown tab selector: full width, only for width < 700px */}
            <div className="w-full max-[700px]:block min-[700px]:hidden mb-6">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full h-10 rounded-md border border-input bg-muted/50">
                  <SelectValue placeholder="Select tab" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="details">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Complaint Details
                    </span>
                  </SelectItem>
                  <SelectItem
                    value="mlc-message"
                    disabled={!(complaint as any).drafted_letter}
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      MLC's Message
                    </span>
                  </SelectItem>
                  <SelectItem value="notes-proofs">
                    <span className="flex items-center gap-2">
                      <StickyNote className="w-4 h-4" />
                      Notes & Proofs
                    </span>
                  </SelectItem>
                  <SelectItem value="actions">
                    <span className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Actions
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Horizontal tabs: only for width >= 700px */}
            <TabsList className="grid w-full grid-cols-4 mb-6 max-[700px]:hidden min-[700px]:grid">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-[#011a60] data-[state=active]:text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Complaint Details
              </TabsTrigger>
              <TabsTrigger
                value="mlc-message"
                className="data-[state=active]:bg-[#011a60] data-[state=active]:text-white"
                disabled={!(complaint as any).drafted_letter}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                MLC's Message
              </TabsTrigger>
              <TabsTrigger
                value="notes-proofs"
                className="data-[state=active]:bg-[#011a60] data-[state=active]:text-white"
              >
                <StickyNote className="w-4 h-4 mr-2" />
                Notes & Proofs
              </TabsTrigger>
              <TabsTrigger
                value="actions"
                className="data-[state=active]:bg-[#011a60] data-[state=active]:text-white"
              >
                <Settings className="w-4 h-4 mr-2" />
                Actions
              </TabsTrigger>
            </TabsList>

            {/* Complaint Details Tab */}
            <TabsContent value="details" className="space-y-4 sm:space-y-6 mt-0 min-w-0 overflow-hidden">
              {/* Basic Information */}
              <div className="space-y-2 sm:space-y-3 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide border-b pb-1.5 sm:pb-2">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm min-w-0">
                  <div className="min-w-0">
                    <Label className="text-xs text-muted-foreground">
                      Description
                    </Label>
                    <p className="text-foreground mt-1 leading-relaxed break-words">
                      {complaint.description}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <Label className="text-xs text-muted-foreground">
                      Category
                    </Label>
                    <p className="text-foreground mt-1 capitalize break-words">
                      {complaint.category}
                      {complaint.subCategory && ` - ${complaint.subCategory}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b pb-2">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Contact Name
                    </Label>
                    <p className="text-foreground mt-1">
                      {(complaint as any).contact_name || complaint.contactName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Phone
                    </Label>
                    <p className="text-foreground mt-1">
                      {(complaint as any).contact_phone ||
                        complaint.contactPhone}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Email
                    </Label>
                    <p className="text-foreground mt-1">
                      {(complaint as any).contact_email ||
                        complaint.contactEmail ||
                        "N/A"}
                    </p>
                  </div>
                  {(complaint as any).voterId && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Voter ID
                      </Label>
                      <p className="text-foreground mt-1">
                        {(complaint as any).voterId}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Geographic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b pb-2">
                  Geographic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  {(complaint as any).village_name && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Village
                      </Label>
                      <p className="text-foreground mt-1">
                        {(complaint as any).village_name}
                      </p>
                    </div>
                  )}
                  {(complaint as any).subdistrict_name && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Sub-District
                      </Label>
                      <p className="text-foreground mt-1">
                        {(complaint as any).subdistrict_name}
                      </p>
                    </div>
                  )}
                  {(complaint as any).district_name && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        District
                      </Label>
                      <p className="text-foreground mt-1">
                        {(complaint as any).district_name}
                      </p>
                    </div>
                  )}
                  {complaint.latitude && complaint.longitude && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Coordinates
                      </Label>
                      <p className="text-foreground mt-1 text-xs">
                        {complaint.latitude.toFixed(6)},{" "}
                        {complaint.longitude.toFixed(6)}
                      </p>
                      <a
                        href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        View on Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
                {typeof complaint.location === "string" && (
                  <div className="text-sm">
                    <Label className="text-xs text-muted-foreground">
                      Location
                    </Label>
                    <p className="text-foreground mt-1">{complaint.location}</p>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b pb-2">
                  Timestamps
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Created At
                    </Label>
                    <p className="text-foreground mt-1">
                      {(complaint as any).created_at || complaint.createdAt
                        ? new Date(
                            (complaint as any).created_at || complaint.createdAt
                          ).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  {(complaint as any).updated_at && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Updated At
                      </Label>
                      <p className="text-foreground mt-1">
                        {new Date(
                          (complaint as any).updated_at
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {(complaint as any).arrivalTime && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Arrival Time
                      </Label>
                      <p className="text-foreground mt-1">
                        {new Date(
                          (complaint as any).arrivalTime
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {(complaint as any).assignedTime && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Assigned Time
                      </Label>
                      <p className="text-foreground mt-1">
                        {new Date(
                          (complaint as any).assignedTime
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Officer Timeline */}
              <div className="space-y-3 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide border-b pb-2">
                  Officer Timeline
                </h3>
                {timelineEvents.length === 0 ? (
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    No timeline events available yet.
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {timelineEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-2 sm:gap-3 rounded-lg border border-[#011a60]/10 bg-white p-2.5 sm:p-3 min-w-0 overflow-hidden"
                      >
                        <div
                          className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full ${event.iconBg}`}
                        >
                          {event.icon}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-2">
                            <p className="text-xs sm:text-sm font-semibold text-foreground break-words">
                              {event.title}
                            </p>
                            <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                              {formatTimelineDate(event.date)}
                            </span>
                          </div>
                          {event.badge && (
                            <Badge
                              className={`mt-1 border-0 text-[10px] sm:text-xs ${event.badge.className}`}
                            >
                              {event.badge.text}
                            </Badge>
                          )}
                          {event.description && (
                            <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground whitespace-pre-wrap break-words">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assignment Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b pb-2">
                  Assignment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {/* <div>
                <Label className="text-xs text-muted-foreground">
                  Officer Assigned
                </Label>
                <p className="text-foreground mt-1">
                  {(complaint as any).isOfficerAssigned ? "Yes" : "No"}
                </p>
              </div> */}
                  {/* {(complaint as any).assignedOfficer && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Assigned Officer ID
                  </Label>
                  <p className="text-foreground mt-1 text-xs font-mono">
                    {typeof (complaint as any).assignedOfficer === "string"
                      ? (complaint as any).assignedOfficer
                      : (complaint as any).assignedOfficer?.name || "N/A"}
                  </p>
                </div>
              )} */}
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Status
                    </Label>
                    <p className="text-foreground mt-1">
                      {isComplaintClosed ? "Closed" : "Open"}
                      {(complaint as any).isExtended && " (Extended)"}
                    </p>
                  </div>
                  {complaint.timeBoundary && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Time Boundary
                      </Label>
                      <p className="text-foreground mt-1">
                        {complaint.timeBoundary} days
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* User-Provided Documents (Images, PDFs, etc.) */}
              {(complaint as any).images &&
                Array.isArray((complaint as any).images) &&
                (complaint as any).images.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b pb-2">
                      User-Provided Documents (
                      {(complaint as any).images.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(complaint as any).images.map(
                        (fileUrl: string, index: number) => {
                          const isImage = isImageFile(fileUrl);
                          const fileType = getFileTypeLabel(fileUrl);
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleViewDocument(fileUrl)}
                              className="group relative flex flex-col border border-[#011a60]/30 rounded-lg hover:border-[#011a60]/60 hover:shadow-md transition-all w-full text-left bg-white overflow-hidden"
                            >
                              {isImage ? (
                                <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                                  <ImagePreview
                                    fileUrl={fileUrl}
                                    alt={`Image ${index + 1}`}
                                  />
                                  <div className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink className="w-4 h-4 text-[#011a60]" />
                                  </div>
                                </div>
                              ) : (
                                <div className="relative w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center">
                                  <FileText className="w-16 h-16 text-[#011a60]/70 mb-2" />
                                  <span className="text-xs text-[#011a60]/60 font-medium">
                                    {fileType}
                                  </span>
                                  <div className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ExternalLink className="w-4 h-4 text-[#011a60]" />
                                  </div>
                                </div>
                              )}
                              <div className="p-3 bg-white border-t border-[#011a60]/10">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {isImage
                                    ? `Image ${index + 1}`
                                    : `Document ${index + 1}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {fileType}
                                </p>
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {/* Documents */}
              {complaint.documents && complaint.documents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b pb-2">
                    Documents ({complaint.documents.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {complaint.documents.map((doc, index) => {
                      const isImage = isImageFile(doc.fileUrl);
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleViewDocument(doc.fileUrl)}
                          className="group relative flex flex-col border border-[#011a60]/30 rounded-lg hover:border-[#011a60]/60 hover:shadow-md transition-all w-full text-left bg-white overflow-hidden"
                        >
                          {isImage ? (
                            <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                              <ImagePreview
                                fileUrl={doc.fileUrl}
                                alt={doc.fileName || `Document ${index + 1}`}
                              />
                              <div className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink className="w-4 h-4 text-[#011a60]" />
                              </div>
                            </div>
                          ) : (
                            <div className="relative w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center">
                              <FileText className="w-16 h-16 text-[#011a60]/70 mb-2" />
                              <span className="text-xs text-[#011a60]/60 font-medium uppercase">
                                {getFileTypeLabel(doc.fileUrl)}
                              </span>
                              <div className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink className="w-4 h-4 text-[#011a60]" />
                              </div>
                            </div>
                          )}
                          <div className="p-3 bg-white border-t border-[#011a60]/10">
                            <p className="text-sm font-medium text-foreground truncate">
                              {doc.fileName || `Document ${index + 1}`}
                            </p>
                            {doc.fileType && (
                              <p className="text-xs text-muted-foreground">
                                {doc.fileType}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Closing Attachments */}
              {closingAttachments.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b pb-2">
                    Closing Attachments ({closingAttachments.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {closingAttachments.map(
                      (attachment: any, index: number) => {
                        const url = attachment.url || attachment.fileUrl;
                        const fileName =
                          attachment.fileName ||
                          attachment.file_name ||
                          `Attachment ${index + 1}`;
                        const fileType =
                          attachment.fileType || attachment.file_type || "";
                        const uploadedBy =
                          attachment.uploadedBy || attachment.uploaded_by;
                        const uploadedAt =
                          attachment.uploadedAt || attachment.uploaded_at;
                        const isImage = isImageFile(url);

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleViewDocument(url)}
                            className="group relative flex flex-col border border-emerald-200 rounded-lg hover:border-emerald-400 hover:shadow-md transition-all w-full text-left bg-white overflow-hidden"
                          >
                            {isImage ? (
                              <div className="relative w-full h-48 bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center overflow-hidden">
                                <ImagePreview fileUrl={url} alt={fileName} />
                                <div className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ExternalLink className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-md shadow-sm">
                                  Closing Proof
                                </div>
                              </div>
                            ) : (
                              <div className="relative w-full h-48 bg-gradient-to-br from-emerald-50 to-green-100 flex flex-col items-center justify-center">
                                <FileText className="w-16 h-16 text-emerald-600/70 mb-2" />
                                <span className="text-xs text-emerald-600/60 font-medium uppercase">
                                  {getFileTypeLabel(url)}
                                </span>
                                <div className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ExternalLink className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-md shadow-sm">
                                  Closing Proof
                                </div>
                              </div>
                            )}
                            <div className="p-3 bg-white border-t border-emerald-200">
                              <p className="text-sm font-medium text-foreground truncate">
                                {fileName}
                              </p>
                              {(fileType || uploadedBy || uploadedAt) && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {[fileType, uploadedBy]
                                    .filter(Boolean)
                                    .join(" • ")}
                                  {uploadedAt
                                    ? ` • ${new Date(
                                        uploadedAt
                                      ).toLocaleDateString()}`
                                    : ""}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* MLC's Message Tab */}
            <TabsContent value="mlc-message" className="mt-0">
              {(complaint as any).drafted_letter ? (
                <div className="space-y-6">
                  {/* Formal Letter Display */}
                  <div className="bg-white border-2 border-[#011a60]/30 rounded-lg shadow-lg overflow-hidden">
                    {/* Letter Paper Effect */}
                    <div className="bg-gradient-to-br from-amber-50/30 via-white to-amber-50/30 p-8 md:p-12 lg:p-16">
                      <div className="max-w-4xl mx-auto space-y-8">
                        {/* From Section - Right Aligned */}
                        <div className="text-right border-b border-[#011a60]/10 pb-4">
                          <p className="text-base md:text-lg font-bold text-[#011a60] tracking-wide">
                            {(complaint as any).drafted_letter.from}
                          </p>
                        </div>

                        {/* Date - Right Aligned */}
                        <div className="text-right">
                          <p className="text-sm md:text-base text-gray-700 font-medium">
                            दिनांक:{" "}
                            <span className="text-[#011a60]">
                              {new Date(
                                (complaint as any).drafted_letter.date
                              ).toLocaleDateString("hi-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </p>
                        </div>

                        {/* To Section - Left Aligned */}
                        <div className="mt-10 border-l-4 border-[#011a60]/30 pl-4">
                          <div className="whitespace-pre-line text-sm md:text-base text-gray-800 leading-relaxed font-medium">
                            {(complaint as any).drafted_letter.to}
                          </div>
                        </div>

                        {/* Subject - Left Aligned with underline effect */}
                        <div className="mt-8 pt-4 border-t border-[#011a60]/10">
                          <p className="text-sm md:text-base font-bold text-[#011a60] leading-relaxed">
                            {(complaint as any).drafted_letter.subject}
                          </p>
                        </div>

                        {/* Body - Justified text for formal look */}
                        <div className="mt-8">
                          <div className="whitespace-pre-line text-sm md:text-base text-gray-800 leading-relaxed text-justify font-normal">
                            {(complaint as any).drafted_letter.body}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attachments Section */}
                  {(complaint as any).drafted_letter.attachments &&
                  Array.isArray(
                    (complaint as any).drafted_letter.attachments
                  ) &&
                  (complaint as any).drafted_letter.attachments.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide border-b pb-2">
                        Attachments (
                        {(complaint as any).drafted_letter.attachments.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(complaint as any).drafted_letter.attachments.map(
                          (attachment: string, index: number) => (
                            <a
                              key={index}
                              href={attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 border border-[#011a60]/30 rounded-lg hover:border-[#011a60]/60 transition-all"
                            >
                              <FileText className="w-5 h-5 text-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  Attachment {index + 1}
                                </p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No drafted letter available
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Notes and Proofs Tab */}
            <TabsContent value="notes-proofs" className="mt-0">
              <div className="space-y-6">
                {/* Add Note Section */}
                <Card className="border-[#011a60]/30 min-w-0 overflow-hidden">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
                      <StickyNote className="w-4 h-4 sm:w-5 sm:h-5 text-[#011a60] shrink-0" />
                      <span className="truncate">Add Note</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Add a note to track your progress or observations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                    <div className="space-y-1.5 sm:space-y-2 min-w-0">
                      <Label className="text-xs sm:text-sm">Note Type</Label>
                      <div className="flex flex-wrap gap-3 sm:gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="noteType"
                            value="inward"
                            checked={noteType === "inward"}
                            onChange={(e) =>
                              setNoteType(
                                e.target.value as "inward" | "outward"
                              )
                            }
                            className="w-4 h-4 text-[#011a60]"
                          />
                            <div className="flex items-center gap-2">
                            <ArrowDownCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                            <span className="text-xs sm:text-sm font-medium">Inward</span>
                          </div>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="noteType"
                            value="outward"
                            checked={noteType === "outward"}
                            onChange={(e) =>
                              setNoteType(
                                e.target.value as "inward" | "outward"
                              )
                            }
                            className="w-4 h-4 text-[#011a60]"
                          />
                          <div className="flex items-center gap-2">
                            <ArrowUpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                            <span className="text-xs sm:text-sm font-medium">Outward</span>
                          </div>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 min-w-0">
                      <Label htmlFor="new-note" className="text-xs sm:text-sm">Note Content</Label>
                      <Textarea
                        id="new-note"
                        placeholder="Enter your note here..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={3}
                        className="resize-none text-sm min-w-0 max-w-full"
                        maxLength={2000}
                      />
                      <p className="text-[10px] sm:text-xs text-muted-foreground text-right">
                        {newNote.length}/2000 characters
                      </p>
                    </div>
                    <Button
                      onClick={handleAddNote}
                      disabled={isAddingNote || !newNote.trim()}
                      className="bg-[#011a60] hover:bg-[#023a9f] w-full sm:w-auto text-sm"
                    >
                      {isAddingNote ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <StickyNote className="w-4 h-4 mr-2" />
                          Add Note
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Admin Notes - Orange (read-only, same as admin panel) */}
                <Card className="border-orange-200 shadow-sm">
                  <CardHeader className="bg-orange-50/50 border-b border-orange-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <StickyNote className="w-5 h-5 text-orange-600" />
                        Admin Notes ({adminNotes.length})
                      </CardTitle>
                      <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0">
                        Admin
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {adminNotes.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">
                        No admin notes yet
                      </p>
                    ) : (
                      <div className="relative space-y-4">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-orange-200 rounded-full" />
                        {adminNotes.map((note) => (
                          <div
                            key={note._id || (note as any).id}
                            className="relative pl-12"
                          >
                            <div className="absolute left-0 top-1.5 w-8 h-8 rounded-full bg-orange-500 border-4 border-background shadow flex items-center justify-center">
                              <MessageCircle className="w-3 h-3 text-white" />
                            </div>
                            <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4 shadow-sm">
                              <p className="text-sm text-foreground whitespace-pre-wrap">
                                {note.content || (note as any).note}
                              </p>
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-orange-100">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {note.createdAt
                                    ? new Date(note.createdAt).toLocaleString()
                                    : "—"}
                                </span>
                                {note.createdBy && (
                                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {note.createdBy}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notes List - Officer (navy theme) */}
                <Card className="border-[#011a60]/30 shadow-sm">
                  <CardHeader className="bg-[#011a60]/5 border-b border-[#011a60]/20">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <StickyNote className="w-5 h-5 text-[#011a60]" />
                        Officer Notes ({notes.length})
                      </CardTitle>
                      <Badge className="bg-[#011a60] hover:bg-[#011a60]/90 text-white border-0">
                        Officer
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {notes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <StickyNote className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No officer notes added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notes.map((note) => (
                          <div
                            key={note._id}
                            className="border border-[#011a60]/30 rounded-xl p-4 bg-[#011a60]/5 shadow-sm"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />

                                <Badge
                                  variant="outline"
                                  className={
                                    note.type === "inward"
                                      ? "border-blue-500 text-blue-700 bg-blue-50"
                                      : "border-green-500 text-green-700 bg-green-50"
                                  }
                                >
                                  {note.type === "inward" ? (
                                    <>
                                      <ArrowDownCircle className="w-3 h-3 mr-1" />
                                      Inward
                                    </>
                                  ) : (
                                    <>
                                      <ArrowUpCircle className="w-3 h-3 mr-1" />
                                      Outward
                                    </>
                                  )}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(note.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {note.content}
                            </p>
                            {note.attachments &&
                              note.attachments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    Attachments ({note.attachments.length})
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {note.attachments.map((url, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleViewDocument(url)}
                                        className="flex items-center gap-2 p-2 border border-[#011a60]/20 rounded hover:border-[#011a60]/40 transition-colors text-sm w-full text-left"
                                      >
                                        <FileText className="w-4 h-4 text-foreground" />
                                        <span className="truncate">
                                          Attachment {idx + 1}
                                        </span>
                                        <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Upload File Section */}
                <Card className="border-[#011a60]/30 min-w-0 overflow-hidden">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-[#011a60] shrink-0" />
                      <span className="truncate">Upload Document/Image</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Upload images or documents as proof of your actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                    {/* Document Type Selection */}
                    <div className="space-y-1.5 sm:space-y-2 min-w-0">
                      <Label className="text-xs sm:text-sm">Document Type</Label>
                      <div className="flex flex-wrap gap-3 sm:gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="documentType"
                            value="inward"
                            checked={documentType === "inward"}
                            onChange={(e) =>
                              setDocumentType(
                                e.target.value as "inward" | "outward"
                              )
                            }
                            className="w-4 h-4 text-[#011a60]"
                          />
                          <div className="flex items-center gap-2">
                            <ArrowDownCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                            <span className="text-xs sm:text-sm font-medium">Inward</span>
                          </div>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="documentType"
                            value="outward"
                            checked={documentType === "outward"}
                            onChange={(e) =>
                              setDocumentType(
                                e.target.value as "inward" | "outward"
                              )
                            }
                            className="w-4 h-4 text-[#011a60]"
                          />
                          <div className="flex items-center gap-2">
                            <ArrowUpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                            <span className="text-xs sm:text-sm font-medium">Outward</span>
                          </div>
                        </label>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
                        Inward: received · Outward: sent
                      </p>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-1.5 sm:space-y-2 min-w-0">
                      <Label htmlFor="file-upload-input" className="text-xs sm:text-sm">Select File</Label>
                      <div className="border-2 border-dashed border-[#011a60]/30 rounded-lg p-4 sm:p-6 hover:border-[#011a60]/50 transition-colors min-w-0">
                        <input
                          id="file-upload-input"
                          type="file"
                          onChange={handleFileSelect}
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                          className="hidden"
                        />
                        <label
                          htmlFor="file-upload-input"
                          className="flex flex-col items-center justify-center cursor-pointer"
                        >
                          {filePreview ? (
                            <div className="space-y-2">
                              <img
                                src={filePreview}
                                alt="Preview"
                                className="max-h-48 rounded-lg border border-[#011a60]/20"
                              />
                              <p className="text-sm text-muted-foreground">
                                {selectedFile?.name}
                              </p>
                            </div>
                          ) : selectedFile ? (
                            <div className="space-y-2 text-center">
                              <FileText className="w-12 h-12 mx-auto text-[#011a60]/50" />
                              <p className="text-sm font-medium text-foreground">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(selectedFile.size)}
                              </p>
                            </div>
                          ) : (
                            <div className="text-center space-y-1.5 sm:space-y-2 min-w-0">
                              <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-[#011a60]/50" />
                              <p className="text-xs sm:text-sm font-medium text-foreground px-1">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground px-1 break-words">
                                Images, PDF, DOC, DOCX, XLS, XLSX, TXT (Max 10MB)
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                      {selectedFile && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            setFilePreview(null);
                            const fileInput = document.getElementById(
                              "file-upload-input"
                            ) as HTMLInputElement;
                            if (fileInput) fileInput.value = "";
                          }}
                          className="w-full"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove File
                        </Button>
                      )}
                    </div>

                    <Button
                      onClick={handleUploadFile}
                      disabled={isUploadingFile || !selectedFile}
                      className="w-full bg-[#011a60] hover:bg-[#023a9f]"
                    >
                      {isUploadingFile ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload File
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Admin Documents - Orange (read-only, same as admin panel) */}
                <Card className="border-orange-200 shadow-sm min-w-0 overflow-hidden">
                  <CardHeader className="bg-orange-50/50 border-b border-orange-200 p-4 sm:p-6">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 shrink-0" />
                        <span className="truncate">Admin Documents ({adminDocuments.length})</span>
                      </CardTitle>
                      <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 text-xs shrink-0">
                        Admin
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 p-4 sm:p-6">
                    {adminDocuments.length === 0 ? (
                      <p className="text-xs sm:text-sm text-muted-foreground py-4">
                        No admin documents yet
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 min-w-0">
                        {adminDocuments.map((doc) => {
                          const isPdf =
                            doc.fileName?.toLowerCase().endsWith(".pdf") ||
                            doc.fileUrl?.toLowerCase().includes(".pdf");
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                            doc.fileName || ""
                          );
                          return (
                            <div
                              key={doc._id}
                              className="bg-orange-50/50 border border-orange-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition-all min-w-0 overflow-hidden"
                            >
                              <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                                <div
                                  className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                                    isPdf
                                      ? "bg-red-100"
                                      : isImage
                                      ? "bg-blue-100"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  <FileText
                                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                      isPdf
                                        ? "text-red-600"
                                        : isImage
                                        ? "text-blue-600"
                                        : "text-gray-600"
                                    }`}
                                  />
                                </div>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <p className="text-xs sm:text-sm font-semibold truncate">
                                    {doc.fileName}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
                                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                                    {doc.createdAt
                                      ? new Date(doc.createdAt).toLocaleString()
                                      : "—"}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 min-w-0">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        doc.fileType === "inward"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : "bg-green-50 text-green-700 border-green-200"
                                      }`}
                                    >
                                      {doc.fileType}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleViewDocument(doc.fileUrl)
                                      }
                                      className="h-7 px-2 text-xs"
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      View
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Documents List - Officer (navy theme) */}
                <Card className="border-[#011a60]/30 shadow-sm">
                  <CardHeader className="bg-[#011a60]/5 border-b border-[#011a60]/20">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#011a60]" />
                        Officer Uploaded Documents ({attachments.length})
                      </CardTitle>
                      <Badge className="bg-[#011a60] hover:bg-[#011a60]/90 text-white border-0">
                        Officer
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {attachments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No documents uploaded yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {attachments.map((doc) => {
                          const isImage = isImageFile(doc.fileUrl);
                          const isInward = doc.attachmentType === "inward";
                          return (
                            <div
                              key={doc._id}
                              className="group relative flex flex-col border border-[#011a60]/30 rounded-xl hover:border-[#011a60]/50 hover:shadow-md transition-all bg-[#011a60]/5 overflow-hidden"
                            >
                              {/* Image/Document Preview */}
                              {isImage ? (
                                <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                                  <ImagePreview
                                    fileUrl={doc.fileUrl}
                                    alt={doc.fileName}
                                  />
                                  <div className="absolute top-2 left-2 z-10">
                                    <Badge
                                      variant="outline"
                                      className={
                                        isInward
                                          ? "border-blue-500 text-blue-700 bg-blue-50/95 backdrop-blur-sm"
                                          : "border-green-500 text-green-700 bg-green-50/95 backdrop-blur-sm"
                                      }
                                    >
                                      {isInward ? (
                                        <>
                                          <ArrowDownCircle className="w-3 h-3 mr-1" />
                                          Inward
                                        </>
                                      ) : (
                                        <>
                                          <ArrowUpCircle className="w-3 h-3 mr-1" />
                                          Outward
                                        </>
                                      )}
                                    </Badge>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`relative w-full h-48 bg-gradient-to-br ${
                                    isInward
                                      ? "from-blue-50 to-indigo-50"
                                      : "from-green-50 to-emerald-50"
                                  } flex flex-col items-center justify-center`}
                                >
                                  <FileText
                                    className={`w-16 h-16 mb-2 ${
                                      isInward
                                        ? "text-blue-600/70"
                                        : "text-green-600/70"
                                    }`}
                                  />
                                  <span
                                    className={`text-xs font-medium uppercase ${
                                      isInward
                                        ? "text-blue-600/60"
                                        : "text-green-600/60"
                                    }`}
                                  >
                                    {getFileTypeLabel(doc.fileUrl)}
                                  </span>
                                  <div className="absolute top-2 left-2">
                                    <Badge
                                      variant="outline"
                                      className={
                                        isInward
                                          ? "border-blue-500 text-blue-700 bg-blue-50/95 backdrop-blur-sm"
                                          : "border-green-500 text-green-700 bg-green-50/95 backdrop-blur-sm"
                                      }
                                    >
                                      {isInward ? (
                                        <>
                                          <ArrowDownCircle className="w-3 h-3 mr-1" />
                                          Inward
                                        </>
                                      ) : (
                                        <>
                                          <ArrowUpCircle className="w-3 h-3 mr-1" />
                                          Outward
                                        </>
                                      )}
                                    </Badge>
                                  </div>
                                </div>
                              )}

                              {/* Document Info */}
                              <div className="p-3 bg-white border-t border-[#011a60]/10">
                                <p className="text-sm font-medium text-foreground truncate mb-1">
                                  {doc.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {formatFileSize(doc.fileSize)} •{" "}
                                  {new Date(doc.createdAt).toLocaleDateString()}
                                </p>
                                <div className="flex items-center gap-2 pt-2 border-t border-[#011a60]/5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-8 text-xs"
                                    onClick={() =>
                                      handleViewDocument(doc.fileUrl)
                                    }
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-8 text-xs"
                                    onClick={async () => {
                                      try {
                                        const viewUrl =
                                          await uploadService.getPresignedViewUrl(
                                            doc.fileUrl
                                          );
                                        const a = document.createElement("a");
                                        a.href = viewUrl;
                                        a.download = doc.fileName || "download";
                                        a.target = "_blank";
                                        a.rel = "noopener noreferrer";
                                        a.click();
                                      } catch (e: any) {
                                        toast.error(
                                          e.message || "Failed to download"
                                        );
                                      }
                                    }}
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="mt-0">
              <div className="space-y-6">
                {/* Status Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-[#011a60]/20 rounded-lg p-4 sm:p-6 min-w-0 overflow-hidden">
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div className="p-2 sm:p-3 bg-[#011a60]/10 rounded-lg shrink-0">
                      <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#011a60]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-[#011a60] mb-1.5 sm:mb-2">
                        Complaint Status
                      </h3>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <span className="text-muted-foreground shrink-0">Status:</span>
                          <span className="font-medium text-foreground truncate">
                            {isComplaintClosed ? "Closed" : "Open"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <span className="text-muted-foreground shrink-0">
                            Time Boundary:
                          </span>
                          <span className="font-medium text-foreground truncate">
                            {complaint.timeBoundary || 7} days
                          </span>
                        </div>
                        {(complaint as any).isExtended && (
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="text-muted-foreground shrink-0">Extension:</span>
                            <Badge className="bg-orange-500 text-white text-xs shrink-0">Extended</Badge>
                          </div>
                        )}
                        {isComplaintClosed && (
                          <>
                            {closedAt && (
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 min-w-0">
                                <span className="text-muted-foreground shrink-0">Closed At:</span>
                                <span className="font-medium text-foreground text-xs sm:text-sm break-all">
                                  {new Date(closedAt).toLocaleString()}
                                </span>
                              </div>
                            )}
                            {closingRemarksValue && (
                              <div className="mt-2 min-w-0">
                                <span className="text-muted-foreground block mb-1 text-xs sm:text-sm">
                                  Closing Remarks:
                                </span>
                                <p className="text-foreground text-xs sm:text-sm leading-relaxed break-words">
                                  {closingRemarksValue}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extension Requests History */}
                {extensionRequests.length > 0 && (
                  <Card className="border-[#011a60]/30 min-w-0 overflow-hidden">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#011a60] shrink-0" />
                        <span className="truncate">Extension Requests ({extensionRequests.length})</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        History of all extension requests for this complaint
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="space-y-3 sm:space-y-4">
                        {extensionRequests
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime()
                          )
                          .map((request) => (
                            <div
                              key={request._id}
                              className="border border-[#011a60]/20 rounded-lg p-3 sm:p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50 min-w-0 overflow-hidden"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2 sm:mb-3 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                                  <Badge
                                    className={`text-xs shrink-0 ${
                                      request.status === "pending"
                                        ? "bg-yellow-500 text-white"
                                        : request.status === "approved"
                                        ? "bg-green-500 text-white"
                                        : "bg-red-500 text-white"
                                    }`}
                                  >
                                    {request.status === "pending"
                                      ? "Pending"
                                      : request.status === "approved"
                                      ? "Approved"
                                      : "Rejected"}
                                  </Badge>
                                  <span className="text-xs sm:text-sm text-muted-foreground">
                                    {request.daysRequested} day
                                    {request.daysRequested !== 1 ? "s" : ""} requested
                                  </span>
                                </div>
                                <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0 break-all">
                                  {new Date(request.createdAt).toLocaleString()}
                                </span>
                              </div>
                              {request.reason && (
                                <div className="mb-2 sm:mb-3 min-w-0">
                                  <p className="text-xs sm:text-sm font-medium text-foreground mb-0.5">
                                    Reason:
                                  </p>
                                  <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap break-words">
                                    {request.reason}
                                  </p>
                                </div>
                              )}
                              {request.status !== "pending" && (
                                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[#011a60]/10 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[10px] sm:text-xs text-muted-foreground break-words">
                                    <span>
                                      {request.status === "approved" ? "Approved" : "Rejected"}{" "}
                                      {request.decidedAt &&
                                        `on ${new Date(request.decidedAt).toLocaleDateString()}`}
                                    </span>
                                    {request.notes && (
                                      <span className="text-foreground truncate">{request.notes}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
                  {/* Request Extension Card */}
                  <Card className="border-2 border-orange-200 hover:border-orange-300 transition-colors min-w-0 overflow-hidden">
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg shrink-0">
                          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base sm:text-lg truncate">
                            Request Term Extension
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm line-clamp-2">
                            Request additional time to act on this complaint
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-4 sm:line-clamp-none break-words">
                        If you need more time to resolve this complaint, you can
                        request an extension. Please provide a valid reason for
                        the extension request.
                      </p>
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                        <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span>Extension requests are subject to approval</span>
                      </div>
                      <Button
                        onClick={() => setShowExtensionDialog(true)}
                        disabled={
                          isComplaintClosed ||
                          actionLoading ||
                          (complaint as any).isExtended
                        }
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                        variant="default"
                      >
                        {(complaint as any).isExtended ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Already Extended
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 mr-2" />
                            Request Extension
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Close Complaint Card */}
                  <Card className="border-2 border-green-200 hover:border-green-300 transition-colors min-w-0 overflow-hidden">
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg shrink-0">
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base sm:text-lg truncate">
                            Close Complaint
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm line-clamp-2">
                            Mark this complaint as resolved and closed
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-4 sm:line-clamp-none break-words">
                        Once you have completed all necessary actions on this
                        complaint, you can close it. Please provide closing
                        remarks describing the resolution.
                      </p>
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                        <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span>This action cannot be undone easily</span>
                      </div>
                      <Button
                        onClick={() => setShowCloseDialog(true)}
                        disabled={isComplaintClosed || actionLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        variant="default"
                      >
                        {isComplaintClosed ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Already Closed
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Close Complaint
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Extension Request Dialog */}
      <Dialog open={showExtensionDialog} onOpenChange={setShowExtensionDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              Request Term Extension
            </DialogTitle>
            <DialogDescription className="text-base">
              Request more time to act on this complaint. This will be sent to
              the admin for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Extension Days Input */}
            <div className="space-y-3">
              <Label htmlFor="extension-days" className="text-sm font-semibold">
                Extension (days) <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-lg border-2 hover:border-orange-400 hover:bg-orange-50"
                  onClick={() =>
                    setExtensionDays((prev) => Math.max(1, prev - 1))
                  }
                  disabled={extensionDays <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    id="extension-days"
                    type="number"
                    min={1}
                    max={365}
                    value={extensionDays}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= 1 && value <= 365) {
                        setExtensionDays(value);
                      }
                    }}
                    className="text-center text-lg font-semibold h-11 border-2 focus-visible:border-orange-400 focus-visible:ring-orange-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-normal">
                    days
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-lg border-2 hover:border-orange-400 hover:bg-orange-50"
                  onClick={() =>
                    setExtensionDays((prev) => Math.min(365, prev + 1))
                  }
                  disabled={extensionDays >= 365}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>Minimum: 1 day</span>
                <span>Maximum: 365 days</span>
              </div>
              {/* Quick Selection Buttons */}
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground self-center">
                  Quick select:
                </span>
                {[3, 7, 14, 30].map((days) => (
                  <Button
                    key={days}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setExtensionDays(days)}
                    className={`text-xs ${
                      extensionDays === days
                        ? "bg-orange-100 border-orange-400 text-orange-700 hover:bg-orange-100"
                        : ""
                    }`}
                  >
                    {days} days
                  </Button>
                ))}
              </div>
            </div>

            {/* Reason for Extension */}
            <div className="space-y-3">
              <Label
                htmlFor="extension-reason"
                className="text-sm font-semibold"
              >
                Reason for Extension <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="extension-reason"
                placeholder="Please provide a detailed explanation for why you need additional time to resolve this complaint. Include specific reasons such as pending documentation, coordination with other departments, or complexity of the case..."
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                rows={5}
                className="resize-none border-2 focus-visible:border-orange-400 focus-visible:ring-orange-400"
                maxLength={1000}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {extensionReason.length === 0 ? (
                    <span className="text-amber-600">⚠ Reason is required</span>
                  ) : extensionReason.length < 50 ? (
                    <span className="text-amber-600">
                      Please provide more detail ({50 - extensionReason.length}{" "}
                      more characters recommended)
                    </span>
                  ) : (
                    <span className="text-green-600">
                      ✓ Good detail provided
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {extensionReason.length}/1000
                </p>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    Extension Request Information
                  </p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Your extension request will be reviewed by an administrator.
                    The current time boundary for this complaint is{" "}
                    <strong className="font-semibold">
                      {complaint?.timeBoundary || 7} days
                    </strong>
                    . You are requesting an additional{" "}
                    <strong className="font-semibold">
                      {extensionDays} {extensionDays === 1 ? "day" : "days"}
                    </strong>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowExtensionDialog(false);
                setExtensionReason("");
                setExtensionDays(7);
              }}
              disabled={actionLoading}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestExtension}
              disabled={
                actionLoading ||
                !extensionReason.trim() ||
                !extensionDays ||
                extensionDays < 1
              }
              className="bg-orange-600 hover:bg-orange-700 min-w-[140px]"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Complaint Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Close Complaint
            </DialogTitle>
            <DialogDescription>
              Please provide closing remarks describing how this complaint was
              resolved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="closing-remarks">
                Closing Remarks <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="closing-remarks"
                placeholder="Please describe the actions taken and how the complaint was resolved..."
                value={closingRemarks}
                onChange={(e) => setClosingRemarks(e.target.value)}
                rows={5}
                className="resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {closingRemarks.length}/2000 characters
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  Once closed, this complaint will be marked as resolved. Make
                  sure all necessary actions have been completed before closing.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCloseDialog(false);
                setClosingRemarks("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCloseComplaint}
              disabled={actionLoading || !closingRemarks.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Closing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Close Complaint
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficerComplaintDetailPage;
