
"use client";
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean; // Kept for compatibility, effect is minimal with SVG logo
  iconOnly?: boolean; // If true, will use 'sm' size.
}

export function Logo({ size = 'md', className, iconOnly = false }: LogoProps) {
  const displaySizeKey = iconOnly ? 'sm' : size;

  // Configuration for different logo sizes
  const sizeConfig = {
    sm: { width: 90, height: 20, fontSize: 16, flairRectXFactor: 0.48, flairRectYFactor: 0.05, flairWidthFactor: 0.22, flairHeightFactor: 0.35 },
    md: { width: 110, height: 24, fontSize: 20, flairRectXFactor: 0.48, flairRectYFactor: 0.05, flairWidthFactor: 0.22, flairHeightFactor: 0.35 },
    lg: { width: 130, height: 28, fontSize: 24, flairRectXFactor: 0.48, flairRectYFactor: 0.05, flairWidthFactor: 0.22, flairHeightFactor: 0.35 },
  };

  const current = sizeConfig[displaySizeKey];
  const purpleColor = "#4A0E6A"; // Dark purple from image
  const redColor = "#D81E05";   // Bright red from image

  // Simplified ViewBox, text will be anchored centrally.
  // These values are relative and will scale with the SVG's width/height.
  const viewBoxWidth = 100; // Arbitrary base width for viewBox
  const viewBoxHeight = (current.fontSize / 16) * 20; // Scale height based on font size relative to 'sm'

  // Calculate x-offset for the flair relative to the start of the "l" tspan.
  // "cargo" is 5 chars. "l" starts after that.
  // This requires knowing the width of "cargo" in the SVG's coordinate system.
  // An approximate x for "l" might be around 55-60 in a 100-width viewBox for "cargoly".
  // Or, more simply, anchor the flair relative to the 'l's expected position.
  const flairX = viewBoxWidth * current.flairRectXFactor; // Position flair around middle of "cargoly"
  const flairY = viewBoxHeight * current.flairRectYFactor; // Position flair near top
  const flairWidth = current.fontSize * current.flairWidthFactor;
  const flairHeight = current.fontSize * current.flairHeightFactor;
  
  // dx for 'l' and 'y' tspans to control spacing.
  // The exact values depend on font rendering and might need tuning.
  // Negative dx on 'l' to pull it closer to 'cargo', positive dx on 'y' to push it from 'l'.
  // These are very approximate.
  const l_dx = -current.fontSize * 0.1; 
  const y_dx = current.fontSize * 0.1;


  return (
    <Link href="/dashboard" className={cn("flex items-center hover:opacity-90", className)}>
      <svg
        width={current.width}
        height={current.height}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Cargoly Logo"
      >
        <style>
          {`
            .cargoly-logo-svg-text {
              font-family: 'Nunito Sans', Arial, sans-serif;
              font-weight: bold;
              font-size: ${current.fontSize}px;
              dominant-baseline: middle; /* Aligns text vertically to its middle */
              text-anchor: start; /* Aligns text horizontally from its start */
            }
          `}
        </style>
        <text x="0" y={viewBoxHeight / 2} className="cargoly-logo-svg-text">
          <tspan fill={purpleColor}>cargo</tspan>
          <tspan dx={l_dx} fill={redColor}>l</tspan>
          <tspan dx={y_dx + flairWidth * 0.7} fill={purpleColor}>y</tspan> {/* Adjust dx for y to account for flair */}
        </text>
        {/* Red flair element, styled to approximate the image */}
        <rect
          x={flairX}
          y={flairY}
          width={flairWidth}
          height={flairHeight}
          fill={redColor}
          rx={flairWidth * 0.1} // Slightly rounded corners for the flair
        />
      </svg>
    </Link>
  );
}
