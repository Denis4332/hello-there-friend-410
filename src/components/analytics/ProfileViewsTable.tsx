import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { ProfileViewStat } from '@/hooks/useProfileViewStats';

interface ProfileViewsTableProps {
  data: ProfileViewStat[];
}

type SortKey = keyof ProfileViewStat;

export const ProfileViewsTable = ({ data }: ProfileViewsTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey>('total_views');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  const SortButton = ({ columnKey, label }: { columnKey: SortKey; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(columnKey)}
      className="hover:bg-transparent"
      aria-label={`Sort by ${label}`}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
    </Button>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton columnKey="display_name" label="Name" />
            </TableHead>
            <TableHead>
              <SortButton columnKey="city" label="Stadt" />
            </TableHead>
            <TableHead className="text-right">
              <SortButton columnKey="total_views" label="Total Views" />
            </TableHead>
            <TableHead className="text-right">
              <SortButton columnKey="views_24h" label="24h" />
            </TableHead>
            <TableHead className="text-right">
              <SortButton columnKey="views_7d" label="7d" />
            </TableHead>
            <TableHead className="text-right">
              <SortButton columnKey="views_30d" label="30d" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Keine Daten verfügbar
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row) => (
              <TableRow key={row.profile_id}>
                <TableCell className="font-medium">{row.display_name}</TableCell>
                <TableCell>{row.city}</TableCell>
                <TableCell className="text-right">{row.total_views}</TableCell>
                <TableCell className="text-right">{row.views_24h}</TableCell>
                <TableCell className="text-right">{row.views_7d}</TableCell>
                <TableCell className="text-right">{row.views_30d}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
