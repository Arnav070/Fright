
"use client";
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className }: LogoProps) {
  // Aspect ratio derived from previous attempts (approx. 250:60 or 4.16:1)
  // sm: width 90, height 22 (90/22 = 4.09)
  // md: width 120, height 29 (120/29 = 4.13)
  // lg: NEW width 200, height 48 (200/48 = 4.16)
  const sizeConfig = {
    sm: { width: 90, height: 22 }, 
    md: { width: 120, height: 29 },
    lg: { width: 200, height: 48 }, // Increased size for 'lg'
  };

  const current = sizeConfig[size];
  const logoPath = "/cargoly-logo.png"; 

  return (
    <Link href="/dashboard" className={cn("flex items-center hover:opacity-90", className)}>
      <Image 
        src={logoPath}
        alt="Cargoly Logo" 
        width={current.width}
        height={current.height}
        priority 
      />
    </Link>
  );
}
