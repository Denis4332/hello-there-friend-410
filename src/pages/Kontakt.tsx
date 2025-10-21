import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
  email: z.string().email('Ungültige E-Mail-Adresse').max(255, 'E-Mail zu lang'),
  message: z.string().min(10, 'Nachricht muss mindestens 10 Zeichen haben').max(1000, 'Nachricht zu lang')
});

const Kontakt = () => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const validation = contactSchema.safeParse({ name, email, message });
    if (!validation.success) {
      toast({
        title: 'Ungültige Eingabe',
        description: validation.error.errors[0].message,
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to database
      const { error } = await supabase
        .from('contact_messages')
        .insert({ 
          name: name.trim(), 
          email: email.trim(), 
          message: message.trim() 
        });

      if (error) {
        console.error('Contact form submission error:', error);
        toast({
          title: 'Fehler',
          description: 'Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.',
          variant: 'destructive'
        });
        return;
      }

      // Success
      toast({
        title: 'Nachricht gesendet',
        description: 'Wir melden uns in der Regel innerhalb von 24-48h.',
      });

      // Clear form
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Kontakt</h1>
          <div className="bg-card border rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  E-Mail <span className="text-destructive">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  Nachricht <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="message"
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Wird gesendet...' : 'Senden'}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground mt-4">
              Wir melden uns in der Regel innerhalb von 24–48h.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Kontakt;
