
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, AlertCircle, Instagram, Plus } from 'lucide-react';
import InstagramProfileManager from './InstagramProfileManager';

const TokenManager: React.FC = () => {
  const [activeProfiles, setActiveProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveProfiles();
  }, []);

  const fetchActiveProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('instagram_profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const testProfileToken = async (profile: any) => {
    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${profile.access_token}`);
      const data = await response.json();
      
      if (data.error) {
        toast({
          title: "Token inválido",
          description: `El token de @${profile.username} ha expirado`,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Token válido",
        description: `El token de @${profile.username} funciona correctamente`,
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo verificar el token",
        variant: "destructive"
      });
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Cargando perfiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-800">Gestión de Tokens Instagram</h3>
        </div>

        {activeProfiles.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Perfiles activos con tokens configurados:
            </p>
            
            {activeProfiles.map((profile) => (
              <Card key={profile.id} className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Instagram className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">@{profile.username}</h4>
                        <p className="text-sm text-gray-600">
                          Token: ***{profile.access_token.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testProfileToken(profile)}
                      className="text-green-600 border-green-300 hover:bg-green-100"
                    >
                      Probar Token
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <h4 className="font-medium text-orange-800">
                    No hay perfiles activos
                  </h4>
                  <p className="text-sm text-orange-700">
                    Agrega al menos un perfil de Instagram para usar la aplicación
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2 text-blue-800">💡 Nuevo Sistema Multi-Usuario</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Cada usuario puede tener múltiples perfiles de Instagram</p>
            <p>• Cada perfil tiene su propio token y configuraciones</p>
            <p>• Los autoresponders están asociados a perfiles específicos</p>
            <p>• Las métricas se calculan por perfil individual</p>
          </div>
        </div>
      </div>

      <InstagramProfileManager />
    </div>
  );
};

export default TokenManager;
