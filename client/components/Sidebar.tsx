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
  const redirectproject = () => {
    router.push("/create-project");
  };
  const HandleLogout = () => {
    logout();
    router.push("/login");
  };
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

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card text-foreground select-none transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <FolderKanban className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-foreground block leading-tight">
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
        <div className="px-3 py-2.5 border-b border-border/50">
          <div className="relative">
            <button
              onClick={() => setShowprojectmenu(!showprojectmenu)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary transition-all text-xs group"
            >
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="flex-1 text-left truncate font-semibold text-foreground">
                {selectedProject?.name}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${showprojectmenu ? "rotate-180" : ""}`}
              />
            </button>
            {showprojectmenu && (
              <div className="absolute top-11 left-0 right-0 bg-popover border border-border rounded-md shadow-xl z-50 overflow-hidden py-1">
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
                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="truncate font-medium">{proj.name}</span>
                  </button>
                ))}
                <div className="border-t border-border mt-1 pt-1 px-1">
                  <button
                    onClick={redirectproject}
                    className="w-full text-left text-xs flex items-center gap-2 text-primary font-medium hover:bg-accent py-1.5 px-2 rounded-md transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div className="px-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search issues, tasks..."
              className="bg-background pl-8 h-8 text-xs rounded-md border-border focus-visible:ring-primary transition-all"
            />
          </div>
        </div>

        <nav className="space-y-1">
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
      <div className="border-t border-border p-3 space-y-2 bg-secondary/10">
        {user && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-md bg-secondary/40 border border-border/50">
            <Avatar className="h-7 w-7 ring-1 ring-border">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {user?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <Button
          className="w-full justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-md h-8 text-xs font-semibold"
          onClick={() => setShowcreateissuemodel(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Create Issue
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md h-7 text-xs"
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
      className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-semibold transition-colors duration-150 ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
