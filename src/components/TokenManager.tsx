
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { Key, CheckCircle, Instagram } from 'lucide-react';

const TokenManager: React.FC = () => {
  const { currentUser, loading } = useInstagramUsers();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Cargando usuario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-800">Usuario Instagram Autenticado</h3>
        </div>

        {currentUser ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      @{currentUser.username}
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </h4>
                    <p className="text-sm text-gray-600">
                      Usuario ID: {currentUser.instagram_user_id}
                    </p>
                    <p className="text-sm text-gray-600">
                      Nuevos prospectos: {currentUser.nuevos_prospectos_contactados}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-orange-600" />
                <div>
                  <h4 className="font-medium text-orange-800">
                    No hay usuario autenticado
                  </h4>
                  <p className="text-sm text-orange-700">
                    Necesitas autenticarte con Instagram para usar la aplicación
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2 text-blue-800">✅ Sistema Simplificado</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Un usuario por sesión autenticado con Instagram</p>
            <p>• Los autoresponders están asociados al usuario autenticado</p>
            <p>• Las métricas se calculan para el usuario actual</p>
            <p>• Sistema simple y directo sin complicaciones multi-perfil</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenManager;
