"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, MapPin } from "lucide-react";
import { GoogleMap, Marker } from '@react-google-maps/api';
import { isGoogleMapsLoaded } from "@/lib/google-maps";
import { format, parse } from "date-fns";
import Image from "next/image";
import { Event } from "@/lib/types";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
// Google Maps container styles
const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '0.5rem',
};

export default function EventDetailPage() {
    const params = useParams();
    const eventId = params.id as string;
    const [event, setEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const router = useRouter();

    // Check if Google Maps API is loaded
    useEffect(() => {
        const checkMapsLoaded = () => {
            if (isGoogleMapsLoaded()) {
                setIsMapLoaded(true);
            } else {
                setTimeout(checkMapsLoaded, 500);
            }
        };

        checkMapsLoaded();
    }, []);

    // Fetch event data
    useEffect(() => {
        const fetchEvent = async () => {
            if (!eventId) return;

            setIsLoading(true);
            try {
                // Fetch the event data
                const { data, error: eventError } = await supabase
                    .from('events')
                    .select(`
                        *,
                        host:profiles(username)
                    `)
                    .eq('id', eventId)
                    .single();

                if (eventError) throw new Error(`Error fetching event: ${eventError.message}`);
                if (!data) throw new Error('Event not found');

                // Fetch tags for this event
                const { data: tagData, error: tagError } = await supabase
                    .from('events_tags')
                    .select('tag')
                    .eq('event_id', eventId);

                if (tagError) throw new Error(`Error fetching tags: ${tagError.message}`);

                // Set the event data with tags
                setEvent({
                    ...data,
                    tags: tagData ? tagData.map(t => t.tag) : []
                });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load event";
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvent();
    }, [eventId]);

    // Format time from 24h to 12h format with AM/PM
    const formatTime = (time: string) => {
        try {
            const timeObj = parse(time, 'HH:mm', new Date());
            return format(timeObj, 'h:mm a');
        } catch {
            return time; // Return original if parsing fails
        }
    };

    // Navigate to previous image
    const prevImage = () => {
        if (!event || !event.supporting_images) return;

        const totalImages = event.supporting_images.length + 1; // +1 for hero image
        setActiveImageIndex((activeImageIndex - 1 + totalImages) % totalImages);
    };

    // Navigate to next image
    const nextImage = () => {
        if (!event || !event.supporting_images) return;

        const totalImages = event.supporting_images.length + 1; // +1 for hero image
        setActiveImageIndex((activeImageIndex + 1) % totalImages);
    };

    // Get current image URL
    const getCurrentImageUrl = () => {
        if (!event) return '';

        if (activeImageIndex === 0) {
            return event.hero_image || '';
        } else if (event.supporting_images && event.supporting_images.length > 0) {
            return event.supporting_images[activeImageIndex - 1] || '';
        }

        return '';
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="container mx-auto p-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-destructive text-lg">{error || "Event not found"}</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => router.push('/events')}
                            >
                                Back to Events
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 space-y-8 flex flex-col">

            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-row gap-2 items-center justify-center h-full">
                    <Badge variant={event.status === "LIVE" ? "default" : "secondary"}>{event.status}</Badge>
                    <h1 className="text-2xl font-bold">{event.name}</h1>
                </div>
                <Button asChild>
                    <Link href={`/events/edit?id=${event.id}`}>Edit Event</Link>
                </Button>
            </div>

            {/* Hero Section */}
            <div className="relative rounded-lg overflow-hidden bg-muted h-[40vh] md:h-[50vh]">
                {event.hero_image ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={getCurrentImageUrl()}
                            alt={event.name}
                            fill
                            className="object-cover"
                            priority
                        />

                        {/* Image Navigation Controls */}
                        {event.supporting_images && event.supporting_images.length > 0 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
                                    onClick={prevImage}
                                >
                                    ←
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background"
                                    onClick={nextImage}
                                >
                                    →
                                </Button>
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                                    {[...Array(event.supporting_images.length + 1)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-2 w-2 rounded-full ${i === activeImageIndex ? 'bg-primary' : 'bg-muted'}`}
                                            onClick={() => setActiveImageIndex(i)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No image available</p>
                    </div>
                )}

                {/* Event Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4 md:p-6">
                    <h1 className="text-2xl md:text-4xl font-bold text-foreground/90">{event.name}</h1>
                    <p className="mt-2 text-lg text-foreground/70">{event.city}</p>
                </div>
            </div>

            {/* Event Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Event Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle>About this event</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-line">{event.description}</p>
                        </CardContent>
                    </Card>

                    {event.supporting_images && event.supporting_images.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Supporting Images</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-4">
                                    {event.supporting_images.map((image, index) => (
                                        // <div key={index} className="w-36 h-36 bg-red-500 relative">
                                        <Image key={index} src={image} alt={event.name} height={128} width={128} style={{
                                            objectFit: 'cover'
                                        }} className="rounded-md h-36 w-36" />
                                        // </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Map (if location is provided) */}
                    {event.location && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Location</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-4 flex items-center">
                                    <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
                                    {event.location}
                                </p>

                                {isMapLoaded && event.latitude && event.longitude ? (
                                    <GoogleMap
                                        mapContainerStyle={mapContainerStyle}
                                        center={{
                                            lat: event.latitude,
                                            lng: event.longitude
                                        }}
                                        zoom={15}
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
                                        <Marker
                                            position={{
                                                lat: event.latitude,
                                                lng: event.longitude
                                            }}
                                        />
                                    </GoogleMap>
                                ) : (
                                    <div className="flex items-center justify-center h-64 bg-muted rounded-md">
                                        <p className="text-muted-foreground">Loading Map...</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Event Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Date and Time */}
                            <div className="flex items-start space-x-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">Date and Time</p>
                                    <p className="text-muted-foreground">
                                        {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {formatTime(event.start_time)}
                                    </p>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-center space-x-3">
                                <div className="h-5 w-5 text-muted-foreground flex items-center justify-center">
                                    $
                                </div>
                                <div>
                                    <p className="font-medium">Price</p>
                                    <p className="text-muted-foreground">
                                        {event.price ? `$${event.price.toFixed(2)}` : 'Free'}
                                    </p>
                                </div>
                            </div>

                            {/* Tags */}
                            {/* {event.tags && event.tags.length > 0 && (
                                <div className="flex items-start space-x-3">
                                    <div className="h-5 w-5 text-muted-foreground flex items-center justify-center">
                                        #
                                    </div>
                                    <div>
                                        <p className="font-medium">Tags</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {event.tags.map(tag => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-1 bg-muted rounded-full text-sm"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )} */}

                            {/* CTA Button */}
                            {event.cta_link && (
                                <Button className="w-full mt-4">
                                    <a href={event.cta_link} target="_blank" rel="noopener noreferrer">
                                        Register
                                    </a>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Host Information (can be expanded) */}
                    {event.host && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Organized by</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center">
                                    <div className="relative h-12 w-12 rounded-full bg-muted overflow-hidden mr-4">
                                        <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-lg font-semibold">
                                            {event.host.username.charAt(0)}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-semibold">{event.host.username}</p>
                                        <p className="text-sm text-muted-foreground">Organizer</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div >
    );
}