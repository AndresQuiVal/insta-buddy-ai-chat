
import React, { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, RefreshCw, Search, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNewProspects } from '@/hooks/useNewProspects';
import { supabase } from '@/integrations/supabase/client';

const ProspectList: React.FC = () => {
  const { prospects, loading, error, refetch } = useNewProspects();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestionLoading, setSuggestionLoading] = useState<string | null>(null);
  const [suggestionDialog, setSuggestionDialog] = useState<{
    open: boolean;
    suggestion: string;
    prospectUsername: string;
  }>({
    open: false,
    suggestion: '',
    prospectUsername: ''
  });

  const handleAISuggestion = async (prospect: any) => {
    try {
      setSuggestionLoading(prospect.id);
      console.log("🤖 Generando sugerencia con IA para:", prospect.username);

      // Obtener datos del usuario de Instagram
      const userDataString = localStorage.getItem('hower-instagram-user');
      if (!userDataString) {
        throw new Error('No hay información de usuario de Instagram disponible');
      }

      const userData = JSON.parse(userDataString);
      const instagramUserId = userData.instagram?.id || userData.facebook?.id;

      const { data, error } = await supabase.functions.invoke('ai-prospect-suggestion', {
        body: {
          prospect_id: prospect.id,
          instagram_user_id: instagramUserId
        }
      });

      if (error) {
        console.error('❌ Error al generar sugerencia:', error);
        throw new Error(error.message || 'Error al comunicarse con el servicio de IA');
      }

      if (data.error) {
        if (data.needs_api_key) {
          toast({
            title: "API Key requerida",
            description: "Necesitas configurar tu API Key de OpenAI en la configuración para usar las sugerencias con IA",
            variant: "destructive"
          });
          return;
        }
        throw new Error(data.error);
      }

      if (data.success && data.suggestion) {
        setSuggestionDialog({
          open: true,
          suggestion: data.suggestion,
          prospectUsername: data.prospect_username || prospect.username
        });

        toast({
          title: "✅ Sugerencia generada",
          description: `Sugerencia creada para ${prospect.username} analizando ${data.messages_analyzed} mensajes`
        });
      }

    } catch (error) {
      console.error("❌ Error al generar sugerencia:", error);
      toast({
        title: "Error en sugerencia",
        description: error instanceof Error ? error.message : "No se pudo generar la sugerencia con IA",
        variant: "destructive"
      });
    } finally {
      setSuggestionLoading(null);
    }
  };

  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Ahora';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d`;
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'esperando_respuesta':
        return { text: 'Esperando respuesta', color: 'bg-red-100 text-red-800' };
      case 'en_seguimiento':
        return { text: 'En seguimiento', color: 'bg-green-100 text-green-800' };
      default:
        return { text: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const filteredProspects = prospects.filter(prospect => {
    const username = prospect.username.toLowerCase();
    const search = searchTerm.toLowerCase();
    return username.includes(search);
  });

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Cargando prospectos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Error al cargar prospectos</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-purple-100">
          <div>
            <h2 className="text-xl font-bold text-purple-700 flex items-center gap-2">
              <MessageCircle className="w-6 h-6" /> Mis Prospectos
            </h2>
            <p className="text-sm text-gray-600">{filteredProspects.length} prospectos activos</p>
          </div>
          <button
            onClick={refetch}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Actualizar prospectos"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 border-b border-purple-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredProspects.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {searchTerm ? 'No se encontraron prospectos' : 'No hay prospectos aún'}
              </h3>
              <p className="text-gray-500">
                {searchTerm ? 'Intenta con otro término de búsqueda' : 'Los prospectos aparecerán aquí cuando el autoresponder responda a mensajes'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último contacto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProspects.map((prospect) => {
                  const statusDisplay = getStatusDisplay(prospect.status);
                  return (
                    <TableRow key={prospect.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {prospect.profile_picture_url ? (
                            <img 
                              src={prospect.profile_picture_url} 
                              alt={prospect.username}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {prospect.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>@{prospect.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                          {statusDisplay.text}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatMessageTime(prospect.last_message_date)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAISuggestion(prospect)}
                          disabled={suggestionLoading === prospect.id}
                          className="flex items-center gap-2"
                        >
                          {suggestionLoading === prospect.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                          Sugerencia con IA
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={suggestionDialog.open} onOpenChange={(open) => setSuggestionDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-600" />
              Sugerencia de IA para @{suggestionDialog.prospectUsername}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Mensaje sugerido:</h4>
              <p className="text-gray-700 leading-relaxed">{suggestionDialog.suggestion}</p>
            </div>
            <div className="text-sm text-gray-500">
              💡 Esta sugerencia fue generada analizando toda la conversación con el objetivo de agendar una reunión o obtener el número de teléfono del prospecto.
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSuggestionDialog(prev => ({ ...prev, open: false }))}
              >
                Cerrar
              </Button>
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(suggestionDialog.suggestion);
                  toast({
                    title: "Copiado",
                    description: "La sugerencia ha sido copiada al portapapeles"
                  });
                }}
              >
                Copiar mensaje
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProspectList;
