
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Filter, MessageCircle, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Prospect {
  id: string;
  name: string;
  username: string;
  lastMessage: string;
  timestamp: string;
  traits: string[];
  matchPoints: number;
  stage: string;
}

const MyProspects = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('todos');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProspects();
  }, []);

  useEffect(() => {
    filterProspects();
  }, [prospects, searchTerm, selectedStage]);

  const loadProspects = () => {
    try {
      console.log('💾 Cargando prospectos desde localStorage');
      const storedProspects = localStorage.getItem('hower-prospects');
      
      if (storedProspects) {
        const parsedProspects = JSON.parse(storedProspects);
        // Verificar que sea un array antes de usarlo
        if (Array.isArray(parsedProspects)) {
          console.log(`💾 Cargando prospectos desde localStorage: ${parsedProspects.length}`);
          setProspects(parsedProspects);
          console.log(`✅ Prospectos cargados desde localStorage: ${parsedProspects.length}`);
        } else {
          console.log('⚠️ Los datos almacenados no son un array válido');
          setProspects([]);
        }
      } else {
        console.log('ℹ️ No hay prospectos almacenados');
        setProspects([]);
      }
    } catch (error) {
      console.error('❌ Error cargando prospectos:', error);
      setProspects([]);
      toast({
        title: "Error",
        description: "No se pudieron cargar los prospectos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterProspects = () => {
    // Verificar que prospects sea un array antes de filtrar
    if (!Array.isArray(prospects)) {
      console.log('⚠️ prospects no es un array, inicializando como array vacío');
      setFilteredProspects([]);
      return;
    }

    let filtered = [...prospects];

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(prospect => {
        // Verificar que prospect existe y tiene las propiedades necesarias
        if (!prospect) return false;
        
        const name = prospect.name || '';
        const username = prospect.username || '';
        const lastMessage = prospect.lastMessage || '';
        
        return (
          name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Filtrar por etapa
    if (selectedStage !== 'todos') {
      filtered = filtered.filter(prospect => {
        if (!prospect) return false;
        return prospect.stage === selectedStage;
      });
    }

    setFilteredProspects(filtered);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'nuevo': return 'bg-blue-100 text-blue-800';
      case 'en_conversacion': return 'bg-yellow-100 text-yellow-800';
      case 'interesado': return 'bg-green-100 text-green-800';
      case 'no_interesado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'nuevo': return 'Nuevo';
      case 'en_conversacion': return 'En conversación';
      case 'interesado': return 'Interesado';
      case 'no_interesado': return 'No interesado';
      default: return 'Sin clasificar';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando prospectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-600" />
          Mis Prospectos
        </h1>
        <p className="text-gray-600">
          Gestiona y da seguimiento a tus leads de Instagram
        </p>
      </div>

      {/* Controles de filtro y búsqueda */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por nombre, usuario o mensaje..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedStage === 'todos' ? 'default' : 'outline'}
                onClick={() => setSelectedStage('todos')}
                size="sm"
              >
                Todos ({Array.isArray(prospects) ? prospects.length : 0})
              </Button>
              <Button
                variant={selectedStage === 'nuevo' ? 'default' : 'outline'}
                onClick={() => setSelectedStage('nuevo')}
                size="sm"
              >
                Nuevos ({Array.isArray(prospects) ? prospects.filter(p => p?.stage === 'nuevo').length : 0})
              </Button>
              <Button
                variant={selectedStage === 'interesado' ? 'default' : 'outline'}
                onClick={() => setSelectedStage('interesado')}
                size="sm"
              >
                Interesados ({Array.isArray(prospects) ? prospects.filter(p => p?.stage === 'interesado').length : 0})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de prospectos */}
      {!Array.isArray(filteredProspects) || filteredProspects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || selectedStage !== 'todos' ? 'No se encontraron prospectos' : 'No tienes prospectos aún'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedStage !== 'todos' 
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Los prospectos aparecerán aquí cuando analices conversaciones de Instagram'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProspects.map((prospect) => {
            // Verificar que el prospect existe antes de renderizar
            if (!prospect) return null;
            
            return (
              <Card key={prospect.id || Math.random()} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {prospect.name ? prospect.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {prospect.name || 'Sin nombre'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          @{prospect.username || 'sin_usuario'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStageColor(prospect.stage || 'sin_clasificar')}>
                        {getStageLabel(prospect.stage || 'sin_clasificar')}
                      </Badge>
                      <Badge variant="outline">
                        {prospect.matchPoints || 0} puntos
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-start gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {prospect.lastMessage || 'Sin mensajes'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {prospect.timestamp || 'Sin fecha'}
                    </div>
                  </div>

                  {Array.isArray(prospect.traits) && prospect.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prospect.traits.slice(0, 3).map((trait, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                      {prospect.traits.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{prospect.traits.length - 3} más
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyProspects;
