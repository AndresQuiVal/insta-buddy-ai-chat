
import { supabase } from '@/integrations/supabase/client';

export const syncAutoresponders = async () => {
  try {
    console.log('🔄 INICIANDO SINCRONIZACIÓN DE AUTORESPONDERS');
    
    // Obtener autoresponders desde localStorage
    const localAutoresponders = JSON.parse(localStorage.getItem('autoresponder-messages') || '[]');
    
    console.log('📋 Autoresponders en localStorage:', localAutoresponders.length);
    console.log('📊 Detalles:', localAutoresponders.map(ar => ({
      id: ar.id,
      name: ar.name,
      is_active: ar.is_active,
      message_preview: ar.message_text?.substring(0, 30) + '...'
    })));
    
    // Enviar al endpoint para almacenar en la base de datos
    console.log('📤 Enviando autoresponders al servidor (base de datos)...');
    
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
    
    console.log('✅ SINCRONIZACIÓN EXITOSA CON BASE DE DATOS');
    console.log('📊 Respuesta del servidor:', data);
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
      syncAutoresponders();
    }
  };
  
  console.log('✅ Sincronización automática configurada');
};
