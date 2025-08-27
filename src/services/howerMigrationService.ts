import { supabase } from '@/integrations/supabase/client';
import HowerService from './howerService';

export class HowerMigrationService {
  /**
   * Migra las credenciales de Hower desde localStorage a la base de datos
   * Para usuarios que ya tienen credenciales guardadas localmente
   */
  static async migrateExistingCredentials(): Promise<{ success: boolean; message: string; migrated: number }> {
    try {
      // Verificar si hay credenciales en localStorage
      const credentials = HowerService.getStoredCredentials();
      if (!credentials) {
        return {
          success: false,
          message: 'No hay credenciales de Hower en localStorage',
          migrated: 0
        };
      }

      // Verificar si hay usuario de Instagram logueado
      const instagramUserData = localStorage.getItem('hower-instagram-user');
      if (!instagramUserData) {
        return {
          success: false,
          message: 'No hay usuario de Instagram logueado',
          migrated: 0
        };
      }

      const userData = JSON.parse(instagramUserData);
      const instagramUserId = userData.instagram?.id || userData.facebook?.id;
      
      if (!instagramUserId) {
        return {
          success: false,
          message: 'No se pudo obtener el ID de Instagram del usuario',
          migrated: 0
        };
      }

      // Verificar si las credenciales ya están en la DB
      const { data: existingUser, error: checkError } = await supabase
        .from('instagram_users')
        .select('hower_username, hower_token')
        .eq('instagram_user_id', instagramUserId)
        .single();

      if (checkError) {
        console.error('Error checking existing credentials:', checkError);
        return {
          success: false,
          message: 'Error verificando credenciales existentes',
          migrated: 0
        };
      }

      // Si ya tiene credenciales en DB, no hacer nada
      if (existingUser?.hower_username && existingUser?.hower_token) {
        return {
          success: true,
          message: 'Las credenciales ya están migradas en la base de datos',
          migrated: 0
        };
      }

      // Migrar credenciales a la DB
      const { error: updateError } = await supabase
        .from('instagram_users')
        .update({
          hower_username: credentials.hower_username,
          hower_token: credentials.hower_token
        })
        .eq('instagram_user_id', instagramUserId);

      if (updateError) {
        console.error('Error migrating credentials:', updateError);
        return {
          success: false,
          message: 'Error guardando credenciales en la base de datos',
          migrated: 0
        };
      }

      console.log('✅ Credenciales migradas exitosamente para usuario:', instagramUserId);
      
      return {
        success: true,
        message: 'Credenciales migradas exitosamente a la base de datos',
        migrated: 1
      };

    } catch (error) {
      console.error('Error in migration:', error);
      return {
        success: false,
        message: 'Error inesperado durante la migración',
        migrated: 0
      };
    }
  }

  /**
   * Verifica si las credenciales están sincronizadas entre localStorage y DB
   */
  static async checkCredentialsSync(): Promise<{ synced: boolean; hasLocal: boolean; hasDB: boolean }> {
    try {
      const localCredentials = HowerService.getStoredCredentials();
      const instagramUserData = localStorage.getItem('hower-instagram-user');

      if (!instagramUserData) {
        return { synced: false, hasLocal: !!localCredentials, hasDB: false };
      }

      const userData = JSON.parse(instagramUserData);
      const instagramUserId = userData.instagram?.id || userData.facebook?.id;

      if (!instagramUserId) {
        return { synced: false, hasLocal: !!localCredentials, hasDB: false };
      }

      const { data: dbCredentials } = await supabase
        .from('instagram_users')
        .select('hower_username, hower_token')
        .eq('instagram_user_id', instagramUserId)
        .single();

      const hasLocal = !!localCredentials;
      const hasDB = !!(dbCredentials?.hower_username && dbCredentials?.hower_token);
      const synced = hasLocal && hasDB && 
        localCredentials?.hower_username === dbCredentials?.hower_username &&
        localCredentials?.hower_token === dbCredentials?.hower_token;

      return { synced, hasLocal, hasDB };

    } catch (error) {
      console.error('Error checking credentials sync:', error);
      return { synced: false, hasLocal: false, hasDB: false };
    }
  }
}

export default HowerMigrationService;