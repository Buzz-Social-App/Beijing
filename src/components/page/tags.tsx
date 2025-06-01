"use client"

import { Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "../ui/card";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Tag } from "../ui/tag";

interface Tag {
    title: string;
}

const ClientTagPage = () => {
    const [tags, setTags] = useState<Tag[]>([])
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newTagTitle, setNewTagTitle] = useState("")

    useEffect(() => {
        fetchTags();
    }, []);

    async function fetchTags() {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .order('title', { ascending: true });

            if (error) throw error;
            console.log(data)

            setTags(data);
        } catch (error) {
            console.error('Error fetching tags:', error);
            setError('Failed to fetch tags');
        }
    }

    async function createTag(title: string) {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tags')
                .insert([{ title }])
                .select()
                .single();

            if (error) throw error;

            setTags([...tags, data]);
            setNewTagTitle("");
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error creating tag:', error);
            setError('Failed to create tag');
        } finally {
            setLoading(false);
        }
    }

    async function deleteTag(title: string) {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('tags')
                .delete()
                .eq('title', title);

            if (error) throw error;

            setTags(tags.filter((t) => t.title !== title));
        } catch (error) {
            console.error('Error deleting tag:', error);
            setError('Failed to delete tag');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Tag</DialogTitle>
                    </DialogHeader>
                    <Input
                        placeholder="Enter tag title"
                        value={newTagTitle}
                        onChange={(e) => setNewTagTitle(e.target.value)}
                    />
                    <DialogFooter>
                        <Button
                            onClick={() => createTag(newTagTitle)}
                            disabled={!newTagTitle.trim() || loading}
                        >
                            {loading ? "Creating..." : "Create Tag"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Card className="flex-1 min-h-0 flex flex-col">
                <CardContent className="flex flex-wrap gap-2 justify-start items-start flex-1">
                    <div className="flex flex-wrap gap-2 justify-start items-start">
                    {tags.map((tag) => (
                        <Tag key={tag.title} tag={tag.title} deleteTag={() => deleteTag(tag.title)} />
                    ))}
                    <div className="flex items-center justify-between px-2 py-2 gap-2 bg-primary rounded-full">
                        <Button
                            variant="default"
                            size="icon"
                            onClick={() => setIsDialogOpen(true)}
                            className="hover:cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <p className="text-sm text-muted-foreground">
                        {loading ? "Saving..." : error ? error : "Tags saved"}
                    </p>
                </CardFooter>
            </Card>
        </>
    );
}

export default ClientTagPage