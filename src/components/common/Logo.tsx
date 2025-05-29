"use client";
import { Ship } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  iconOnly?: boolean;
}

export function Logo({ size = 'md', className, showText = true, iconOnly = false }: LogoProps) {
  const textSizeClass = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl';
  const iconSizeClass = size === 'lg' ? 'h-8 w-8' : size === 'md' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <Link href="/dashboard" className={`flex items-center gap-2 text-primary hover:opacity-90 ${className}`}>
      <Ship className={iconSizeClass} />
      {showText && !iconOnly && <span className={`font-bold ${textSizeClass}`}>Cargoly</span>}
    </Link>
  );
}
