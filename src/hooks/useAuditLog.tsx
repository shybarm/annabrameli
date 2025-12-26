import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  table_name: string | null;
  action: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  ip_address: string | null;
  user_email?: string;
  user_name?: string;
}

interface AuditLogFilters {
  tableName?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export function useAuditLog(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ['audit-log', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters.tableName) {
        query = query.eq('table_name', filters.tableName);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLogEntry[];
    }
  });
}

export function useAuditLogTables() {
  return useQuery({
    queryKey: ['audit-log-tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('table_name')
        .not('table_name', 'is', null);

      if (error) throw error;
      
      const uniqueTables = [...new Set(data.map(d => d.table_name))].filter(Boolean) as string[];
      return uniqueTables.sort();
    }
  });
}
