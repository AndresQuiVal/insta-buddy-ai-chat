
import React, { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, RefreshCw, Search, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ProspectMessage {
  id: string;
  message_instagram_id: string;
  message_text: string;
  is_from_prospect: boolean;
  message_timestamp: string;
  message_type: string;
  raw_data: any;
}

interface Prospect {
  id: string;
  prospect_instagram_id: string;
  username: string;
  profile_picture_url?: string;
  first_contact_date: string;
  last_message_date: string;
  last_message_from_prospect: boolean;
  status: string;
  messages?: ProspectMessage[];
}

const ProspectListDemo: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingAI, setLoadingAI] = useState<string | null>(null);

  // Datos quemados para la demo
  const demoProspects: Prospect[] = [
    {
      id: '1',
      prospect_instagram_id: '123456789',
      username: 'maria_rodriguez',
      profile_picture_url: 'https://images.unsplash.com/photo-1494790108755-2616b9c9b239?w=100&h=100&fit=crop&crop=face',
      first_contact_date: '2024-06-15T10:00:00Z',
      last_message_date: '2024-06-19T14:30:00Z',
      last_message_from_prospect: true,
      status: 'esperando_respuesta'
    },
    {
      id: '2',
      prospect_instagram_id: '987654321',
      username: 'carlos_mendez',
      profile_picture_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      first_contact_date: '2024-06-14T09:15:00Z',
      last_message_date: '2024-06-19T11:45:00Z',
      last_message_from_prospect: false,
      status: 'reunion_agendada'
    },
    {
      id: '3',
      prospect_instagram_id: '456789123',
      username: 'ana_garcia',
      profile_picture_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      first_contact_date: '2024-06-13T16:20:00Z',
      last_message_date: '2024-06-18T08:10:00Z',
      last_message_from_prospect: true,
      status: 'en_seguimiento'
    },
    {
      id: '4',
      prospect_instagram_id: '789123456',
      username: 'luis_torres',
      profile_picture_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      first_contact_date: '2024-06-12T13:45:00Z',
      last_message_date: '2024-06-17T19:30:00Z',
      last_message_from_prospect: true,
      status: 'esperando_respuesta'
    },
    {
      id: '5',
      prospect_instagram_id: '321654987',
      username: 'sofia_martinez',
      profile_picture_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      first_contact_date: '2024-06-11T11:00:00Z',
      last_message_date: '2024-06-16T15:20:00Z',
      last_message_from_prospect: false,
      status: 'reunion_agendada'
    }
  ];

  // Sugerencias aleatorias quemadas para la demo
  const demoSuggestions = [
    "🎯 María ha mostrado interés en productos de bienestar. Sugiere agendar una llamada para mostrarle el catálogo completo y ofrecer un descuento por primera compra.",
    "💼 Carlos mencionó que tiene un negocio. Podrías ofrecerle precios mayoristas o un programa de afiliados que le genere ingresos adicionales.",
    "⭐ Ana ha estado muy activa respondiendo rápido. Es el momento perfecto para hacer el cierre de venta. Envíale testimonios de clientes satisfechos.",
    "🚀 Luis preguntó por los precios varias veces. Está listo para comprar, solo necesita un pequeño incentivo. Ofrécele un bono adicional si compra hoy.",
    "💎 Sofía ha mostrado mucho interés en los productos premium. Preséntale el paquete VIP con todos los beneficios exclusivos.",
    "🔥 Este prospecto está en el momento ideal para el cierre. Su comportamiento indica alta intención de compra. ¡Es hora de actuar!",
    "📞 Recomiendo agendar una videollamada. La conversación ha progresado lo suficiente para una presentación personalizada del producto.",
    "🎁 Ofrece un regalo sorpresa por su lealtad. Ha estado muy comprometido en las conversaciones y merece un reconocimiento especial."
  ];

  const getProspectState = (prospect: Prospect) => {
    if (prospect.status === 'esperando_respuesta') {
      return 'Esperando respuesta';
    } else if (prospect.status === 'en_seguimiento') {
      return 'En seguimiento';
    } else if (prospect.status === 'reunion_agendada') {
      return 'Reunión agendada';
    }
    return 'Sin respuesta';
  };

  const handleAISuggestion = async (prospect: Prospect) => {
    console.log("🤖 Generando sugerencia estratégica DEMO para:", prospect.username);
    
    setLoadingAI(prospect.id);
    
    try {
      // Simular tiempo de carga de IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Seleccionar una sugerencia aleatoria
      const randomSuggestion = demoSuggestions[Math.floor(Math.random() * demoSuggestions.length)];
      
      toast({
        title: "🎯 Sugerencia Estratégica",
        description: randomSuggestion,
        duration: 15000,
      });
      
      console.log("✅ Sugerencia estratégica DEMO generada:", randomSuggestion);
      
    } catch (error) {
      console.error("❌ Error al generar sugerencia estratégica DEMO:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al generar la sugerencia estratégica",
        variant: "destructive"
      });
    } finally {
      setLoadingAI(null);
    }
  };

  const filteredProspects = demoProspects.filter(prospect => {
    const userName = prospect.username.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return userName.includes(search);
  });

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-purple-100">
        <div>
          <h2 className="text-xl font-bold text-purple-700 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" /> Mis Prospectos (Demo)
          </h2>
          <p className="text-sm text-gray-600">{filteredProspects.length} prospectos</p>
          <p className="text-xs text-gray-500">Datos de demostración</p>
        </div>
        <button
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="p-4 border-b border-purple-100">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProspects.map((prospect) => (
              <TableRow key={prospect.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {prospect.profile_picture_url && (
                      <img 
                        src={prospect.profile_picture_url} 
                        alt={prospect.username}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    {prospect.username}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    prospect.status === 'esperando_respuesta'
                      ? 'bg-yellow-100 text-yellow-800'
                      : prospect.status === 'reunion_agendada'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {getProspectState(prospect)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAISuggestion(prospect)}
                    disabled={loadingAI === prospect.id}
                    className="flex items-center gap-2"
                  >
                    {loadingAI === prospect.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4" />
                        Sugerencia Estratégica
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProspectListDemo;
