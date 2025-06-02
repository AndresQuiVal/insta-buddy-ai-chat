
import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, Calendar, Filter, Search, Brain, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAITraitAnalysis } from '@/hooks/useAITraitAnalysis';
import { toast } from '@/hooks/use-toast';

interface Prospect {
  id: string;
  userName: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  avatar?: string;
  matchPoints: number;
  metTraits: string[];
}

const ProspectList = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByStars, setFilterByStars] = useState<number | null>(null);
  const [idealTraits, setIdealTraits] = useState<{trait: string, enabled: boolean}[]>([]);
  const { isAnalyzing, analyzeAll, loadIdealTraits } = useAITraitAnalysis();

  useEffect(() => {
    loadProspects();
    loadTraits();

    // Escuchar eventos de actualización
    const handleStorageChange = () => {
      loadProspects();
    };

    const handleConversationsUpdate = () => {
      loadProspects();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('conversations-updated', handleConversationsUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('conversations-updated', handleConversationsUpdate);
    };
  }, []);

  const loadTraits = () => {
    const traits = loadIdealTraits();
    setIdealTraits(traits);
    console.log("📋 DEBUG: Características cargadas en ProspectList:", traits);
  };

  const loadProspects = () => {
    try {
      const savedConversations = localStorage.getItem('hower-conversations');
      if (savedConversations) {
        const conversations = JSON.parse(savedConversations);
        console.log("💾 DEBUG: Conversaciones cargadas:", conversations);
        setProspects(conversations);
        setFilteredProspects(conversations);
      }
    } catch (error) {
      console.error("Error loading prospects:", error);
    }
  };

  const handleAnalyzeAll = async () => {
    console.log("🔍 DEBUG: ProspectList - Iniciando análisis completo con IA...");
    
    try {
      await analyzeAll();
      
      toast({
        title: "🤖 ¡Análisis completado!",
        description: "Todas las conversaciones han sido analizadas con IA",
      });
      
      // Recargar prospectos después del análisis
      loadProspects();
      
    } catch (error) {
      console.error("Error en análisis:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al analizar las conversaciones",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    let filtered = prospects;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(prospect =>
        prospect.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estrellas
    if (filterByStars !== null) {
      filtered = filtered.filter(prospect => prospect.matchPoints >= filterByStars);
    }

    // Ordenar por puntuación (mayor a menor)
    filtered = filtered.sort((a, b) => (b.matchPoints || 0) - (a.matchPoints || 0));

    setFilteredProspects(filtered);
  }, [prospects, searchTerm, filterByStars]);

  const getCompatibilityLevel = (points: number, maxPoints: number) => {
    if (maxPoints === 0) return { label: 'No configurado', color: 'bg-gray-500' };
    
    const percentage = (points / maxPoints) * 100;
    if (percentage === 100) return { label: 'Perfecto', color: 'bg-green-500' };
    if (percentage >= 75) return { label: 'Excelente', color: 'bg-green-400' };
    if (percentage >= 50) return { label: 'Bueno', color: 'bg-yellow-500' };
    if (percentage >= 25) return { label: 'Regular', color: 'bg-orange-500' };
    if (percentage > 0) return { label: 'Bajo', color: 'bg-red-500' };
    return { label: 'Sin evaluar', color: 'bg-gray-400' };
  };

  const maxPoints = idealTraits.filter(t => t.enabled).length || 4;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mis Prospectos</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredProspects.length} prospecto{filteredProspects.length !== 1 ? 's' : ''} 
            {filterByStars !== null && ` con ${filterByStars}+ estrella${filterByStars !== 1 ? 's' : ''}`}
          </p>
        </div>
        
        {/* Botón Analizar Todo con IA */}
        <button
          onClick={handleAnalyzeAll}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Brain className="w-4 h-4" />
          {isAnalyzing ? 'Analizando...' : `🔍 Analizar Todo (${idealTraits.filter(t => t.enabled).length} criterios)`}
          {isAnalyzing && <RefreshCw className="w-4 h-4 animate-spin ml-2" />}
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre o mensaje..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((stars) => (
            <Button
              key={stars}
              variant={filterByStars === stars ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterByStars(filterByStars === stars ? null : stars)}
              className="flex items-center gap-1"
            >
              <Star className="w-3 h-3" />
              {stars}+
            </Button>
          ))}
          {filterByStars !== null && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterByStars(null)}
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Lista de prospectos */}
      <div className="grid gap-4">
        {filteredProspects.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              {prospects.length === 0 ? (
                <>
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No hay prospectos aún</h3>
                  <p>Cuando tengas conversaciones, aparecerán aquí</p>
                </>
              ) : (
                <>
                  <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No se encontraron prospectos</h3>
                  <p>Intenta ajustar los filtros de búsqueda</p>
                </>
              )}
            </div>
          </Card>
        ) : (
          filteredProspects.map((prospect) => {
            const compatibility = getCompatibilityLevel(prospect.matchPoints || 0, maxPoints);
            
            return (
              <Card key={prospect.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                      {prospect.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {prospect.userName}
                        </h3>
                        <Badge variant="secondary" className={`${compatibility.color} text-white`}>
                          {compatibility.label}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {prospect.lastMessage}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {prospect.timestamp}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {prospect.matchPoints || 0}/{maxPoints} características
                        </div>
                      </div>
                      
                      {prospect.metTraits && prospect.metTraits.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {prospect.metTraits.slice(0, 2).map((trait, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              ✓ {trait.length > 30 ? trait.substring(0, 30) + '...' : trait}
                            </Badge>
                          ))}
                          {prospect.metTraits.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{prospect.metTraits.length - 2} más
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    {[...Array(maxPoints)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < (prospect.matchPoints || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProspectList;
