"use client";

import React, { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import axiosInstance from "@/lib/Axiosinstance";


interface KanbanCardProps {
  issue: any;
  isOverlay?: boolean;
  onClick?: () => void;
}

const priorityColors: Record<string, string> = {
  HIGH: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  LOW: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
};

const issueTypeColors: Record<string, string> = {
  BUG: "bg-red-500",
  TASK: "bg-blue-500",
  STORY: "bg-purple-500",
};

const KanbanCard = ({ issue, isOverlay = false, onClick }: KanbanCardProps) => {
  const [assignee, setAssignee] = useState<any>(null);

  // ❗ useSortable ONLY for real cards, not overlay
  const sortable = !isOverlay
    ? useSortable({ id: issue.id })
    : null;

  const style = sortable
    ? {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.4 : 1,
      }
    : undefined;

  /* =====================
     Fetch assignee by ID
  ===================== */
  useEffect(() => {
    if (!issue?.assigneeId || isOverlay) return;

    const fetchAssignee = async () => {
      try {
        const res = await axiosInstance.get(
          `/api/users/${issue.assigneeId}`,
        );
        setAssignee(res.data);
      } catch (err) {
        console.error("Failed to load assignee", err);
      }
    };

    fetchAssignee();
  }, [issue?.assigneeId, isOverlay]);

  return (
    <div
      ref={sortable?.setNodeRef}
      style={style}
      {...sortable?.attributes}
      {...sortable?.listeners}
      onClick={(e) => {
        e.stopPropagation(); // prevents drag-click conflict
        onClick?.();
      }}
      className={`rounded-xl border border-border/60 bg-card p-3.5 shadow-xs transition-all ${
        isOverlay
          ? "shadow-xl border-primary ring-2 ring-primary/20"
          : "hover:border-primary/50 hover:shadow-md cursor-pointer"
      }`}
    >
      {/* Title */}
      <p className="text-sm font-semibold text-card-foreground mb-3 leading-snug">
        {issue.title}
      </p>

      {/* Meta */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`h-3.5 w-3.5 rounded-md ${issueTypeColors[issue.type]}`}
          />
          <span className="text-[11px] font-bold text-muted-foreground tracking-wide">
            {issue.key}
          </span>
        </div>

        <Badge className={`text-[10px] px-2 py-0.5 font-semibold ${priorityColors[issue.priority]}`}>
          {issue.priority}
        </Badge>
      </div>

      {/* Assignee */}
      {assignee && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/40 mt-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={assignee.avatar} />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
              {assignee.name?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] font-medium text-muted-foreground truncate">
            {assignee.name}
          </span>
        </div>
      )}
    </div>
  );
};

export default KanbanCard;
