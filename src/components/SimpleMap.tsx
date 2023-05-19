import React, { useEffect, useRef } from 'react';

function SimpleMap() {
  const mapRef = useRef(null);

  const initMap = () => {
    if (window.google && mapRef.current) {
      new window.google.maps.Map(mapRef.current, {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8,
      });
    } else {
      console.error('google not loaded');
    }
  };

  useEffect(() => {
    window.initMap = initMap;

    // Only load the Google Maps script if it hasn't already been loaded
  if (!document.querySelector('script[src*="https://maps.googleapis.com/maps/api/js"]')) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      delete window.initMap;
    };
  }
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />;
}

export default SimpleMap;
