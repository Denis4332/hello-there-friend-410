import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EscoriaLogoProps {
  className?: string;
}

export const EscoriaLogo = ({ className }: EscoriaLogoProps) => {
  return (
    <span className={cn('font-bold tracking-tight flex items-baseline text-2xl', className)}>
      ESCOR
      <span className="relative inline-block w-[0.4em] h-[1em] mx-[1px]">
        <Heart className="absolute top-[0.1em] left-1/2 -translate-x-1/2 w-[0.5em] h-[0.5em] fill-current" />
        <span className="absolute bottom-[0.08em] left-1/2 -translate-x-1/2 w-[0.13em] h-[0.5em] bg-current rounded-[1px]" />
      </span>
      A
    </span>
  );
};
