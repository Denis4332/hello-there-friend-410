import { useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { useContactMessages, useMarkAsRead, useDeleteMessage } from '@/hooks/useContactMessages';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type FilterType = 'all' | 'unread' | 'read';

export default function AdminMessages() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const { data: messages, isLoading } = useContactMessages(filter);
  const markAsRead = useMarkAsRead();
  const deleteMessage = useDeleteMessage();

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Möchten Sie diese Nachricht wirklich löschen?')) {
      deleteMessage.mutate(id);
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Kontaktanfragen</h1>
          <p className="text-muted-foreground">
            Verwalte alle eingehenden Kontaktanfragen
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Alle
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            onClick={() => setFilter('unread')}
          >
            Ungelesen
          </Button>
          <Button
            variant={filter === 'read' ? 'default' : 'outline'}
            onClick={() => setFilter('read')}
          >
            Gelesen
          </Button>
        </div>

        {/* Messages Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Lädt Nachrichten...</p>
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Nachricht</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message, index) => (
                  <TableRow key={message.id} className={`${index % 2 === 0 ? 'bg-muted/20' : ''} hover:bg-muted/50 transition-colors`}>
                    <TableCell>
                      <Badge variant={message.status === 'unread' ? 'destructive' : 'secondary'}>
                        {message.status === 'unread' ? '🔴 Neu' : '✅ Gelesen'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(message.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </TableCell>
                    <TableCell className="font-medium">{message.name}</TableCell>
                    <TableCell>{message.email}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {message.message}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMessage(message)}
                        >
                          Details
                        </Button>
                        {message.status === 'unread' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(message.id)}
                          >
                            Als gelesen
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(message.id)}
                        >
                          Löschen
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'Noch keine Kontaktanfragen vorhanden'
                : filter === 'unread'
                ? 'Keine ungelesenen Nachrichten'
                : 'Keine gelesenen Nachrichten'}
            </p>
          </div>
        )}

        {/* Message Details Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Kontaktanfrage Details</DialogTitle>
              <DialogDescription>
                Eingegangen am {selectedMessage && format(new Date(selectedMessage.created_at), 'dd.MM.yyyy um HH:mm', { locale: de })} Uhr
              </DialogDescription>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-base">{selectedMessage.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">E-Mail</p>
                  <p className="text-base">{selectedMessage.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nachricht</p>
                  <p className="text-base whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  {selectedMessage.status === 'unread' && (
                    <Button
                      onClick={() => {
                        handleMarkAsRead(selectedMessage.id);
                        setSelectedMessage(null);
                      }}
                    >
                      Als gelesen markieren
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedMessage.id)}
                  >
                    Löschen
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
