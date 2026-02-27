import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetAllReportsQuery, useUpdateReportStatusMutation } from "../../services/reportService";
import { Eye, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ReportsDashboard() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  
  const { data: reportsData, isLoading, error } = useGetAllReportsQuery();
  const reports = reportsData?.recent_reports || [];
  const [updateReportStatus] = useUpdateReportStatusMutation();

  const getInitial = (name, fallback) => {
    const n = (name || "").trim();
    return n ? n.charAt(0).toUpperCase() : fallback;
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setAdminMessage("");
    setShowReportDialog(true);
  };

  const handleUpdateStatus = async (reportId, status, adminMessageText) => {
    try {
      await updateReportStatus({
        reportId,
        status,
        ...(adminMessageText != null && { admin_message: adminMessageText }),
      }).unwrap();
      setShowReportDialog(false);
      setAdminMessage("");
    } catch (err) {
      console.error("Failed to update report status:", err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="w-3 h-3 mr-1" />Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReasonBadge = (reason) => {
    const reasonMap = {
      'inappropriate-content': 'Inappropriate Content',
      'harassment': 'Harassment',
      'spam': 'Spam',
      'fake-profile': 'Fake Profile',
      'other': 'Other'
    };
    return reasonMap[reason] || reason;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-muted-foreground">Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Failed to load reports</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Reports Dashboard</h1>
        <p className="text-gray-600 dark:text-muted-foreground">Manage user reports and complaints</p>
      </div>

      <div className="grid gap-4">
        {reports?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600 dark:text-muted-foreground">No reports found</p>
            </CardContent>
          </Card>
        ) : (
          reports?.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={report.reporter?.profile?.profile_picture_url || report.reporter?.profile?.profile_image_url || "/placeholder.svg"} 
                        onError={(e) => {
                          e.target.src = "/placeholder.svg";
                        }}
                      />
                      <AvatarFallback>
                        {getInitial(report.reporter?.name || report.reporter?.email, "R")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {report.reported_user?.name || report.reported_user?.email || `Report #${report.id}`}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 flex-wrap">
                        <span>
                          Reported by {(report.reporter?.name || "").trim() || report.reporter?.email || "Unknown"}
                        </span>
                        {report.report_count > 1 && (
                          <Badge variant="secondary">
                            {report.report_count} reports
                          </Badge>
                        )}
                        {report.auto_suspended && (
                          <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            Auto-suspended
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(report.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(report)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-foreground">Reported User:</span>
                    <span className="text-sm text-gray-600 dark:text-muted-foreground">
                      {report.reported_user?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-foreground">Date:</span>
                    <span className="text-sm text-gray-600 dark:text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Report Detail Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-2xl bg-white dark:bg-card border-indigo-200 dark:border-white/30">
          <DialogHeader>
            <DialogTitle className="text-indigo-900 dark:text-foreground">
              Report #{selectedReport?.id} Details
            </DialogTitle>
            <DialogDescription className="text-indigo-700 dark:text-muted-foreground">
              Review the report details and take appropriate action
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-foreground mb-2">Reporter</h4>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={selectedReport.reporter?.profile?.profile_picture_url || selectedReport.reporter?.profile?.profile_image_url || "/placeholder.svg"} 
                        onError={(e) => {
                          e.target.src = "/placeholder.svg";
                        }}
                      />
                      <AvatarFallback>
                        {getInitial(selectedReport.reporter?.name, "R")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600 dark:text-muted-foreground">
                      {selectedReport.reporter?.name || selectedReport.reporter?.email || "Unknown"}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-foreground mb-2">Reported User</h4>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={selectedReport.reported_user?.profile?.profile_picture_url || selectedReport.reported_user?.profile?.profile_image_url || "/placeholder.svg"} 
                        onError={(e) => {
                          e.target.src = "/placeholder.svg";
                        }}
                      />
                      <AvatarFallback>
                        {getInitial(selectedReport.reported_user?.name, "U")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600 dark:text-muted-foreground">
                      {selectedReport.reported_user?.name || selectedReport.reported_user?.email || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Summary of how many times and by whom */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-foreground mb-2">Report Summary</h4>
                <p className="text-sm text-gray-700 dark:text-foreground mb-1">
                  Reported{" "}
                  <span className="font-semibold">
                    {selectedReport.report_count || 1}
                  </span>{" "}
                  time{(selectedReport.report_count || 1) > 1 ? "s" : ""}.
                </p>
                {Array.isArray(selectedReport.reporters) && selectedReport.reporters.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-foreground mb-1">
                      Reported by:
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-muted-foreground list-disc list-inside space-y-0.5">
                      {selectedReport.reporters.map((r) => (
                        <li key={r.id}>
                          {r.name} <span className="text-xs text-gray-500">({r.email})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-foreground mb-2">Title</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">{selectedReport.title}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-foreground mb-2">Message</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground bg-gray-50 dark:bg-card p-3 rounded-md">
                  {selectedReport.message}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-foreground mb-2">Status</h4>
                {getStatusBadge(selectedReport.status)}
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-foreground mb-2">Date Reported</h4>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  {new Date(selectedReport.created_at).toLocaleString()}
                </p>
              </div>

              {selectedReport?.status === "pending" && (
                <div className="space-y-2 pt-2 border-t border-indigo-200 dark:border-white/30">
                  <Label className="text-gray-900 dark:text-foreground font-semibold">
                    Message from admin (optional)
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground">
                    This will be sent to the reported user as: &quot;Your account has been reported. Message from the admin: [your message]&quot;
                  </p>
                  <Textarea
                    placeholder="e.g. Please review our community guidelines."
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                    className="min-h-[80px] border-indigo-200 dark:border-white/30 bg-white dark:bg-card text-gray-900 dark:text-foreground"
                    maxLength={1000}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowReportDialog(false)}
              className="border-indigo-300 dark:border-[#3A3A47] text-indigo-700 dark:text-[#3b82f6] hover:bg-indigo-100 dark:hover:bg-[#282833]"
            >
              Close
            </Button>
            {selectedReport?.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedReport.id, "dismissed")}
                  className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900"
                >
                  Dismiss
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(selectedReport.id, "resolved", adminMessage.trim() || null)}
                  className="bg-amber-600 text-white hover:bg-amber-700"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Send Warning
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
