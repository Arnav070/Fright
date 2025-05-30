
"use client";
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconOnly?: boolean;
  // showText prop is no longer needed as the SVG itself contains the text.
}

export function Logo({ size = 'md', className, iconOnly = false }: LogoProps) {
  const displaySizeKey = iconOnly ? 'sm' : size;

  // Simplified sizeConfig just for width and height of the SVG tag
  const sizeConfig = {
    sm: { width: 90, height: 24 }, // Adjusted height for better aspect ratio
    md: { width: 120, height: 32 },
    lg: { width: 150, height: 40 },
  };

  const current = sizeConfig[displaySizeKey];
  const purpleColor = "#4A0E6A";
  const redColor = "#D81E05";

  // Crafted SVG string. ViewBox is 0 0 220 60.
  // "cargo" ends around x=125. "l" stem is 130-142. Flair from 125-175. "y" starts at 155.
  const svgString = `
    <svg
      viewBox="0 0 220 60"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Cargoly Logo"
    >
      <style>
        .cargoly-font {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-weight: 700; /* Bold */
          font-size: 32px; /* Adjusted font size within viewBox */
          dominant-baseline: middle;
          text-anchor: start;
        }
      </style>
      <text x="10" y="30" class="cargoly-font" fill="${purpleColor}">cargo</text>

      <!-- L Stem -->
      <path d="M128 12 L128 48 L140 48 L140 12Z" fill="${redColor}" />
      
      <!-- L Flair (Top Bar) -->
      <path d="M122 12 L170 12 L158 24 L122 24Z" fill="${redColor}" />
      
      <text x="152" y="30" class="cargoly-font" fill="${purpleColor}">y</text>
    </svg>
  `;
  // Path for L Stem: M(startX, startY) L(startX, endY) L(endX, endY) L(endX, startY) Z
  // StartX=128, StartY=12, EndX=140 (width 12), EndY=48 (height 36)

  // Path for L Flair: M(topLeftX, topLeftY) L(topRightX, topRightY) L(bottomRightX, bottomRightY) L(bottomLeftX, bottomRightY) Z
  // TopLeftX=122 (extends left of stem), TopLeftY=12
  // TopRightX=170 (extends far right), TopRightY=12
  // BottomRightX=158 (inset from 170 by 12 for slant), BottomRightY=24 (thickness 12)
  // BottomLeftX=122, BottomLeftY=24

  // Text "y": starts at x=152 (tucked under flair), y=30 (vertically aligned)

  return (
    <Link href="/dashboard" className={cn("flex items-center hover:opacity-90", className)}>
      <div
        style={{ width: current.width, height: current.height }}
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    </Link>
  );
}
