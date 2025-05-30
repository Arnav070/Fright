
"use client";
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  // The iconOnly and showText props are less relevant now as we use a static image.
}

export function Logo({ size = 'md', className }: LogoProps) {
  // Estimated aspect ratio from the provided image is ~3:1 (width:height)
  // Adjust these height values if your actual image's aspect ratio differs.
  const sizeConfig = {
    sm: { width: 90, height: 30 }, 
    md: { width: 120, height: 40 },
    lg: { width: 150, height: 50 },
  };

  const current = sizeConfig[size];
  const logoPath = "/cargoly-logo.png"; // This is where you should save your logo image in the 'public' folder

  return (
    <Link href="/dashboard" className={cn("flex items-center hover:opacity-90", className)}>
      <Image 
        src={logoPath}
        alt="Cargoly Logo" 
        width={current.width}
        height={current.height}
        priority // Good to add for LCP elements like a logo in the header
      />
    </Link>
  );
}
