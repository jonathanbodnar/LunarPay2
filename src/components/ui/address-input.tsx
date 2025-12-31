'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressData {
  address: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

interface AddressInputProps {
  value: AddressData;
  onChange: (value: AddressData) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

// US States list for dropdown
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'Washington DC' },
];

interface PlacePrediction {
  description: string;
  place_id: string;
}

export function AddressInput({ 
  value, 
  onChange, 
  placeholder = "Start typing an address...",
  required,
  className 
}: AddressInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Check if Google Places API is available
  useEffect(() => {
    const checkGoogle = () => {
      if (typeof window !== 'undefined' && window.google?.maps?.places) {
        setIsGoogleLoaded(true);
        autocompleteService.current = new google.maps.places.AutocompleteService();
        // Need a map element for PlacesService
        if (mapRef.current) {
          const map = new google.maps.Map(mapRef.current);
          placesService.current = new google.maps.places.PlacesService(map);
        }
      }
    };
    
    checkGoogle();
    // Also listen for Google Maps loading
    const interval = setInterval(checkGoogle, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize input value from props
  useEffect(() => {
    if (value.address) {
      const fullAddress = [value.address, value.city, value.state, value.zip]
        .filter(Boolean)
        .join(', ');
      setInputValue(fullAddress);
      if (value.city || value.state || value.zip) {
        setShowManualEntry(true);
      }
    }
  }, []);

  // Fetch predictions from Google
  const fetchPredictions = useCallback((input: string) => {
    if (!autocompleteService.current || input.length < 3) {
      setPredictions([]);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'us' },
        types: ['address'],
      },
      (results) => {
        if (results) {
          setPredictions(results.map(r => ({
            description: r.description,
            place_id: r.place_id,
          })));
        }
      }
    );
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange({ ...value, address: newValue });
    
    if (isGoogleLoaded) {
      fetchPredictions(newValue);
      setShowDropdown(true);
    }
  };

  // Handle prediction selection
  const handleSelectPrediction = (prediction: PlacePrediction) => {
    if (!placesService.current) {
      // Fallback if places service isn't available
      setInputValue(prediction.description);
      onChange({ ...value, address: prediction.description });
      setShowDropdown(false);
      setShowManualEntry(true);
      return;
    }

    placesService.current.getDetails(
      { placeId: prediction.place_id },
      (place) => {
        if (place?.address_components) {
          let streetNumber = '';
          let route = '';
          let city = '';
          let state = '';
          let zip = '';

          for (const component of place.address_components) {
            const types = component.types;
            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            } else if (types.includes('route')) {
              route = component.long_name;
            } else if (types.includes('locality')) {
              city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = component.short_name;
            } else if (types.includes('postal_code')) {
              zip = component.long_name;
            }
          }

          const address = `${streetNumber} ${route}`.trim();
          setInputValue(prediction.description);
          onChange({ address, city, state, zip, country: 'US' });
          setShowManualEntry(true);
        }
        setShowDropdown(false);
      }
    );
  };

  const handleFieldChange = (field: keyof AddressData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className={cn("space-y-3", className)} ref={dropdownRef}>
      {/* Hidden div for Google Places Service */}
      <div ref={mapRef} style={{ display: 'none' }} />
      
      {/* Main address input with autocomplete */}
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => predictions.length > 0 && setShowDropdown(true)}
            placeholder={placeholder}
            required={required}
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Predictions dropdown */}
        {showDropdown && predictions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            {predictions.map((prediction, index) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handleSelectPrediction(prediction)}
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
              >
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{prediction.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Toggle for manual entry */}
      <button
        type="button"
        onClick={() => setShowManualEntry(!showManualEntry)}
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        {showManualEntry ? 'Hide' : 'Enter manually'} 
        <ChevronDown className={cn("h-3 w-3 transition-transform", showManualEntry && "rotate-180")} />
      </button>

      {/* Manual entry fields */}
      {showManualEntry && (
        <div className="grid grid-cols-6 gap-3">
          <div className="col-span-6">
            <label className="text-xs text-muted-foreground">Street Address</label>
            <input
              type="text"
              value={value.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              placeholder="123 Main St"
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="col-span-3">
            <label className="text-xs text-muted-foreground">City</label>
            <input
              type="text"
              value={value.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              placeholder="City"
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">State</label>
            <select
              value={value.state}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              className="w-full h-9 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">State</option>
              {US_STATES.map(state => (
                <option key={state.code} value={state.code}>{state.code}</option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label className="text-xs text-muted-foreground">ZIP</label>
            <input
              type="text"
              value={value.zip}
              onChange={(e) => handleFieldChange('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="12345"
              maxLength={5}
              className="w-full h-9 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Simple compact version for forms
interface SimpleAddressInputProps {
  address: string;
  city: string;
  state: string;
  zip: string;
  onChange: (data: { address: string; city: string; state: string; zip: string }) => void;
}

export function SimpleAddressInput({ address, city, state, zip, onChange }: SimpleAddressInputProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground">Street Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => onChange({ address: e.target.value, city, state, zip })}
          placeholder="123 Main St, Apt 4B"
          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="grid grid-cols-6 gap-3">
        <div className="col-span-3">
          <label className="text-xs text-muted-foreground">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => onChange({ address, city: e.target.value, state, zip })}
            placeholder="City"
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground">State</label>
          <select
            value={state}
            onChange={(e) => onChange({ address, city, state: e.target.value, zip })}
            className="w-full h-9 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">State</option>
            {US_STATES.map(s => (
              <option key={s.code} value={s.code}>{s.code}</option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className="text-xs text-muted-foreground">ZIP</label>
          <input
            type="text"
            value={zip}
            onChange={(e) => onChange({ address, city, state, zip: e.target.value.replace(/\D/g, '').slice(0, 5) })}
            placeholder="12345"
            maxLength={5}
            className="w-full h-9 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
    </div>
  );
}

