"use client";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import React from "react";
import KanbanCard from "./KanbanCard";

const KanbanColumn = ({ column, issues, onIssueClick }: any) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });
  return (
    <div className="w-[300px] flex-shrink-0 rounded-lg bg-secondary/30 border border-border p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {column.title}
        </h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/50">
          {issues.length}
        </span>
      </div>
      <div ref={setNodeRef} className="flex-1 space-y-2.5 overflow-y-auto pr-1">
        <SortableContext
          items={issues.map((i: any) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {issues.map((issue: any) => (
            <KanbanCard
              key={issue.id}
              issue={issue}
              onClick={() => onIssueClick(issue)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;
