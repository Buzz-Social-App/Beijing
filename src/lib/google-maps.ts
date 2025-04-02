/**
 * Helper utility to load the Google Maps API
 */

// Track if the API has already been loaded
let isLoaded = false;
let isLoading = false;
let loadError: Error | null = null;

// List of callbacks to run when API is loaded
const callbacks: (() => void)[] = [];

/**
 * Load the Google Maps API with the Places library
 */
export const loadGoogleMapsApi = (): Promise<void> => {
    // If already loaded, return resolved promise
    if (isLoaded) {
        return Promise.resolve();
    }

    // If already loading, return a promise that resolves when loading is complete
    if (isLoading) {
        return new Promise((resolve, reject) => {
            callbacks.push(() => {
                if (loadError) {
                    reject(loadError);
                } else {
                    resolve();
                }
            });
        });
    }

    // Start loading
    isLoading = true;

    return new Promise((resolve, reject) => {
        try {
            // Define the callback function
            window.initializeGoogleMaps = () => {
                console.log('Google Maps API loaded via helper');
                isLoaded = true;
                isLoading = false;
                window.googleMapsLoaded = true;

                // Call all registered callbacks
                callbacks.forEach(callback => callback());

                // Resolve the promise
                resolve();
            };

            // Create and append the script
            const script = document.createElement('script');
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

            if (!apiKey) {
                const error = new Error('Google Maps API key is not defined');
                loadError = error;
                reject(error);
                return;
            }

            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initializeGoogleMaps`;
            script.async = true;
            script.onerror = (e) => {
                console.error('Error loading Google Maps API:', e);
                const error = new Error('Failed to load Google Maps API');
                loadError = error;
                isLoading = false;
                reject(error);
            };

            document.head.appendChild(script);
        } catch (error) {
            console.error('Error setting up Google Maps API:', error);
            loadError = error as Error;
            isLoading = false;
            reject(error);
        }
    });
};

// Helper to check if Google Maps API is loaded
export const isGoogleMapsLoaded = (): boolean => {
    return isLoaded;
};

// Declare global types
declare global {
    interface Window {
        googleMapsLoaded: boolean;
        initializeGoogleMaps: () => void;
    }
}

// Initialize the global property
if (typeof window !== 'undefined') {
    window.googleMapsLoaded = window.googleMapsLoaded || false;
}