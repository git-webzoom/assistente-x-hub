import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export const useRecentActivity = () => {
  const { user } = useAuth();

  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ['recent-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get user's tenant_id
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, name')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return [];

      const tenantId = userData.tenant_id;

      // Fetch recent contacts (last 10)
      const { data: recentContacts } = await supabase
        .from('contacts')
        .select('name, created_at, created_by')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent tasks completed
      const { data: recentTasks } = await supabase
        .from('tasks')
        .select('title, updated_at, assigned_to')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(10);

      // Fetch recent appointments
      const { data: recentAppointments } = await supabase
        .from('appointments')
        .select('title, created_at, created_by')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Combine and format activities
      const allActivities = [
        ...(recentContacts?.map(c => ({
          action: 'Novo contato adicionado',
          user: c.name,
          time: getRelativeTime(c.created_at),
          timestamp: new Date(c.created_at).getTime()
        })) || []),
        ...(recentTasks?.map(t => ({
          action: 'Tarefa concluída',
          user: t.title,
          time: getRelativeTime(t.updated_at),
          timestamp: new Date(t.updated_at).getTime()
        })) || []),
        ...(recentAppointments?.map(a => ({
          action: 'Compromisso agendado',
          user: a.title,
          time: getRelativeTime(a.created_at),
          timestamp: new Date(a.created_at).getTime()
        })) || [])
      ];

      // Sort by timestamp and take top 5
      return allActivities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
    },
    enabled: !!user?.id,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'contacts' },
        () => refetch()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => refetch()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  return { activities: activities || [], isLoading };
};

// Helper function to format relative time
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'há poucos segundos';
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} hora${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''}`;
  return `há ${Math.floor(diffInSeconds / 86400)} dia${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''}`;
};
