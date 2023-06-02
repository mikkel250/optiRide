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

type DirectionsStepWithCheckbox = google.maps.DirectionsStep & { checked?: boolean, stopover?: boolean | undefined };

const TransitRoute = () => {
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult[] | null>(null);
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
  const [steps, setSteps] = useState<DirectionsStepWithCheckbox[]>([]);

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
          if (status === google.maps.DirectionsStatus.OK && result !== null) {
            setDirections([result]);
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
    if (directions && directions[0].routes[0] && directions[0].routes[0].legs[0]) {
      const newSteps = directions[0].routes[0].legs[0].steps.map((step) => ({
        ...step,
        checked: false,
      }));
      setSteps(newSteps);
    }
  }, [directions]);

  const createBikingDirectionsFromCheckedSteps = async () => {
    if (origin && destination) {
      const DirectionsService = new google.maps.DirectionsService();

      let waypoints: DirectionsStepWithCheckbox[] = [];
      // let mode = google.maps.TravelMode.TRANSIT;
      for (let i = 0; i < steps.length; i++) {
        // if the current step is checked and the previous step was not checked, or the current step is not checked, or it's the final step push
        if ((steps[i].checked && (i === 0 || !steps[i - 1].checked)) || !steps[i].checked || i === steps.length - 1) {
          // mode = steps[i].checked ? google.maps.TravelMode.BICYCLING : google.maps.TravelMode.TRANSIT;
          waypoints.push({...steps[i], stopover: true});
        }
      }
      
      let newDirections: google.maps.DirectionsResult[] = [];
      for (let i = 0; i < waypoints.length - 1; i++) {
        // eslint-disable-next-line no-loop-func
        await new Promise<void>((resolve) => {
          DirectionsService.route({
            origin: waypoints[i].start_location!,
            destination: waypoints[i+1].start_location!,
            travelMode: waypoints[i].checked ? google.maps.TravelMode.BICYCLING : google.maps.TravelMode.TRANSIT,
          }, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result !== null) {
              newDirections.push(result);
            } else {
              console.log(`error fetching directions ${result}`);
            }
            resolve();
          });
        })
      }

      await new Promise<void>((resolve) => {
        DirectionsService.route({
          origin: waypoints[waypoints.length - 1].start_location!,
          destination: destination, 
          travelMode: steps[steps.length - 1].checked ? google.maps.TravelMode.BICYCLING : google.maps.TravelMode.TRANSIT,
        }, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result !== null) {
            newDirections.push(result);
          } else {
            console.log(`Error fetching last leg of directions! ${result}`);
          }
          resolve();
        });
      });

      setDirections([...newDirections]);
    } else {
      alert("fields cannot be empty");
    }
  }

  const handleCheckboxChange = (index: number) => {
    setSteps((prevSteps) => prevSteps.map((step, i) => i === index ? {...step, checked: ! step.checked } : step ));
  };

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
          {directions && directions.map((directions, index) => (
            <DirectionsRenderer
            key={index}
              options={{
                directions: directions,
              }}
            />
          ))}
        </GoogleMap>
        <div className='step-instructions'>
          {steps &&
            steps.map((step, i) => (
              <>
              <div key={i}>
                {step.duration && <span className="bold">{step.duration.text}</span>},  {step.distance && <span className="bold">{step.distance.text}</span>}.  {parse(DOMPurify.sanitize(step.instructions))}
                <input type="checkbox" checked={step.checked} onChange={() => handleCheckboxChange(i)} />
              </div>
              </>
            ))}
            <div className="button-container"><button onClick={createBikingDirectionsFromCheckedSteps}>Convert Checked to Biking</button></div>
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
