
import { supabase } from '@/integrations/supabase/client';

export const syncAutoresponders = async () => {
  try {
    console.log('🔄 Sincronizando autoresponders con servidor...');
    
    // Obtener autoresponders desde localStorage
    const localAutoresponders = JSON.parse(localStorage.getItem('autoresponder-messages') || '[]');
    
    console.log('📋 Autoresponders en localStorage:', localAutoresponders.length);
    
    // Enviar al endpoint para almacenar en el servidor
    const { data, error } = await supabase.functions.invoke('get-autoresponders', {
      body: { 
        action: 'store',
        autoresponders: localAutoresponders 
      }
    });
    
    if (error) {
      console.error('❌ Error sincronizando:', error);
      return false;
    }
    
    console.log('✅ Autoresponders sincronizados con servidor:', data);
    return true;
    
  } catch (error) {
    console.error('❌ Error en syncAutoresponders:', error);
    return false;
  }
};

// Sincronizar automáticamente cada vez que se modifica localStorage
export const setupAutoSync = () => {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key: string, value: string) {
    originalSetItem.call(this, key, value);
    if (key === 'autoresponder-messages') {
      console.log('📡 localStorage modificado, sincronizando con servidor...');
      syncAutoresponders();
    }
  };
};
