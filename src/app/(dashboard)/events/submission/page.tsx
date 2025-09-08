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
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressPicker } from "@/components/ui/address-picker";
import { GoogleMap, Marker } from '@react-google-maps/api';
// import { Tag } from "@/components/ui/tag";
import { isGoogleMapsLoaded, loadGoogleMapsApi } from "@/lib/google-maps";
import { Tag } from "@/components/ui/tag";
import { processAndUploadImage } from "@/lib/utils";

// Google Maps container styles
const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem',
    marginTop: '1rem'
};

// Define the Tag type based on the schema
// type Tag = {
//     title: string;
//     icon: string;
// };

export default function EventFormPage() {
    const [formData, setFormData] = useState({
        name: "",
        location: "",
        city: "",
        description: "",
        cta_link: "",
        price: "",
        time: "",
    });
    const [coordinates, setCoordinates] = useState<{ latitude: number | null, longitude: number | null }>({
        latitude: null,
        longitude: null
    });
    const [isHidden, setIsHidden] = useState(false);
    const [cities, setCities] = useState<{ id: string, city: string, live: boolean, latitude: number, longitude: number }[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [heroImage, setHeroImage] = useState<File | null>(null);
    const [supportingImages, setSupportingImages] = useState<File[]>([]);
    const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
    const [supportingImagePreviews, setSupportingImagePreviews] = useState<string[]>([]);
    // const [tags, setTags] = useState<Tag[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [tags, setTags] = useState<{ title: string }[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isLoadingTags, setIsLoadingTags] = useState(false);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [eventId, setEventId] = useState<string | null>(null);
    // Add state for drag-over
    const [isHeroDragActive, setIsHeroDragActive] = useState(false);
    const [isSupportingDragActive, setIsSupportingDragActive] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [isGuestMode, setIsGuestMode] = useState(user ? false : true);
    const [guestInfo, setGuestInfo] = useState({
        name: "",
        email: "",
    });

    // Check if editing an existing event
    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            setEventId(id);
            fetchEventDetails(id);
        }
    }, [searchParams]);

    // Fetch event details if editing
    const fetchEventDetails = async (id: string) => {
        setIsLoading(true);
        try {
            // Fetch the event data
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single();

            if (eventError) throw eventError;
            if (!eventData) throw new Error('Event not found');

            // Check if the current user is the event creator
            if (eventData.host_id !== user?.id) {
                setError("You don't have permission to edit this event");
                return;
            }

            // Set form data
            setFormData({
                name: eventData.name || "",
                location: eventData.location || "",
                city: eventData.city || "",
                description: eventData.description || "",
                cta_link: eventData.cta_link || "",
                price: eventData.price ? (eventData.price / 100).toString() : "",
                time: eventData.start_time || "",
            });

            // Set coordinates
            if (eventData.latitude && eventData.longitude) {
                setCoordinates({
                    latitude: eventData.latitude,
                    longitude: eventData.longitude
                });
            }

            // Set if hidden
            setIsHidden(eventData.location === null);

            // Set date
            if (eventData.date) {
                setSelectedDate(new Date(eventData.date));
            }

            // Set hero image preview
            if (eventData.hero_image) {
                setHeroImagePreview(eventData.hero_image);
            }

            // Set supporting images previews
            if (eventData.supporting_images && Array.isArray(eventData.supporting_images)) {
                setSupportingImagePreviews(eventData.supporting_images);
            }

            // Fetch event tags
            const { data: tagData, error: tagError } = await supabase
                .from('events_tags')
                .select('tag')
                .eq('event_id', id);

            if (tagError) throw tagError;

            if (tagData) {
                setSelectedTags(tagData.map(t => t.tag));
            }

        } catch (err) {
            console.error('Error fetching event details:', err);
            setError('Failed to load event details');
        } finally {
            setIsLoading(false);
        }
    };

    // Check if Google Maps API is loaded
    useEffect(() => {
        const checkMapsLoaded = () => {
            console.log("Checking if Google Maps API is loaded");
            if (isGoogleMapsLoaded()) {
                setIsMapLoaded(true);
            } else {
                setTimeout(checkMapsLoaded, 500);
            }
        };
        loadGoogleMapsApi()
        checkMapsLoaded();
    }, []);

    // Fetch cities from the database
    useEffect(() => {
        const fetchCities = async () => {
            setIsLoadingCities(true);
            try {
                const { data, error } = await supabase
                    .from('cities')
                    .select('*')
                    .eq('live', true)
                    .order('city', { ascending: true });

                if (error) throw error;

                setCities(data || []);

                // Auto-select the first city if available
                if (data && data.length > 0) {
                    const firstCity = data[0];
                    setFormData(prev => ({ ...prev, city: firstCity.city }));

                    // If no coordinates are set yet, use the first city's coordinates
                    if (!coordinates.latitude || !coordinates.longitude) {
                        setCoordinates({
                            latitude: firstCity.latitude,
                            longitude: firstCity.longitude
                        });
                    }
                }
            } catch (err) {
                console.error('Error fetching cities:', err);
            } finally {
                setIsLoadingCities(false);
            }
        };

        fetchCities();
    }, []);

    // Fetch tags from the database
    useEffect(() => {
        const fetchTags = async () => {
            setIsLoadingTags(true);
            try {
                const { data, error } = await supabase
                    .from('tags')
                    .select('*');

                if (error) throw error;

                setTags(data || []);
            } catch (err) {
                console.error('Error fetching tags:', err);
            } finally {
                setIsLoadingTags(false);
            }
        };

        fetchTags();
    }, []);

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle address change from AddressPicker
    const handleAddressChange = (address: string, newCoordinates: { latitude: number; longitude: number }) => {
        setFormData(prev => ({ ...prev, location: address }));
        setCoordinates({
            latitude: newCoordinates.latitude,
            longitude: newCoordinates.longitude
        });
    };

    // Handle select changes
    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle hero image upload
    const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setHeroImage(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setHeroImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle supporting images upload
    const handleSupportingImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const fileArray = Array.from(e.target.files);
            setSupportingImages((prev) => [...prev, ...fileArray]);

            // Create previews
            const previewUrls: string[] = [];
            fileArray.forEach((file) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    previewUrls.push(reader.result as string);
                    if (previewUrls.length === fileArray.length) {
                        setSupportingImagePreviews((prev) => [...prev, ...previewUrls]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    // Handle guest info changes
    const handleGuestInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setGuestInfo((prev) => ({ ...prev, [name]: value }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent, status: string) => {
        e.preventDefault();

        if (!selectedDate) {
            setError("Please select a date for the event");
            return;
        }

        if (!formData.time) {
            setError("Please select a time for the event");
            return;
        }

        if (!isHidden && !formData.location) {
            setError("Please enter an address for the event");
            return;
        }

        // If guest mode and required fields aren't filled
        if (!user && isGuestMode && (!guestInfo.name || !guestInfo.email)) {
            setError("Please enter your name and email to submit as a guest");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            // Format date for database
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');

            // Prepare event data
            interface EventData {
                name: string;
                location: string | null;
                city: string;
                description: string;
                date: string;
                start_time: string;
                cta_link: string;
                status: string;
                price: number | null;
                latitude: number | null;
                longitude: number | null;
                host_id?: string;
                guest_id?: string;
            }

            const eventData: EventData = {
                name: formData.name,
                location: isHidden ? null : formData.location,
                city: formData.city,
                description: formData.description,
                date: formattedDate,
                start_time: formData.time,
                cta_link: formData.cta_link,
                status: status,
                price: formData.price ? parseFloat(formData.price) : null,
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
            };

            // If guest user, create guest record first
            let guestId = null;
            if (!user && isGuestMode) {
                const { data: guestData, error: guestError } = await supabase
                    .from('guests')
                    .insert({
                        name: guestInfo.name,
                        email: guestInfo.email,
                    })
                    .select('id')
                    .single();

                if (guestError) throw new Error(`Error creating guest: ${guestError.message}`);
                if (!guestData) throw new Error('Failed to create guest record');

                guestId = guestData.id;
                // Add the guest ID to the event data
                eventData.guest_id = guestId;
            } else if (user) {
                // Set host_id if user is logged in
                eventData.host_id = user.id;
            }

            let insertedEventId;

            if (eventId) {
                // Update existing event - only allow if user is logged in or it's their guest event
                // This would need additional checks on the server for security
                const { error: updateError } = await supabase
                    .from('events')
                    .update({
                        ...eventData,
                        price: eventData.price ? Number(eventData.price) * 100 : null,
                    })
                    .eq('id', eventId);

                if (updateError) throw new Error(`Error updating event: ${updateError.message}`);
                insertedEventId = eventId;
            } else {
                // Create new event
                const { data: newEventData, error: insertError } = await supabase
                    .from('events')
                    .insert({
                        ...eventData,
                        price: eventData.price ? Number(eventData.price) * 100 : null,
                        created_at: new Date().toISOString(),
                    })
                    .select('id')
                    .single();

                if (insertError) throw new Error(`Error creating event: ${insertError.message}`);
                if (!newEventData) throw new Error('Failed to create event: No ID returned');

                insertedEventId = newEventData.id;
            }

            // Handle hero image upload if a new file was selected
            let heroImageUrl = heroImagePreview;
            if (heroImage) {
                const heroKey = `events/${insertedEventId}/hero.jpg`;
                heroImageUrl = await processAndUploadImage(heroImage, heroKey, {
                    maxWidth: 2000,
                    maxHeight: 1200,
                    quality: 0.82,
                    mimeType: 'image/jpeg',
                });
            }

            // Handle supporting images upload if new files were selected
            const supportingImageUrls = [...supportingImagePreviews];
            for (let i = 0; i < supportingImages.length; i++) {
                const file = supportingImages[i];
                const suppKey = `events/${insertedEventId}/supporting/${i}.jpg`;
                const url = await processAndUploadImage(file, suppKey, {
                    maxWidth: 1600,
                    maxHeight: 1600,
                    quality: 0.8,
                    mimeType: 'image/jpeg',
                });
                supportingImageUrls.push(url);
            }

            // Update event with image URLs if changed
            if (heroImage || supportingImages.length > 0) {
                const { error: updateError } = await supabase
                    .from('events')
                    .update({
                        hero_image: heroImageUrl,
                        supporting_images: supportingImageUrls.length > 0 ? supportingImageUrls : null,
                    })
                    .eq('id', insertedEventId);

                if (updateError) throw new Error(`Error updating event images: ${updateError.message}`);
            }

            // Handle tags
            if (eventId) {
                // First remove existing tags
                await supabase
                    .from('events_tags')
                    .delete()
                    .eq('event_id', eventId);
            }

            // Add tags if selected
            if (selectedTags.length > 0) {
                const tagInserts = selectedTags.map(tag => ({
                    event_id: insertedEventId,
                    tag: tag
                }));

                const { error: tagError } = await supabase
                    .from('events_tags')
                    .insert(tagInserts);

                if (tagError) throw new Error(`Error adding tags: ${tagError.message}`);
            }

            // Navigate to event page
            router.push(`/events/${insertedEventId}`);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to save event";
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle removing a supporting image
    const removeSupportingImage = (index: number) => {
        setSupportingImages((prev) => prev.filter((_, i) => i !== index));
        setSupportingImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle tag selection
    const handleTagSelect = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    // Drag-and-drop handlers for hero image
    const handleHeroDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsHeroDragActive(true);
    };
    const handleHeroDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsHeroDragActive(false);
    };
    const handleHeroDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsHeroDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            // Reuse the existing handler logic
            const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleHeroImageChange(fakeEvent);
        }
    };
    // Drag-and-drop handlers for supporting images
    const handleSupportingDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsSupportingDragActive(true);
    };
    const handleSupportingDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsSupportingDragActive(false);
    };
    const handleSupportingDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsSupportingDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // Reuse the existing handler logic
            const fakeEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleSupportingImagesChange(fakeEvent);
        }
    };

    return (
        <div className="container mx-auto p-4 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
                <h1 className="text-2xl font-bold">{eventId ? 'Edit Event' : 'Create New Event'}</h1>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    {(user) && <Button
                        type="button"
                        variant="secondary"
                        disabled={isSubmitting}
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
                    </Button>}
                    <Button
                        type="button"
                        disabled={isSubmitting || (!user && !isGuestMode)}
                        onClick={(e) => handleSubmit(e as React.FormEvent, "PENDING")}
                        className="w-full sm:w-auto"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {eventId ? "Updating..." : "Creating..."}
                            </>
                        ) : (
                            !user && !isGuestMode ? "Enable Guest Mode to Submit" : "Submit Event"
                        )}
                    </Button>
                </div>
            </div>


            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin mr-2" />
                    <span>Loading event data...</span>
                </div>
            ) : (
                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader className="px-4 sm:px-6">
                                <CardTitle>Event Details</CardTitle>
                                <CardDescription>
                                    Enter the basic information about your event
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 px-4 sm:px-6">
                                {/* Guest creator mode when not logged in */}
                                {!user && (
                                    <div className="space-y-2 p-3 sm:p-4 border border-muted rounded-md bg-muted/10">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="guest-mode"
                                                checked={isGuestMode}
                                                onCheckedChange={(checked) => setIsGuestMode(!!checked)}
                                            />
                                            <Label htmlFor="guest-mode">Create event as guest</Label>
                                        </div>

                                        {isGuestMode && (
                                            <div className="space-y-4 mt-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Display Name *</Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        placeholder="The host name to displayed"
                                                        value={guestInfo.name}
                                                        onChange={handleGuestInfoChange}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Your Email *</Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        placeholder="Your email address"
                                                        value={guestInfo.email}
                                                        onChange={handleGuestInfoChange}
                                                        required
                                                    />
                                                </div>

                                                <div className="mt-4 p-3 bg-primary/10 rounded-md text-sm border border-primary/20">
                                                    <p className="font-medium text-primary">Want more control over your events?</p>
                                                    <p className="text-muted-foreground mt-1">
                                                        Create an account to view event analytics, track reach,
                                                        and easily edit your events in the future.
                                                    </p>
                                                    <div className="mt-2">
                                                        <Button
                                                            type="button"
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => router.push('/signup')}
                                                        >
                                                            Sign up for free
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="name">Event Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Enter event name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Input
                                        id="description"
                                        name="description"
                                        placeholder="Event description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date *</Label>
                                        <DatePicker
                                            date={selectedDate}
                                            setDate={setSelectedDate}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="time">Start Time *</Label>
                                        <Input
                                            id="time"
                                            type="time"
                                            name="time"
                                            placeholder="Start time"
                                            value={formData.time}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (leave empty if free)</Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cta_link">CTA Link</Label>
                                    <Input
                                        id="cta_link"
                                        name="cta_link"
                                        placeholder="https://..."
                                        value={formData.cta_link}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Location */}
                        <Card className="h-full">
                            <CardHeader className="px-4 sm:px-6">
                                <CardTitle>Location</CardTitle>
                                <CardDescription>
                                    Enter where your event will take place
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 h-full flex flex-col px-4 sm:px-6">
                                <div className="flex flex-wrap items-center justify-start gap-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="hidden-toggle"
                                            checked={isHidden}
                                            onCheckedChange={(checked) => setIsHidden(!!checked)}
                                        />
                                        <Label htmlFor="hidden-toggle">Hidden Event</Label>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {isHidden ? "Address will be hidden from users" : "Address will be public"}
                                    </span>
                                </div>

                                {!isHidden && (
                                    <AddressPicker
                                        value={formData.location}
                                        onChange={handleAddressChange}
                                        required={!isHidden}
                                        label="Address"
                                    />
                                )}

                                <div className="space-y-2 flex flex-col">
                                    <Label htmlFor="city">City *</Label>
                                    <Select
                                        value={formData.city}
                                        onValueChange={(value) => handleSelectChange('city', value)}
                                        required
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a city" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {isLoadingCities ? (
                                                <div className="p-2 flex items-center justify-center">
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    Loading cities...
                                                </div>
                                            ) : (
                                                cities.map((city, index) => (
                                                    <SelectItem key={index} value={city.city}>
                                                        {city.city}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Add Map Preview */}
                                <div className="flex-grow">
                                    {isMapLoaded ? (
                                        <div className="h-64 md:h-full min-h-[16rem] w-full flex">
                                            <GoogleMap
                                                mapContainerStyle={mapContainerStyle}
                                                center={{
                                                    lat: coordinates.latitude || 0,
                                                    lng: coordinates.longitude || 0
                                                }}
                                                zoom={coordinates.latitude && coordinates.longitude && !isHidden ? 15 : 12}
                                                options={{
                                                    streetViewControl: false,
                                                    mapTypeControl: false,
                                                    fullscreenControl: false,
                                                    zoomControl: true,
                                                    styles: [
                                                        {
                                                            "elementType": "geometry",
                                                            "stylers": [
                                                                {
                                                                    "color": "#212121"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "elementType": "labels.icon",
                                                            "stylers": [
                                                                {
                                                                    "visibility": "off"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "elementType": "labels.text.fill",
                                                            "stylers": [
                                                                {
                                                                    "color": "#757575"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "elementType": "labels.text.stroke",
                                                            "stylers": [
                                                                {
                                                                    "color": "#212121"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "administrative",
                                                            "elementType": "geometry",
                                                            "stylers": [
                                                                {
                                                                    "color": "#757575"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "administrative.country",
                                                            "elementType": "labels.text.fill",
                                                            "stylers": [
                                                                {
                                                                    "color": "#9e9e9e"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "administrative.land_parcel",
                                                            "elementType": "labels",
                                                            "stylers": [
                                                                {
                                                                    "visibility": "off"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "administrative.locality",
                                                            "elementType": "labels.text.fill",
                                                            "stylers": [
                                                                {
                                                                    "color": "#bdbdbd"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "poi",
                                                            "elementType": "labels.text.fill",
                                                            "stylers": [
                                                                {
                                                                    "color": "#757575"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "poi.park",
                                                            "elementType": "geometry",
                                                            "stylers": [
                                                                {
                                                                    "color": "#181818"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "poi.park",
                                                            "elementType": "labels.text.fill",
                                                            "stylers": [
                                                                {
                                                                    "color": "#616161"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "poi.park",
                                                            "elementType": "labels.text.stroke",
                                                            "stylers": [
                                                                {
                                                                    "color": "#1b1b1b"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "road",
                                                            "elementType": "geometry.fill",
                                                            "stylers": [
                                                                {
                                                                    "color": "#2c2c2c"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "road",
                                                            "elementType": "labels.text.fill",
                                                            "stylers": [
                                                                {
                                                                    "color": "#8a8a8a"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "road.arterial",
                                                            "elementType": "geometry",
                                                            "stylers": [
                                                                {
                                                                    "color": "#373737"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "road.highway",
                                                            "elementType": "geometry",
                                                            "stylers": [
                                                                {
                                                                    "color": "#3c3c3c"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "road.highway.controlled_access",
                                                            "elementType": "geometry",
                                                            "stylers": [
                                                                {
                                                                    "color": "#4e4e4e"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "road.local",
                                                            "elementType": "labels",
                                                            "stylers": [
                                                                {
                                                                    "visibility": "off"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "road.local",
                                                            "elementType": "labels.text.fill",
                                                            "stylers": [
                                                                {
                                                                    "color": "#616161"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "transit",
                                                            "elementType": "labels.text.fill",
                                                            "stylers": [
                                                                {
                                                                    "color": "#757575"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "water",
                                                            "elementType": "geometry",
                                                            "stylers": [
                                                                {
                                                                    "color": "#000000"
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "featureType": "water",
                                                            "elementType": "labels.text.fill",
                                                            "stylers": [
                                                                {
                                                                    "color": "#3d3d3d"
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }}
                                            >
                                                {coordinates.latitude && coordinates.longitude && (
                                                    <Marker
                                                        position={{
                                                            lat: coordinates.latitude,
                                                            lng: coordinates.longitude
                                                        }}
                                                    />
                                                )}
                                            </GoogleMap>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-64 md:h-full min-h-[16rem] bg-muted rounded-md">
                                            <p className="text-muted-foreground">Loading Map...</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Images */}
                        <Card className="">
                            <CardHeader className="px-4 sm:px-6">
                                <CardTitle>Images</CardTitle>
                                <CardDescription>
                                    Upload a hero image and supporting images for your event
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 px-4 sm:px-6">
                                <div className="space-y-2">
                                    <Label htmlFor="hero-image">Hero Image *</Label>
                                    <div
                                        className={`border-2 border-dashed rounded-md p-4 sm:p-6 text-center transition-colors ${isHeroDragActive ? 'border-primary bg-primary/10' : ''}`}
                                        onDragOver={handleHeroDragOver}
                                        onDragLeave={handleHeroDragLeave}
                                        onDrop={handleHeroDrop}
                                    >
                                        {heroImagePreview ? (
                                            <div className="relative">
                                                <img
                                                    src={heroImagePreview}
                                                    alt="Hero preview"
                                                    className="mx-auto max-h-64 rounded-md"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    className="mt-2 w-full sm:w-auto"
                                                    onClick={() => {
                                                        setHeroImage(null);
                                                        setHeroImagePreview(null);
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ) : (
                                            <label htmlFor="hero-image" className="cursor-pointer">
                                                <div className="flex flex-col items-center">
                                                    <UploadCloud className="mb-2 h-10 w-10 text-muted-foreground" />
                                                    <span className="text-sm font-medium">
                                                        Drag & drop or click to upload
                                                    </span>
                                                    <span className="text-xs text-muted-foreground mt-1">
                                                        PNG, JPG or GIF up to 10MB
                                                    </span>
                                                </div>
                                                <Input
                                                    id="hero-image"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleHeroImageChange}
                                                    required
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="supporting-images">Supporting Images</Label>
                                    <div
                                        className={`border-2 border-dashed rounded-md p-4 sm:p-6 text-center transition-colors ${isSupportingDragActive ? 'border-primary bg-primary/10' : ''}`}
                                        onDragOver={handleSupportingDragOver}
                                        onDragLeave={handleSupportingDragLeave}
                                        onDrop={handleSupportingDrop}
                                    >
                                        <label htmlFor="supporting-images" className="cursor-pointer">
                                            <div className="flex flex-col items-center">
                                                <UploadCloud className="mb-2 h-10 w-10 text-muted-foreground" />
                                                <span className="text-sm font-medium">
                                                    Drag & drop or click to upload (multiple)
                                                </span>
                                                <span className="text-xs text-muted-foreground mt-1">
                                                    PNG, JPG or GIF up to 10MB
                                                </span>
                                            </div>
                                            <Input
                                                id="supporting-images"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                multiple
                                                onChange={handleSupportingImagesChange}
                                            />
                                        </label>
                                    </div>

                                    {supportingImagePreviews.length > 0 && (
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            {supportingImagePreviews.map((preview, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={preview}
                                                        alt={`Supporting preview ${index + 1}`}
                                                        className="aspect-square object-cover rounded-md"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        className="absolute top-2 right-2"
                                                        onClick={() => removeSupportingImage(index)}
                                                    >
                                                        ✕
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tags */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tags</CardTitle>
                                <CardDescription>
                                    Select tags that describe your event (optional)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingTags ? (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        <span>Loading tags...</span>
                                    </div>
                                ) : tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 justify-start items-start">
                                        {tags.map((tag) => (
                                            <button
                                                className={`rounded-full ${selectedTags.includes(tag.title) ? "ring-2 ring-primary" : ""} hover:cursor-pointer`}
                                                key={tag.title}
                                                onClick={() => handleTagSelect(tag.title)}
                                            >
                                                <Tag tag={tag.title} />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-4 text-muted-foreground">
                                        <p>No tags available. Add tags in the Tags Management section.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {
                        error && (
                            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mt-6">
                                {error}
                            </div>
                        )
                    }
                </form>
            )}
        </div>
    );
}
