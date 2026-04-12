import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface WorkSession {
  id: string;
  user_id: string;
  clinic_id: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: "auto" | "edited" | "approved";
  created_at: string;
  updated_at: string;
}

export const useWorkSessions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const todaySession = useQuery({
    queryKey: ["work-session-today", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("work_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data as WorkSession | null;
    },
    enabled: !!user?.id,
  });

  const allSessions = useQuery({
    queryKey: ["work-sessions-all"],
    queryFn: async () => {
      // Fetch work sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("work_sessions")
        .select("*")
        .order("date", { ascending: false })
        .order("start_time", { ascending: false });
      
      if (sessionsError) throw sessionsError;
      if (!sessions?.length) return [];
      
      // Get unique user IDs
      const userIds = [...new Set(sessions.map(s => s.user_id))];
      
      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);
      
      if (profilesError) throw profilesError;
      
      // Create a map for quick lookup
      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );
      
      // Merge sessions with profiles
      return sessions.map(s => ({
        ...s,
        profiles: profileMap.get(s.user_id) || null,
      }));
    },
  });

  const clockIn = useMutation({
    mutationFn: async (clinicId?: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toTimeString().split(" ")[0];
      
      // Check if a session already exists for today
      const { data: existingSession } = await supabase
        .from("work_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();
      
      // If session exists with end_time (closed), reopen it
      if (existingSession) {
        if (existingSession.end_time === null) {
          // Already working - throw specific error
          throw new Error("ALREADY_WORKING");
        }
        // Reopen the closed session
        const { data, error } = await supabase
          .from("work_sessions")
          .update({ 
            start_time: now, 
            end_time: null,
            status: "auto" 
          })
          .eq("id", existingSession.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      
      // No session exists - create new one
      const { data, error } = await supabase
        .from("work_sessions")
        .insert({
          user_id: user.id,
          clinic_id: clinicId || null,
          date: today,
          start_time: now,
          status: "auto",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-session-today"] });
      queryClient.invalidateQueries({ queryKey: ["work-sessions-all"] });
    },
  });

  const clockOut = useMutation({
    mutationFn: async (sessionId: string) => {
      const now = new Date().toTimeString().split(" ")[0];
      const { data, error } = await supabase
        .from("work_sessions")
        .update({ end_time: now })
        .eq("id", sessionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-session-today"] });
      queryClient.invalidateQueries({ queryKey: ["work-sessions-all"] });
    },
  });

  const updateSession = useMutation({
    mutationFn: async ({
      sessionId,
      start_time,
      end_time,
    }: {
      sessionId: string;
      start_time: string;
      end_time: string;
    }) => {
      const { data, error } = await supabase
        .from("work_sessions")
        .update({ start_time, end_time, status: "edited" })
        .eq("id", sessionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-session-today"] });
      queryClient.invalidateQueries({ queryKey: ["work-sessions-all"] });
    },
  });

  const approveSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from("work_sessions")
        .update({ status: "approved" })
        .eq("id", sessionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-sessions-all"] });
    },
  });

  return {
    todaySession,
    allSessions,
    clockIn,
    clockOut,
    updateSession,
    approveSession,
  };
};

export const calculateHours = (start: string | null, end: string | null): string => {
  if (!start || !end) return "-";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMinutes < 0) return "-";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};
