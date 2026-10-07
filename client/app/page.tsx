"use client";
import KanbanBoard from "@/components/KanbanBoard";
import { AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { ChevronRight, MoreHorizontal, Share2 } from "lucide-react";
import { Suspense, use } from "react";
import { useState } from "react";


export default function Home() {

  const [onlyMyIssues, setOnlyMyIssues] = useState(false);
const [recentlyUpdated, setRecentlyUpdated] = useState(false);

  return (
    <div className="flex h-full flex-col p-6 overflow-hidden bg-background text-foreground">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Projects</span>
          <ChevronRight className="h-4 w-4" />
          <span>Platform Services</span>
          <ChevronRight className="h-4 w-4" />
          <span>Kanban Board</span>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Kanban Board
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <Avatar
                key={i}
                className="h-8 w-8 border-2 border-background rounded-full"
              >
                <AvatarImage src={`https://i.pravatar.cc/150?u=${i}`} />
                <AvatarFallback>U{i}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <Button
  variant="outline"
  size="sm"
  onClick={() => setOnlyMyIssues((prev) => !prev)}
  className={`h-8 rounded-md border-dashed ${
    onlyMyIssues
      ? "bg-primary/10 border-primary text-primary font-medium"
      : "bg-transparent text-muted-foreground"
  }`}
>
  Only My Issues
</Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-md border-dashed bg-transparent text-muted-foreground"
          >
            Recently Updated
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto min-h-0">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading board...</div>}>
          <KanbanBoard />
        </Suspense>
      </div>
    </div>
  );
}
