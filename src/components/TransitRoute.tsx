import React, { useState, useRef, useEffect } from "react";
import {
  GoogleMap,
  DirectionsRenderer,
  Autocomplete,
  useJsApiLoader,
} from "@react-google-maps/api";

const libraries: (
  | "places"
  | "drawing"
  | "geometry"
  | "localContext"
  | "visualization"
)[] = ["places"];

interface Location {
  lat: number;
  lng: number;
}

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

function generateTimeOptions() {
  let options = [];

  for (let i = 0; i < 48; i++) {
    let hours = Math.floor(i / 2);
    let minutes = i % 2 === 0 ? "00" : "30";
    let time = `${hours.toString().padStart(2, "0")}:${minutes}`;

    options.push(time);
  }

  return options;
}


const TransitRoute = () => {
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [origin, setOrigin] = useState<Location | string>("");
  const [destination, setDestination] = useState<Location | string>("");
  // const [apiError, setApiError] = useState<boolean>(false);
  const debouncedOrigin = useDebounce(origin, 500);
  const debouncedDestination = useDebounce(destination, 500);
  const [directionsResponse, setDirectionsResponse] =
    useState<google.maps.DirectionsResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [preferredTransitType, setPreferredTransitType] = useState<string>("");
  const [transitRoutingPreference, setTransitRoutingPreference] =
    useState<string>("");
  const [preferredDepartureTime, setPreferredDepartureTime] = useState<string>(
    new Date().toISOString()
  );

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`,
    libraries,
  })

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
          // transitOptions: {
          //   modes: [preferredTransitType],
          //   routingPreference: transitRoutingPreference,
          //   departureTime: preferredDepartureTime,
          // },
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

  const containerStyle = {
    width: "100%",
    height: "600px",
  };

  const center: Location = {
    lat: 37.7749,
    lng: -122.4194,
  };

  const originRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onOriginLoad = (autocomplete: google.maps.places.Autocomplete) => {
    originRef.current = autocomplete;
  };

  const onOriginPlaceChanged = () => {
    if (originRef.current !== null) {
      const place = originRef.current.getPlace();
      if (place && place.geometry && place.geometry.location) {
        setOrigin({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    }
  };

  const onDestinationLoad = (autocomplete: google.maps.places.Autocomplete) => {
    destinationRef.current = autocomplete;
  };

  const onDestinationPlaceChanged = () => {
    if (destinationRef.current !== null) {
      const place = destinationRef.current.getPlace();
      if (place && place.geometry && place.geometry.location) {
        const destination = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setDestination(destination);
        // fetchNearestTransitStations(destination);
      }
    }
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
          <div>
            <div className='userPreferences'>
            <label htmlFor='preferredTransitType'>
                Preferred Transit Type:
              </label>
              <select
                id='preferredTransitType'
                name='preferredTransitType'
                value={preferredTransitType || ''}
                onChange={(e) =>
                  setPreferredTransitType(
                    e.target.value as google.maps.TransitMode
                  )
                }
              >
                <option value="">None</option>
                <option value={google.maps.TransitMode.BUS}>Bus</option>
                <option value={google.maps.TransitMode.SUBWAY}>Subway</option>
                <option value={google.maps.TransitMode.RAIL}>
                  Rail (Train, Tram, Monorail)
                </option>
              </select>
              <label htmlFor='transitRoutingPreference'>
                Transit Routing Preference (fewer transfers, less biking):
              </label>
              <select
                id='transitRoutingPreference'
                value={transitRoutingPreference}
                onChange={(e) =>
                  setTransitRoutingPreference(
                    e.target.value as google.maps.TransitRoutePreference
                  )
                }
              >
                <option value={google.maps.TransitRoutePreference.LESS_WALKING}>
                  Less Biking
                </option>
                <option
                  value={google.maps.TransitRoutePreference.FEWER_TRANSFERS}
                >
                  Fewer Transfers
                </option>
              </select>
              <label htmlFor='preferredDepartureDate'>Departure Date:</label>
              <input
                type='date'
                id='preferredDepartureDate'
                value={preferredDepartureTime.slice(0, 10)}
                onChange={(e) => {
                  const time = preferredDepartureTime.slice(11, 16);
                  setPreferredDepartureTime(`${e.target.value}T${time}:00.000Z`);
                }}
              />
  
  
              <select
                id='preferredDepartureTime'
                name='preferredDepartureTime'
                value={preferredDepartureTime.slice(11, 16)}
                onChange={(e) => {
                  const date = preferredDepartureTime.slice(0, 10);
                  setPreferredDepartureTime(`${date}T${e.target.value}`);
                }}
              >
                {generateTimeOptions().map((time, index) => (
                  <option key={index} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <label htmlFor='origin'>Origin:</label>
            <Autocomplete
              onLoad={onOriginLoad}
              onPlaceChanged={onOriginPlaceChanged}
            >
              <input id='origin' type='text' placeholder='Enter starting point' />
            </Autocomplete>
          </div>
          <div>
            <label htmlFor='destination'>Destination:</label>
            <Autocomplete
              onLoad={onDestinationLoad}
              onPlaceChanged={onDestinationPlaceChanged}
            >
              <input
                id='destination'
                type='text'
                placeholder='Enter destination'
              />
            </Autocomplete>
          </div>
  
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
        </>
      );
      
    }
    if (loadError) {
      return <div>Error! Map cannot be loaded!</div>
    }

    return isLoaded ? renderMap() : <div>Map is loading....</div>
  // }
};

export default TransitRoute;