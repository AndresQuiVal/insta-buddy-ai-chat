
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Instagram, Plus, Settings, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface InstagramProfile {
  id: string;
  instagram_user_id: string;
  username: string;
  access_token: string;
  is_active: boolean;
  nuevos_prospectos_contactados: number;
  openai_api_key?: string;
  ia_persona?: string;
  created_at: string;
}

const InstagramProfileManager: React.FC = () => {
  const [profiles, setProfiles] = useState<InstagramProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfile, setNewProfile] = useState({
    username: '',
    access_token: '',
    instagram_user_id: '',
    page_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('instagram_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los perfiles de Instagram",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${token}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      // Obtener información de Instagram
      const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token=${token}`);
      const accountsData = await accountsResponse.json();
      
      const pageWithInstagram = accountsData.data?.find((acc: any) => acc.instagram_business_account);
      
      if (!pageWithInstagram) {
        throw new Error('No se encontró cuenta de Instagram Business conectada');
      }

      return {
        isValid: true,
        instagramUserId: pageWithInstagram.instagram_business_account.id,
        pageId: pageWithInstagram.id,
        username: data.name || 'Usuario'
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Error validando token'
      };
    }
  };

  const addProfile = async () => {
    if (!newProfile.access_token.trim()) {
      toast({
        title: "Error",
        description: "El token de acceso es requerido",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔍 Validando token...');
      const validation = await validateToken(newProfile.access_token);
      
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuario no autenticado');
      }

      const profileData = {
        user_id: user.user.id,
        instagram_user_id: validation.instagramUserId!,
        username: validation.username!,
        access_token: newProfile.access_token,
        page_id: validation.pageId,
        is_active: true,
        nuevos_prospectos_contactados: 0
      };

      const { error } = await supabase
        .from('instagram_profiles')
        .insert(profileData);

      if (error) throw error;

      toast({
        title: "¡Perfil agregado!",
        description: `Perfil de @${validation.username} agregado exitosamente`,
      });

      setNewProfile({ username: '', access_token: '', instagram_user_id: '', page_id: '' });
      setShowAddForm(false);
      fetchProfiles();

    } catch (error) {
      console.error('Error adding profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error agregando perfil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProfileStatus = async (profileId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('instagram_profiles')
        .update({ is_active: !currentStatus })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Perfil ${!currentStatus ? 'activado' : 'desactivado'}`,
      });

      fetchProfiles();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del perfil",
        variant: "destructive"
      });
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (!confirm('¿Estás seguro de eliminar este perfil? Se eliminarán todos los autoresponders asociados.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('instagram_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: "Perfil eliminado",
        description: "El perfil y todos sus datos fueron eliminados",
      });

      fetchProfiles();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el perfil",
        variant: "destructive"
      });
    }
  };

  if (loading && profiles.length === 0) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Instagram className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-semibold">Perfiles de Instagram</h2>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Perfil
        </Button>
      </div>

      {/* Lista de perfiles */}
      <div className="grid gap-4">
        {profiles.map((profile) => (
          <Card key={profile.id} className="border-purple-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${profile.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <CardTitle className="text-lg">@{profile.username}</CardTitle>
                  {profile.is_active && <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleProfileStatus(profile.id, profile.is_active)}
                  >
                    {profile.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteProfile(profile.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">ID Instagram:</span>
                  <p className="font-mono">{profile.instagram_user_id}</p>
                </div>
                <div>
                  <span className="text-gray-600">Nuevos Prospectos:</span>
                  <p className="font-semibold text-purple-600">{profile.nuevos_prospectos_contactados}</p>
                </div>
                <div>
                  <span className="text-gray-600">Token:</span>
                  <p className="font-mono text-xs">***{profile.access_token.slice(-8)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Agregado:</span>
                  <p>{new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulario para agregar nuevo perfil */}
      {showAddForm && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Agregar Nuevo Perfil de Instagram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="access_token">Token de Acceso de Instagram *</Label>
              <Input
                id="access_token"
                type="password"
                placeholder="Tu token de acceso de Instagram..."
                value={newProfile.access_token}
                onChange={(e) => setNewProfile(prev => ({ ...prev, access_token: e.target.value }))}
              />
              <p className="text-sm text-gray-600 mt-1">
                Obtén tu token desde Facebook Developer Console
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={addProfile}
                disabled={loading || !newProfile.access_token.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {loading ? 'Validando...' : 'Agregar Perfil'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {profiles.length === 0 && !showAddForm && (
        <Card className="border-dashed border-purple-300 bg-purple-50">
          <CardContent className="text-center py-8">
            <Instagram className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay perfiles de Instagram
            </h3>
            <p className="text-gray-600 mb-4">
              Agrega tu primer perfil de Instagram para comenzar a usar la aplicación
            </p>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Perfil
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InstagramProfileManager;
