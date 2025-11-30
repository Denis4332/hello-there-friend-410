import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EscoriaLogoProps {
  className?: string;
}

export const EscoriaLogo = ({ className }: EscoriaLogoProps) => {
  return (
    <span className={cn('font-bold tracking-tight text-2xl', className)}>
      ESCOR
      <span className="relative inline-block w-[0.4em] h-[0.9em] mx-[1px]" style={{ verticalAlign: 'baseline' }}>
        <Heart className="absolute top-[-0.05em] left-1/2 -translate-x-1/2 w-[0.5em] h-[0.5em] fill-current" />
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[0.12em] h-[0.45em] bg-current rounded-[1px]" />
      </span>
      A
    </span>
  );
};
