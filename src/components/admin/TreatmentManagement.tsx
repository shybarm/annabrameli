import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, Plus, Edit, Stethoscope, Sparkles, MessageCircle, MoreHorizontal } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Treatment {
  id: string;
  name: string;
  name_he: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  category: string | null;
  is_active: boolean | null;
}

const CATEGORIES = [
  { value: 'aesthetics', label: 'אסתטיקה', icon: Sparkles },
  { value: 'medical', label: 'רפואי', icon: Stethoscope },
  { value: 'consultation', label: 'ייעוץ', icon: MessageCircle },
  { value: 'other', label: 'אחר', icon: MoreHorizontal },
];

const getCategoryLabel = (category: string | null) => {
  return CATEGORIES.find(c => c.value === category)?.label || 'אחר';
};

const getCategoryIcon = (category: string | null) => {
  const CategoryIcon = CATEGORIES.find(c => c.value === category)?.icon || MoreHorizontal;
  return CategoryIcon;
};

export function TreatmentManagement() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name_he: '',
    category: 'other',
    price: 0,
    duration_minutes: 30,
  });

  // Fetch treatments
  const { data: treatments, isLoading } = useQuery({
    queryKey: ['treatments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointment_types')
        .select('*')
        .order('name_he');
      if (error) throw error;
      return data as Treatment[];
    },
  });

  // Add treatment mutation
  const addTreatment = useMutation({
    mutationFn: async (data: { name_he: string; category: string; price: number; duration_minutes: number }) => {
      const { error } = await supabase
        .from('appointment_types')
        .insert({
          name: data.name_he, // Use Hebrew name as primary name
          name_he: data.name_he,
          category: data.category,
          price: data.price,
          duration_minutes: data.duration_minutes,
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment-types'] });
      toast({ title: 'הטיפול נוסף בהצלחה' });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  // Update treatment mutation
  const updateTreatment = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name_he: string; category: string; price: number; duration_minutes: number } }) => {
      const { error } = await supabase
        .from('appointment_types')
        .update({
          name: data.name_he,
          name_he: data.name_he,
          category: data.category,
          price: data.price,
          duration_minutes: data.duration_minutes,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment-types'] });
      toast({ title: 'הטיפול עודכן בהצלחה' });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });

  const handleOpenAdd = () => {
    setEditingTreatment(null);
    setFormData({
      name_he: '',
      category: 'other',
      price: 0,
      duration_minutes: 30,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (treatment: Treatment) => {
    setEditingTreatment(treatment);
    setFormData({
      name_he: treatment.name_he,
      category: treatment.category || 'other',
      price: treatment.price || 0,
      duration_minutes: treatment.duration_minutes,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTreatment(null);
    setFormData({
      name_he: '',
      category: 'other',
      price: 0,
      duration_minutes: 30,
    });
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.name_he.trim()) {
      toast({ title: 'יש להזין שם טיפול', variant: 'destructive' });
      return;
    }
    if (formData.price < 0) {
      toast({ title: 'המחיר חייב להיות 0 או יותר', variant: 'destructive' });
      return;
    }

    if (editingTreatment) {
      updateTreatment.mutate({ id: editingTreatment.id, data: formData });
    } else {
      addTreatment.mutate(formData);
    }
  };

  const isPending = addTreatment.isPending || updateTreatment.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                מחירון טיפולים
              </CardTitle>
              <CardDescription>ניהול סוגי טיפולים ומחיריהם</CardDescription>
            </div>
            <Button onClick={handleOpenAdd} className="min-h-[44px]">
              <Plus className="h-4 w-4 ml-2" />
              הוסף טיפול
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : treatments && treatments.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {treatments.map((treatment) => {
                const CategoryIcon = getCategoryIcon(treatment.category);
                return (
                  <div 
                    key={treatment.id} 
                    className="p-4 border rounded-lg bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {treatment.name_he}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {getCategoryLabel(treatment.category)}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {treatment.duration_minutes} דק׳
                          </span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEdit(treatment)}
                        className="h-8 w-8 shrink-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-xl font-bold text-primary">
                        ₪{treatment.price?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">אין טיפולים במחירון</p>
              <Button onClick={handleOpenAdd} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 ml-2" />
                הוסף טיפול ראשון
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTreatment ? 'עריכת טיפול' : 'הוספת טיפול חדש'}
            </DialogTitle>
            <DialogDescription>
              {editingTreatment ? 'עדכן את פרטי הטיפול' : 'הזן את פרטי הטיפול החדש'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="treatment_name">שם הטיפול *</Label>
              <Input
                id="treatment_name"
                value={formData.name_he}
                onChange={(e) => setFormData(prev => ({ ...prev, name_he: e.target.value }))}
                placeholder="לדוגמה: בוטוקס"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment_category">סוג טיפול</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="treatment_category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="treatment_price">מחיר (₪)</Label>
                <Input
                  id="treatment_price"
                  type="number"
                  min={0}
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatment_duration">משך (דקות)</Label>
                <Input
                  id="treatment_duration"
                  type="number"
                  min={5}
                  step={5}
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              ביטול
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? 'שומר...' : editingTreatment ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
