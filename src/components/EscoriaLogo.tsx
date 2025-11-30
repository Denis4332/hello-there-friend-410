import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EscoriaLogoProps {
  className?: string;
}

export const EscoriaLogo = ({ className }: EscoriaLogoProps) => {
  return (
    <span className={cn('font-bold tracking-tight flex items-baseline text-2xl', className)}>
      ESCOR
      <span className="relative inline-flex flex-col items-center mx-[2px]">
        <Heart className="w-[0.6em] h-[0.6em] fill-current" />
        <span className="w-[0.15em] h-[0.5em] bg-current rounded-[1px]" />
      </span>
      A
    </span>
  );
};
