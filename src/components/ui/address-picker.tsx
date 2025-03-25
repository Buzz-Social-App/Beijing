import { useEffect, useRef, useState } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { MapPin } from "lucide-react";
import { loadGoogleMapsApi, isGoogleMapsLoaded } from "@/lib/google-maps";

// Define interface for Google Maps place result
interface PlaceResult {
    geometry: {
        location: {
            lat: () => number;
            lng: () => number;
        };
    };
    formatted_address: string;
    name?: string;
    place_id?: string;
    types?: string[];
}

interface AddressPickerProps {
    value: string;
    onChange: (address: string, coordinates: { latitude: number; longitude: number }) => void;
    required?: boolean;
    label?: string;
    disabled?: boolean;
}

export function AddressPicker({
    value,
    onChange,
    required = false,
    label = "Address",
    disabled = false,
}: AddressPickerProps) {
    const [placesLoaded, setPlacesLoaded] = useState(false);
    const [mapsApiError, setMapsApiError] = useState<string | null>(null);
    const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({
        latitude: null,
        longitude: null,
    });
    const autocompleteRef = useRef<HTMLInputElement>(null);
    const autocompleteInstance = useRef<google.maps.places.Autocomplete | null>(null);

    // Check if API key exists
    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const apiKeyMissing = !googleMapsApiKey || googleMapsApiKey === "";

    // Load the Google Maps API
    useEffect(() => {
        if (apiKeyMissing) return;

        // If already loaded (from another component), set the loaded state
        if (isGoogleMapsLoaded()) {
            console.log('Google Maps already loaded');
            setPlacesLoaded(true);
            return;
        }

        // Load the API
        console.log('Loading Google Maps API...');
        loadGoogleMapsApi()
            .then(() => {
                console.log('Google Maps API loaded successfully');
                setPlacesLoaded(true);
            })
            .catch((error) => {
                console.error('Error loading Google Maps API:', error);
                setMapsApiError('Failed to load Google Maps API. Please refresh the page.');
            });
    }, [apiKeyMissing]);

    // Initialize Google Places Autocomplete after the API is loaded
    useEffect(() => {
        if (!placesLoaded) return;

        // Check if Google Maps API is actually available
        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
            console.error('Google Maps API not fully loaded yet');
            setMapsApiError('Google Maps API not properly loaded. Please refresh the page.');
            return;
        }

        // Don't initialize again if already done
        if (autocompleteInstance.current) return;

        // Only initialize if we have a reference to the input
        if (!autocompleteRef.current) {
            console.error('Input reference not available');
            return;
        }

        try {
            console.log('Initializing autocomplete...');
            const options = {
                types: ["establishment", "geocode"],
                fields: ["geometry.location", "formatted_address", "name", "place_id", "types"],
                componentRestrictions: { country: "gb" }, // Restrict to China for Beijing
            };

            autocompleteInstance.current = new google.maps.places.Autocomplete(
                autocompleteRef.current,
                options
            );

            // Add place_changed event listener
            autocompleteInstance.current.addListener("place_changed", () => {
                const place = autocompleteInstance.current?.getPlace() as PlaceResult;
                console.log('Place selected:', place);

                if (place && place.geometry && place.geometry.location) {
                    const latitude = place.geometry.location.lat();
                    const longitude = place.geometry.location.lng();

                    const newCoordinates = {
                        latitude,
                        longitude,
                    };

                    setCoordinates(newCoordinates);

                    // If this is an establishment and has a name, use that in the location display
                    let locationText = place.formatted_address;
                    if (
                        place.types &&
                        (place.types.includes("establishment") || place.types.includes("point_of_interest")) &&
                        place.name
                    ) {
                        locationText = `${place.name}, ${place.formatted_address}`;
                    }

                    onChange(locationText, newCoordinates);
                }
            });

            console.log("Autocomplete initialized successfully");
        } catch (error) {
            console.error("Error initializing autocomplete:", error);
            setMapsApiError("Failed to initialize Google Maps autocomplete");
        }
    }, [placesLoaded, onChange]);

    // Handle input changes from user typing
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only pass coordinates if both latitude and longitude are not null
        if (coordinates.latitude !== null && coordinates.longitude !== null) {
            onChange(e.target.value, {
                latitude: coordinates.latitude,
                longitude: coordinates.longitude
            });
        } else {
            // Just update the address without coordinates
            onChange(e.target.value, { latitude: 0, longitude: 0 });
        }
    };

    return (
        <div className="space-y-2">
            {label && <Label htmlFor="location">{label} {required && "*"}</Label>}
            <div className="relative">
                <Input
                    id="location"
                    name="location"
                    placeholder="Search for venues, addresses, landmarks..."
                    value={value}
                    onChange={handleInputChange}
                    required={required}
                    ref={autocompleteRef}
                    className="pr-10"
                    disabled={disabled || apiKeyMissing}
                />
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>

            {apiKeyMissing && (
                <p className="text-xs text-destructive mt-1">
                    Google Maps API key is missing. Please add it to your environment variables.
                </p>
            )}

            {mapsApiError && (
                <p className="text-xs text-destructive mt-1">
                    {mapsApiError}
                </p>
            )}

            {!placesLoaded && !apiKeyMissing && (
                <p className="text-xs text-muted-foreground mt-1">
                    Loading Google Maps...
                </p>
            )}

            {placesLoaded && coordinates.latitude && coordinates.longitude ? (
                <div className="text-xs space-y-1 mt-1 p-2 bg-muted rounded">
                    <p className="font-medium">Selected location:</p>
                    <p>{value}</p>
                    <p className="text-muted-foreground">
                        Coordinates: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                    </p>
                </div>
            ) : placesLoaded ? (
                <p className="text-xs text-muted-foreground mt-1">
                    Start typing to see suggestions. You can enter venues, landmarks, or addresses.
                </p>
            ) : null}

            {/* Add a debug indicator during development */}
            {process.env.NODE_ENV === 'development' && (
                <div className="hidden">
                    <p data-testid="address-picker-debug">
                        API Key: {apiKeyMissing ? 'Missing' : 'Present'} |
                        Places Loaded: {placesLoaded ? 'Yes' : 'No'} |
                        Has Error: {mapsApiError ? 'Yes' : 'No'} |
                        Autocomplete Initialized: {autocompleteInstance.current ? 'Yes' : 'No'}
                    </p>
                </div>
            )}
        </div>
    );
} 