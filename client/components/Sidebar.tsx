"use client";

import {
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Input } from "./ui/input";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import CreateIssuemodel from "./CreateIssuemodel";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/Axiosinstance";
import NotificationBell from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

const Sidebar = () => {
  const router = useRouter();
  const { user, logout, selectedProject, setSelectedProject } = useAuth();
  const [project, setProject] = useState([]);
  const [loading, setloading] = useState(true);
  const [showprojectmenu, setShowprojectmenu] = useState(false);
  const [showcreateissuemodel, setShowcreateissuemodel] = useState(false);
  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      try {
        const res = await axiosInstance.get("/api/projects");
        const userProjects = res.data.filter(
          (project: any) =>
            project.ownerId === user.id || project.memberIds?.includes(user.id),
        );
        setProject(userProjects);
        if (!selectedProject && userProjects.length > 0) {
          setSelectedProject(userProjects[0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setloading(false);
      }
    };
    fetchProjects();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen w-64 items-center justify-center border-r bg-card/50 backdrop-blur-sm">
        <span className="text-sm font-medium text-muted-foreground animate-pulse">Loading workspace…</span>
      </div>
    );
  }

  const redirectproject = () => {
    router.push("/create-project");
  };
  const HandleLogout = () => {
    logout();
    router.push("/login");
  };
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card/60 backdrop-blur-xl text-foreground select-none transition-all duration-300 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-transform hover:scale-105">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-foreground block leading-tight">
              Jira SaaS
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Workspace
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>

      {/* Project Selector */}
      {selectedProject && (
        <div className="px-3 py-2">
          <div className="relative">
            <button
              onClick={() => setShowprojectmenu(!showprojectmenu)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-secondary/50 border border-border/60 hover:border-primary/50 hover:bg-secondary transition-all text-sm group shadow-2xs"
            >
              <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
              <span className="flex-1 text-left truncate font-semibold text-foreground group-text">
                {selectedProject?.name}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showprojectmenu ? "rotate-180" : ""}`}
              />
            </button>
            {showprojectmenu && (
              <div className="absolute top-12 left-0 right-0 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Switch Project
                </div>
                {project.map((proj: any) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setSelectedProject(proj);
                      setShowprojectmenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full bg-primary/70" />
                    <span className="truncate font-medium">{proj.name}</span>
                  </button>
                ))}
                <div className="border-t border-border mt-1 pt-1 px-1">
                  <button
                    onClick={redirectproject}
                    className="w-full text-left text-sm flex items-center gap-2 text-primary font-medium hover:bg-accent/80 py-2 px-2 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6 scrollbar-none">
        <div className="px-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search issues, tasks..."
              className="bg-secondary/40 pl-9 h-9 text-xs rounded-xl border-border/60 focus-visible:ring-primary/40 transition-all"
            />
          </div>
        </div>

        <nav className="space-y-1.5">
          <NavItem
            href="/"
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Kanban Board"
          />
          <NavItem
            href="/backlog"
            icon={<ListTodo className="h-4 w-4" />}
            label="Backlog"
          />
          <NavItem
            href="/projects"
            icon={<FolderKanban className="h-4 w-4" />}
            label="Projects"
          />
          <NavItem
            href="/team"
            icon={<Users className="h-4 w-4" />}
            label="Team"
          />
          <NavItem
            href="/profile"
            icon={<Settings className="h-4 w-4" />}
            label="Profile"
          />
        </nav>
      </div>

      {/* Footer / User Profile */}
      <div className="border-t border-border/60 p-3 space-y-2.5 bg-card/30">
        {user && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-secondary/40 border border-border/40 shadow-2xs">
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {user?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.name}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <Button
          className="w-full justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 rounded-xl h-9 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => setShowcreateissuemodel(true)}
        >
          <Plus className="h-4 w-4" />
          Create Issue
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl h-8 text-xs transition-colors"
          onClick={HandleLogout}
        >
          <LogOut className="h-3.5 w-3.5" />
          Log out
        </Button>
      </div>
      <CreateIssuemodel
        isOpen={showcreateissuemodel}
        onClose={() => setShowcreateissuemodel(false)}
      />
    </div>
  );
};

export default Sidebar;
function NavItem({ href, icon, label, active }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
        active
          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
