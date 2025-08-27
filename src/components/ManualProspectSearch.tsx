import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2 } from 'lucide-react';
import HowerService from '@/services/howerService';

interface ManualProspectSearchProps {
  instagramUserId: string;
  onSearchComplete: () => void;
}

const ManualProspectSearch: React.FC<ManualProspectSearchProps> = ({ 
  instagramUserId, 
  onSearchComplete 
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleManualSearch = async () => {
    setIsSearching(true);
    
    try {
      console.log('🔍 Iniciando búsqueda manual de prospectos...');
      
      // Obtener credenciales de Hower desde localStorage
      const credentials = HowerService.getStoredCredentials();
      
      console.log('🔑 Estado de credenciales:', {
        hasCredentials: !!credentials,
        username: credentials?.hower_username || 'NO FOUND',
        hasToken: !!credentials?.hower_token
      });
      
      // Si no hay credenciales, usar credenciales de prueba hardcodeadas
      const searchCredentials = credentials || {
        hower_username: "andresquival",
        hower_token: "testhower"
      };

      console.log('🔍 Usando credenciales:', {
        username: searchCredentials.hower_username,
        hasToken: !!searchCredentials.hower_token
      });

      // Llamar a la función search-prospects con las credenciales
      const { data, error } = await supabase.functions.invoke('search-prospects', {
        body: { 
          instagramUserId,
          howerUsername: searchCredentials.hower_username,
          howerToken: searchCredentials.hower_token
        }
      });

      if (error) {
        console.error('❌ Error en búsqueda de prospectos:', error);
        toast({
          title: "❌ Error en búsqueda",
          description: "No se pudieron buscar nuevos prospectos. Verifica tu conexión.",
          variant: "destructive"
        });
        return;
      }

      if (data?.success) {
        console.log('✅ Búsqueda completada:', data);
        toast({
          title: "✅ Búsqueda completada",
          description: `Se encontraron ${data.results?.total || 0} prospectos nuevos`,
        });
        onSearchComplete();
      } else if (data?.hasICP === false) {
        toast({
          title: "⚠️ ICP incompleto",
          description: "Completa tu Perfil de Cliente Ideal para buscar prospectos",
          variant: "destructive"
        });
      } else {
        toast({
          title: "⚠️ Sin resultados",
          description: "No se encontraron nuevos prospectos en esta búsqueda",
        });
      }

    } catch (error) {
      console.error('❌ Error general en búsqueda:', error);
      toast({
        title: "❌ Error",
        description: "Error inesperado al buscar prospectos",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Button 
      onClick={handleManualSearch}
      disabled={isSearching}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {isSearching ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Search className="w-4 h-4" />
      )}
      {isSearching ? 'Buscando...' : 'Buscar Prospectos'}
    </Button>
  );
};

export default ManualProspectSearch;