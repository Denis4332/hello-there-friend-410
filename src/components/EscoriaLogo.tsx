import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EscoriaLogoProps {
  className?: string;
}

export const EscoriaLogo = ({ className }: EscoriaLogoProps) => {
  return (
    <span className={cn('font-bold tracking-tight flex items-baseline text-xl', className)}>
      ESCOR
      <span className="relative inline-flex flex-col items-center mx-[1px]">
        <Heart className="w-[0.35em] h-[0.35em] fill-current" />
        <span className="w-[0.13em] h-[0.55em] bg-current rounded-[1px]" />
      </span>
      A
    </span>
  );
};
