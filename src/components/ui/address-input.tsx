'use client';

import * as React from 'react';

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
