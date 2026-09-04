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
import { AlertCircle, Mail, Save } from "lucide-react";
import React, { useEffect, useState } from "react";

const page = () => {
  const { user, login } = useAuth();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

      login(res.data);
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
    const newAvatar = window.prompt(
      "Enter the URL of your new profile picture:",
      avatar,
    );

    if (newAvatar === null) return;

    setAvatar(newAvatar);

    try {
      setIsLoading(true);
      setError("");
      setMessage("");

      const res = await axiosInstance.put(`/api/users/${user.id}`, {
        name,
        group: user.group,
        avatar: newAvatar.trim(),
      });

      login(res.data);
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

  const lastLogin = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleString()
    : "Not available";

  return (
    <div className="flex h-full flex-col p-6 overflow-auto bg-[#F4F5F7]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#172B4D] mb-2">
          Profile Settings
        </h1>
        <p className="text-[#5E6C84]">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-[#172B4D]">About You</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src={avatar || "/placeholder.svg"} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <h2 className="text-xl font-semibold text-[#172B4D]">
                  {user.name}
                </h2>

                <Badge className="mt-2">{user.role}</Badge>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-[#5E6C84]" />
                  <span className="text-[#172B4D]">{user.email}</span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <span className="text-[#5E6C84]">Group:</span>
                  <Badge variant="outline">{user.group || "Not set"}</Badge>
                </div>
              </div>

              <Button
                type="button"
                className="w-full bg-[#0052CC] text-white hover:bg-[#0747A6]"
                onClick={handleAvatarChange}
                disabled={isLoading}
              >
                Edit Profile Picture
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#172B4D]">
                Personal Information
              </CardTitle>

              <CardDescription>
                Update your contact details
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {error && (
                  <div className="flex gap-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {message && (
                  <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                    {message}
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-[#172B4D] mb-1 block">
                    Full Name
                  </label>

                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="focus-visible:ring-[#0052CC]"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#172B4D] mb-1 block">
                    Email
                  </label>

                  <Input
                    type="email"
                    value={user.email}
                    disabled
                    className="focus-visible:ring-[#0052CC]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-[#172B4D] mb-1 block">
                      Role
                    </label>

                    <Input
                      disabled
                      value={user.role}
                      className="focus-visible:ring-[#0052CC]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-[#172B4D] mb-1 block">
                      Team
                    </label>

                    <Input
                      disabled
                      value={user.group || ""}
                      className="focus-visible:ring-[#0052CC]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-[#0052CC] text-white hover:bg-[#0747A6]"
                  >
                    <Save className="h-4 w-4 mr-2" />

                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#172B4D]">Activity</CardTitle>

              <CardDescription>
                Your account activity information
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#5E6C84]">
                    Account Created
                  </span>

                  <span className="text-[#172B4D] font-semibold">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Not available"}
                  </span>
                </div>

                <div className="flex justify-between text-sm border-t pt-3">
                  <span className="text-[#5E6C84]">
                    Last Login
                  </span>

                  <span className="text-[#172B4D] font-semibold">
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

export default page;