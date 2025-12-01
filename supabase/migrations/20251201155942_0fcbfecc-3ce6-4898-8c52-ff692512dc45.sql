-- Erweitere contact_messages für verschiedene Anfrage-Typen
ALTER TABLE public.contact_messages 
ADD COLUMN type TEXT DEFAULT 'general',
ADD COLUMN attachment_url TEXT,
ADD COLUMN metadata JSONB;

-- Index für schnelle Typ-Filterung
CREATE INDEX idx_contact_messages_type ON public.contact_messages(type);