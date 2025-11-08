import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { ReactNode } from 'react';

interface FilterPopoverProps {
  trigger: {
    icon: ReactNode;
    label: string;
  };
  items: Array<{
    id: string;
    label: string;
  }>;
  selected: string;
  onSelect: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allLabel?: string;
  layout?: 'list' | 'grid';
  align?: 'start' | 'center' | 'end';
}

export const FilterPopover = ({
  trigger,
  items,
  selected,
  onSelect,
  open,
  onOpenChange,
  allLabel = 'Alle',
  layout = 'list',
  align = 'start',
}: FilterPopoverProps) => {
  const selectedItem = items.find(item => item.id === selected);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between h-12">
          {trigger.icon}
          {selectedItem ? selectedItem.label : trigger.label}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2 max-h-[400px] overflow-y-auto" align={align}>
        <div className={layout === 'grid' ? 'grid grid-cols-3 gap-1.5' : 'space-y-1'}>
          <Button
            type="button"
            variant={!selected ? "default" : "ghost"}
            onClick={() => {
              onSelect('');
              onOpenChange(false);
            }}
            size={layout === 'grid' ? 'sm' : 'default'}
            className={layout === 'grid' ? 'h-9' : 'w-full justify-start'}
          >
            {allLabel}
          </Button>
          {items.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={selected === item.id ? "default" : "ghost"}
              onClick={() => {
                onSelect(item.id);
                onOpenChange(false);
              }}
              size={layout === 'grid' ? 'sm' : 'default'}
              className={layout === 'grid' ? 'h-9' : 'w-full justify-start'}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
