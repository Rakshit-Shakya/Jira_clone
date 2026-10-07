"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/AuthContext";
import axiosInstance from "@/lib/Axiosinstance";
import { Mail, Trash2, UserPlus } from "lucide-react";
import React, { useEffect, useState } from "react";

const page = () => {
  const { selectedProject, setSelectedProject } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fetchMembers = async () => {
    if (!selectedProject?.id) return;
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/api/projects/${selectedProject?.id}`,
      );
      setTeamMembers(res.data?.members ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMembers();
  }, [selectedProject]);
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

  const handleAddmember = async () => {
    if (!selectedProject) return;
    const name = prompt("Enter member name:");
    if (!name) return;

    const email =
      prompt("Enter member email:") ||
      `${name.toLowerCase().replace(" ", ".")}@example.com`;

    const group =
      prompt("Enter group (Engineering / Design / Admin):") || "Engineering";
    const password = email.split("@")[0] + "@123";
    const avatar = `https://i.pravatar.cc/150?u=${email}`;
    try {
      setLoading(true);
      const res = await axiosInstance.post("/api/users/signup", {
        name: name,
        email: email,
        password: password,
        role: "MEMBER",
        group: group,
        avatar: avatar,
      });
      const newuser = res.data;
      const updatedmemberids = Array.from(
        new Set([...(selectedProject.memberIds || []), newuser.id]),
      );
      await axiosInstance.put(`/api/projects/${selectedProject.id}`, {
        name: selectedProject.name,
        description: selectedProject.description,
        memberIds: updatedmemberids,
      });
      setSelectedProject({ ...selectedProject, memberIds: updatedmemberids });
      await fetchMembers();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteMember = async (userid: string, name: string) => {
    if (!selectedProject) return;
    if (!confirm(`Remove ${name} from project?`)) return;
    try {
      setLoading(true);
      const updatedmemberids = (selectedProject.memberIds ?? []).filter(
        (id: string) => id !== userid,
      );
      await axiosInstance.put(`/api/projects/${selectedProject.id}`, {
        name: selectedProject.name,
        description: selectedProject.description,
        memberIds: updatedmemberids,
      });
      setSelectedProject({ ...selectedProject, memberIds: updatedmemberids });
      await fetchMembers();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  const groupMap = new Map<string, any[]>();
  teamMembers.forEach((member: any) => {
    if (!groupMap.has(member.group)) {
      groupMap.set(member.group, []);
    }
    groupMap.get(member.group)?.push(member);
  });
  const groups = Array.from(groupMap.keys());
  const filteredMembers = selectedGroup
    ? teamMembers.filter((member: any) => member.group === selectedGroup)
    : teamMembers;
  return (
    <div className="p-8 h-full flex flex-col bg-background text-foreground relative">
      {/* Loader */}
      {loading && (
        <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-50">
          <p className="text-sm text-muted-foreground">Updating team…</p>
        </div>
      )}

      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Team Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {teamMembers.length} team members
          </p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
          onClick={handleAddmember}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </header>

      {/* Group Filter */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={selectedGroup === null ? "default" : "outline"}
          onClick={() => setSelectedGroup(null)}
          className={selectedGroup === null ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : ""}
        >
          All Members
        </Button>
        {groups.map((group) => (
          <Button
            key={group}
            variant={selectedGroup === group ? "default" : "outline"}
            onClick={() => setSelectedGroup(group)}
            className={selectedGroup === group ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : ""}
          >
            {group}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 rounded-lg border border-border bg-card overflow-y-auto">
        <Table>
          <TableHeader className="bg-secondary/50 sticky top-0">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Group</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member: any) => (
                <TableRow key={member.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-foreground">{member.name}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {member.email}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={
                        member.role === "ADMIN"
                          ? "bg-red-500/10 text-red-600 border border-red-500/20"
                          : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                      }
                    >
                      {member.role}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="bg-secondary text-secondary-foreground">
                      {member.group}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteMember(member.id, member.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No members found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default page;
