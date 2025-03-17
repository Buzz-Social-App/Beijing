'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Define the City type
type City = {
    city: string;
    live: boolean;
    latitude: number;
    longitude: number;
};

// Google Maps container styles
const containerStyle = {
    width: '100%',
    height: '100%'
};

// Default center position
const defaultCenter = {
    lat: 20,
    lng: 0
};

export default function CitiesPage() {
    const [cities, setCities] = useState<City[]>([]);
    const [newCity, setNewCity] = useState({
        city: '',
        live: true,
        latitude: 0,
        longitude: 0
    });
    const [loading, setLoading] = useState(false);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [coordinatesSet, setCoordinatesSet] = useState(false);
    const router = useRouter();

    // Load Google Maps API
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places', 'geocoding']
    });

    const [geocodeLoading, setGeocodeLoading] = useState(false);
    const [geocodeError, setGeocodeError] = useState<string | null>(null);

    // Fetch cities on component mount
    useEffect(() => {
        fetchCities();
    }, []);

    async function fetchCities() {
        try {
            const { data, error } = await supabase
                .from('cities')
                .select('*');

            if (error) throw error;

            setCities(data);
        } catch (error) {
            console.error('Error fetching cities:', error);
        }
    }

    // Geocode city name to get coordinates
    const handleGeocodeCity = async () => {
        if (!newCity.city.trim()) {
            setGeocodeError("Please enter a city name first");
            return;
        }

        setGeocodeLoading(true);
        setGeocodeError(null);

        try {
            // Using Google Maps Geocoding API
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(newCity.city)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            );

            const data = await response.json();

            if (data.status === 'OK' && data.results.length > 0) {
                const { lat, lng } = data.results[0].geometry.location;

                setNewCity({
                    ...newCity,
                    latitude: lat,
                    longitude: lng
                });

                setMapCenter({ lat, lng });
                setCoordinatesSet(true);
            } else {
                setGeocodeError(`Couldn't find coordinates for '${newCity.city}'. Try a more specific name.`);
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            setGeocodeError("Error geocoding city. Please try again.");
        } finally {
            setGeocodeLoading(false);
        }
    };

    // Handle coordinate input changes
    const handleCoordinateChange = (field: 'latitude' | 'longitude', value: string) => {
        const numValue = parseFloat(value) || 0;
        setNewCity({
            ...newCity,
            [field]: numValue
        });

        if (field === 'latitude') {
            setMapCenter(prev => ({ ...prev, lat: numValue }));
        } else {
            setMapCenter(prev => ({ ...prev, lng: numValue }));
        }

        setCoordinatesSet(true);
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setGeocodeError(null);

        try {
            // Insert the city with coordinates into the database
            const { data, error } = await supabase
                .from('cities')
                .insert([{
                    city: newCity.city,
                    live: newCity.live,
                    latitude: newCity.latitude,
                    longitude: newCity.longitude
                }])
                .select();

            if (error) throw error;

            setCities([...cities, data[0]]);
            setNewCity({
                city: '',
                live: true,
                latitude: 0,
                longitude: 0
            });
            setCoordinatesSet(false);
            router.refresh();
        } catch (error) {
            console.error('Error adding city:', error);
        } finally {
            setLoading(false);
        }
    }

    // Format coordinates for display
    const formatCoordinates = (lat: number, lng: number) => {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    };

    // Toggle city live status
    const toggleCityStatus = async (city: City) => {
        try {
            // Use the city name as the unique identifier if id doesn't exist
            const { error } = await supabase
                .from('cities')
                .update({ live: !city.live })
                .eq('city', city.city);  // Use city name instead of id

            if (error) throw error;

            // Update local state
            setCities(cities.map(c =>
                c.city === city.city ? { ...c, live: !c.live } : c
            ));
        } catch (error) {
            console.error('Error updating city status:', error);
        }
    };

    return (
        <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-4rem)]">
            <h1 className="text-2xl font-bold mb-4">Cities Management</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Left column - Form */}
                <Card className="overflow-auto">
                    <CardHeader>
                        <CardTitle>Add New City</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="city-name">City Name</Label>
                                <div className="flex space-x-2">
                                    <Input
                                        id="city-name"
                                        value={newCity.city}
                                        onChange={(e) => setNewCity({ ...newCity, city: e.target.value })}
                                        required
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleGeocodeCity}
                                        disabled={geocodeLoading || !isLoaded}
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap"
                                    >
                                        {geocodeLoading ? 'Finding...' : 'Get Coordinates'}
                                    </Button>
                                </div>
                                {geocodeError && (
                                    <p className="text-sm text-red-500 mt-1">{geocodeError}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="coordinates">Coordinates</Label>
                                <div className="flex items-center space-x-2">
                                    <Input
                                        id="latitude"
                                        type="number"
                                        step="0.000001"
                                        placeholder="Latitude"
                                        value={newCity.latitude || ''}
                                        onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                                        required
                                    />
                                    <Input
                                        id="longitude"
                                        type="number"
                                        step="0.000001"
                                        placeholder="Longitude"
                                        value={newCity.longitude || ''}
                                        onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Enter coordinates manually or use the Get Coordinates button
                                </p>
                                {coordinatesSet && (
                                    <p className="text-xs text-green-500">
                                        Coordinates set: {formatCoordinates(newCity.latitude, newCity.longitude)}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="live-status"
                                    checked={newCity.live}
                                    onChange={(e) => setNewCity({ ...newCity, live: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="live-status">Live</Label>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full"
                            >
                                {loading ? 'Adding...' : 'Add City'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Right column - split into top and bottom */}
                <div className="md:col-span-2 flex flex-col space-y-6 overflow-hidden">
                    {/* Top right - Cities list */}
                    <Card className="flex-1 min-h-0 flex flex-col">
                        <CardHeader className="flex-shrink-0">
                            <CardTitle>Cities List</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                            <div className="overflow-auto h-full">
                                <table className="w-full table-fixed">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="py-2 px-4 text-left font-medium w-1/3">City</th>
                                            <th className="py-2 px-4 text-left font-medium w-1/2">Coordinates</th>
                                            <th className="py-2 px-4 text-left font-medium w-1/6">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cities.length > 0 ? (
                                            cities.map((city) => (
                                                <tr key={`city-row-${city.city}`} className="border-b border-muted">
                                                    <td className="py-2 px-4 truncate">{city.city}</td>
                                                    <td className="py-2 px-4 truncate">
                                                        {formatCoordinates(city.latitude, city.longitude)}
                                                    </td>
                                                    <td className="py-2 px-4 text-center">
                                                        <span
                                                            className={`inline-block min-w-[80px] px-2 py-1 rounded-full text-xs cursor-pointer hover:opacity-80 ${city.live ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                                            onClick={() => toggleCityStatus(city)}
                                                            title={`Click to mark as ${city.live ? 'inactive' : 'live'}`}
                                                        >
                                                            {city.live ? 'Live' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr key="no-cities-row" className="border-b border-muted">
                                                <td colSpan={3} className="py-4 text-center text-muted-foreground">
                                                    No cities found. Add your first city!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bottom right - Map */}
                    <Card className="flex-1 min-h-0 flex flex-col">
                        <CardHeader className="flex-shrink-0">
                            <CardTitle>Cities Map</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                            <div className="h-full rounded-lg overflow-hidden">
                                {isLoaded ? (
                                    <GoogleMap
                                        mapContainerStyle={containerStyle}
                                        center={mapCenter}
                                        zoom={2}
                                        options={{
                                            streetViewControl: false,
                                            mapTypeControl: false,
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
                                        {/* Show existing cities */}
                                        {cities.map((city) => (
                                            <Marker
                                                key={`city-marker-${city.city}`}
                                                position={{
                                                    lat: city.latitude,
                                                    lng: city.longitude
                                                }}
                                                onClick={() => setSelectedCity(city)}
                                            />
                                        ))}

                                        {/* Show marker for new city if coordinates are set */}
                                        {coordinatesSet && (
                                            <Marker
                                                key="new-city-marker"
                                                position={{
                                                    lat: newCity.latitude,
                                                    lng: newCity.longitude
                                                }}
                                                icon={{
                                                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                                                }}
                                            />
                                        )}

                                        {selectedCity && (
                                            <InfoWindow
                                                position={{
                                                    lat: selectedCity.latitude,
                                                    lng: selectedCity.longitude
                                                }}
                                                onCloseClick={() => setSelectedCity(null)}
                                            >
                                                <div className="p-2 text-black">
                                                    <h3 className="font-bold">{selectedCity.city}</h3>
                                                    <p className="text-sm">
                                                        Coordinates: {formatCoordinates(selectedCity.latitude, selectedCity.longitude)}
                                                    </p>
                                                    <p className="text-sm">
                                                        Status: {selectedCity.live ? 'Live' : 'Inactive'}
                                                    </p>
                                                </div>
                                            </InfoWindow>
                                        )}
                                    </GoogleMap>
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-muted">
                                        <p className="text-muted-foreground">Loading Map...</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
