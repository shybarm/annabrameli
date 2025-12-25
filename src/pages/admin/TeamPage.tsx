import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Users, UserPlus, Shield, Trash2, UserCircle } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'doctor' | 'secretary' | 'patient';
  created_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
  };
  email?: string;
}

interface AvailableUser {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string;
}

export default function TeamPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Fetch team members with profile info
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'doctor', 'secretary'])
        .order('created_at', { ascending: false });
      
      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      // Get profile info for each user
      const userIds = roles.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Merge data
      return roles.map(role => ({
        ...role,
        profile: profiles?.find(p => p.user_id === role.user_id),
      })) as TeamMember[];
    },
  });

  // Fetch all registered users for adding to team
  const { data: availableUsers } = useQuery({
    queryKey: ['available-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return profiles as AvailableUser[];
    },
  });

  // Filter out users who already have staff roles
  const usersWithoutRole = availableUsers?.filter(user => 
    !teamMembers?.some(member => member.user_id === user.user_id)
  ) || [];

  const addMember = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role as 'admin' | 'doctor' | 'secretary' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
      setIsDialogOpen(false);
      setSelectedUserId('');
      setSelectedRole('');
      toast({ title: 'חבר הצוות נוסף בהצלחה' });
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה בהוספת חבר צוות', description: error.message, variant: 'destructive' });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
      toast({ title: 'חבר הצוות הוסר בהצלחה' });
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה בהסרת חבר הצוות', description: error.message, variant: 'destructive' });
    },
  });

  const roleLabels: Record<string, string> = {
    admin: 'מנהל',
    doctor: 'רופא',
    secretary: 'מזכירה',
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    doctor: 'bg-blue-100 text-blue-700',
    secretary: 'bg-green-100 text-green-700',
  };

  const getMemberName = (member: TeamMember) => {
    if (member.profile?.first_name || member.profile?.last_name) {
      return `${member.profile.first_name || ''} ${member.profile.last_name || ''}`.trim();
    }
    return 'משתמש לא ידוע';
  };

  const getUserDisplayName = (user: AvailableUser) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.user_id.slice(0, 8) + '...';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">צוות המרפאה</h1>
            <p className="text-muted-foreground">ניהול חברי הצוות והרשאות</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <UserPlus className="h-4 w-4 ml-2" />
                הוסף חבר צוות
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>הוספת חבר צוות</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {usersWithoutRole.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      <Label>בחר משתמש</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר משתמש רשום" />
                        </SelectTrigger>
                        <SelectContent>
                          {usersWithoutRole.map((user) => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {getUserDisplayName(user)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>תפקיד</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר תפקיד" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="doctor">רופא</SelectItem>
                          <SelectItem value="secretary">מזכירה</SelectItem>
                          <SelectItem value="admin">מנהל</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => addMember.mutate({ userId: selectedUserId, role: selectedRole })}
                      disabled={!selectedUserId || !selectedRole || addMember.isPending}
                    >
                      {addMember.isPending ? 'מוסיף...' : 'הוסף לצוות'}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">אין משתמשים רשומים זמינים להוספה</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      המשתמש צריך קודם להירשם למערכת דרך דף ההתחברות
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">ניהול צוות</p>
                <p className="text-sm text-blue-700">
                  ניתן להוסיף רק משתמשים שכבר נרשמו למערכת. לאחר הרישום, בחר את המשתמש והקצה לו תפקיד.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              חברי צוות ({teamMembers?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : teamMembers && teamMembers.length > 0 ? (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-medium">
                        <UserCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium">{getMemberName(member)}</p>
                        <Badge className={roleColors[member.role]}>
                          {roleLabels[member.role]}
                        </Badge>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>הסרת חבר צוות</AlertDialogTitle>
                          <AlertDialogDescription>
                            האם אתה בטוח שברצונך להסיר את {getMemberName(member)} מהצוות?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ביטול</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeMember.mutate(member.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            הסר
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">אין חברי צוות רשומים</p>
                <p className="text-sm text-muted-foreground mt-2">
                  הוסף חברי צוות על ידי לחיצה על "הוסף חבר צוות"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
