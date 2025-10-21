import { AdminHeader } from '@/components/layout/AdminHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type UserRole = 'admin' | 'user';
type UserStatus = 'active' | 'suspended';

interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  display_name: string | null;
  profile_count: number;
  created_at: string;
}

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('user');

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_users_for_admin');
      if (error) throw error;
      return data as User[];
    },
  });

  // Mutation to update user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      // Check if user_role entry exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Rolle erfolgreich aktualisiert');
      setRoleDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren der Rolle: ' + error.message);
    },
  });

  // Mutation to toggle user status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, currentStatus }: { userId: string; currentStatus: UserStatus }) => {
      const newStatus: UserStatus = currentStatus === 'active' ? 'suspended' : 'active';
      
      // Check if user_role entry exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id, role')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing status
        const { error } = await supabase
          .from('user_roles')
          .update({ status: newStatus })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Insert new entry with default role and new status
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'user', status: newStatus });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      const action = variables.currentStatus === 'active' ? 'gesperrt' : 'entsperrt';
      toast.success(`Nutzer erfolgreich ${action}`);
    },
    onError: (error) => {
      toast.error('Fehler beim Ändern des Status: ' + error.message);
    },
  });

  const handleRoleChange = () => {
    if (selectedUser) {
      updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
    }
  };

  const handleToggleStatus = (user: User) => {
    toggleStatusMutation.mutate({ userId: user.id, currentStatus: user.status });
  };

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AdminHeader />
        <main className="flex-1 py-8 bg-muted">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Lade Nutzer...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <main className="flex-1 py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Nutzer verwalten</h1>
            <div className="text-sm text-muted-foreground">
              {users?.length || 0} Nutzer insgesamt
            </div>
          </div>

          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">E-Mail</th>
                    <th className="text-left p-3 text-sm font-medium">Name</th>
                    <th className="text-left p-3 text-sm font-medium">Rolle</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="text-left p-3 text-sm font-medium">Profile</th>
                    <th className="text-left p-3 text-sm font-medium">Registriert</th>
                    <th className="text-left p-3 text-sm font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user) => (
                    <tr key={user.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 text-sm">{user.email}</td>
                      <td className="p-3 text-sm">{user.display_name || '-'}</td>
                      <td className="p-3">
                        <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={user.status === 'active' ? 'default' : 'destructive'}
                        >
                          {user.status === 'active' ? 'Aktiv' : 'Gesperrt'}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{user.profile_count}</td>
                      <td className="p-3 text-sm">
                        {new Date(user.created_at).toLocaleDateString('de-CH')}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRoleDialog(user)}
                          >
                            Rolle ändern
                          </Button>
                          <Button
                            size="sm"
                            variant={user.status === 'active' ? 'destructive' : 'default'}
                            onClick={() => handleToggleStatus(user)}
                            disabled={toggleStatusMutation.isPending}
                          >
                            {user.status === 'active' ? 'Sperren' : 'Entsperren'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {users?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Keine Nutzer gefunden
            </div>
          )}
        </div>
      </main>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rolle ändern</DialogTitle>
            <DialogDescription>
              Rolle für {selectedUser?.email} ändern
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Neue Rolle</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Aktuelle Rolle: <strong>{selectedUser?.role === 'admin' ? 'Admin' : 'User'}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={updateRoleMutation.isPending || newRole === selectedUser?.role}
            >
              {updateRoleMutation.isPending ? 'Speichere...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
