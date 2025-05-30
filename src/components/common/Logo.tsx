
"use client";
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  // iconOnly and showText are no longer directly used as the SVG is self-contained.
  // The 'size' prop effectively handles different display needs.
}

export function Logo({ size = 'md', className }: LogoProps) {
  // Aspect ratio of viewBox="0 0 250 60" is 250/60 = 4.1667
  const aspectRatio = 250 / 60;

  const sizeConfig = {
    sm: { width: 90, height: Math.round(90 / aspectRatio) },    // approx 22
    md: { width: 120, height: Math.round(120 / aspectRatio) },  // approx 29
    lg: { width: 150, height: Math.round(150 / aspectRatio) },  // approx 36
  };

  const current = sizeConfig[size];
  const purpleColor = "#4A0E6A"; // As used for "cargo" and "y"
  const redColor = "#D81E05";    // As used for the stylized "l"

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
      
      <!-- Stylized L shape in red -->
      <path d="M110 48 L110 12 L122 12 L122 36Z" fill="${redColor}" /> 
      <path d="M122 12 L160 12 L170 24 L122 36Z" fill="${redColor}" />
      
      <text x="160" y="32" class="cargoly-font" fill="${purpleColor}">y</text>
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
