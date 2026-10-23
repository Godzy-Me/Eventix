import { createContext, useContext, useEffect, useState } from "react";

const LocationContext = createContext();

export const LocationProvide = ({ children }) => {

    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLocationData = async (latitude, longitude) => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                );
                const data = await res.json();
                const userLocation = data?.address?.state;
                setLocation(userLocation);

            } catch (error) {
                setError("Failed to fetch location data");
            } finally {
                setLoading(false);
            }
        };

        // Logic to fetch and set location data
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchLocationData(latitude, longitude);
            },
            () => {
                setError("Unable to retrieve your location");
                setLoading(false);
            }
        );

    }, []);

    return (
        <LocationContext.Provider value={{ location, loading, error }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => useContext(LocationContext);