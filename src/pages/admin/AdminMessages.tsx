import { useState } from 'react';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { useContactMessages, useMarkAsRead, useDeleteMessage, MessageType, StatusFilter } from '@/hooks/useContactMessages';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminMessages() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<MessageType>('all');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const { data: messages, isLoading } = useContactMessages(statusFilter, typeFilter);
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

  const getTypeBadge = (type: string | null) => {
    switch (type) {
      case 'banner':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Banner-Anfrage</Badge>;
      case 'ad_inquiry':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Inserat-Anfrage</Badge>;
      default:
        return <Badge variant="outline">Allgemein</Badge>;
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

        {/* Type Filter Tabs */}
        <div className="mb-4">
          <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as MessageType)}>
            <TabsList>
              <TabsTrigger value="all">Alle</TabsTrigger>
              <TabsTrigger value="general">Allgemein</TabsTrigger>
              <TabsTrigger value="banner">Banner-Anfragen</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            Alle
          </Button>
          <Button
            variant={statusFilter === 'unread' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('unread')}
            size="sm"
          >
            Ungelesen
          </Button>
          <Button
            variant={statusFilter === 'read' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('read')}
            size="sm"
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
                  <TableHead>Typ</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Nachricht</TableHead>
                  <TableHead>Anhang</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message, index) => (
                  <TableRow 
                    key={message.id} 
                    className={`${index % 2 === 0 ? 'bg-muted/20' : ''} hover:bg-muted/50 transition-colors cursor-pointer`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <TableCell>
                      <Badge variant={message.status === 'unread' ? 'destructive' : 'secondary'}>
                        {message.status === 'unread' ? '🔴 Neu' : '✅ Gelesen'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(message.type)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {message.created_at && format(new Date(message.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </TableCell>
                    <TableCell className="font-medium">{message.name}</TableCell>
                    <TableCell>{message.email}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {message.message}
                    </TableCell>
                    <TableCell>
                      {message.attachment_url && (
                        <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
                          <ImageIcon className="h-5 w-5 text-primary hover:text-primary/80" />
                        </a>
                      )}
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
              {typeFilter === 'banner' 
                ? 'Keine Banner-Anfragen vorhanden'
                : statusFilter === 'all' 
                ? 'Noch keine Kontaktanfragen vorhanden'
                : statusFilter === 'unread'
                ? 'Keine ungelesenen Nachrichten'
                : 'Keine gelesenen Nachrichten'}
            </p>
          </div>
        )}

        {/* Message Details Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Kontaktanfrage Details
                {selectedMessage && getTypeBadge(selectedMessage.type)}
              </DialogTitle>
              <DialogDescription>
                Eingegangen am {selectedMessage && selectedMessage.created_at && format(new Date(selectedMessage.created_at), 'dd.MM.yyyy um HH:mm', { locale: de })} Uhr
              </DialogDescription>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-base">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">E-Mail</p>
                    <p className="text-base">{selectedMessage.email}</p>
                  </div>
                </div>

                {/* Banner-specific metadata */}
                {selectedMessage.type === 'banner' && selectedMessage.metadata && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-3">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200">Banner-Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Position:</span>
                        <span className="ml-2 font-medium">{selectedMessage.metadata.position_name || selectedMessage.metadata.position}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Laufzeit:</span>
                        <span className="ml-2 font-medium">{selectedMessage.metadata.duration_label}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Preis:</span>
                        <span className="ml-2 font-bold text-green-600">CHF {selectedMessage.metadata.calculated_price}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Telefon:</span>
                        <span className="ml-2">{selectedMessage.metadata.contact_phone}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Titel:</span>
                        <span className="ml-2">{selectedMessage.metadata.title}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Link:</span>
                        <a href={selectedMessage.metadata.link_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline flex items-center gap-1">
                          {selectedMessage.metadata.link_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attachment preview */}
                {(selectedMessage.attachment_url || selectedMessage.metadata?.image_base64) && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Banner-Bild</p>
                    {selectedMessage.attachment_url ? (
                      <a href={selectedMessage.attachment_url} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={selectedMessage.attachment_url} 
                          alt="Banner Preview" 
                          className="max-w-full h-auto rounded-lg border max-h-64 object-contain"
                        />
                      </a>
                    ) : selectedMessage.metadata?.image_base64 && (
                      <img 
                        src={selectedMessage.metadata.image_base64} 
                        alt="Banner Preview (Base64)" 
                        className="max-w-full h-auto rounded-lg border max-h-64 object-contain"
                      />
                    )}
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nachricht</p>
                  <p className="text-base whitespace-pre-wrap bg-muted p-3 rounded-lg mt-1">{selectedMessage.message}</p>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  {selectedMessage.type === 'banner' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate('/admin/advertisements');
                        setSelectedMessage(null);
                      }}
                    >
                      → Banner erstellen
                    </Button>
                  )}
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
