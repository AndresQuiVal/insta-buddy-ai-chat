
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InstagramDashboard from '@/components/InstagramDashboard';
import InstagramMessages from '@/components/InstagramMessages';
import InstagramDebug from '@/components/InstagramDebug';
import TokenManager from '@/components/TokenManager';
import { BarChart3, MessageCircle, Settings, Instagram, CheckCircle, AlertCircle, Bug, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [accessToken, setAccessToken] = useState('');
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const { toast } = useToast();

  const handleSaveToken = () => {
    if (!accessToken.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un token válido",
        variant: "destructive"
      });
      return;
    }

    // Simular guardado del token
    localStorage.setItem('instagram_access_token', accessToken);
    setIsTokenSaved(true);
    setAccessToken('');
    
    toast({
      title: "¡Token guardado!",
      description: "Tu token de Instagram se ha configurado correctamente",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Hower Assistant
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Sistema inteligente de respuestas automáticas para Instagram con IA integrada
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-white/90 backdrop-blur-lg border border-purple-100 shadow-lg">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <MessageCircle className="w-4 h-4" />
              Mensajes
            </TabsTrigger>
            <TabsTrigger 
              value="debug" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <Bug className="w-4 h-4" />
              Debug
            </TabsTrigger>
            <TabsTrigger 
              value="token" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <Key className="w-4 h-4" />
              Token
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <Settings className="w-4 h-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <InstagramDashboard />
          </TabsContent>

          <TabsContent value="messages" className="h-[600px]">
            <InstagramMessages />
          </TabsContent>

          <TabsContent value="debug" className="space-y-6">
            <InstagramDebug />
          </TabsContent>

          <TabsContent value="token" className="space-y-6">
            <TokenManager />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Configuración del Sistema</h3>
              
              <div className="space-y-6">
                {/* Token Configuration Section */}
                <div className="border-b border-gray-200 pb-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">Token de Acceso de Instagram</h4>
                  
                  {isTokenSaved || localStorage.getItem('instagram_access_token') ? (
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-800 font-medium">Token de Instagram Configurado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-600 text-sm">Activo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        <span className="text-yellow-800 font-medium">Token de Instagram Requerido</span>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="accessToken" className="text-sm font-medium">
                          Pega tu token de Instagram aquí:
                        </Label>
                        <div className="flex gap-3">
                          <Input
                            id="accessToken"
                            type="password"
                            placeholder="EAA... (pega tu token aquí)"
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            onClick={handleSaveToken}
                            disabled={!accessToken.trim()}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          >
                            Guardar Token
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600">
                          Copia tu token desde Meta Graph API Explorer y pégalo arriba
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-3">Estado de la Integración</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-green-800 font-medium">Webhook Instagram</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-600 text-sm">Activo</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-green-800 font-medium">Base de Datos</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-600 text-sm">Conectada</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-3">Configuración del Webhook</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-medium text-blue-800 mb-2">Webhook URL</h5>
                      <p className="text-sm text-blue-700 mb-2">
                        Configura esta URL en Facebook Developers:
                      </p>
                      <code className="bg-blue-100 px-3 py-2 rounded text-xs text-blue-800 block">
                        https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/instagram-webhook
                      </code>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-3">Próximos Pasos</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isTokenSaved || localStorage.getItem('instagram_access_token') ? 'bg-green-500' : 'bg-purple-500'}`}></div>
                      <span className={`text-sm ${isTokenSaved || localStorage.getItem('instagram_access_token') ? 'text-green-600 line-through' : 'text-gray-600'}`}>
                        Agregar token de acceso de Instagram
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600 text-sm">Configurar webhook en Facebook Developers</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600 text-sm">Verificar permisos de la aplicación</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
