
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AutoresponderDebug: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [autoresponders, setAutoresponders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkUserAutoresponders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Buscando usuario: qroz.fitness');
      
      // Buscar usuario por username
      const { data: user, error: userError } = await supabase
        .from('instagram_users')
        .select('*')
        .eq('username', 'qroz.fitness')
        .single();

      if (userError) {
        console.error('❌ Error buscando usuario:', userError);
        setError(`Error buscando usuario: ${userError.message}`);
        return;
      }

      if (!user) {
        setError('Usuario qroz.fitness no encontrado');
        return;
      }

      console.log('✅ Usuario encontrado:', user);
      setUserData(user);

      // Buscar autoresponders del usuario
      console.log('🔍 Buscando autoresponders para instagram_user_id:', user.instagram_user_id);
      
      const { data: userAutoresponders, error: autoresponderError } = await supabase
        .from('autoresponder_messages')
        .select('*')
        .eq('instagram_user_id_ref', user.instagram_user_id)
        .order('created_at', { ascending: false });

      if (autoresponderError) {
        console.error('❌ Error buscando autoresponders:', autoresponderError);
        setError(`Error buscando autoresponders: ${autoresponderError.message}`);
        return;
      }

      console.log('✅ Autoresponders encontrados:', userAutoresponders);
      setAutoresponders(userAutoresponders || []);

    } catch (err) {
      console.error('💥 Error general:', err);
      setError(`Error general: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserAutoresponders();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug: Autoresponders de qroz.fitness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkUserAutoresponders} disabled={loading}>
            {loading ? 'Consultando...' : 'Recargar'}
          </Button>

          {error && (
            <div className="p-4 bg-red-100 border border-red-300 rounded text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {userData && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Datos del Usuario:</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p><strong>ID:</strong> {userData.id}</p>
                <p><strong>Username:</strong> {userData.username}</p>
                <p><strong>Instagram User ID:</strong> {userData.instagram_user_id}</p>
                <p><strong>Is Active:</strong> {userData.is_active ? 'Sí' : 'No'}</p>
                <p><strong>Created:</strong> {new Date(userData.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Autoresponders Configurados: {autoresponders.length}
            </h3>
            
            {autoresponders.length === 0 ? (
              <div className="p-4 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
                <strong>⚠️ No hay autoresponders configurados para este usuario</strong>
              </div>
            ) : (
              <div className="space-y-4">
                {autoresponders.map((autoresponder, index) => (
                  <Card key={autoresponder.id} className="border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-blue-600">#{index + 1}</span>
                        {autoresponder.name}
                        <span className={`px-2 py-1 rounded text-xs ${
                          autoresponder.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {autoresponder.is_active ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div>
                        <strong>Mensaje:</strong>
                        <div className="bg-gray-50 p-2 rounded mt-1">
                          {autoresponder.message_text}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <strong>Solo primer mensaje:</strong> {autoresponder.send_only_first_message ? 'Sí' : 'No'}
                        </div>
                        <div>
                          <strong>Usa palabras clave:</strong> {autoresponder.use_keywords ? 'Sí' : 'No'}
                        </div>
                        <div>
                          <strong>Instagram User ID Ref:</strong> {autoresponder.instagram_user_id_ref || 'No asignado'}
                        </div>
                        <div>
                          <strong>Creado:</strong> {new Date(autoresponder.created_at).toLocaleString()}
                        </div>
                      </div>

                      {autoresponder.use_keywords && autoresponder.keywords && (
                        <div>
                          <strong>Palabras clave:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {autoresponder.keywords.map((keyword, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoresponderDebug;
