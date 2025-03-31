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
import { Tag } from "@/components/ui/tag";
import { IconName } from "@/components/ui/dynamic-icon";
import { isGoogleMapsLoaded } from "@/lib/google-maps";

// Google Maps container styles
const mapContainerStyle = {
    width: '100%',
    height: '200px',
    borderRadius: '0.5rem',
    marginTop: '1rem'
};

// Define the Tag type based on the schema
type Tag = {
    title: string;
    icon: string;
};

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
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoadingTags, setIsLoadingTags] = useState(false);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [eventId, setEventId] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

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
                price: eventData.price ? eventData.price.toString() : "",
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

    // Check if Google Maps API is loaded from the shared loader
    useEffect(() => {
        const checkMapsLoaded = () => {
            if (isGoogleMapsLoaded()) {
                setIsMapLoaded(true);
            } else {
                // If not loaded yet, check again after a short delay
                setTimeout(checkMapsLoaded, 500);
            }
        };

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

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent, status: string) => {
        e.preventDefault();

        if (!user) {
            setError("You must be logged in to create an event");
            return;
        }

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

        setIsSubmitting(true);
        setError("");

        try {
            // Format date for database
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');

            // Prepare event data
            const eventData = {
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

            let insertedEventId;

            if (eventId) {
                // Update existing event
                const { error: updateError } = await supabase
                    .from('events')
                    .update(eventData)
                    .eq('id', eventId);

                if (updateError) throw new Error(`Error updating event: ${updateError.message}`);
                insertedEventId = eventId;
            } else {
                // Create new event
                const { data: newEventData, error: insertError } = await supabase
                    .from('events')
                    .insert({
                        ...eventData,
                        host_id: user.id,
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
                const filePath = `events/${insertedEventId}/hero-${Date.now()}`;
                const { error: heroError } = await supabase.storage
                    .from('event-images')
                    .upload(filePath, heroImage);

                if (heroError) throw new Error(`Error uploading hero image: ${heroError.message}`);

                // Get public URL
                const { data: publicUrlData } = supabase.storage
                    .from('event-images')
                    .getPublicUrl(filePath);

                heroImageUrl = publicUrlData.publicUrl;
            }

            // Handle supporting images upload if new files were selected
            const supportingImageUrls = [...supportingImagePreviews];
            for (let i = 0; i < supportingImages.length; i++) {
                const file = supportingImages[i];
                const filePath = `events/${insertedEventId}/supporting-${i}-${Date.now()}`;
                const { error: supportingError } = await supabase.storage
                    .from('event-images')
                    .upload(filePath, file);

                if (supportingError) throw new Error(`Error uploading supporting image: ${supportingError.message}`);

                // Get public URL
                const { data: publicUrlData } = supabase.storage
                    .from('event-images')
                    .getPublicUrl(filePath);

                supportingImageUrls.push(publicUrlData.publicUrl);
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

    return (
        <div className="container mx-auto p-4 flex flex-col">
            <h1 className="text-2xl font-bold mb-4">{eventId ? 'Edit Event' : 'Create New Event'}</h1>

            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin mr-2" />
                    <span>Loading event data...</span>
                </div>
            ) : (
                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Event Details</CardTitle>
                                <CardDescription>
                                    Enter the basic information about your event
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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

                                <div className="grid grid-cols-2 gap-4">
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
                        <Card>
                            <CardHeader>
                                <CardTitle>Location</CardTitle>
                                <CardDescription>
                                    Enter where your event will take place
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
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

                                <div className="space-y-2">
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
                                                cities.map((city) => (
                                                    <SelectItem key={city.id} value={city.city}>
                                                        {city.city}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Add Map Preview */}
                                {isMapLoaded ? (
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
                                                    featureType: 'all',
                                                    elementType: 'geometry',
                                                    stylers: [{ color: '#242f3e' }]
                                                },
                                                {
                                                    featureType: 'all',
                                                    elementType: 'labels.text.stroke',
                                                    stylers: [{ color: '#242f3e' }, { lightness: -80 }]
                                                },
                                                {
                                                    featureType: 'administrative',
                                                    elementType: 'labels.text.fill',
                                                    stylers: [{ color: '#746855' }]
                                                },
                                                {
                                                    featureType: 'administrative.locality',
                                                    elementType: 'labels.text.fill',
                                                    stylers: [{ color: '#d59563' }]
                                                },
                                                {
                                                    featureType: 'poi',
                                                    elementType: 'labels.text.fill',
                                                    stylers: [{ color: '#d59563' }]
                                                },
                                                {
                                                    featureType: 'poi.park',
                                                    elementType: 'geometry',
                                                    stylers: [{ color: '#263c3f' }]
                                                },
                                                {
                                                    featureType: 'poi.park',
                                                    elementType: 'labels.text.fill',
                                                    stylers: [{ color: '#6b9a76' }]
                                                },
                                                {
                                                    featureType: 'road',
                                                    elementType: 'geometry',
                                                    stylers: [{ color: '#38414e' }]
                                                },
                                                {
                                                    featureType: 'road',
                                                    elementType: 'geometry.stroke',
                                                    stylers: [{ color: '#212a37' }]
                                                },
                                                {
                                                    featureType: 'road',
                                                    elementType: 'labels.text.fill',
                                                    stylers: [{ color: '#9ca5b3' }]
                                                },
                                                {
                                                    featureType: 'road.highway',
                                                    elementType: 'geometry',
                                                    stylers: [{ color: '#746855' }]
                                                },
                                                {
                                                    featureType: 'road.highway',
                                                    elementType: 'geometry.stroke',
                                                    stylers: [{ color: '#1f2835' }]
                                                },
                                                {
                                                    featureType: 'road.highway',
                                                    elementType: 'labels.text.fill',
                                                    stylers: [{ color: '#f3d19c' }]
                                                },
                                                {
                                                    featureType: 'transit',
                                                    elementType: 'geometry',
                                                    stylers: [{ color: '#2f3948' }]
                                                },
                                                {
                                                    featureType: 'transit.station',
                                                    elementType: 'labels.text.fill',
                                                    stylers: [{ color: '#d59563' }]
                                                },
                                                {
                                                    featureType: 'water',
                                                    elementType: 'geometry',
                                                    stylers: [{ color: '#17263c' }]
                                                },
                                                {
                                                    featureType: 'water',
                                                    elementType: 'labels.text.fill',
                                                    stylers: [{ color: '#515c6d' }]
                                                },
                                                {
                                                    featureType: 'water',
                                                    elementType: 'labels.text.stroke',
                                                    stylers: [{ color: '#17263c' }]
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
                                ) : (
                                    <div className="flex items-center justify-center h-48 bg-muted rounded-md">
                                        <p className="text-muted-foreground">Loading Map...</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Images */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Images</CardTitle>
                                <CardDescription>
                                    Upload a hero image and supporting images for your event
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="hero-image">Hero Image *</Label>
                                    <div className="border-2 border-dashed rounded-md p-6 text-center">
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
                                                    className="mt-2"
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
                                    <div className="border-2 border-dashed rounded-md p-6 text-center">
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
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {tags.map((tag) => (
                                            <Tag
                                                key={tag.title}
                                                title={tag.title}
                                                icon={tag.icon as IconName}
                                                onClick={() => handleTagSelect(tag.title)}
                                                className={selectedTags.includes(tag.title) ? "ring-2 ring-primary" : ""}
                                            />
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

                    <div className="mt-8 flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={isSubmitting}
                            onClick={(e) => handleSubmit(e as React.FormEvent, "DRAFT")}
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
                            disabled={isSubmitting}
                            onClick={(e) => handleSubmit(e as React.FormEvent, "PENDING")}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {eventId ? "Updating..." : "Creating..."}
                                </>
                            ) : (
                                "Submit Event"
                            )}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
