
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProspectActivity {
  prospect_id: string;
  last_message_at: string;
  traits_reset_at?: string;
}

/**
 * Actualiza la última actividad de un prospecto
 */
export const updateProspectActivity = async (prospectId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('update_prospect_activity', {
      p_prospect_id: prospectId
    });

    if (error) {
      console.error('Error actualizando actividad del prospecto:', error);
      throw error;
    }

    console.log(`✅ Actividad actualizada para prospecto: ${prospectId}`);
  } catch (error) {
    console.error('Error en updateProspectActivity:', error);
  }
};

/**
 * Ejecuta el reinicio automático de características inactivas
 */
export const runAutoReset = async (): Promise<number> => {
  try {
    console.log('🔄 Ejecutando reinicio automático de características...');

    const { data: resetCount, error } = await supabase.rpc('reset_inactive_prospect_traits');

    if (error) {
      console.error('Error en reinicio automático:', error);
      throw error;
    }

    const count = resetCount || 0;
    console.log(`✅ Reinicio automático completado. ${count} prospectos reiniciados.`);

    if (count > 0) {
      toast({
        title: "Reinicio automático ejecutado",
        description: `${count} prospectos han sido reiniciados por inactividad`,
      });
    }

    return count;
  } catch (error) {
    console.error('Error ejecutando reinicio automático:', error);
    toast({
      title: "Error en reinicio automático",
      description: "No se pudo ejecutar el reinicio automático de características",
      variant: "destructive"
    });
    return 0;
  }
};

/**
 * Obtiene la configuración de horas para reinicio automático
 */
export const getAutoResetHours = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('auto_reset_hours')
      .limit(1)
      .single();

    if (error || !data) {
      console.log('⚠️ No se encontró configuración, usando valor por defecto: 48 horas');
      return 48;
    }

    return data.auto_reset_hours || 48;
  } catch (error) {
    console.error('Error obteniendo configuración de reinicio:', error);
    return 48;
  }
};

/**
 * Actualiza la configuración de horas para reinicio automático
 */
export const updateAutoResetHours = async (hours: number): Promise<void> => {
  try {
    // Primero intentar actualizar configuración existente
    const { data: existingSettings, error: selectError } = await supabase
      .from('user_settings')
      .select('id')
      .limit(1)
      .single();

    if (existingSettings) {
      // Actualizar configuración existente
      const { error } = await supabase
        .from('user_settings')
        .update({ auto_reset_hours: hours })
        .eq('id', existingSettings.id);

      if (error) throw error;
    } else {
      // Crear nueva configuración
      const { error } = await supabase
        .from('user_settings')
        .insert({ auto_reset_hours: hours });

      if (error) throw error;
    }

    console.log(`✅ Configuración de reinicio actualizada: ${hours} horas`);
    
    toast({
      title: "Configuración actualizada",
      description: `Las características se reiniciarán después de ${hours} horas de inactividad`,
    });
  } catch (error) {
    console.error('Error actualizando configuración de reinicio:', error);
    toast({
      title: "Error al guardar configuración",
      description: "No se pudo actualizar la configuración de reinicio automático",
      variant: "destructive"
    });
    throw error;
  }
};

/**
 * Obtiene estadísticas de prospectos para el reinicio automático
 */
export const getAutoResetStats = async () => {
  try {
    const resetHours = await getAutoResetHours();
    const cutoffTime = new Date(Date.now() - resetHours * 60 * 60 * 1000).toISOString();

    // Obtener prospectos que serían reiniciados
    const { data: inactiveProspects, error } = await supabase
      .from('prospect_last_activity')
      .select('prospect_id, last_message_at')
      .lt('last_message_at', cutoffTime);

    if (error) throw error;

    return {
      resetHours,
      inactiveCount: inactiveProspects?.length || 0,
      cutoffTime
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de reinicio:', error);
    return {
      resetHours: 48,
      inactiveCount: 0,
      cutoffTime: new Date().toISOString()
    };
  }
};
