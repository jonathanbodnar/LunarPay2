'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface QuantitySelectProps {
  value: number | null;
  onChange: (value: number | null, isUnlimited: boolean) => void;
  isUnlimited?: boolean;
  showUnlimited?: boolean;
  label?: string;
}

export function QuantitySelect({ 
  value, 
  onChange, 
  isUnlimited = false,
  showUnlimited = true,
  label 
}: QuantitySelectProps) {
  const [mode, setMode] = useState<'preset' | 'custom' | 'unlimited'>(
    isUnlimited ? 'unlimited' : (value && value > 10 ? 'custom' : 'preset')
  );
  const [customValue, setCustomValue] = useState(value?.toString() || '1');

  useEffect(() => {
    if (isUnlimited) {
      setMode('unlimited');
    } else if (value && value > 10) {
      setMode('custom');
      setCustomValue(value.toString());
    } else {
      setMode('preset');
    }
  }, [value, isUnlimited]);

  const handleModeChange = (newMode: string) => {
    if (newMode === 'unlimited') {
      setMode('unlimited');
      onChange(null, true);
    } else if (newMode === 'custom') {
      setMode('custom');
      const customVal = parseInt(customValue) || 1;
      onChange(customVal, false);
    } else {
      setMode('preset');
      const presetVal = parseInt(newMode);
      onChange(presetVal, false);
    }
  };

  const handleCustomChange = (val: string) => {
    setCustomValue(val);
    const numVal = parseInt(val) || 1;
    onChange(numVal, false);
  };

  const presetOptions = [1, 2, 3, 4, 5, 10];

  return (
    <div className="space-y-1">
      {label && <label className="text-xs text-muted-foreground">{label}</label>}
      <div className="flex gap-2">
        <select
          className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm"
          value={mode === 'unlimited' ? 'unlimited' : mode === 'custom' ? 'custom' : (value?.toString() || '1')}
          onChange={(e) => handleModeChange(e.target.value)}
        >
          {presetOptions.map(num => (
            <option key={num} value={num.toString()}>{num}</option>
          ))}
          <option value="custom">Custom...</option>
          {showUnlimited && <option value="unlimited">Unlimited</option>}
        </select>
        
        {mode === 'custom' && (
          <Input
            type="number"
            min="1"
            value={customValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="w-24"
            placeholder="Enter qty"
          />
        )}
      </div>
    </div>
  );
}

