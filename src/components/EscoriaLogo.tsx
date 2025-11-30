import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EscoriaLogoProps {
  className?: string;
}

export const EscoriaLogo = ({ className }: EscoriaLogoProps) => {
  return (
    <span className={cn('font-bold tracking-tight flex items-baseline text-2xl', className)}>
      ESCOR
      <span className="relative inline-block w-[0.4em] h-[1.1em] mx-[1px]">
        {/* Herz als "Punkt" - positioniert oben */}
        <Heart className="absolute top-0 left-1/2 -translate-x-1/2 w-[0.55em] h-[0.55em] fill-current" />
        {/* Stiel des i - auf der Baseline */}
        <span className="absolute bottom-[0.15em] left-1/2 -translate-x-1/2 w-[0.15em] h-[0.5em] bg-current rounded-[1px]" />
      </span>
      A
    </span>
  );
};
