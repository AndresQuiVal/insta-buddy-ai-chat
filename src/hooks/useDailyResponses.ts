import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useInstagramUsers } from './useInstagramUsers';

interface DailyResponsesData {
  today: number;
  yesterday: number;
  week: number;
  total: number;
}

export const useDailyResponses = () => {
  const [data, setData] = useState<DailyResponsesData>({
    today: 0,
    yesterday: 0,
    week: 0,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const { currentUser } = useInstagramUsers();

  const fetchDailyResponses = async () => {
    if (!currentUser?.instagram_user_id) return;
    
    console.log('🔍 [DEBUG-RESPUESTAS] Iniciando fetchDailyResponses para usuario:', currentUser.instagram_user_id);
    setLoading(true);
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);

      // Formatear fechas para PostgreSQL
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      // Respuestas de hoy
      const { data: todayData, error: todayError } = await supabase
        .from('daily_prospect_responses')
        .select('*')
        .eq('instagram_user_id', currentUser.instagram_user_id)
        .eq('response_date', formatDate(today));

      // Respuestas de ayer
      const { data: yesterdayData, error: yesterdayError } = await supabase
        .from('daily_prospect_responses')
        .select('*')
        .eq('instagram_user_id', currentUser.instagram_user_id)
        .eq('response_date', formatDate(yesterday));

      // Respuestas de la semana
      const { data: weekData, error: weekError } = await supabase
        .from('daily_prospect_responses')
        .select('*')
        .eq('instagram_user_id', currentUser.instagram_user_id)
        .gte('response_date', formatDate(weekAgo));

      // Total de respuestas
      const { data: totalData, error: totalError } = await supabase
        .from('daily_prospect_responses')
        .select('*')
        .eq('instagram_user_id', currentUser.instagram_user_id);

      if (todayError) console.error('Error fetching today responses:', todayError);
      if (yesterdayError) console.error('Error fetching yesterday responses:', yesterdayError);
      if (weekError) console.error('Error fetching week responses:', weekError);
      if (totalError) console.error('Error fetching total responses:', totalError);

      const newData = {
        today: todayData?.length || 0,
        yesterday: yesterdayData?.length || 0,
        week: weekData?.length || 0,
        total: totalData?.length || 0
      };

      console.log('📊 [DEBUG-RESPUESTAS] Datos calculados:', newData);
      console.log('📊 [DEBUG-RESPUESTAS] Respuestas de hoy (raw):', todayData);

      setData(newData);

    } catch (error) {
      console.error('Error fetching daily responses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyResponses();
    
    // Suscripción en tiempo real - MONITOREAR TODOS LOS EVENTOS PARA DEBUG
    const subscription = supabase
      .channel('daily-responses-updates')
      .on('postgres_changes', {
        event: '*', // TEMPORALMENTE escuchar TODO para debug
        schema: 'public',
        table: 'daily_prospect_responses'
      }, (payload) => {
        console.log('🚨 [DEBUG-RESPUESTAS] EVENTO EN daily_prospect_responses:', {
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
          usuario_afectado: (payload.new as any)?.instagram_user_id || (payload.old as any)?.instagram_user_id,
          usuario_actual: currentUser?.instagram_user_id
        });
        
        // Solo recargar si es nuestro usuario
        if (((payload.new as any)?.instagram_user_id === currentUser?.instagram_user_id) || 
            ((payload.old as any)?.instagram_user_id === currentUser?.instagram_user_id)) {
          console.log('🔄 [DEBUG-RESPUESTAS] Evento afecta a nuestro usuario - recargando...');
          fetchDailyResponses();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser?.instagram_user_id]);

  return { data, loading, refetch: fetchDailyResponses };
};