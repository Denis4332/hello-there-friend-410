import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface ProfileViewStat {
  profile_id: string;
  display_name: string;
  total_views: number;
  unique_views: number;
  last_view: string;
}

interface ProfileViewsTableProps {
  data: ProfileViewStat[];
}

type SortKey = 'display_name' | 'total_views' | 'unique_views' | 'last_view';

export const ProfileViewsTableVirtualized = ({ data }: ProfileViewsTableProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Keine Daten verfügbar
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto border rounded-lg">
      <div className="relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>Profil</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8">
                  Gesamt <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8">
                  Einzigartig <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8">
                  Letzter Aufruf <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = data[virtualRow.index];
              return (
                <TableRow
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <TableCell className="font-medium">{row.display_name}</TableCell>
                  <TableCell>{row.total_views}</TableCell>
                  <TableCell>{row.unique_views}</TableCell>
                  <TableCell>{new Date(row.last_view).toLocaleDateString('de-CH')}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
