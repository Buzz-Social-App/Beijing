"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud } from "lucide-react";
import { CldUploadWidget } from 'next-cloudinary';

// Update the type to match Cloudinary's actual response structure
type CloudinaryResult = {
    event: string;
    info: {
        secure_url: string;
        public_id: string;
        thumbnail_url: string;
        asset_id: string;
    };
};

export default function AdvertFormPage() {
    const [formData, setFormData] = useState({
        title: "",
        link_url: "",
    });
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const advertId = searchParams.get('id');
    const isEditMode = !!advertId;

    // Load existing advert data if in edit mode
    useEffect(() => {
        const loadAdvertData = async () => {
            if (!advertId) return;

            setIsLoading(true);
            try {
                const { data: advertData, error: advertError } = await supabase
                    .from('adverts')
                    .select('*')
                    .eq('id', advertId)
                    .single();

                if (advertError) throw new Error(`Error loading advert: ${advertError.message}`);
                if (!advertData) throw new Error('Advert not found');

                setFormData({
                    title: advertData.title,
                    link_url: advertData.link_url || "",
                });
                setImageUrl(advertData.image_url);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load advert";
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        loadAdvertData();
    }, [advertId]);

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent, status: string) => {
        e.preventDefault();

        if (!imageUrl) {
            setError("Please upload an image for the advert");
            return;
        }

        if (!user) {
            setError("You must be logged in to create an advert");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const advertData = {
                title: formData.title,
                image_url: imageUrl,
                link_url: formData.link_url || null,
                status: status,
            };

            let result;
            if (isEditMode) {
                // Update existing advert
                result = await supabase
                    .from('adverts')
                    .update(advertData)
                    .eq('id', advertId)
                    .select('id')
                    .single();
            } else {
                // Create new advert
                result = await supabase
                    .from('adverts')
                    .insert(advertData)
                    .select('id')
                    .single();
            }

            const { error: advertError } = result;
            if (advertError) throw new Error(`Error ${isEditMode ? 'updating' : 'creating'} advert: ${advertError.message}`);

            // Navigate back to adverts page
            router.push('/adverts');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'save'} advert`;
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 flex items-center justify-center h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
                <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Advert' : 'Create New Advert'}</h1>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={isSubmitting || !user}
                        onClick={(e) => handleSubmit(e as React.FormEvent, "DRAFT")}
                        className="w-full sm:w-auto"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save as Draft"
                        )}
                    </Button>
                    <Button
                        type="button"
                        disabled={isSubmitting || !user}
                        onClick={(e) => handleSubmit(e as React.FormEvent, "PENDING")}
                        className="w-full sm:w-auto"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Submit Advert"
                        )}
                    </Button>
                </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Advert Details</CardTitle>
                            <CardDescription>
                                Enter the basic information about your advert
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="Enter advert title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="link_url">Link URL</Label>
                                <Input
                                    id="link_url"
                                    name="link_url"
                                    type="url"
                                    placeholder="https://..."
                                    value={formData.link_url}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Image Upload */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Advert Image</CardTitle>
                            <CardDescription>
                                Upload an image for your advert
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>Image *</Label>
                                <CldUploadWidget
                                    uploadPreset="adverts"
                                    options={{
                                        maxFiles: 1,
                                        resourceType: "image",
                                        clientAllowedFormats: ["png", "jpeg", "jpg", "gif"],
                                        maxFileSize: 10000000, // 10MB
                                        folder: "adverts",
                                        sources: ["local", "url", "camera"],
                                        styles: {
                                            palette: {
                                                window: "#000000",
                                                windowBorder: "#90A0B3",
                                                tabIcon: "#0078FF",
                                                menuIcons: "#5A616A",
                                                textDark: "#000000",
                                                textLight: "#FFFFFF",
                                                link: "#0078FF",
                                                action: "#FF620C",
                                                inactiveTabIcon: "#0E2F5A",
                                                error: "#F44235",
                                                inProgress: "#0078FF",
                                                complete: "#20B832",
                                                sourceBg: "#E4EBF1"
                                            }
                                        }
                                    }}
                                    onSuccess={(result) => {
                                        const uploadResult = result as CloudinaryResult;
                                        console.log(uploadResult);
                                        if (uploadResult?.event === "success" && uploadResult?.info) {
                                            setImageUrl(uploadResult.info.secure_url);
                                        }
                                    }}
                                >
                                    {({ open }) => (
                                        <div
                                            className="space-y-4"
                                            onDragEnter={() => setIsDragging(true)}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setIsDragging(true);
                                            }}
                                            onDrop={() => setIsDragging(false)}
                                        >
                                            <div
                                                onClick={() => open()}
                                                className={`border-2 border-dashed rounded-md p-4 sm:p-6 text-center transition-colors cursor-pointer
                                                    ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-border'}`}
                                            >
                                                {imageUrl ? (
                                                    <div className="relative">
                                                        <img
                                                            src={imageUrl}
                                                            alt="Preview"
                                                            className="mx-auto max-h-64 rounded-md"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            className="mt-2 w-full sm:w-auto"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setImageUrl(null);
                                                            }}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <UploadCloud className="mb-2 h-10 w-10 text-muted-foreground" />
                                                        <span className="text-sm font-medium">
                                                            Click to upload or drag & drop
                                                        </span>
                                                        <span className="text-xs text-muted-foreground mt-1">
                                                            PNG, JPG or GIF up to 10MB
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CldUploadWidget>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {!user && (
                    <div className="bg-primary/10 text-primary px-4 py-3 rounded-md mt-6">
                        Please log in to create an advert
                    </div>
                )}

                {error && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mt-6">
                        {error}
                    </div>
                )}
            </form>
        </div>
    );
}
