import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Users, UserPlus, Shield, Trash2 } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'doctor' | 'secretary';
  email?: string;
  created_at: string;
}

export default function TeamPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({ email: '', role: '' });

  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'doctor', 'secretary'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const addMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      // In a real implementation, you'd invite the user via email
      // For now, we'll just show a message
      toast({ 
        title: 'שים לב', 
        description: 'המשתמש צריך להירשם קודם למערכת. לאחר ההרשמה, ניתן להוסיף את התפקיד שלו.' 
      });
      throw new Error('User must register first');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setIsDialogOpen(false);
      setNewMember({ email: '', role: '' });
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
      toast({ title: 'חבר הצוות הוסר בהצלחה' });
    },
    onError: (error) => {
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
                הזמן חבר צוות
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>הזמנת חבר צוות חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>כתובת אימייל</Label>
                  <Input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>תפקיד</Label>
                  <Select
                    value={newMember.role}
                    onValueChange={(v) => setNewMember(prev => ({ ...prev, role: v }))}
                  >
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
                  onClick={() => addMember.mutate(newMember)}
                  disabled={!newMember.email || !newMember.role}
                >
                  שלח הזמנה
                </Button>
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
                <p className="font-medium text-blue-800">הוספת חברי צוות</p>
                <p className="text-sm text-blue-700">
                  כדי להוסיף חבר צוות חדש, המשתמש צריך קודם להירשם למערכת דרך דף ההתחברות. 
                  לאחר ההרשמה, ניתן להוסיף את התפקיד שלו כאן.
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
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground font-medium">
                        {member.role.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{member.user_id}</p>
                        <Badge className={roleColors[member.role]}>
                          {roleLabels[member.role]}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('האם אתה בטוח שברצונך להסיר חבר צוות זה?')) {
                          removeMember.mutate(member.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">אין חברי צוות רשומים</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
