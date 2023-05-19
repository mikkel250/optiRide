import React, { useRef, useState } from "react";
import { Autocomplete } from "@react-google-maps/api";

interface RouteFormProps {
  origin: google.maps.LatLngLiteral | string;
  destination: google.maps.LatLngLiteral | string;
  setOrigin: (location: google.maps.LatLngLiteral | string) => void;
  setDestination: (location: google.maps.LatLngLiteral | string) => void;
  preferredTransitType: string;
  setPreferredTransitType: (transitType: string) => void;
  transitRoutingPreference: string;
  setTransitRoutingPreference: (preference: string) => void;
  preferredDepartureTime: string;
  setPreferredDepartureTime: (time: string) => void;
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

const RouteForm: React.FC<RouteFormProps> = ({
  origin,
  destination,
  setOrigin,
  setDestination,
  preferredTransitType,
  setPreferredTransitType,
  transitRoutingPreference,
  setTransitRoutingPreference,
  preferredDepartureTime,
  setPreferredDepartureTime,
}) => {
  const originRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onDestinationLoad = (autocomplete: google.maps.places.Autocomplete) => {
    destinationRef.current = autocomplete;
  };
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

  return (
    <div>
      <div className='userPreferences'>
        <label htmlFor='preferredTransitType'>Preferred Transit Type:</label>
        <select
          id='preferredTransitType'
          name='preferredTransitType'
          value={preferredTransitType || ""}
          onChange={(e) =>
            setPreferredTransitType(e.target.value as google.maps.TransitMode)
          }
        >
          <option value=''>None</option>
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
          <option value={google.maps.TransitRoutePreference.FEWER_TRANSFERS}>
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
            const timeValue = e.target.textContent === "Now" ? new Date().toISOString() : `${date}T${e.target.value}`;
            setPreferredDepartureTime(timeValue);
          }}
        >
          <option value={new Date().toISOString()}>Now</option>
          {generateTimeOptions().map((time, index) => (
            <option key={index} value={time}>
              {time}
            </option>
          ))}
        </select>

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
          <input id='destination' type='text' placeholder='Enter destination' />
        </Autocomplete>
      </div>
    </div>
  );
};

export default RouteForm;
