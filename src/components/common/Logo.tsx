
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
  // "cargo" text starts at x=10.
  // New "l" stem is from x=138 to x=150.
  // New "l" flair (extending left) coordinates:
  // Top-left (slanted): M112 12
  // Top-right: L150 12
  // Bottom-right: L150 24
  // Bottom-left (straight): L100 24Z
  // "y" text starts at x=162.
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
          font-size: 32px; /* Font size within viewBox */
          dominant-baseline: middle;
          text-anchor: start;
        }
      </style>
      <text x="10" y="30" class="cargoly-font" fill="${purpleColor}">cargo</text>

      <!-- L Stem (shifted right) -->
      <path d="M138 12 L138 48 L150 48 L150 12Z" fill="${redColor}" />
      
      <!-- L Flair (Top Bar, inverted: extends left, slant on left edge) -->
      <path d="M112 12 L150 12 L150 24 L100 24Z" fill="${redColor}" />
      
      <text x="162" y="30" class="cargoly-font" fill="${purpleColor}">y</text>
    </svg>
  `;

  return (
    <Link href="/dashboard" className={cn("flex items-center hover:opacity-90", className)}>
      <div
        style={{ width: current.width, height: current.height }}
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    </Link>
  );
}
