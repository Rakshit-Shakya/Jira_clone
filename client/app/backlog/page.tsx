"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/Axiosinstance";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Share2,
} from "lucide-react";
import React, { useEffect, useState } from "react";

const page = () => {
  // const issues = [
  //   {
  //     id: "1",
  //     key: "PS-124",
  //     title: "Implement user authentication flow",
  //     description: "Add OAuth and JWT token support",
  //     type: "TASK",
  //     status: "TODO",
  //     priority: "HIGH",
  //     projectId: "proj-1",
  //     reporterId: "user-1",
  //     assigneeId: "user-2",
  //     order: 0,
  //     createdAt: new Date().toISOString(),
  //     updatedAt: new Date().toISOString(),
  //     comments: [],
  //   },
  //   {
  //     id: "2",
  //     key: "PS-125",
  //     title: "Fix critical bug in payment processing",
  //     description: "Payment gateway timeout issue",
  //     type: "BUG",
  //     status: "IN_PROGRESS",
  //     priority: "HIGH",
  //     projectId: "proj-1",
  //     reporterId: "user-1",
  //     assigneeId: "user-1",
  //     order: 0,
  //     createdAt: new Date().toISOString(),
  //     updatedAt: new Date().toISOString(),
  //     comments: [],
  //   },
  //   {
  //     id: "3",
  //     key: "PS-126",
  //     title: "Design system audit and cleanup",
  //     type: "STORY",
  //     status: "TODO",
  //     priority: "MEDIUM",
  //     projectId: "proj-1",
  //     reporterId: "user-2",
  //     order: 1,
  //     createdAt: new Date().toISOString(),
  //     updatedAt: new Date().toISOString(),
  //     comments: [],
  //   },
  // ];
  const { selectedProject, user } = useAuth();

  const [issues, setIssues] = useState<any[]>([]);
  const [activeSprint, setActiveSprint] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);

  /* =====================
     Fetch backlog data
  ===================== */
  const fetchData = async () => {
    if (!selectedProject?.id) return;

    try {
      setLoading(true);
      const issuesRes = await axiosInstance.get(
        `/api/issues/project/${selectedProject.id}`,
      );
      const sprintRes = await axiosInstance.get(
  `/api/sprints/project/${selectedProject.id}`,
);

setIssues(issuesRes.data ?? []);

const sprints = sprintRes.data ?? [];

const activeSprint =
  sprints.find((s: any) => s.status === "ACTIVE") ||
  sprints.find((s: any) => s.status === "PLANNED") ||
  null;

setActiveSprint(activeSprint);
    } catch (err) {
      console.error("Failed to load backlog", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProject?.id]);

  /* =====================
     Create backlog issue
  ===================== */
  const createIssue = async () => {
    if (!newTitle.trim() || !selectedProject || !user) return;

    try {
      await axiosInstance.post("/api/issues", {
        title: newTitle,
        projectId: selectedProject.id,
        status: "TODO",
        priority: "MEDIUM",
        type: "TASK",
        reporterId: user.id,
        sprintId: null, // BACKLOG
      });

      setNewTitle("");
      setIsCreating(false);
      fetchData();
    } catch (err) {
      console.error("Failed to create issue", err);
    }
  };

  const sprintIssues = issues.filter((i) => i.sprintId === activeSprint?.id);

  const backlogIssues = issues.filter((i) => !i.sprintId);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground bg-background">
        Loading backlog…
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col p-6 overflow-hidden bg-background text-foreground">
      {/* Breadcrumb */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Projects</span>
          <ChevronRight className="h-4 w-4" />
          <span>{selectedProject?.name}</span>
          <ChevronRight className="h-4 w-4" />
          <span>Backlog</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Backlog</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {/* Backlog Section */}
        <section>
          <SectionHeader title="Backlog" count={backlogIssues.length} />

          <div className="border border-t-0 border-border rounded-b-md divide-y divide-border bg-card">
            {backlogIssues.map((issue) => (
              <BacklogItem key={issue.id} issue={issue} />
            ))}

            {isCreating ? (
              <form
                className="p-2 bg-card"
                onSubmit={(e) => {
                  e.preventDefault();
                  createIssue();
                }}
              >
                <input
                  autoFocus
                  className="w-full p-2 border-2 border-primary rounded-md text-sm bg-background text-foreground focus:outline-none"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onBlur={() => !newTitle && setIsCreating(false)}
                />
              </form>
            ) : (
              <CreateIssueRow onClick={() => setIsCreating(true)} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
const SectionHeader = ({ title, count }: any) => (
  <div className="flex items-center justify-between bg-secondary/50 p-3 rounded-t-md border border-border">
    <div className="flex items-center gap-2">
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
      <span className="font-semibold text-foreground text-sm">{title}</span>
      <span className="text-xs ml-2 text-muted-foreground">{count} issues</span>
    </div>
  </div>
);

const SprintSection = ({ sprint, issues }: any) => (
  <>
    <SectionHeader title={sprint.name} count={issues.length} />
    <div className="border border-t-0 border-border rounded-b-md divide-y divide-border bg-card">
      {issues.map((issue: any) => (
        <BacklogItem key={issue.id} issue={issue} />
      ))}
    </div>
  </>
);

const CreateIssueRow = ({ onClick }: any) => (
  <div className="p-3 hover:bg-secondary/40 cursor-pointer transition-colors bg-card" onClick={onClick}>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Plus className="h-4 w-4 text-primary" />
      Create issue
    </div>
  </div>
);
const BacklogItem = ({ issue }: any) => {
  const priorityMap = {
    HIGH: "text-red-500",
    MEDIUM: "text-amber-500",
    LOW: "text-blue-500",
  };

  const priorityColor =
    priorityMap[issue.priority as keyof typeof priorityMap] || "text-muted-foreground";

  return (
    <div className="flex items-center justify-between p-3 hover:bg-secondary/40 transition-colors group bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-3.5 w-3.5 rounded bg-primary/80 flex-shrink-0" />
        <span className="text-xs font-bold text-muted-foreground">{issue.key}</span>
        <span className="truncate text-sm font-medium text-foreground">{issue.title}</span>
      </div>

      <div className="flex items-center gap-4">
        <span className={`text-xs font-semibold ${priorityColor}`}>
          {issue.priority}
        </span>
        <Avatar className="h-6 w-6">
          <AvatarImage src={issue.assignee?.avatar} />
          <AvatarFallback className="text-[10px]">U</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};
export default page;
