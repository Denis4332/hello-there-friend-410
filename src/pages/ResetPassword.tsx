import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
  .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
  .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
  .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten')
  .regex(/[^A-Za-z0-9]/, 'Passwort muss mindestens ein Sonderzeichen enthalten');

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { updatePassword, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If no user, redirect to auth page
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    // Validate password strength
    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return;
    }

    setIsLoading(true);

    try {
      // Check if password is leaked
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: leakCheck, error: leakError } = await supabase.functions.invoke('check-leaked-password', {
        body: { password: newPassword }
      });

      if (!leakError && leakCheck?.isLeaked) {
        setError(`Dieses Passwort wurde in ${leakCheck.count.toLocaleString()} Datenlecks gefunden und ist nicht sicher. Bitte wähle ein anderes Passwort.`);
        setIsLoading(false);
        return;
      }

      const { error: updateError } = await updatePassword(newPassword);

      setIsLoading(false);

      if (!updateError) {
        navigate('/');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Neues Passwort festlegen</CardTitle>
            <CardDescription>
              Geben Sie Ihr neues Passwort ein
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Mindestens 8 Zeichen, ein Groß- und Kleinbuchstabe, eine Zahl und ein Sonderzeichen
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Passwort ändern
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ResetPassword;
