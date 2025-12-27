import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Users, UserPlus, Shield, ShieldOff, Trash2, UserCircle, Mail, Copy, Clock, CheckCircle, Settings, MapPin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useClinicContext } from '@/contexts/ClinicContext';
import { useClinic, useClinics } from '@/hooks/useClinics';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'doctor' | 'secretary' | 'patient';
  permissions: Record<string, boolean> | null;
  created_at: string;
  clinic_id: string | null;
  profile?: {
    first_name: string | null;
    last_name: string | null;
  };
  clinic?: {
    id: string;
    name: string;
  } | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  invite_code: string;
  permissions: Record<string, boolean> | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  clinic_id: string | null;
  clinic?: {
    id: string;
    name: string;
  } | null;
}

const defaultPermissions = {
  canViewPatients: true,
  canEditPatients: false,
  canViewAppointments: true,
  canEditAppointments: false,
  canViewBilling: false,
  canEditBilling: false,
  canViewDocuments: true,
  canEditDocuments: false,
};

const permissionLabels: Record<string, string> = {
  canViewPatients: 'צפייה במטופלים',
  canEditPatients: 'עריכת מטופלים',
  canViewAppointments: 'צפייה בתורים',
  canEditAppointments: 'עריכת תורים',
  canViewBilling: 'צפייה בחיובים',
  canEditBilling: 'עריכת חיובים',
  canViewDocuments: 'צפייה במסמכים',
  canEditDocuments: 'העלאת מסמכים',
};

export default function TeamPage() {
  const queryClient = useQueryClient();
  const { selectedClinicId } = useClinicContext();
  const { data: currentClinic } = useClinic(selectedClinicId ?? undefined);
  const { data: allClinics } = useClinics();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('secretary');
  const [permissions, setPermissions] = useState<Record<string, boolean>>(defaultPermissions);
  const [selectedClinicIds, setSelectedClinicIds] = useState<string[]>(selectedClinicId ? [selectedClinicId] : []);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<Record<string, boolean>>(defaultPermissions);
  const [editingClinicIds, setEditingClinicIds] = useState<string[]>([]);

  // Fetch team members for current clinic
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members', selectedClinicId],
    queryFn: async () => {
      let query = supabase
        .from('user_roles')
        .select('*, clinic:clinics(id, name)')
        .in('role', ['admin', 'doctor', 'secretary'])
        .order('created_at', { ascending: false });
      
      if (selectedClinicId) {
        // Show members assigned to this clinic OR admins (who can see all)
        query = query.or(`clinic_id.eq.${selectedClinicId},role.eq.admin`);
      }
      
      const { data: roles, error: rolesError } = await query;
      
      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      return roles.map(role => ({
        ...role,
        permissions: role.permissions as Record<string, boolean> | null,
        profile: profiles?.find(p => p.user_id === role.user_id),
      })) as TeamMember[];
    },
  });

  // Fetch pending invitations for current clinic
  const { data: invitations } = useQuery({
    queryKey: ['team-invitations', selectedClinicId],
    queryFn: async () => {
      let query = supabase
        .from('team_invitations')
        .select('*, clinic:clinics(id, name)')
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (selectedClinicId) {
        query = query.eq('clinic_id', selectedClinicId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Invitation[];
    },
  });

  // Send invitation
  const sendInvite = useMutation({
    mutationFn: async () => {
      const clinicIdsToUse = selectedClinicIds.length > 0 ? selectedClinicIds : (selectedClinicId ? [selectedClinicId] : []);
      const { data, error } = await supabase.functions.invoke('send-team-invite', {
        body: { email: inviteEmail, role: selectedRole, permissions, clinic_ids: clinicIdsToUse },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', selectedClinicId] });
      setIsDialogOpen(false);
      setInviteEmail('');
      setSelectedRole('secretary');
      setPermissions(defaultPermissions);
      setSelectedClinicIds(selectedClinicId ? [selectedClinicId] : []);
      
      // Copy invite link
      if (data?.inviteLink) {
        navigator.clipboard.writeText(data.inviteLink);
        toast({ title: 'ההזמנה נשלחה והקישור הועתק!' });
      } else {
        toast({ title: 'ההזמנה נוצרה בהצלחה' });
      }
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה בשליחת ההזמנה', description: error.message, variant: 'destructive' });
    },
  });

  // Update member permissions and clinics
  const updateMember = useMutation({
    mutationFn: async ({ id, permissions, clinicIds }: { id: string; permissions: Record<string, boolean>; clinicIds: string[] }) => {
      // Get current member info
      const member = teamMembers?.find(m => m.id === id);
      if (!member) throw new Error('Member not found');
      
      // Update the current role with first clinic (or null)
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ 
          permissions,
          clinic_id: clinicIds.length > 0 ? clinicIds[0] : null
        })
        .eq('id', id);
      if (updateError) throw updateError;
      
      // Handle additional clinics: create new roles for each additional clinic
      if (clinicIds.length > 1) {
        for (let i = 1; i < clinicIds.length; i++) {
          // Check if role already exists
          const { data: existing } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', member.user_id)
            .eq('clinic_id', clinicIds[i])
            .single();
          
          if (!existing) {
            const { error: insertError } = await supabase
              .from('user_roles')
              .insert({
                user_id: member.user_id,
                role: member.role,
                permissions,
                clinic_id: clinicIds[i]
              });
            if (insertError && !insertError.message.includes('duplicate')) throw insertError;
          }
        }
      }
      
      // Remove roles for clinics not in the list anymore (except current one being edited)
      const existingRoles = teamMembers?.filter(m => m.user_id === member.user_id && m.id !== id) || [];
      for (const role of existingRoles) {
        if (role.clinic_id && !clinicIds.includes(role.clinic_id)) {
          await supabase.from('user_roles').delete().eq('id', role.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', selectedClinicId] });
      setEditingMemberId(null);
      toast({ title: 'חבר הצוות עודכן בהצלחה' });
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה בעדכון', description: error.message, variant: 'destructive' });
    },
  });

  // Remove member
  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', selectedClinicId] });
      toast({ title: 'חבר הצוות הוסר בהצלחה' });
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה בהסרת חבר הצוות', description: error.message, variant: 'destructive' });
    },
  });

  // Delete invitation
  const deleteInvitation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', selectedClinicId] });
      toast({ title: 'ההזמנה בוטלה' });
    },
  });

  // Reset MFA for a staff member (admin only)
  const resetMFA = useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase.functions.invoke('reset-staff-mfa', {
        body: { targetUserId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ 
        title: 'אימות דו-שלבי אופס בהצלחה',
        description: `המשתמש יידרש להגדיר אימות דו-שלבי מחדש בכניסה הבאה`,
      });
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה באיפוס אימות דו-שלבי', description: error.message, variant: 'destructive' });
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

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'הקישור הועתק!' });
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setEditingPermissions(member.permissions || defaultPermissions);
    // Get all clinic IDs for this user
    const userClinicIds = teamMembers
      ?.filter(m => m.user_id === member.user_id && m.clinic_id)
      .map(m => m.clinic_id as string) || [];
    setEditingClinicIds(userClinicIds.length > 0 ? userClinicIds : (member.clinic_id ? [member.clinic_id] : []));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">צוות המרפאה</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              ניהול חברי הצוות והרשאות
              {currentClinic && (
                <span className="inline-flex items-center gap-1 text-primary">
                  <MapPin className="h-4 w-4" />
                  {currentClinic.name}
                </span>
              )}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <UserPlus className="h-4 w-4 ml-2" />
                הזמן חבר צוות
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-md">
              <DialogHeader>
                <DialogTitle>הזמנת חבר צוות חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>כתובת אימייל</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>תפקיד</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="secretary">מזכירה</SelectItem>
                      <SelectItem value="doctor">רופא</SelectItem>
                      <SelectItem value="admin">מנהל</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Clinic selection */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    מרפאות להוספה
                  </Label>
                  <ScrollArea className="h-32 border rounded-md p-2">
                    <div className="space-y-2">
                      {allClinics?.map((clinic) => (
                        <div key={clinic.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`clinic-${clinic.id}`}
                            checked={selectedClinicIds.includes(clinic.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedClinicIds(prev => [...prev, clinic.id]);
                              } else {
                                setSelectedClinicIds(prev => prev.filter(id => id !== clinic.id));
                              }
                            }}
                          />
                          <Label htmlFor={`clinic-${clinic.id}`} className="text-sm cursor-pointer">
                            {clinic.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <p className="text-xs text-muted-foreground">בחר מרפאה אחת או יותר</p>
                </div>
                <div className="space-y-3">
                  <Label>הרשאות</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(permissionLabels).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={key}
                          checked={permissions[key] || false}
                          onCheckedChange={(checked) => 
                            setPermissions(prev => ({ ...prev, [key]: !!checked }))
                          }
                        />
                        <Label htmlFor={key} className="text-sm cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => sendInvite.mutate()}
                  disabled={!inviteEmail || sendInvite.isPending}
                >
                  <Mail className="h-4 w-4 ml-2" />
                  {sendInvite.isPending ? 'שולח...' : 'שלח הזמנה'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="members" dir="rtl">
          <TabsList>
            <TabsTrigger value="members">חברי צוות</TabsTrigger>
            <TabsTrigger value="pending">הזמנות ממתינות ({invitations?.length || 0})</TabsTrigger>
          </TabsList>

          {/* Team Members */}
          <TabsContent value="members">
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
                        <div className="flex items-center gap-2">
                          <Dialog open={editingMemberId === member.id} onOpenChange={(open) => !open && setEditingMemberId(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => handleEditMember(member)}>
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent dir="rtl" className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>עריכת חבר צוות - {getMemberName(member)}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                {/* Clinic Selection */}
                                <div className="space-y-3">
                                  <Label className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    מרפאות
                                  </Label>
                                  <ScrollArea className="h-32 border rounded-md p-2">
                                    <div className="space-y-2">
                                      {allClinics?.map((clinic) => (
                                        <div key={clinic.id} className="flex items-center gap-2">
                                          <Checkbox
                                            id={`edit-clinic-${clinic.id}`}
                                            checked={editingClinicIds.includes(clinic.id)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                setEditingClinicIds(prev => [...prev, clinic.id]);
                                              } else {
                                                setEditingClinicIds(prev => prev.filter(id => id !== clinic.id));
                                              }
                                            }}
                                          />
                                          <Label htmlFor={`edit-clinic-${clinic.id}`} className="text-sm cursor-pointer">
                                            {clinic.name}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </div>
                                
                                {/* Permissions */}
                                <div className="space-y-3">
                                  <Label>הרשאות</Label>
                                  <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(permissionLabels).map(([key, label]) => (
                                      <div key={key} className="flex items-center gap-2">
                                        <Checkbox
                                          id={`edit-${key}`}
                                          checked={editingPermissions[key] || false}
                                          onCheckedChange={(checked) => 
                                            setEditingPermissions(prev => ({ ...prev, [key]: !!checked }))
                                          }
                                        />
                                        <Label htmlFor={`edit-${key}`} className="text-sm cursor-pointer">
                                          {label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Reset MFA Button */}
                                <div className="border-t pt-4">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        className="w-full text-amber-600 border-amber-300 hover:bg-amber-50"
                                        disabled={resetMFA.isPending}
                                      >
                                        {resetMFA.isPending ? (
                                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                        ) : (
                                          <ShieldOff className="h-4 w-4 ml-2" />
                                        )}
                                        איפוס אימות דו-שלבי
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent dir="rtl">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>איפוס אימות דו-שלבי</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          האם אתה בטוח שברצונך לאפס את האימות הדו-שלבי של {getMemberName(member)}?
                                          <br /><br />
                                          המשתמש יידרש להגדיר אימות דו-שלבי מחדש בכניסה הבאה למערכת.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => resetMFA.mutate(member.user_id)}
                                          className="bg-amber-600 text-white hover:bg-amber-700"
                                        >
                                          אפס אימות דו-שלבי
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                                
                                <Button 
                                  className="w-full" 
                                  onClick={() => updateMember.mutate({ id: member.id, permissions: editingPermissions, clinicIds: editingClinicIds })}
                                  disabled={updateMember.isPending}
                                >
                                  {updateMember.isPending ? 'שומר...' : 'שמור שינויים'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">אין חברי צוות רשומים</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      שלח הזמנה לחבר צוות חדש
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Invitations */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  הזמנות ממתינות
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invitations && invitations.length > 0 ? (
                  <div className="space-y-3">
                    {invitations.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-700">
                            <Mail className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium" dir="ltr">{invite.email}</p>
                            <div className="flex items-center gap-2">
                              <Badge className={roleColors[invite.role]}>
                                {roleLabels[invite.role]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                תוקף עד: {format(new Date(invite.expires_at), 'dd/MM/yyyy', { locale: he })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => copyInviteLink(invite.invite_code)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteInvitation.mutate(invite.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">אין הזמנות ממתינות</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
