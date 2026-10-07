"use client";

import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import axiosInstance from "@/lib/Axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import {
  AlertCircle,
  Plus,
  Link2,
  GitBranch,
  Paperclip,
  Clock,
  Download,
  Trash2,
  FileText,
} from "lucide-react";

const priorityLabels: Record<string, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const typeIcons: Record<string, string> = {
  BUG: "🐛",
  TASK: "✓",
  STORY: "📖",
};

const IssueModel = ({ issue, isOpen, onClose }: any) => {
  const { user } = useAuth();

  const [assignee, setAssignee] = useState<any>(null);
  const [commentText, setCommentText] = useState("");
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newDependencyId, setNewDependencyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localIssue, setLocalIssue] = useState<any>(null);

  // Task 6: Attachments
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Task 2: Work Logs / Time Tracking
  const [worklogs, setWorklogs] = useState<any[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [logDuration, setLogDuration] = useState("");
  const [logDescription, setLogDescription] = useState("");
  const [worklogError, setWorklogError] = useState("");

  useEffect(() => {
    if (!isOpen || !issue?.id) return;

    setLocalIssue(issue);
    setError("");
    setUploadError("");
    setWorklogError("");
    fetchSubtasks(issue.id);
    fetchAttachments(issue.id);
    fetchWorklogs(issue.id);
  }, [isOpen, issue?.id]);

  const fetchSubtasks = async (issueId: string) => {
    try {
      const res = await axiosInstance.get(`/api/issues/${issueId}/subtasks`);
      setSubtasks(res.data || []);
    } catch (err) {
      console.error("Failed to load subtasks", err);
    }
  };

  const fetchAttachments = async (issueId: string) => {
    try {
      const res = await axiosInstance.get(`/api/issues/${issueId}/attachments`);
      setAttachments(res.data || []);
    } catch (err) {
      console.error("Failed to load attachments", err);
    }
  };

  const fetchWorklogs = async (issueId: string) => {
    try {
      const [logsRes, totalRes] = await Promise.all([
        axiosInstance.get(`/api/issues/${issueId}/worklogs`),
        axiosInstance.get(`/api/issues/${issueId}/worklogs/total`),
      ]);
      setWorklogs(logsRes.data || []);
      setTotalMinutes(totalRes.data?.totalMinutes || 0);
    } catch (err) {
      console.error("Failed to load worklogs", err);
    }
  };

  useEffect(() => {
    if (!localIssue?.assigneeId) {
      setAssignee(null);
      return;
    }

    const fetchAssignee = async () => {
      try {
        const res = await axiosInstance.get(
          `/api/users/${localIssue.assigneeId}`,
        );
        setAssignee(res.data);
      } catch (err) {
        console.error("Failed to load assignee", err);
      }
    };

    fetchAssignee();
  }, [localIssue?.assigneeId]);

  const saveComment = async () => {
    if (!commentText.trim() || !user || !localIssue) return;

    try {
      setLoading(true);
      setError("");

      const newComment = {
        authorId: user.id,
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      };

      const updatedComments = [
        ...(localIssue.comments || []),
        newComment,
      ];

      const res = await axiosInstance.put(`/api/issues/${localIssue.id}`, {
        title: localIssue.title,
        description: localIssue.description,
        type: localIssue.type,
        priority: localIssue.priority,
        status: localIssue.status,
        projectId: localIssue.projectId,
        reporterId: localIssue.reporterId,
        assigneeId: localIssue.assigneeId,
        sprintId: localIssue.sprintId ?? null,
        order: localIssue.order ?? 0,
        comments: updatedComments,
        parentId: localIssue.parentId || null,
        dependsOn: localIssue.dependsOn || [],
        updatedAt: new Date().toISOString(),
      });

      setLocalIssue(res.data);
      setCommentText("");
    } catch (err: any) {
      console.error("Failed to save comment", err);
      setError(err.response?.data?.message || "Failed to save comment");
    } finally {
      setLoading(false);
    }
  };

  const createSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !localIssue) return;

    try {
      setLoading(true);
      setError("");

      await axiosInstance.post("/api/issues", {
        title: newSubtaskTitle.trim(),
        projectId: localIssue.projectId,
        parentId: localIssue.id,
        type: "TASK",
        status: "TODO",
        priority: "MEDIUM",
        description: "Subtask of " + localIssue.key,
      });

      setNewSubtaskTitle("");
      fetchSubtasks(localIssue.id);
    } catch (err: any) {
      console.error("Failed to create subtask", err);
      setError(err.response?.data?.message || "Failed to create subtask");
    } finally {
      setLoading(false);
    }
  };

  const addDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDependencyId.trim() || !localIssue) return;

    try {
      setLoading(true);
      setError("");

      const updatedDependsOn = [
        ...(localIssue.dependsOn || []),
        newDependencyId.trim(),
      ];

      const res = await axiosInstance.put(`/api/issues/${localIssue.id}`, {
        title: localIssue.title,
        description: localIssue.description,
        type: localIssue.type,
        priority: localIssue.priority,
        status: localIssue.status,
        projectId: localIssue.projectId,
        reporterId: localIssue.reporterId,
        assigneeId: localIssue.assigneeId,
        sprintId: localIssue.sprintId ?? null,
        order: localIssue.order ?? 0,
        comments: localIssue.comments || [],
        parentId: localIssue.parentId || null,
        dependsOn: updatedDependsOn,
        updatedAt: new Date().toISOString(),
      });

      setLocalIssue(res.data);
      setNewDependencyId("");
    } catch (err: any) {
      console.error("Failed to add dependency", err);
      setError(err.response?.data?.message || "Failed to add dependency. Check for circular references or invalid IDs.");
    } finally {
      setLoading(false);
    }
  };

  // Task 6: Upload Attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !localIssue) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds maximum allowed size of 10MB");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");

      const formData = new FormData();
      formData.append("file", file);

      await axiosInstance.post(`/api/issues/${localIssue.id}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchAttachments(localIssue.id);
    } catch (err: any) {
      console.error("Failed to upload attachment", err);
      setUploadError(err.response?.data?.message || "Upload failed. Allowed: PDF, PNG, JPG/JPEG, DOCX (max 10MB)");
    } finally {
      setUploading(false);
    }
  };

  // Task 6: Download Attachment
  const handleDownloadAttachment = async (att: any) => {
    try {
      const res = await axiosInstance.get(`/api/attachments/${att.id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", att.originalFilename || "download");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download attachment", err);
    }
  };

  // Task 6: Delete Attachment
  const handleDeleteAttachment = async (attId: string) => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;
    try {
      await axiosInstance.delete(`/api/attachments/${attId}`);
      if (localIssue) fetchAttachments(localIssue.id);
    } catch (err: any) {
      console.error("Failed to delete attachment", err);
      setUploadError(err.response?.data?.message || "Failed to delete attachment");
    }
  };

  // Task 2: Create Work Log
  const handleCreateWorklog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localIssue) return;

    const duration = parseInt(logDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      setWorklogError("Duration must be a positive number of minutes");
      return;
    }

    if (!logDate) {
      setWorklogError("Date is required");
      return;
    }

    try {
      setLoading(true);
      setWorklogError("");

      await axiosInstance.post(`/api/issues/${localIssue.id}/worklogs`, {
        date: logDate,
        durationMinutes: duration,
        description: logDescription.trim(),
      });

      setLogDuration("");
      setLogDescription("");
      fetchWorklogs(localIssue.id);
    } catch (err: any) {
      console.error("Failed to log work", err);
      setWorklogError(err.response?.data?.message || "Failed to log work");
    } finally {
      setLoading(false);
    }
  };

  // Task 2: Delete Work Log
  const handleDeleteWorklog = async (wlId: string) => {
    if (!window.confirm("Are you sure you want to delete this time entry?")) return;
    try {
      await axiosInstance.delete(`/api/worklogs/${wlId}`);
      if (localIssue) fetchWorklogs(localIssue.id);
    } catch (err: any) {
      console.error("Failed to delete work log", err);
      setWorklogError(err.response?.data?.message || "Failed to delete work log");
    }
  };

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours === 0) return `${m}m`;
    if (m === 0) return `${hours}h`;
    return `${hours}h ${m}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border border-border shadow-2xl bg-card text-card-foreground">
        <DialogHeader className="p-4 border-b border-border bg-secondary/30">
          <DialogTitle className="text-sm font-semibold text-muted-foreground">
            {localIssue?.key ? `${localIssue.key}: ${localIssue.title}` : "Loading issue…"}
          </DialogTitle>
        </DialogHeader>

        {!localIssue ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Loading issue…
          </div>
        ) : (
          <div className="flex flex-col md:flex-row">
            {/* Main */}
            <div className="flex-1 p-6 space-y-6">
              {error && (
                <div className="flex gap-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <h2 className="text-2xl font-semibold mb-2 text-foreground">
                  {localIssue.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {localIssue.description || "No description"}
                </p>
              </div>

              {/* Subtasks Section (Task 1) */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                  <GitBranch className="h-4 w-4 text-primary" /> Subtasks ({subtasks.length})
                </h3>
                <div className="space-y-2 mb-3">
                  {subtasks.map((st) => (
                    <div key={st.id} className="flex items-center justify-between p-2.5 rounded-md border border-border bg-card text-sm">
                      <span className="font-medium text-foreground">{st.key}: {st.title}</span>
                      <Badge variant="outline">{st.status}</Badge>
                    </div>
                  ))}
                </div>
                <form onSubmit={createSubtask} className="flex gap-2">
                  <Input
                    placeholder="Add subtask title..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="h-9 bg-background border-border text-foreground"
                  />
                  <Button type="submit" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-1" /> Add Subtask
                  </Button>
                </form>
              </div>

              {/* Dependencies Section (Task 1) */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                  <Link2 className="h-4 w-4 text-primary" /> Dependencies (Blocked By) ({localIssue.dependsOn?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {localIssue.dependsOn?.map((depId: string) => (
                    <Badge key={depId} variant="secondary" className="px-3 py-1">
                      ID: {depId}
                    </Badge>
                  ))}
                  {(!localIssue.dependsOn || localIssue.dependsOn.length === 0) && (
                    <span className="text-xs text-muted-foreground italic">No dependencies</span>
                  )}
                </div>
                <form onSubmit={addDependency} className="flex gap-2">
                  <Input
                    placeholder="Enter blocker Issue ID..."
                    value={newDependencyId}
                    onChange={(e) => setNewDependencyId(e.target.value)}
                    className="h-9 bg-background border-border text-foreground"
                  />
                  <Button type="submit" size="sm" variant="outline">
                    Add Dependency
                  </Button>
                </form>
              </div>

              {/* Task 6: File Attachments Section */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                  <Paperclip className="h-4 w-4 text-primary" /> Attachments ({attachments.length})
                </h3>
                {uploadError && (
                  <div className="flex gap-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive mb-3 border border-destructive/20">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
                <div className="space-y-2 mb-3">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-2.5 rounded-md border border-border bg-card text-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-foreground truncate">{att.originalFilename}</span>
                        <span className="text-xs text-muted-foreground">({(att.sizeBytes / 1024).toFixed(1)} KB)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadAttachment(att)}
                          title="Download"
                        >
                          <Download className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAttachment(att.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {attachments.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No files attached yet (PDF, PNG, JPG, DOCX up to 10MB)</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.png,.jpg,.jpeg,.docx"
                    className="text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    disabled={uploading}
                  />
                  {uploading && <span className="text-xs text-primary animate-pulse">Uploading...</span>}
                </div>
              </div>

              {/* Task 2: Time Tracking / Work Logs Section */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Clock className="h-4 w-4 text-primary" /> Work Logs
                  </h3>
                  <Badge variant="outline" className="font-mono">
                    Total: {formatMinutes(totalMinutes)}
                  </Badge>
                </div>

                {worklogError && (
                  <div className="flex gap-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive mb-3 border border-destructive/20">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{worklogError}</span>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {worklogs.map((wl) => (
                    <div key={wl.id} className="flex items-center justify-between p-2.5 rounded-md border border-border bg-card text-sm">
                      <div>
                        <span className="font-semibold text-foreground">{formatMinutes(wl.durationMinutes)}</span>
                        <span className="text-xs text-muted-foreground ml-2">on {wl.date}</span>
                        {wl.description && <p className="text-xs text-muted-foreground mt-0.5">{wl.description}</p>}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteWorklog(wl.id)}
                        title="Delete entry"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {worklogs.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No time logged yet</p>
                  )}
                </div>

                {/* Add Work Log Form */}
                <form onSubmit={handleCreateWorklog} className="space-y-2 bg-secondary/40 p-3 rounded-md border border-border">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">Date</label>
                      <Input
                        type="date"
                        value={logDate}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="h-8 text-xs bg-background border-border text-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">Duration (Minutes)</label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g. 60"
                        value={logDuration}
                        onChange={(e) => setLogDuration(e.target.value)}
                        className="h-8 text-xs bg-background border-border text-foreground"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Input
                      placeholder="Work description (optional)..."
                      value={logDescription}
                      onChange={(e) => setLogDescription(e.target.value)}
                      className="h-8 text-xs bg-background border-border text-foreground"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Log Time
                    </Button>
                  </div>
                </form>
              </div>

              {/* Comments Section */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-4 text-foreground">
                  Comments ({localIssue.comments?.length || 0})
                </h3>

                <div className="space-y-4 mb-6">
                  {localIssue.comments?.length > 0 ? (
                    <div className="space-y-3">
                      {localIssue.comments.map(
                        (comment: any, index: number) => (
                          <div
                            key={index}
                            className="rounded-md border border-border bg-secondary/40 p-3"
                          >
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {typeof comment === "string" ? comment : comment.text}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No comments yet
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="bg-background border-border text-foreground"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={!commentText || loading}
                        onClick={saveComment}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full md:w-[280px] p-6 border-l border-border bg-secondary/20">
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase mb-1 text-muted-foreground tracking-wider">Status</h3>
                  <Badge>{localIssue.status}</Badge>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase mb-1 text-muted-foreground tracking-wider">Type</h3>
                  <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    {typeIcons[localIssue.type] || "📌"} {localIssue.type}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase mb-1 text-muted-foreground tracking-wider">Priority</h3>
                  <Badge>{priorityLabels[localIssue.priority] || localIssue.priority}</Badge>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase mb-1 text-muted-foreground tracking-wider">Assignee</h3>
                  {assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={assignee.avatar} />
                        <AvatarFallback>{assignee.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground font-medium">{assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Unassigned</span>
                  )}
                </div>

                <div className="border-t border-border pt-3">
                  <h3 className="text-xs font-bold uppercase mb-1 text-muted-foreground tracking-wider">Time Logged</h3>
                  <span className="text-sm font-semibold text-foreground">
                    {formatMinutes(totalMinutes)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IssueModel;
