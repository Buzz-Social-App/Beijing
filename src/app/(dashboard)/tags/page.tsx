'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flame, Music, Smile } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tag } from '@/components/ui/tag';
import { IconName } from '@/components/ui/dynamic-icon';

// Define the Tag type based on the schema
type Tag = {
    title: string;
    icon: string;
};

// Map of icon names to Lucide icon components
const iconMap: Record<string, React.ReactNode> = {
    'flame': <Flame className="h-6 w-6" />,
    'music': <Music className="h-6 w-6" />,
    'smile': <Smile className="h-6 w-6" />
};

// Larger icons for the tag cards
const largeIconMap: Record<string, React.ReactNode> = {
    'flame': <Flame className="h-8 w-8 text-neutral-100" />,
    'music': <Music className="h-8 w-8 text-neutral-100" />,
    'smile': <Smile className="h-8 w-8 text-neutral-100" />
};

export default function TagsPage() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [newTag, setNewTag] = useState({
        title: '',
        icon: 'flame' // Default icon
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Fetch tags on component mount
    useEffect(() => {
        fetchTags();
    }, []);

    async function fetchTags() {
        try {
            const { data, error } = await supabase
                .from('tags')
                .select('*');

            if (error) throw error;

            setTags(data || []);
        } catch (error) {
            console.error('Error fetching tags:', error);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            // Insert the tag into the database
            const { data, error } = await supabase
                .from('tags')
                .insert([{
                    title: newTag.title,
                    icon: newTag.icon
                }])
                .select();

            if (error) throw error;

            setTags([...tags, data[0]]);
            setNewTag({
                title: '',
                icon: 'flame'
            });
            router.refresh();
        } catch (error) {
            console.error('Error adding tag:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleIconChange = (value: string) => {
        setNewTag({ ...newTag, icon: value });
    };

    return (
        <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-4rem)]">
            <h1 className="text-2xl font-bold mb-4">Tags Management</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Left column - Form */}
                <Card className="overflow-auto">
                    <CardHeader>
                        <CardTitle>Add New Tag</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="tag-title">Tag Title</Label>
                                <Input
                                    id="tag-title"
                                    value={newTag.title}
                                    onChange={(e) => setNewTag({ ...newTag, title: e.target.value })}
                                    required
                                    className="flex-1"
                                    placeholder="Enter tag title"
                                />
                            </div>

                            <div className="space-y-2 flex flex-col">
                                <Label htmlFor="tag-icon">Icon</Label>
                                <div className="flex items-center space-x-4">
                                    <div className="flex-1">
                                        <Select
                                            value={newTag.icon}
                                            onValueChange={handleIconChange}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select an icon" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(iconMap).map(([iconName, icon]) => (
                                                    <SelectItem key={iconName} value={iconName}>
                                                        <div className="flex items-center">
                                                            <span className="mr-2">{icon}</span>
                                                            <span className="capitalize">{iconName}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Preview of how the icon will appear
                                </p>
                                {newTag.title && (
                                    <Tag title={newTag.title} icon={newTag.icon as IconName} />
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full"
                            >
                                {loading ? 'Adding...' : 'Add Tag'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Right column - Tags grid */}
                <div className="md:col-span-2 flex flex-col overflow-hidden">
                    <Card className="flex-1 min-h-0 flex flex-col">
                        <CardHeader className="flex-shrink-0">
                            <CardTitle>Tags</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto">
                            {tags.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {tags.map((tag) => (
                                        <div
                                            key={tag.title}
                                            className="bg-neutral-800 rounded-2xl aspect-square flex flex-col w-fit items-center justify-center text-center p-2 space-y-1"
                                        >
                                            {largeIconMap[tag.icon] || <Flame className="h-8 w-8 text-neutral-100" />}
                                            <span className="text-neutral-100 text-xs font-normal">{tag.title}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-muted-foreground">No tags found. Add your first tag!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
