'use client';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { height: 24, text: 'text-lg' },
    md: { height: 32, text: 'text-2xl' },
    lg: { height: 48, text: 'text-4xl' },
  };

  const { height, text } = sizes[size];

  return (
    <div className={`flex items-center gap-0 ${className}`}>
      <svg
        viewBox="0 0 120 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        height={height}
        className="shrink-0"
      >
        {/* Circle/moon accent on the 'p' */}
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="3" fill="none" />
        <circle cx="16" cy="8" r="5" fill="currentColor" />
        
        {/* Letter 'p' */}
        <path
          d="M8 18 L8 48 M8 28 Q8 18 20 18 Q32 18 32 28 Q32 38 20 38 L8 38"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Letter 'a' */}
        <path
          d="M56 38 Q56 48 46 48 Q36 48 36 38 L36 38 Q36 28 46 28 Q56 28 56 38 L56 48"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Letter 'y' */}
        <path
          d="M64 28 L76 42 M88 28 L76 42 L70 56"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

// Simpler text-based logo for use in tight spaces
export function LogoText({ className = '' }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      <span className="relative">
        <span className="absolute -top-1 -left-1 text-[0.5em]">°</span>
        <span className="ml-2">pay</span>
      </span>
    </span>
  );
}

// Logo mark only (for favicon, small spaces)
export function LogoMark({ className = '', size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 40 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size * 1.25}
      className={className}
    >
      {/* Circle/moon accent */}
      <circle cx="12" cy="10" r="6" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="15" cy="7" r="4" fill="currentColor" />
      
      {/* Letter 'p' */}
      <path
        d="M8 16 L8 48 M8 26 Q8 18 18 18 Q28 18 28 26 Q28 34 18 34 L8 34"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

