
"use client";
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconOnly?: boolean; 
}

export function Logo({ size = 'md', className, iconOnly = false }: LogoProps) {
  const displaySizeKey = iconOnly ? 'sm' : size;

  // Configuration for different logo sizes
  // Factors are used to calculate SVG attributes based on fontSize or viewBox dimensions
  const sizeConfig = {
    sm: { 
      width: 90, height: 20, fontSize: 16, 
      l_dx_factor: -0.1, y_dx_factor: 0.1, y_dx_flair_spacing_factor: 0,
      flair_rect_x_factor_of_viewbox: 0.49, flair_rect_y_factor_of_viewbox: 0.22,
      flair_width_factor_of_fontsize: 0.25, flair_height_factor_of_fontsize: 0.10, flair_rx_factor_of_fontsize: 0.03
    },
    md: { 
      width: 110, height: 24, fontSize: 20, 
      l_dx_factor: -0.1, y_dx_factor: 0.1, y_dx_flair_spacing_factor: 0,
      flair_rect_x_factor_of_viewbox: 0.49, flair_rect_y_factor_of_viewbox: 0.22,
      flair_width_factor_of_fontsize: 0.25, flair_height_factor_of_fontsize: 0.10, flair_rx_factor_of_fontsize: 0.03
    },
    lg: { 
      width: 130, height: 28, fontSize: 24, 
      l_dx_factor: -0.1, y_dx_factor: 0.1, y_dx_flair_spacing_factor: 0,
      flair_rect_x_factor_of_viewbox: 0.49, flair_rect_y_factor_of_viewbox: 0.22,
      flair_width_factor_of_fontsize: 0.25, flair_height_factor_of_fontsize: 0.10, flair_rx_factor_of_fontsize: 0.03
    },
  };

  const current = sizeConfig[displaySizeKey];
  const purpleColor = "#4A0E6A"; 
  const redColor = "#D81E05";   

  const viewBoxWidth = 100; 
  const viewBoxHeight = (current.fontSize / 16) * 20; 

  const l_dx = current.fontSize * current.l_dx_factor;
  const y_dx_base = current.fontSize * current.y_dx_factor;
  
  const flairWidth = current.fontSize * current.flair_width_factor_of_fontsize;
  const flairHeight = current.fontSize * current.flair_height_factor_of_fontsize;
  const flairRx = current.fontSize * current.flair_rx_factor_of_fontsize;

  // y_dx_flair_spacing_factor is 0, so y_total_dx will be same as y_dx_base
  // This ensures 'y' is not pushed away by the flair, as flair is on top of 'l'
  const y_total_dx = y_dx_base + (flairWidth * current.y_dx_flair_spacing_factor); 

  const flairX = viewBoxWidth * current.flair_rect_x_factor_of_viewbox;
  const flairY = viewBoxHeight * current.flair_rect_y_factor_of_viewbox;
  
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
          <tspan dx={y_total_dx} fill={purpleColor}>y</tspan>
        </text>
        <rect
          x={flairX}
          y={flairY}
          width={flairWidth}
          height={flairHeight}
          fill={redColor}
          rx={flairRx}
        />
      </svg>
    </Link>
  );
}
