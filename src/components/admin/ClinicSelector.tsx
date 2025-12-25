import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useClinics } from '@/hooks/useClinics';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Building2, Plus } from 'lucide-react';

interface ClinicSelectorProps {
  onClinicChange?: (clinicId: string) => void;
}

export function ClinicSelector({ onClinicChange }: ClinicSelectorProps) {
  const { data: clinics, isLoading } = useClinics();
  const queryClient = useQueryClient();
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newClinic, setNewClinic] = useState({ name: '', city: '', address: '', phone: '' });

  useEffect(() => {
    const savedClinicId = localStorage.getItem('selectedClinicId');
    if (savedClinicId && clinics?.find(c => c.id === savedClinicId)) {
      setSelectedClinicId(savedClinicId);
    } else if (clinics && clinics.length > 0) {
      setSelectedClinicId(clinics[0].id);
      localStorage.setItem('selectedClinicId', clinics[0].id);
    }
  }, [clinics]);

  const handleClinicChange = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    localStorage.setItem('selectedClinicId', clinicId);
    onClinicChange?.(clinicId);
  };

  const handleCreateClinic = async () => {
    if (!newClinic.name.trim()) {
      toast({ title: 'נא להזין שם מרפאה', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('clinics')
        .insert({
          name: newClinic.name.trim(),
          city: newClinic.city.trim() || null,
          address: newClinic.address.trim() || null,
          phone: newClinic.phone.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      toast({ title: 'המרפאה נוספה בהצלחה' });
      setIsDialogOpen(false);
      setNewClinic({ name: '', city: '', address: '', phone: '' });
      
      // Switch to new clinic
      if (data) {
        handleClinicChange(data.id);
      }
    } catch (error: any) {
      toast({ title: 'שגיאה בהוספת מרפאה', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-muted/50 border-b px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">טוען מרפאות...</span>
        </div>
      </div>
    );
  }

  const selectedClinic = clinics?.find(c => c.id === selectedClinicId);

  return (
    <div className="bg-muted/50 border-b px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">מרפאה:</span>
        <Select value={selectedClinicId} onValueChange={handleClinicChange}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue placeholder="בחר מרפאה" />
          </SelectTrigger>
          <SelectContent>
            {clinics?.map((clinic) => (
              <SelectItem key={clinic.id} value={clinic.id}>
                {clinic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedClinic?.city && (
          <span className="text-xs text-muted-foreground">({selectedClinic.city})</span>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 mr-2">
              <Plus className="h-4 w-4 ml-1" />
              מרפאה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>הוספת מרפאה חדשה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>שם המרפאה *</Label>
                <Input
                  value={newClinic.name}
                  onChange={(e) => setNewClinic(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="למשל: מרפאת הרצליה"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>עיר</Label>
                  <Input
                    value={newClinic.city}
                    onChange={(e) => setNewClinic(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="תל אביב"
                  />
                </div>
                <div className="space-y-2">
                  <Label>טלפון</Label>
                  <Input
                    value={newClinic.phone}
                    onChange={(e) => setNewClinic(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="03-1234567"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>כתובת</Label>
                <Input
                  value={newClinic.address}
                  onChange={(e) => setNewClinic(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="רחוב הרופא 1"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateClinic}
                disabled={isCreating || !newClinic.name.trim()}
              >
                {isCreating ? 'מוסיף...' : 'הוסף מרפאה'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
