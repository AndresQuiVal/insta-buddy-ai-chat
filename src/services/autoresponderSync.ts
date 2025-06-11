
import { supabase } from '@/integrations/supabase/client';

export const syncAutoresponders = async () => {
  try {
    console.log('🔄 INICIANDO SINCRONIZACIÓN DE AUTORESPONDERS');
    
    // Obtener autoresponders desde localStorage
    const localAutoresponders = JSON.parse(localStorage.getItem('autoresponder-messages') || '[]');
    
    console.log('📋 Autoresponders en localStorage:', localAutoresponders.length);
    console.log('📊 Detalles completos:', localAutoresponders.map(ar => ({
      id: ar.id,
      name: ar.name,
      is_active: ar.is_active,
      send_only_first_message: ar.send_only_first_message,
      message_text: ar.message_text
    })));
    
    // Enviar al endpoint para REEMPLAZAR completamente en la base de datos
    console.log('📤 Enviando autoresponders al servidor para REEMPLAZAR en BD...');
    
    const { data, error } = await supabase.functions.invoke('get-autoresponders', {
      body: { 
        action: 'store',
        autoresponders: localAutoresponders 
      }
    });
    
    if (error) {
      console.error('❌ Error sincronizando con servidor:', error);
      return false;
    }
    
    console.log('✅ SINCRONIZACIÓN EXITOSA - BASE DE DATOS ACTUALIZADA');
    console.log('📊 Respuesta del servidor:', data);
    
    // Verificar que se almacenó correctamente
    if (data?.action === 'stored') {
      console.log('🎯 Confirmado: Autoresponders almacenados correctamente');
      console.log('📈 Cantidad sincronizada:', data.count);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error crítico en syncAutoresponders:', error);
    return false;
  }
};

// Sincronizar automáticamente cada vez que se modifica localStorage
export const setupAutoSync = () => {
  console.log('🔧 Configurando sincronización automática');
  
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key: string, value: string) {
    originalSetItem.call(this, key, value);
    if (key === 'autoresponder-messages') {
      console.log('📡 localStorage modificado para autoresponders - Sincronizando...');
      // Sincronizar después de un pequeño delay para asegurar que se guardó
      setTimeout(() => {
        syncAutoresponders();
      }, 100);
    }
  };
  
  console.log('✅ Sincronización automática configurada');
};
