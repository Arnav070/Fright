
"use client";
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className }: LogoProps) {
  const aspectRatio = 250 / 60; // Based on the new viewBox

  const sizeConfig = {
    sm: { width: 90, height: Math.round(90 / aspectRatio) },
    md: { width: 120, height: Math.round(120 / aspectRatio) },
    lg: { width: 150, height: Math.round(150 / aspectRatio) },
  };

  const current = sizeConfig[size];
  const purpleColor = "#4A0E6A"; // As used for "cargo" and "y"
  const mainRedColor = "#D81E05";    // Main part of the flag/arrow
  const foldRedColor = "#C0392B";    // Darker red for the "fold" part to give depth

  // SVG string crafted to match the new logo image
  const svgString = `
    <svg
      viewBox="0 0 250 60"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Cargoly Logo"
    >
      <style>
        .cargoly-font {
          font-family: 'Nunito Sans', Arial, sans-serif;
          font-weight: 700; /* Bold */
          font-size: 30px; /* Font size within viewBox */
          dominant-baseline: middle;
          text-anchor: start;
        }
      </style>
      <text x="10" y="32" class="cargoly-font" fill="${purpleColor}">cargo</text>
      
      {/* Folded part of the 'l' shape - a thin, slightly darker rectangle */}
      <rect x="90" y="17" width="4" height="30" fill="${foldRedColor}" />
      
      {/* Main pointed part of the 'l' shape (flag/arrow) */}
      {/* Points: top-left, bottom-left, bottom-right-base, tip, top-right-base */}
      <polygon points="94,17 94,47 124,47 149,32 124,17" fill="${mainRedColor}" />
      
      <text x="154" y="32" class="cargoly-font" fill="${purpleColor}">y</text>
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
