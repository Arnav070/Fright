
"use client";
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconOnly?: boolean; // Kept for interface consistency, but text is always shown
  showText?: boolean; // Kept for interface consistency
}

export function Logo({ size = 'md', className, iconOnly = false }: LogoProps) {
  const displaySizeKey = iconOnly ? 'sm' : size;

  const sizeConfig = {
    sm: { 
      width: 90, height: 20, fontSize: 16,
      // Kerning/spacing factors for tspans
      l_tspan_dx_factor: -0.1, 
      y_tspan_dx_factor: -0.05, // Adjusted to tuck 'y'
      // Factors for the 'l' top bar path, relative to viewBox and fontSize
      l_top_bar_x_start_factor_vb: 0.47, // Start X of bar (of viewBoxWidth)
      l_top_bar_y_start_factor_vb: 0.22, // Top Y of bar (of viewBoxHeight)
      l_top_bar_width_factor_fs: 0.85,    // Total width of bar (of fontSize)
      l_top_bar_thickness_factor_fs: 0.18, // Thickness of bar (of fontSize)
      l_top_bar_slant_factor_fs: 0.25,   // Horizontal projection of the slant (of fontSize)
    },
    md: { 
      width: 110, height: 24, fontSize: 20, 
      l_tspan_dx_factor: -0.1, 
      y_tspan_dx_factor: -0.05,
      l_top_bar_x_start_factor_vb: 0.47,
      l_top_bar_y_start_factor_vb: 0.22,
      l_top_bar_width_factor_fs: 0.85,
      l_top_bar_thickness_factor_fs: 0.18,
      l_top_bar_slant_factor_fs: 0.25,
    },
    lg: { 
      width: 130, height: 28, fontSize: 24, 
      l_tspan_dx_factor: -0.1, 
      y_tspan_dx_factor: -0.05,
      l_top_bar_x_start_factor_vb: 0.47,
      l_top_bar_y_start_factor_vb: 0.22,
      l_top_bar_width_factor_fs: 0.85,
      l_top_bar_thickness_factor_fs: 0.18,
      l_top_bar_slant_factor_fs: 0.25,
    },
  };

  const current = sizeConfig[displaySizeKey];
  const purpleColor = "#4A0E6A"; 
  const redColor = "#D81E05";   

  const viewBoxWidth = 100; 
  const viewBoxHeight = (current.fontSize / 16) * 20; // Maintain aspect ratio based on font size

  // Calculate tspan dx values
  const l_dx = current.fontSize * current.l_tspan_dx_factor;
  const y_dx = current.fontSize * current.y_tspan_dx_factor;

  // Calculate dimensions for the 'l' top bar path
  const pathStartX = viewBoxWidth * current.l_top_bar_x_start_factor_vb;
  const pathStartY = viewBoxHeight * current.l_top_bar_y_start_factor_vb;
  const pathBarThickness = current.fontSize * current.l_top_bar_thickness_factor_fs;
  const pathBarWidth = current.fontSize * current.l_top_bar_width_factor_fs;
  const pathSlantHorizontal = current.fontSize * current.l_top_bar_slant_factor_fs;

  // Define the SVG path for the 'l' top bar
  // P1: Top-left of bar
  // P2: Top-right of bar
  // P3: Bottom-right of bar (slanted edge)
  // P4: Bottom-left of bar
  const p1x = pathStartX;
  const p1y = pathStartY;
  const p2x = pathStartX + pathBarWidth;
  const p2y = pathStartY;
  const p3x = pathStartX + pathBarWidth - pathSlantHorizontal;
  const p3y = pathStartY + pathBarThickness;
  const p4x = pathStartX;
  const p4y = pathStartY + pathBarThickness;

  const lTopBarPathData = `M ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y} L ${p4x} ${p4y} Z`;
  
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
              dominant-baseline: middle; 
              text-anchor: start; 
            }
          `}
        </style>
        <text x="0" y={viewBoxHeight / 2} className="cargoly-logo-svg-text">
          <tspan fill={purpleColor}>cargo</tspan>
          <tspan dx={l_dx} fill={redColor}>l</tspan>
          <tspan dx={y_dx} fill={purpleColor}>y</tspan>
        </text>
        {/* Path for the stylized top bar of 'l' */}
        <path d={lTopBarPathData} fill={redColor} />
      </svg>
    </Link>
  );
}
