import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Expense {
  id: string;
  clinic_id: string | null;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  recurring: boolean;
  recurring_interval: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'שכירות' },
  { value: 'salary', label: 'משכורות' },
  { value: 'utilities', label: 'חשמל/מים/ארנונה' },
  { value: 'supplies', label: 'ציוד רפואי' },
  { value: 'marketing', label: 'שיווק ופרסום' },
  { value: 'insurance', label: 'ביטוחים' },
  { value: 'maintenance', label: 'תחזוקה' },
  { value: 'software', label: 'תוכנות ומערכות' },
  { value: 'other', label: 'אחר' },
];

export function useExpenses(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['expenses', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      
      if (startDate) {
        query = query.gte('expense_date', startDate);
      }
      if (endDate) {
        query = query.lte('expense_date', endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
  });
}

export function useExpenseStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['expense-stats', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*');
      
      if (startDate) {
        query = query.gte('expense_date', startDate);
      }
      if (endDate) {
        query = query.lte('expense_date', endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const expenses = data as Expense[];
      const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const byCategory: Record<string, number> = {};
      
      expenses.forEach(e => {
        byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
      });
      
      return { total, byCategory, count: expenses.length };
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: { category: string; amount: number; description?: string | null; expense_date?: string; recurring?: boolean; recurring_interval?: string | null; clinic_id?: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          category: expense.category,
          amount: expense.amount,
          description: expense.description || null,
          expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
          recurring: expense.recurring || false,
          recurring_interval: expense.recurring_interval || null,
          clinic_id: expense.clinic_id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      toast({ title: 'ההוצאה נוספה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בהוספת ההוצאה', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Expense>) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      toast({ title: 'ההוצאה עודכנה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון ההוצאה', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      toast({ title: 'ההוצאה נמחקה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה במחיקת ההוצאה', description: error.message, variant: 'destructive' });
    },
  });
}
