import { useState } from 'react';
import { Search, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const NICHOS = {
  'belleza': ['skincare', 'makeup', 'beauty', 'cosmetics', 'facial'],
  'salud': ['health', 'wellness', 'fitness', 'nutrition', 'supplements'],
  'deporte': ['sports', 'gym', 'workout', 'training', 'athletic'],
  'plan_comida': ['meal plan', 'diet', 'nutrition', 'healthy eating', 'recipes'],
  'vida_saludable': ['healthy lifestyle', 'wellness', 'organic', 'natural', 'holistic']
};

interface Ad {
  id: string;
  ad_creative_bodies: string[];
  ad_creative_link_captions: string[];
  ad_creative_link_titles: string[];
  ad_delivery_start_time: string;
  ad_delivery_stop_time: string | null;
  ad_snapshot_url: string;
  page_name: string;
  impressions: string;
}

const AdsHower = () => {
  const [selectedNicho, setSelectedNicho] = useState<string>('');
  const [ageFilter, setAgeFilter] = useState<string>('reciente');
  const [statusFilter, setStatusFilter] = useState<string>('ambos');
  const [loading, setLoading] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!selectedNicho) {
      toast({
        title: "Selecciona un nicho",
        description: "Debes seleccionar un nicho para buscar anuncios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const keywords = NICHOS[selectedNicho as keyof typeof NICHOS];
      
      const { data, error } = await supabase.functions.invoke('search-ads', {
        body: {
          keywords,
          ageFilter,
          statusFilter
        }
      });

      if (error) throw error;

      setAds(data.ads || []);
      
      toast({
        title: "Búsqueda completada",
        description: `Se encontraron ${data.ads?.length || 0} anuncios`
      });
    } catch (error: any) {
      console.error('Error searching ads:', error);
      toast({
        title: "Error al buscar anuncios",
        description: error.message || "Ocurrió un error al buscar los anuncios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Hower Winner ADS
          </h1>
          <p className="text-muted-foreground">
            Descubre los anuncios más efectivos de tu nicho
          </p>
        </div>

        {/* Filters Card */}
        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Nicho */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nicho</label>
              <Select value={selectedNicho} onValueChange={setSelectedNicho}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un nicho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="belleza">💄 Belleza</SelectItem>
                  <SelectItem value="salud">🏥 Salud</SelectItem>
                  <SelectItem value="deporte">⚽ Deporte</SelectItem>
                  <SelectItem value="plan_comida">🍽️ Plan de Comida</SelectItem>
                  <SelectItem value="vida_saludable">🌿 Vida Saludable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Antigüedad */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Antigüedad
              </label>
              <Select value={ageFilter} onValueChange={setAgeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="antiguo">🕰️ Antiguo (6-12 meses)</SelectItem>
                  <SelectItem value="reciente">📅 Reciente (1-3 meses)</SelectItem>
                  <SelectItem value="nuevo">✨ Nuevo (últimas 2 semanas)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Estado
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activos">✅ Activos</SelectItem>
                  <SelectItem value="inactivos">❌ Inactivos</SelectItem>
                  <SelectItem value="ambos">🔄 Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <Button 
                onClick={handleSearch} 
                disabled={loading}
                className="w-full"
              >
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Results */}
        {ads.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              Top 3 Anuncios con Mayor Antigüedad
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ads.slice(0, 3).map((ad, index) => (
                <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
                      #{index + 1}
                    </div>
                    <iframe
                      src={ad.ad_snapshot_url}
                      className="w-full h-[400px] border-0"
                      title={`Ad ${ad.id}`}
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg">{ad.page_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Inicio: {new Date(ad.ad_delivery_start_time).toLocaleDateString()}
                      </p>
                      {ad.ad_delivery_stop_time && (
                        <p className="text-sm text-muted-foreground">
                          Fin: {new Date(ad.ad_delivery_stop_time).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    {ad.ad_creative_link_titles?.[0] && (
                      <div className="border-l-4 border-primary pl-3">
                        <p className="text-sm font-semibold">
                          💡 {ad.ad_creative_link_titles[0]}
                        </p>
                      </div>
                    )}
                    
                    {ad.ad_creative_bodies?.[0] && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {ad.ad_creative_bodies[0]}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Impresiones: {ad.impressions || 'N/A'}
                      </span>
                      <a 
                        href={ad.ad_snapshot_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Ver completo →
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!loading && ads.length === 0 && selectedNicho && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              No se encontraron anuncios con los filtros seleccionados
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdsHower;
