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
import { AlertCircle, ArrowRight, FolderKanban } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const page = () => {
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

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

    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        const res = await axiosInstance.post("/api/users/signup", {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: "USER",
          group: "",
          avatar: "https://i.pravatar.cc/150?u=john",
        });

        const user = res.data;

        login(user);

        router.push("/setup-project");
      } else {
        const res = await axiosInstance.post("/api/users/login", {
          email: formData.email.trim(),
          password: formData.password,
        });

        const user = res.data;

        login(user);

        router.push("/");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);

      const status = error?.response?.status;

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (status === 400
          ? "Please check the information you entered."
          : status === 401
            ? "Invalid email or password."
            : status === 409
              ? "An account with this email already exists."
              : "Unable to connect to the server. Please try again.");

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <FolderKanban className="h-7 w-7" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isSignUp ? "Create your account" : "Log in to your account"}
          </h1>
        </div>

        <Card className="border border-border shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">
              {isSignUp ? "Get started" : "Welcome back"}
            </CardTitle>

            <CardDescription className="text-muted-foreground">
              {isSignUp
                ? "Create an account to start managing your projects"
                : "Enter your credentials to access your Jira projects"}
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

              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    Full name
                  </label>

                  <Input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    required={isSignUp}
                    className="h-10 border-border bg-background text-foreground focus-visible:ring-primary"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Email address
                </label>

                <Input
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  required
                  className="h-10 border-border bg-background text-foreground focus-visible:ring-primary"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  Password
                </label>

                <Input
                  type="password"
                  name="password"
                  placeholder={
                    isSignUp ? "At least 6 characters" : "Your password"
                  }
                  required
                  minLength={isSignUp ? 6 : undefined}
                  className="h-10 border-border bg-background text-foreground focus-visible:ring-primary"
                  value={formData.password}
                  onChange={handleChange}
                />

                {isSignUp && (
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
              >
                {isLoading
                  ? "Processing..."
                  : isSignUp
                    ? "Sign up"
                    : "Log in"}

                {!isLoading && (
                  <ArrowRight className="ml-2 h-4 w-4" />
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isSignUp
                ? "Already have an account? "
                : "Don't have an account? "}

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                  setFormData({
                    name: "",
                    email: "",
                    password: "",
                  });
                }}
                className="text-primary hover:underline font-semibold"
              >
                {isSignUp ? "Log in" : "Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-6 text-xs text-muted-foreground">
          <span>Privacy Policy</span>
          <span>User Agreement</span>
        </div>
      </div>
    </div>
  );
};

export default page;