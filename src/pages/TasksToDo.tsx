import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { useNavigate } from 'react-router-dom';

const TasksToDo: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useInstagramUsers();
  const [debugInfo, setDebugInfo] = useState<string>('Inicializando...');

  // Debug persistente para monitorear el estado
  useEffect(() => {
    const info = `
Estado: ${new Date().toLocaleTimeString()}
userLoading: ${userLoading}
currentUser: ${currentUser ? 'SI' : 'NO'}
currentUser.id: ${currentUser?.instagram_user_id || 'N/A'}
window.innerWidth: ${window.innerWidth}
navigator.userAgent: ${navigator.userAgent.includes('Mobile') ? 'MOBILE' : 'DESKTOP'}
    `.trim();
    
    setDebugInfo(info);
    
    console.log('🔍 [SIMPLE-DEBUG]', {
      userLoading,
      currentUser: currentUser ? currentUser.instagram_user_id : 'null',
      isMobile: window.innerWidth < 768,
      timestamp: new Date().toISOString()
    });
  }, [currentUser, userLoading]);

  // Solo mostrar mensajes informativos, sin redirects
  useEffect(() => {
    if (!userLoading && !currentUser) {
      console.log('ℹ️ No hay usuario autenticado - mostrando mensaje');
      toast({
        title: "Información",
        description: "Necesitas conectar tu cuenta de Instagram",
        variant: "default"
      });
    }
  }, [currentUser, userLoading, toast]);

  // SEO simple
  useEffect(() => {
    document.title = 'Tareas Simples | Hower';
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    navigate('/');
  };

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Cargando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header simple */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleGoBack}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Tareas Simples</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        
        {/* Debug Box - Siempre visible */}
        <Card className="border-2 border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle>🔍 Debug Info (Versión Simple)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-white p-3 rounded border overflow-auto">
              {debugInfo}
            </pre>
          </CardContent>
        </Card>

        {/* Estado del usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Estado de Autenticación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!currentUser ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No hay usuario conectado
                </p>
                <Button onClick={handleGoBack}>
                  Ir a Inicio para Conectar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-green-600 font-medium">
                  ✅ Usuario conectado
                </p>
                <p className="text-sm text-muted-foreground">
                  ID: {currentUser.instagram_user_id}
                </p>
                <p className="text-sm text-muted-foreground">
                  Username: {currentUser.username}
                </p>
                <p className="text-sm text-muted-foreground">
                  Activo: {currentUser.is_active ? 'Sí' : 'No'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Dispositivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Ancho de pantalla:</strong> {window.innerWidth}px
              </div>
              <div>
                <strong>Tipo:</strong> {window.innerWidth < 768 ? 'Móvil' : 'Desktop'}
              </div>
              <div className="md:col-span-2">
                <strong>User Agent:</strong> 
                <br />
                <span className="text-xs break-all">
                  {navigator.userAgent}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test de funcionalidad básica */}
        <Card>
          <CardHeader>
            <CardTitle>Test de Funcionalidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Si puedes ver esta sección, la renderización básica funciona.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" size="sm">
                  Test Button 1
                </Button>
                <Button variant="secondary" size="sm">
                  Test Button 2
                </Button>
                <Button variant="default" size="sm">
                  Test Button 3
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default TasksToDo;