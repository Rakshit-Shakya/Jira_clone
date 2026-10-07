"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/Axiosinstance";
import { AlertCircle, ArrowRight, Car, FolderKanban } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const page = () => {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    key: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setSelectedProject] = useState<any>(null);
  const { user } = useAuth();
  // const currentProject = {
  //   id: "proj-1",
  //   name: "Platform Services",
  //   key: "PS",
  //   ownerId: "user-1",
  //   memberIds: ["user-1", "user-2"],
  //   createdAt: new Date().toISOString(),
  //   description: "Core platform infrastructure and services",
  // };
  // const currentUser = {
  //   id: "user-1",
  //   name: "John Doe",
  //   email: "john@example.com",
  //   role: "ADMIN",
  //   group: "Engineering",
  //   avatar: "https://i.pravatar.cc/150?u=john",
  //   createdAt: new Date().toISOString(),
  // };
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
    setIsLoading(true);

    try {
      // Validate inputs
      if (!formData.name.trim()) {
        setError("Project name is required");
        setIsLoading(false);
        return;
      }

      if (!formData.key.trim()) {
        setError("Project key is required");
        setIsLoading(false);
        return;
      }
      const res = await axiosInstance.post("/api/projects", {
  name: formData.name.trim(),
  key: formData.key.trim(),
  ownerId: user?.id,
  memberIds: user?.id ? [user.id] : [],
});
      
     setSelectedProject(res.data);
router.push("/");
    } catch (err) {
      setError("Failed to create project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleskip = () => {
    router.push("/");
  };

  if (user === null) {
    router.push("/login");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <FolderKanban className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Create your first project
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Welcome, {user?.name}!</p>
          </div>
        </div>

        <Card className="border border-border shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Set up your project</CardTitle>
            <CardDescription className="text-muted-foreground">
              Give your project a name and key to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex gap-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Project name
                </label>
                <Input
                  type="text"
                  name="name"
                  placeholder="e.g., Platform Services"
                  required
                  className="h-10 border-border bg-background text-foreground focus-visible:ring-primary"
                  value={formData.name}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  This is the display name for your project
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Project key
                </label>
                <Input
                  type="text"
                  name="key"
                  placeholder="e.g., PS"
                  maxLength={5}
                  required
                  className="h-10 border-border bg-background text-foreground focus-visible:ring-primary"
                  value={formData.key}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Used for issue keys (e.g., {formData.key || "PS"}-1). Letters
                  only, max 5 characters.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                >
                  {isLoading ? "Creating project..." : "Create project"}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleskip}
                  disabled={isLoading}
                  className="w-full bg-transparent"
                >
                  Skip for now
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="rounded-md bg-primary/10 p-4 border border-primary/20">
          <p className="text-sm text-primary">
            You can create additional projects anytime from the Projects page
            after you get started.
          </p>
        </div>
      </div>
    </div>
  );
};

export default page;

