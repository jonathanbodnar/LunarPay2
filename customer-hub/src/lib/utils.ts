import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: string) => {
  const formatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit' })  
  return formatter.format(new Date(date))  
}

export const formatMoney = (amount: number | string) => {
  amount = Number(amount)
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return formatter.format(amount)
}

export const motionFadeUp = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { type: "spring", stiffness: 3000, damping: 70 },
};

export const invertColor = (hex: string | undefined) => {
  if (!hex) {
    return hex;
  }

  // Remove the '#' if it's there
  hex = hex.replace('#', '');

  // Parse the hex color into RGB values
  let r = parseInt(hex.slice(0, 2), 16);
  let g = parseInt(hex.slice(2, 4), 16);
  let b = parseInt(hex.slice(4, 6), 16);

  // Invert the color (255 - original value)
  r = 255 - r;
  g = 255 - g;
  b = 255 - b;

  // Return the inverted color as a hex string
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()}`;
}
