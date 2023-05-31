// TransitRoute.tsx
import React, { useState, useRef, useEffect } from "react";
import parse from "html-react-parser";
import DOMPurify from "dompurify";
import RouteForm from './RouteForm';
import {
  GoogleMap,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";

const TransitRoute = () => {
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
    const [directionsKey, setDirectionsKey] = useState<number>(0);
  const [origin, setOrigin] = useState<google.maps.LatLngLiteral | string>("");
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | string>("");
  // const [directionsResponse, setDirectionsResponse] =
    // useState<google.maps.DirectionsResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [preferredTransitType, setPreferredTransitType] = useState<string>("");
  const [transitRoutingPreference, setTransitRoutingPreference] =
    useState<string>("FEWER_TRANSFERS");
  const [preferredDepartureTime, setPreferredDepartureTime] = useState<string>(
    new Date().toISOString()
  );
  const [steps, setSteps] = useState<google.maps.DirectionsStep[]>([]);
  const libraries: (
    | "places"
    | "drawing"
    | "geometry"
    | "localContext"
    | "visualization"
  )[] = React.useMemo(() => ["places"], []);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`,
    libraries,
  });

  // useEffect(() => {
  //   if (origin && destination) {
  //     const DirectionsService = new google.maps.DirectionsService();
  //     DirectionsService.route(
  //       {
  //         origin: origin,
  //         destination: destination,
  //         travelMode: google.maps.TravelMode.TRANSIT,
  //         transitOptions: {
  //           modes: preferredTransitType ? [preferredTransitType as google.maps.TransitMode] : undefined,
  //           routingPreference: transitRoutingPreference as google.maps.TransitRoutePreference,
  //           departureTime: new Date(preferredDepartureTime),
  //         },
  //       },
  //       (result, status) => {
  //         if (status === google.maps.DirectionsStatus.OK) {
  //           setDirections(result);
  //         } else {
  //           console.log(`error fetching directions ${result}`);
  //         }
  //       }
  //     );
  //   }
  // }, [
  //   origin,
  //   destination,
  //   preferredTransitType,
  //   transitRoutingPreference,
  //   preferredDepartureTime,
  // ]);
  
  const fetchDirections = () => {
    if (origin && destination) {
      const DirectionsService = new google.maps.DirectionsService();
      DirectionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: google.maps.TravelMode.TRANSIT,
          transitOptions: {
            modes: preferredTransitType ? [preferredTransitType as google.maps.TransitMode] : undefined,
            routingPreference: transitRoutingPreference as google.maps.TransitRoutePreference,
            departureTime: new Date(preferredDepartureTime),
          },
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            setDirections(result);
            setDirectionsKey(prevKey => prevKey + 1);
          } else {
            console.log(`error fetching directions ${result}`);
          }
        }
      );
    } else {
      alert("fields cannot be empty!");
    }
  }
  
  useEffect(() => {
    let allSteps: google.maps.DirectionsStep[] = [];
    if (directions && directions.routes[0] && directions.routes[0].legs[0]) {
      directions.routes[0].legs.forEach((leg) => {
        allSteps.push(...leg.steps);
      });
      setSteps(allSteps);
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
      <button onClick={fetchDirections}>Get Directions</button>
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
            key={directionsKey}
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
