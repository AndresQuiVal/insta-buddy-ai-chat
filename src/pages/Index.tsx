import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InstagramDashboard, { DashboardDebugPanel } from '@/components/InstagramDashboard';
import InstagramMessages from '@/components/InstagramMessages';
import InstagramDiagnostic from '@/components/InstagramDiagnostic';
import AdvancedMetrics from '@/components/AdvancedMetrics';
import TokenManager from '@/components/TokenManager';
import { BarChart3, MessageCircle, Settings, Instagram, CheckCircle, AlertCircle, Key, Brain, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [accessToken, setAccessToken] = useState('');
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const { toast } = useToast();
  const [showDebug, setShowDebug] = useState(false);

  const handleSaveToken = () => {
    if (!accessToken.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un token válido",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('instagram_access_token', accessToken);
    setIsTokenSaved(true);
    setAccessToken('');
    
    toast({
      title: "¡Token guardado!",
      description: "Tu token de Instagram se ha configurado correctamente",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('instagram_access_token');
    setIsTokenSaved(false);
    toast({
      title: "¡Sesión cerrada!",
      description: "Tu sesión se ha cerrado correctamente",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="https://i.ibb.co/QF8zCPqs/Requerimientos-para-el-Puesto-de-Customer-Success-en-Hower-1-Experiencia-y-Conocimientos-Experiencia.png"
              alt="Logo Hower"
              className="w-12 h-12 rounded-2xl object-cover"
            />
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
              value="metrics" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <Brain className="w-4 h-4" />
              Saber tus Números
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              <MessageCircle className="w-4 h-4" />
              Mensajes
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

          <TabsContent value="metrics" className="space-y-6">
            <AdvancedMetrics />
          </TabsContent>

          <TabsContent value="messages" className="h-[600px]">
            <InstagramMessages />
          </TabsContent>

          <TabsContent value="token" className="space-y-6">
            <TokenManager />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Diagnóstico ahora está en Configuración */}
            <div className="space-y-8">
              <InstagramDiagnostic />
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowDebug(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v2H7V5a2 2 0 012-2z" /></svg>
                  Debug
                </button>
              </div>
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Configuración del Sistema</h3>
                
                <div className="space-y-6">
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
                <div className="flex justify-end mt-8">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
            <DashboardDebugPanel show={showDebug} onClose={() => setShowDebug(false)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
