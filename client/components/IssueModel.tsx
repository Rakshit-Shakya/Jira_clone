"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import axiosInstance from "@/lib/Axiosinstance";
import { useAuth } from "@/lib/AuthContext";
import { AlertCircle, Plus, CheckCircle2, Link2, GitBranch } from "lucide-react";

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

  useEffect(() => {
    if (!isOpen || !issue?.id) return;

    setLocalIssue(issue);
    setError("");
    fetchSubtasks(issue.id);
  }, [isOpen, issue?.id]);

  const fetchSubtasks = async (issueId: string) => {
    try {
      const res = await axiosInstance.get(`/api/issues/${issueId}/subtasks`);
      setSubtasks(res.data || []);
    } catch (err) {
      console.error("Failed to load subtasks", err);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-sm font-semibold text-[#5E6C84]">
            {localIssue?.key ? `${localIssue.key}: ${localIssue.title}` : "Loading issue…"}
          </DialogTitle>
        </DialogHeader>

        {!localIssue ? (
          <div className="flex h-64 items-center justify-center text-sm text-[#6B778C]">
            Loading issue…
          </div>
        ) : (
          <div className="flex flex-col md:flex-row">
            {/* Main */}
            <div className="flex-1 p-6 space-y-6">
              {error && (
                <div className="flex gap-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  {localIssue.title}
                </h2>
                <p className="text-sm text-[#42526E]">
                  {localIssue.description || "No description"}
                </p>
              </div>

              {/* Subtasks Section */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-[#0052CC]" /> Subtasks ({subtasks.length})
                </h3>
                <div className="space-y-2 mb-3">
                  {subtasks.map((st) => (
                    <div key={st.id} className="flex items-center justify-between p-2 rounded border bg-white text-sm">
                      <span className="font-medium text-[#172B4D]">{st.key}: {st.title}</span>
                      <Badge variant="outline">{st.status}</Badge>
                    </div>
                  ))}
                </div>
                <form onSubmit={createSubtask} className="flex gap-2">
                  <Input
                    placeholder="Add subtask title..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="h-9"
                  />
                  <Button type="submit" size="sm" className="bg-[#0052CC] text-white">
                    <Plus className="h-4 w-4 mr-1" /> Add Subtask
                  </Button>
                </form>
              </div>

              {/* Dependencies Section */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-[#0052CC]" /> Dependencies (Blocked By) ({localIssue.dependsOn?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {localIssue.dependsOn?.map((depId: string) => (
                    <Badge key={depId} variant="secondary" className="px-3 py-1">
                      ID: {depId}
                    </Badge>
                  ))}
                  {(!localIssue.dependsOn || localIssue.dependsOn.length === 0) && (
                    <span className="text-xs text-[#6B778C] italic">No dependencies</span>
                  )}
                </div>
                <form onSubmit={addDependency} className="flex gap-2">
                  <Input
                    placeholder="Enter blocker Issue ID..."
                    value={newDependencyId}
                    onChange={(e) => setNewDependencyId(e.target.value)}
                    className="h-9"
                  />
                  <Button type="submit" size="sm" variant="outline">
                    Add Dependency
                  </Button>
                </form>
              </div>

              {/* Comments Section */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-4">
                  Comments ({localIssue.comments?.length || 0})
                </h3>

                <div className="space-y-4 mb-6">
                  {localIssue.comments?.length > 0 ? (
                    <div className="space-y-3">
                      {localIssue.comments.map(
                        (comment: any, index: number) => (
                          <div
                            key={index}
                            className="rounded-md border border-[#DFE1E6] bg-[#F4F5F7] p-3"
                          >
                            <p className="text-sm text-[#172B4D] whitespace-pre-wrap">
                              {typeof comment === "string" ? comment : comment.text}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6B778C] italic">
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
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        className="bg-[#0052CC] text-white"
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
            <div className="w-full md:w-[280px] p-6 border-l bg-[#F4F5F7]">
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold uppercase mb-1">Status</h3>
                  <Badge>{localIssue.status}</Badge>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase mb-1">Type</h3>
                  <span>
                    {typeIcons[localIssue.type] || "📌"} {localIssue.type}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase mb-1">Priority</h3>
                  <Badge>{priorityLabels[localIssue.priority] || localIssue.priority}</Badge>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase mb-1">Assignee</h3>
                  {assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={assignee.avatar} />
                        <AvatarFallback>{assignee.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm italic">Unassigned</span>
                  )}
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
