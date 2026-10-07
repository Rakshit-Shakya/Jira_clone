"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { AlertCircle, Mail, Save, Key, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const ProfilePage = () => {
  const { user, login, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setAvatar(user.avatar || "");
  }, [user]);

  if (!user) {
    return <div className="p-6">User not found</div>;
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setMessage("");

      const res = await axiosInstance.put(`/api/users/${user.id}`, {
        name: name.trim(),
        group: user.group,
        avatar: avatar.trim(),
      });

      login({ ...res.data, token: user.token || localStorage.getItem("token") || undefined });
      setMessage("Profile updated successfully.");
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to update profile. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async () => {
    const newAvatarUrl = window.prompt(
      "Enter the URL of your new profile picture:",
      avatar,
    );

    if (newAvatarUrl === null) return;

    setAvatar(newAvatarUrl);

    try {
      setIsLoading(true);
      setError("");
      setMessage("");

      const res = await axiosInstance.put(`/api/users/${user.id}`, {
        name,
        group: user.group,
        avatar: newAvatarUrl.trim(),
      });

      login({ ...res.data, token: user.token || localStorage.getItem("token") || undefined });
      setMessage("Profile picture updated successfully.");
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to update profile picture.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPwError("Both current and new passwords are required");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);
      setPwError("");
      setPwMessage("");

      await axiosInstance.put(`/api/users/${user.id}/password`, {
        currentPassword,
        newPassword,
      });

      setPwMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      console.error(err);
      setPwError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setEmailError("New email is required");
      return;
    }

    try {
      setIsLoading(true);
      setEmailError("");
      setEmailMessage("");

      const res = await axiosInstance.put(`/api/users/${user.id}/email`, {
        email: newEmail.trim(),
      });

      setEmailMessage(res.data.message || "Verification email sent.");
      setNewEmail("");
    } catch (err: any) {
      console.error(err);
      setEmailError(err.response?.data?.message || "Failed to request email change.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Are you sure you want to deactivate your account? You will be logged out immediately.")) {
      return;
    }

    try {
      setIsLoading(true);
      await axiosInstance.put(`/api/users/${user.id}/deactivate`);
      logout();
      router.push("/login");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to deactivate account.");
      setIsLoading(false);
    }
  };

  const lastLogin = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleString()
    : "Not available";

  return (
    <div className="flex h-full flex-col p-6 overflow-auto bg-background text-foreground">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
          Profile Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal information, security, and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">About You</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20 mb-4 ring-2 ring-primary/20">
                  <AvatarImage src={avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{user.name ? user.name.charAt(0) : "U"}</AvatarFallback>
                </Avatar>

                <h2 className="text-xl font-semibold text-card-foreground">
                  {user.name}
                </h2>

                <Badge className="mt-2">{user.role}</Badge>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{user.email}</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Group:</span>
                  <Badge variant="outline">{user.group || "Not set"}</Badge>
                </div>
              </div>

              <Button
                type="button"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                onClick={handleAvatarChange}
                disabled={isLoading}
              >
                Edit Profile Picture
              </Button>

              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={handleDeactivate}
                disabled={isLoading}
              >
                <UserX className="h-4 w-4 mr-2" />
                Deactivate Account
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                Personal Information
              </CardTitle>

              <CardDescription className="text-muted-foreground">
                Update your contact details
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {error && (
                  <div className="flex gap-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {message && (
                  <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-600 border border-emerald-500/20">
                    {message}
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">
                    Full Name
                  </label>

                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background text-foreground border-border"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">
                    Email
                  </label>

                  <Input
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-background text-foreground border-border opacity-70"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">
                      Role
                    </label>

                    <Input
                      disabled
                      value={user.role}
                      className="bg-background text-foreground border-border opacity-70"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-foreground mb-1 block">
                      Team
                    </label>

                    <Input
                      disabled
                      value={user.group || ""}
                      className="bg-background text-foreground border-border opacity-70"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                  >
                    <Save className="h-4 w-4 mr-2" />

                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Change Password</CardTitle>
              <CardDescription className="text-muted-foreground">Update your password with current password verification</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {pwError && (
                  <div className="flex gap-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{pwError}</span>
                  </div>
                )}
                {pwMessage && (
                  <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-600 border border-emerald-500/20">
                    {pwMessage}
                  </div>
                )}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">Current Password</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">New Password (min 6 chars)</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20">
                    <Key className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Request Email Change Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Change Email & Verification</CardTitle>
              <CardDescription className="text-muted-foreground">Request an email update with verification token</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailChangeRequest} className="space-y-4">
                {emailError && (
                  <div className="flex gap-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{emailError}</span>
                  </div>
                )}
                {emailMessage && (
                  <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-600 border border-emerald-500/20">
                    {emailMessage}
                  </div>
                )}
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1 block">New Email Address</label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="bg-background text-foreground border-border"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20">
                    Request Email Change
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Activity</CardTitle>

              <CardDescription className="text-muted-foreground">
                Your account activity information
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Account Created
                  </span>

                  <span className="text-foreground font-semibold">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Not available"}
                  </span>
                </div>

                <div className="flex justify-between text-sm border-t border-border pt-3">
                  <span className="text-muted-foreground">
                    Last Login
                  </span>

                  <span className="text-foreground font-semibold">
                    {lastLogin}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
