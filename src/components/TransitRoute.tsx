import React, { useState, useRef, useEffect } from "react";
import parse from "html-react-parser";
import DOMPurify from "dompurify";
import Routeform from './RouteForm';
import {
  GoogleMap,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";

const libraries: (
  | "places"
  | "drawing"
  | "geometry"
  | "localContext"
  | "visualization"
)[] = ["places"];


function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const TransitRoute = () => {
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [origin, setOrigin] = useState<google.maps.LatLngLiteral | string>("");
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | string>("");
  // const [apiError, setApiError] = useState<boolean>(false);
  const debouncedOrigin = useDebounce(origin, 500);
  const debouncedDestination = useDebounce(destination, 500);
  const [directionsResponse, setDirectionsResponse] =
    useState<google.maps.DirectionsResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [preferredTransitType, setPreferredTransitType] = useState<string>("");
  const [transitRoutingPreference, setTransitRoutingPreference] =
    useState<string>("FEWER_TRANSFERS");
  const [preferredDepartureTime, setPreferredDepartureTime] = useState<string>(
    new Date().toISOString()
  );
  const [steps, setSteps] = useState<google.maps.DirectionsStep[]>([]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`,
    libraries,
  });

  useEffect(() => {
    if (debouncedOrigin && debouncedDestination) {
      const DirectionsService = new google.maps.DirectionsService();
      DirectionsService.route(
        {
          origin: debouncedOrigin,
          destination: debouncedDestination,
          travelMode: google.maps.TravelMode.TRANSIT,
          // alternatives: [
          //   {
          //     mode: google.maps.TravelMode.TRANSIT,
          //     origin_mode: google.maps.TravelMode.BICYCLING,
          //   },
          //   {
          //     mode: google.maps.TravelMode.BICYCLING,
          //   },
          // ],
          transitOptions: {
            modes: [preferredTransitType as google.maps.TransitMode],
            routingPreference: transitRoutingPreference as google.maps.TransitRoutePreference,
            departureTime: new Date(preferredDepartureTime),
          },
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            setDirectionsResponse(result);
          } else {
            console.log(`error fetching directions ${result}`);
          }
        }
      );
    }
  }, [
    debouncedOrigin,
    debouncedDestination,
    preferredTransitType,
    transitRoutingPreference,
    preferredDepartureTime,
  ]);

  // useEffect to check if directionsResponse exists and is not the same as the previously set directions object
  useEffect(() => {
    if (directionsResponse && directionsResponse !== directions) {
      setDirections(directionsResponse);
    }
  }, [directionsResponse, directions]);

  useEffect(() => {
    if (directions && directions.routes[0] && directions.routes[0].legs[0]) {
      setSteps(directions.routes[0].legs[0].steps);
    }
  }, [directions]);

  const containerStyle = {
    width: "100%",
    height: "600px",
  };

  const center: google.maps.LatLngLiteral = {
    lat: 37.7749,
    lng: -122.4194,
  };

 

  

  // a useEffect hook to check if the process.env.REACT_APP_GOOGLE_MAPS_API_KEY exists
  // useEffect(() => {
  //   if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
  //     setApiError(true);
  //   }
  // }, []);

  // if (apiError) {
  //   return <div>API key not found</div>;
  // } else {
  const renderMap = () => {
    return (
      <>
      <RouteForm
        origin={origin}
        destination={destination}
        setOrigin={setOrigin}
        setDestination={setDestination}
        preferredTransitType={preferredTransitType}
        setPreferredTransitType={setPreferredTransitType}
        transitRoutingPreference={transitRoutingPreference}
        setTransitRoutingPreference={setTransitRoutingPreference}
        preferredDepartureTime={preferredDepartureTime}
        setPreferredDepartureTime={setPreferredDepartureTime}
      />
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={10}
          onLoad={(map) => {
            mapRef.current = map;
          }}
        >
          {directions && (
            <DirectionsRenderer
              options={{
                directions: directions,
              }}
            />
          )}
        </GoogleMap>
        <div className='step-instructions'>
          {steps &&
            steps.map((step, i) => (
              <div key={i}>
                {parse(DOMPurify.sanitize(step.instructions))}
                {step.distance && <p>Distance: {step.distance.text}</p>}
                {step.duration && <p>Duration: {step.duration.text}</p>}
              </div>
            ))}
        </div>
      </>
    );
  };
  if (loadError) {
    return <div>Error! Map cannot be loaded!</div>;
  }

  return isLoaded ? renderMap() : <div>Map is loading....</div>;
  // }
};

export default TransitRoute;
