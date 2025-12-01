import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type MessageType = 'all' | 'general' | 'banner';
export type StatusFilter = 'all' | 'unread' | 'read';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string | null;
  created_at: string | null;
  read_at: string | null;
  type: string | null;
  attachment_url: string | null;
  metadata: Record<string, any> | null;
}

export const useContactMessages = (
  statusFilter: StatusFilter = 'all',
  typeFilter: MessageType = 'all'
) => {
  return useQuery({
    queryKey: ['contact-messages', statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ContactMessage[];
    },
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['contact-messages-unread-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unread');

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      queryClient.invalidateQueries({ queryKey: ['contact-messages-unread-count'] });
      toast.success('Nachricht als gelesen markiert');
    },
    onError: () => {
      toast.error('Fehler beim Markieren der Nachricht');
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      queryClient.invalidateQueries({ queryKey: ['contact-messages-unread-count'] });
      toast.success('Nachricht gelöscht');
    },
    onError: () => {
      toast.error('Fehler beim Löschen der Nachricht');
    },
  });
};

// Mutation für Banner-Anfrage erstellen (anonym erlaubt)
export const useCreateBannerRequest = () => {
  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      message: string;
      attachment_url?: string;
      metadata?: Record<string, any>;
    }) => {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: data.name,
          email: data.email,
          message: data.message,
          type: 'banner',
          attachment_url: data.attachment_url,
          metadata: data.metadata,
          status: 'unread',
        });

      if (error) throw error;
    },
  });
};
