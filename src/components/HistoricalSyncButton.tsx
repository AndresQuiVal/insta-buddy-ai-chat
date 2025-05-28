
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Download, CheckCircle, Clock, Instagram, Wifi } from 'lucide-react';
import { syncHistoricalConversations, checkSyncPermissions } from '@/services/instagramMessagingSync';
import { Alert, AlertDescription } from '@/components/ui/alert';

const HistoricalSyncButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleCheckPermissions = async () => {
    setIsChecking(true);
    setPermissionStatus(null);
    
    const accessToken = localStorage.getItem('hower-instagram-token');
    if (!accessToken) {
      setPermissionStatus({
        hasAllPermissions: false,
        error: 'No hay token de acceso. Conecta tu cuenta de Instagram primero.'
      });
      setIsChecking(false);
      return;
    }

    console.log('Verificando permisos con token...');
    const result = await checkSyncPermissions(accessToken);
    console.log('Resultado de verificación:', result);
    setPermissionStatus(result);
    setIsChecking(false);
  };

  const handleStartSync = async () => {
    if (!permissionStatus?.hasAllPermissions) return;

    setIsSyncing(true);
    setSyncProgress(0);

    const accessToken = localStorage.getItem('hower-instagram-token')!;
    
    // Simular progreso (la API no proporciona progreso real)
    const progressInterval = setInterval(() => {
      setSyncProgress(prev => Math.min(prev + 10, 90));
    }, 1000);

    const result = await syncHistoricalConversations(accessToken);
    
    clearInterval(progressInterval);
    setSyncProgress(100);
    setSyncResult(result);
    setIsSyncing(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setPermissionStatus(null);
    setSyncResult(null);
    setSyncProgress(0);
  };

  const handleOpenDialog = () => {
    setIsOpen(true);
    // Verificar permisos automáticamente al abrir
    setTimeout(() => {
      handleCheckPermissions();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleOpenDialog}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Sincronizar Historial
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sincronizar Conversaciones Históricas</DialogTitle>
          <DialogDescription>
            Importa conversaciones pasadas desde Instagram Messaging API
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estado de verificación de permisos */}
          {isChecking && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Wifi className="w-5 h-5 text-blue-500 animate-pulse" />
              <span className="text-blue-700">Verificando conexión y permisos...</span>
            </div>
          )}

          {/* Resultados de permisos */}
          {permissionStatus && !isChecking && (
            <div className="space-y-3">
              {permissionStatus.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error de conexión:</strong><br />
                    {permissionStatus.error}
                    <br /><br />
                    <em>Soluciones posibles:</em>
                    <ul className="mt-2 ml-4 text-sm">
                      <li>• Reconecta tu cuenta de Instagram</li>
                      <li>• Verifica que tengas una cuenta Business</li>
                      <li>• Asegúrate de tener conexión a internet</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : permissionStatus.hasAllPermissions ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Conexión verificada correctamente.
                    <br />
                    📱 Instagram Business: {permissionStatus.hasInstagramBusiness ? 'Conectado' : 'No encontrado'}
                    <br />
                    🔑 Permisos: {permissionStatus.permissions?.length || 0} activos
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <Instagram className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Configuración incompleta:</strong><br />
                    {!permissionStatus.hasInstagramBusiness && '• No hay cuenta de Instagram Business conectada'}
                    {permissionStatus.missingPermissions?.length > 0 && (
                      <>
                        <br />• Faltan permisos: {permissionStatus.missingPermissions.join(', ')}
                      </>
                    )}
                    <br /><br />
                    <em>Para solucionarlo:</em>
                    <ul className="mt-2 ml-4 text-sm">
                      <li>• Ve a Facebook Business Manager</li>
                      <li>• Conecta una cuenta de Instagram Business</li>
                      <li>• Otorga permisos de mensajería</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {permissionStatus.hasAllPermissions && !isSyncing && !syncResult && (
                <div className="space-y-3">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800 font-medium mb-2">
                      ✅ Listo para sincronizar
                    </p>
                    <p className="text-sm text-green-700">
                      Esta función importará:
                    </p>
                    <ul className="text-sm text-green-700 space-y-1 ml-4 mt-1">
                      <li>• Conversaciones recientes disponibles</li>
                      <li>• Mensajes donde tu cuenta participó</li>
                      <li>• Datos organizados por cliente</li>
                    </ul>
                  </div>
                  
                  <Button 
                    onClick={handleStartSync}
                    className="w-full"
                    disabled={isSyncing}
                  >
                    Iniciar Sincronización
                  </Button>
                </div>
              )}

              {!permissionStatus.hasAllPermissions && !permissionStatus.error && (
                <Button 
                  onClick={handleCheckPermissions}
                  variant="outline"
                  className="w-full"
                >
                  Verificar Nuevamente
                </Button>
              )}
            </div>
          )}

          {/* Progreso de sincronización */}
          {isSyncing && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500 animate-spin" />
                <span className="text-blue-700">Sincronizando conversaciones...</span>
              </div>
              <Progress value={syncProgress} className="w-full" />
              <p className="text-xs text-gray-500 text-center">
                {syncProgress}% completado
              </p>
            </div>
          )}

          {/* Resultado de sincronización */}
          {syncResult && (
            <div className="space-y-3">
              {syncResult.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Sincronización completada exitosamente.
                    <br />
                    📨 {syncResult.syncedMessages} mensajes sincronizados
                    <br />
                    💬 {syncResult.syncedConversations} conversaciones procesadas
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ❌ Error en la sincronización: {syncResult.error}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button onClick={handleClose} className="w-full">
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistoricalSyncButton;
