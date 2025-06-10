
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Star, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Trait {
  trait: string;
  enabled: boolean;
  position: number;
}

const IdealClientTraits: React.FC = () => {
  const [traits, setTraits] = useState<Trait[]>([]);
  const [newTrait, setNewTrait] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Cargar características desde Supabase
  useEffect(() => {
    loadTraitsFromSupabase();
  }, []);

  const loadTraitsFromSupabase = async () => {
    try {
      setIsLoading(true);
      console.log("🔍 Cargando características desde Supabase...");
      
      const { data: traits, error } = await supabase
        .from('ideal_client_traits')
        .select('*')
        .order('position');

      if (error) {
        console.error('❌ Error loading traits:', error);
        setDefaultTraits();
        return;
      }

      if (!traits || traits.length === 0) {
        console.log("⚠️ No se encontraron características, creando por defecto");
        setDefaultTraits();
        return;
      }

      const traitsData = traits.map(t => ({
        trait: t.trait,
        enabled: t.enabled,
        position: t.position
      }));

      console.log("✅ Características cargadas desde Supabase:", traitsData);
      setTraits(traitsData);
      
      toast({
        title: "✅ Características cargadas",
        description: `${traitsData.filter(t => t.enabled).length} de ${traitsData.length} características habilitadas`,
      });

    } catch (error) {
      console.error("Error al cargar características:", error);
      setDefaultTraits();
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultTraits = async () => {
    const defaultTraits = [
      { trait: "Interesado en nuestros productos o servicios", enabled: true, position: 0 },
      { trait: "Tiene presupuesto adecuado para adquirir nuestras soluciones", enabled: true, position: 1 },
      { trait: "Está listo para tomar una decisión de compra", enabled: true, position: 2 },
      { trait: "Se encuentra en nuestra zona de servicio", enabled: true, position: 3 }
    ];
    
    setTraits(defaultTraits);
    await saveTraitsToSupabase(defaultTraits);
  };

  const saveTraitsToSupabase = async (traitsToSave: Trait[]) => {
    try {
      console.log("💾 Guardando características en Supabase:", traitsToSave);
      
      // Primero, eliminar todas las características existentes
      const { error: deleteError } = await supabase
        .from('ideal_client_traits')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todas

      if (deleteError) {
        console.error("Error al eliminar características anteriores:", deleteError);
      }

      // Luego, insertar las nuevas características
      const { data, error: insertError } = await supabase
        .from('ideal_client_traits')
        .insert(
          traitsToSave.map(trait => ({
            trait: trait.trait,
            enabled: trait.enabled,
            position: trait.position,
            user_id: '00000000-0000-0000-0000-000000000000' // Usuario por defecto
          }))
        );

      if (insertError) {
        console.error("Error al guardar características:", insertError);
        throw insertError;
      }

      console.log("✅ Características guardadas en Supabase");
      
      // También guardar en localStorage como respaldo
      localStorage.setItem('hower-ideal-client-traits', JSON.stringify(traitsToSave));
      
      // Disparar evento para que otros componentes se actualicen
      window.dispatchEvent(new CustomEvent('traits-updated', { detail: traitsToSave }));
      
    } catch (error) {
      console.error("Error al guardar características:", error);
      throw error;
    }
  };

  const saveTraits = async () => {
    setIsSaving(true);
    
    try {
      await saveTraitsToSupabase(traits);
      
      toast({
        title: "Características guardadas",
        description: "Las características del cliente ideal se han actualizado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar las características",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addTrait = async () => {
    if (newTrait.trim() && traits.length < 6) {
      const newTraits = [...traits, { trait: newTrait.trim(), enabled: true, position: traits.length }];
      setTraits(newTraits);
      setNewTrait('');
      
      try {
        await saveTraitsToSupabase(newTraits);
        toast({
          title: "Característica agregada",
          description: "La nueva característica se ha guardado correctamente",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo guardar la nueva característica",
          variant: "destructive"
        });
      }
    }
  };

  const removeTrait = async (index: number) => {
    if (traits.length > 1) {
      const updatedTraits = traits.filter((_, i) => i !== index);
      const reindexedTraits = updatedTraits.map((trait, i) => ({ ...trait, position: i }));
      setTraits(reindexedTraits);
      
      try {
        await saveTraitsToSupabase(reindexedTraits);
        toast({
          title: "Característica eliminada",
          description: "La característica se ha eliminado correctamente",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar la característica",
          variant: "destructive"
        });
      }
    }
  };

  const updateTrait = (index: number, newTraitText: string) => {
    const updatedTraits = [...traits];
    updatedTraits[index].trait = newTraitText;
    setTraits(updatedTraits);
  };

  const toggleTrait = async (index: number) => {
    const updatedTraits = [...traits];
    updatedTraits[index].enabled = !updatedTraits[index].enabled;
    setTraits(updatedTraits);
    
    try {
      await saveTraitsToSupabase(updatedTraits);
      toast({
        title: updatedTraits[index].enabled ? "Característica habilitada" : "Característica deshabilitada",
        description: "Los cambios se han guardado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la característica",
        variant: "destructive"
      });
    }
  };

  const enabledTraitsCount = traits.filter(t => t.enabled).length;

  if (isLoading) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin mr-2" />
          <span>Cargando características...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Star className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-semibold text-gray-800">Características del Cliente Ideal</h3>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-800">
            Características activas: {enabledTraitsCount}/4
          </span>
          <div className="flex">
            {[...Array(4)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < enabledTraitsCount ? 'fill-primary text-primary' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {traits.map((trait, index) => (
          <div key={index} className="space-y-2 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Característica {index + 1}</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={trait.enabled}
                  onCheckedChange={() => toggleTrait(index)}
                />
                {traits.length > 1 && (
                  <Button
                    onClick={() => removeTrait(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <Input
              value={trait.trait}
              onChange={(e) => updateTrait(index, e.target.value)}
              placeholder="Describe la característica del cliente ideal..."
              disabled={!trait.enabled}
              className={!trait.enabled ? 'opacity-50' : ''}
            />
          </div>
        ))}

        {traits.length < 6 && (
          <div className="flex gap-2">
            <Input
              value={newTrait}
              onChange={(e) => setNewTrait(e.target.value)}
              placeholder="Agregar nueva característica..."
              onKeyPress={(e) => e.key === 'Enter' && addTrait()}
            />
            <Button onClick={addTrait} disabled={!newTrait.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <Button onClick={saveTraits} className="w-full" disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Guardar Características
          </>
        )}
      </Button>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p><strong>🚀 Sistema Automático Activado:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>✅ La IA analiza automáticamente las conversaciones en tiempo real</li>
          <li>⭐ Detecta cuando los prospectos cumplen estas características</li>
          <li>📊 Asigna puntos de compatibilidad automáticamente (1-4 estrellas)</li>
          <li>🎯 Los prospectos aparecen ordenados por compatibilidad en "Mis Prospectos"</li>
          <li>🤖 La IA responde automáticamente según tu configuración</li>
          <li>💾 Todo se guarda en la base de datos Supabase</li>
        </ul>
      </div>
    </div>
  );
};

export default IdealClientTraits;
