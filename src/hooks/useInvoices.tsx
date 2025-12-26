import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string | null;
  appointment_id: string | null;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  currency: string;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  payment_link: string | null;
  insurance_claim_status: string | null;
  insurance_claim_amount: number | null;
  created_at: string;
  updated_at: string;
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  invoice_items?: InvoiceItem[];
}

export interface InvoiceInput {
  patient_id: string;
  appointment_id?: string;
  due_date?: string;
  notes?: string;
  payment_link?: string;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
  }[];
}

// Generate unique invoice number
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true });
  
  const nextNumber = (count || 0) + 1;
  return `INV-${year}-${String(nextNumber).padStart(5, '0')}`;
}

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          patients(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Invoice[];
    },
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          patients(id, first_name, last_name),
          invoice_items(*)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Invoice | null;
    },
    enabled: !!id,
  });
}

export function usePatientInvoices(patientId: string | undefined) {
  return useQuery({
    queryKey: ['invoices', 'patient', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!patientId,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: InvoiceInput) => {
      const invoice_number = await generateInvoiceNumber();
      
      // Calculate totals
      const subtotal = input.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const tax_rate = 18;
      const tax_amount = subtotal * (tax_rate / 100);
      const total = subtotal + tax_amount;
      
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number,
          patient_id: input.patient_id,
          appointment_id: input.appointment_id,
          due_date: input.due_date,
          notes: input.notes,
          payment_link: input.payment_link,
          subtotal,
          tax_rate,
          tax_amount,
          total,
        })
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;
      
      // Create invoice items
      const items = input.items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items);
      
      if (itemsError) throw itemsError;
      
      return invoice as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'חשבונית נוצרה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });
}

export interface InvoiceUpdateInput {
  notes?: string;
  due_date?: string | null;
  payment_link?: string | null;
  items: {
    id?: string;
    description: string;
    quantity: number;
    unit_price: number;
  }[];
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: InvoiceUpdateInput }) => {
      // Calculate totals
      const subtotal = input.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const tax_rate = 18;
      const tax_amount = subtotal * (tax_rate / 100);
      const total = subtotal + tax_amount;
      
      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          notes: input.notes,
          due_date: input.due_date,
          payment_link: input.payment_link,
          subtotal,
          tax_rate,
          tax_amount,
          total,
        })
        .eq('id', id);
      
      if (invoiceError) throw invoiceError;
      
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);
      
      if (deleteError) throw deleteError;
      
      // Create new invoice items
      const items = input.items.map(item => ({
        invoice_id: id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items);
      
      if (itemsError) throw itemsError;
      
      return { id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.id] });
      toast({ title: 'החשבונית עודכנה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בעדכון החשבונית', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, amount_paid }: { id: string; status: string; amount_paid?: number }) => {
      const updateData: Record<string, unknown> = { status };
      if (amount_paid !== undefined) {
        updateData.amount_paid = amount_paid;
      }
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.id] });
      toast({ title: 'סטטוס החשבונית עודכן' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: ['invoices', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('status, total, amount_paid');
      
      if (error) throw error;
      
      const stats = {
        total: data.reduce((sum, inv) => sum + Number(inv.total), 0),
        paid: data.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total), 0),
        pending: data.filter(inv => ['draft', 'sent'].includes(inv.status)).reduce((sum, inv) => sum + Number(inv.total), 0),
        overdue: data.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + Number(inv.total), 0),
        count: data.length,
        paidCount: data.filter(inv => inv.status === 'paid').length,
        pendingCount: data.filter(inv => ['draft', 'sent'].includes(inv.status)).length,
      };
      
      return stats;
    },
  });
}
