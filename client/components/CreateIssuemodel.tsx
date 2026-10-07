import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { AlertCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/Axiosinstance";

const CreateIssuemodel = ({ isOpen, onClose }: any) => {
  const { user, selectedProject } = useAuth();
  // const currentUser = {
  //   id: "user-1",
  //   name: "John Doe",
  //   email: "john@example.com",
  //   role: "ADMIN",
  //   group: "Engineering",
  //   avatar: "https://i.pravatar.cc/150?u=john",
  //   createdAt: new Date().toISOString(),
  // };
  const [isloading, setIsloading] = useState(false);
  const [error, setError] = useState("");
  const [teamMembers, setteamMembers] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "TASK",
    priority: "MEDIUM",
    assigneeId: "",
  });
  useEffect(() => {
    if (!selectedProject?.id || !isOpen) return;
    const fetchMembers = async () => {
      try {
        const res = await axiosInstance.get(
          `/api/projects/${selectedProject?.id}`,
        );
        setteamMembers(res.data.members || []);
      } catch (error) {
        console.log(error);
      }
    };
    fetchMembers();
  }, [selectedProject?.id, isOpen]);
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setError("");
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject) {
  setError("A logged-in user and selected project are required.");
  return;
}
    try {
      setIsloading(true);
      await axiosInstance.post("/api/issues", {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        status: "TODO",
        projectId: selectedProject?.id,
        reporterId: user?.id,
        assigneeId: formData.assigneeId || null,
        order: 0,
      });

      onClose();
    } catch (error: any) {
  console.error(error);

  setError(
    error.response?.data?.message ||
      "Failed to create issue. Please try again.",
  );
} finally {
      setIsloading(false);
      setFormData({
        title: "",
        description: "",
        type: "TASK",
        priority: "MEDIUM",
        assigneeId: "",
      });
    }
  };
  // const teamMembers = [
  //   {
  //     id: "user-1",
  //     name: "John Doe",
  //     email: "john@example.com",
  //     role: "ADMIN",
  //     group: "Engineering",
  //     avatar: "https://i.pravatar.cc/150?u=john",
  //     createdAt: new Date().toISOString(),
  //   },
  //   {
  //     id: "user-2",
  //     name: "Jane Smith",
  //     email: "jane@example.com",
  //     role: "MEMBER",
  //     group: "Design",
  //     avatar: "https://i.pravatar.cc/150?u=jane",
  //     createdAt: new Date().toISOString(),
  //   },
  // ];
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Create Issue</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex gap-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Issue Title *
            </label>
            <Input
              type="text"
              name="title"
              placeholder="e.g., Implement user authentication"
              required
              className="h-10 border-border bg-background text-foreground focus-visible:ring-primary"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Description
            </label>
            <Textarea
              name="description"
              placeholder="Add a description (optional)"
              className="min-h-[100px] border-border bg-background text-foreground focus-visible:ring-primary resize-none"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Type
              </label>
              <select
                name="type"
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="TASK">Task</option>
                <option value="BUG">Bug</option>
                <option value="STORY">Story</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Priority
              </label>
              <select
                name="priority"
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Assignee
              </label>
              <select
                name="assigneeId"
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none"
                value={formData.assigneeId || ""}
                onChange={handleChange}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member: any) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} disabled={isloading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
              disabled={isloading}
            >
              {isloading ? "Creating..." : "Create Issue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIssuemodel;
