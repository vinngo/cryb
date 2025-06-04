"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Bell, Copy, Home, LogOut, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useUserStore } from "@/lib/stores/usersStore";
import { useSearchParams } from "next/navigation";
import {
  updateProfile,
  updatePassword,
  createNewHouse,
  joinExistingHouse,
  leaveHouse,
} from "./actions";

export default function ProfilePage() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const {
    user: userData,
    email: emailData,
    house,
    fetchUserData,
  } = useUserStore();

  // Get current user (in a real app, this would come from auth)
  const [currentUser, setCurrentUser] = useState(userData);
  const [name, setName] = useState(currentUser?.display_name);
  const [email] = useState(emailData);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [houseName, setHouseName] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [isJoinHouseDialogOpen, setIsJoinHouseDialogOpen] = useState(false);
  const [isCreateHouseDialogOpen, setIsCreateHouseDialogOpen] = useState(false);
  const [isLeaveHouseDialogOpen, setIsLeaveHouseDialogOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(userData);
  }, [userData]);

  useEffect(() => {
    const action = params.get("action");
    if (action === "create-house") {
      setIsCreateHouseDialogOpen(true);
    } else if (action === "join-house") {
      setIsJoinHouseDialogOpen(true);
    }
  }, [params]);

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!formData.get("name")) return;

    if (!currentUser) return;

    const result = await updateProfile(formData, currentUser.id);

    if (!result.success) {
      throw new Error(result.error || "Failed to update profile!");
    }

    await fetchUserData();

    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
      variant: "success",
    });
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation password must match.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);

    const { success } = await updatePassword(formData);

    if (success) {
      await fetchUserData();
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
        variant: "success",
      });
    } else {
      await fetchUserData();
      toast({
        title: "Update Failed",
        description: "Your password was not changed due to some error",
        variant: "destructive",
      });
    }
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleJoinHouse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    const { success } = await joinExistingHouse(formData);

    if (success) {
      await fetchUserData();
      toast({
        title: "House joined",
        description: "You have successfully joined the house.",
        variant: "success",
      });
    } else {
      await fetchUserData();
      toast({
        title: "Joining Failed",
        description: "There was an error joining the house.",
        variant: "destructive",
      });
    }
    setIsJoinHouseDialogOpen(false);
    setInviteCode("");
  };

  const handleCreateHouse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    const { success } = await createNewHouse(formData);

    if (success) {
      await fetchUserData();
      toast({
        title: "House created",
        description: `Your new house "${houseName}" has been created.`,
        variant: "success",
      });
    } else {
      await fetchUserData();
      toast({
        title: "House not created",
        description: `Your new house was not created due to some error`,
        variant: "destructive",
      });
    }

    setIsCreateHouseDialogOpen(false);
    setHouseName("");
  };

  const handleLeaveHouse = async () => {
    const { success } = await leaveHouse();
    if (success) {
      await fetchUserData();
      toast({
        title: "House left",
        description: "You have left the house.",
        variant: "success",
      });
    } else {
      await fetchUserData();
      toast({
        title: "House not left",
        description: "You were not able to leave the house due to some error.",
        variant: "destructive",
      });
    }
    setIsLeaveHouseDialogOpen(false);
  };

  const handleSignOut = () => {
    router.push("/login");
  };

  const copyInviteCode = () => {
    if (!house) return;
    navigator.clipboard.writeText(house.code);
    toast({
      title: "Invite code copied",
      description: "House invite code copied to clipboard.",
      variant: "success",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-24 w-24">
                <AvatarFallback>
                  {currentUser?.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-semibold">
                  {currentUser?.display_name}
                </h2>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="space-y-4">
              {house ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Current House</span>
                    </div>
                  </div>
                  <div className="rounded-md border px-3 py-2 text-sm">
                    <div className="font-medium">{house?.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-muted-foreground">
                        Invite Code: {house?.code}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={copyInviteCode}
                      >
                        <Copy className="h-3 w-3" />
                        <span className="sr-only">Copy invite code</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium">
                        Not currently in a house.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Dialog
                  open={isJoinHouseDialogOpen}
                  onOpenChange={setIsJoinHouseDialogOpen}
                >
                  <DialogTrigger asChild>
                    {house ? (
                      <Button variant="outline" className="w-full">
                        Join Different House
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full">
                        Join a House
                      </Button>
                    )}
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleJoinHouse}>
                      <DialogHeader>
                        <DialogTitle>Join a House</DialogTitle>
                        <DialogDescription>
                          Enter the invite code to join an existing house.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-code">Invite Code</Label>
                          <Input
                            id="invite-code"
                            name="invite-code"
                            placeholder="Enter house invite code"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            required
                          />
                        </div>
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Note</AlertTitle>
                          <AlertDescription>
                            Joining a new house will remove you from your
                            current house.
                          </AlertDescription>
                        </Alert>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Join House</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={isCreateHouseDialogOpen}
                  onOpenChange={setIsCreateHouseDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Create New House
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateHouse}>
                      <DialogHeader>
                        <DialogTitle>Create a New House</DialogTitle>
                        <DialogDescription>
                          Set up a new house and invite your housemates.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="house-name">House Name</Label>
                          <Input
                            id="house-name"
                            placeholder="e.g., The Pad"
                            name="house-name"
                            value={houseName}
                            onChange={(e) => setHouseName(e.target.value)}
                            required
                          />
                        </div>
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Note</AlertTitle>
                          <AlertDescription>
                            Creating a new house will remove you from your
                            current house.
                          </AlertDescription>
                        </Alert>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Create House</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={isLeaveHouseDialogOpen}
                  onOpenChange={setIsLeaveHouseDialogOpen}
                >
                  <DialogTrigger asChild>
                    {house ? (
                      <Button
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive"
                      >
                        Leave House
                      </Button>
                    ) : (
                      <div></div>
                    )}
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Leave House</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to leave {house?.name}?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                          This action cannot be undone. You will lose access to
                          all house data.
                        </AlertDescription>
                      </Alert>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsLeaveHouseDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleLeaveHouse}>
                        Leave House
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Separator />

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="account">
                <User className="mr-2 h-4 w-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Bell className="mr-2 h-4 w-4" />
                Preferences
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit">Update Profile</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        name="current_password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        name="new_password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        name="confirm_password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit">Change Password</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Manage how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about chores, expenses, and house
                        updates via email.
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how cryb looks on your device
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Switch between light and dark themes.
                      </p>
                    </div>
                    <Switch
                      id="dark-mode"
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
