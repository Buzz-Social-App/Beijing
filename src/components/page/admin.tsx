"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { supabase } from "@/lib/supabase";
import { useAuth, SUPER_ADMIN_ID } from "@/lib/auth-context";

interface Admin {
    id: string;
    email?: string;
}

const ClientAdminPage = () => {
    const { isSuperAdmin } = useAuth();
    const router = useRouter();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [adminToRemove, setAdminToRemove] = useState<Admin | null>(null);
    const [newAdminId, setNewAdminId] = useState("");

    useEffect(() => {
        if (!isSuperAdmin) {
            router.push("/");
            return;
        }
        fetchAdmins();
    }, [isSuperAdmin, router]);

    async function fetchAdmins() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("admins")
                .select("id")
                .order("id", { ascending: true });

            if (error) throw error;

            const adminsWithEmails: Admin[] = await Promise.all(
                (data || []).map(async (admin) => {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("username")
                        .eq("id", admin.id)
                        .single();
                    return { id: admin.id, email: profile?.username };
                })
            );

            setAdmins(adminsWithEmails);
        } catch (err) {
            console.error("Error fetching admins:", err);
            setError("Failed to fetch admins");
        } finally {
            setLoading(false);
        }
    }

    async function addAdmin(id: string) {
        setActionLoading(true);
        setError(null);
        try {
            const trimmedId = id.trim();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(trimmedId)) {
                setError("Invalid UUID format");
                return;
            }

            if (admins.some((a) => a.id === trimmedId)) {
                setError("This user is already an admin");
                return;
            }

            const { error } = await supabase
                .from("admins")
                .insert([{ id: trimmedId }]);

            if (error) throw error;

            setNewAdminId("");
            setIsAddDialogOpen(false);
            await fetchAdmins();
        } catch (err) {
            console.error("Error adding admin:", err);
            setError("Failed to add admin. Make sure the user ID exists.");
        } finally {
            setActionLoading(false);
        }
    }

    async function removeAdmin(id: string) {
        setActionLoading(true);
        setError(null);
        try {
            const { error } = await supabase
                .from("admins")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setAdminToRemove(null);
            setIsRemoveDialogOpen(false);
            await fetchAdmins();
        } catch (err) {
            console.error("Error removing admin:", err);
            setError("Failed to remove admin");
        } finally {
            setActionLoading(false);
        }
    }

    if (!isSuperAdmin) return null;

    return (
        <>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Admin</DialogTitle>
                        <DialogDescription>
                            Enter the user ID (UUID) to grant admin access.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="e.g. a1bf12b4-7be7-47ba-89cb-5ff0705816e9"
                        value={newAdminId}
                        onChange={(e) => setNewAdminId(e.target.value)}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => addAdmin(newAdminId)}
                            disabled={!newAdminId.trim() || actionLoading}
                        >
                            {actionLoading ? "Adding..." : "Add Admin"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Admin</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove admin access for{" "}
                            <span className="font-mono font-semibold">
                                {adminToRemove?.email || adminToRemove?.id}
                            </span>
                            ?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => adminToRemove && removeAdmin(adminToRemove.id)}
                            disabled={actionLoading}
                        >
                            {actionLoading ? "Removing..." : "Remove"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="flex-1 min-h-0 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Current Admins</CardTitle>
                    <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Admin
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : admins.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No admins found.</p>
                    ) : (
                        <div className="space-y-2">
                            {admins.map((admin) => (
                                <div
                                    key={admin.id}
                                    className="flex items-center justify-between p-3 rounded-lg border"
                                >
                                    <div className="min-w-0 flex-1">
                                        {admin.email && (
                                            <p className="text-sm font-medium truncate">{admin.email}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground font-mono truncate">
                                            {admin.id}
                                        </p>
                                    </div>
                                    {admin.id === SUPER_ADMIN_ID ? (
                                        <span className="text-xs text-muted-foreground ml-4 shrink-0">
                                            Super Admin
                                        </span>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="ml-4 shrink-0 text-destructive hover:text-destructive"
                                            onClick={() => {
                                                setAdminToRemove(admin);
                                                setIsRemoveDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end">
                    <p className="text-sm text-muted-foreground">
                        {error ? error : `${admins.length} admin${admins.length !== 1 ? "s" : ""}`}
                    </p>
                </CardFooter>
            </Card>
        </>
    );
};

export default ClientAdminPage;
