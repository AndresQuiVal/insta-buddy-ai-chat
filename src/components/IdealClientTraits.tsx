
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Star, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Trait {
  id?: string;
  trait: string;
  enabled: boolean;
  position: number;
}

const IdealClientTraits: React.FC = () => {
  const [traits, setTraits] = useState<Trait[]>([]);
  const [newTrait, setNewTrait] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Cargar características desde la base de datos
  useEffect(() => {
    loadTraitsFromDatabase();
  }, []);

  const loadTraitsFromDatabase = async () => {
    try {
      setIsLoading(true);
      
      // Verificar si el usuario está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("Usuario no autenticado, usando características por defecto");
        setDefaultTraits();
        setIsLoading(false);
        return;
      }

      // Cargar características del usuario desde la base de datos
      const { data, error } = await supabase
        .from('ideal_client_traits')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (error) {
        console.error("Error al cargar características:", error);
        setDefaultTraits();
        return;
      }

      if (data && data.length > 0) {
        // Convertir datos de la base de datos al formato del componente
        const loadedTraits = data.map(item => ({
          id: item.id,
          trait: item.trait,
          enabled: item.enabled,
          position: item.position
        }));
        setTraits(loadedTraits);
      } else {
        // Si no hay características guardadas, crear las por defecto
        await createDefaultTraits(user.id);
      }
    } catch (error) {
      console.error("Error al cargar características:", error);
      setDefaultTraits();
      toast({
        title: "Error",
        description: "No se pudieron cargar las características. Usando valores por defecto.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultTraits = () => {
    setTraits([
      { trait: "Interesado en nuestros productos o servicios", enabled: true, position: 0 },
      { trait: "Tiene presupuesto adecuado para adquirir nuestras soluciones", enabled: true, position: 1 },
      { trait: "Está listo para tomar una decisión de compra", enabled: true, position: 2 },
      { trait: "Se encuentra en nuestra zona de servicio", enabled: true, position: 3 }
    ]);
  };

  const createDefaultTraits = async (userId: string) => {
    try {
      const defaultTraits = [
        { trait: "Interesado en nuestros productos o servicios", enabled: true, position: 0 },
        { trait: "Tiene presupuesto adecuado para adquirir nuestras soluciones", enabled: true, position: 1 },
        { trait: "Está listo para tomar una decisión de compra", enabled: true, position: 2 },
        { trait: "Se encuentra en nuestra zona de servicio", enabled: true, position: 3 }
      ];

      const traitsToInsert = defaultTraits.map(trait => ({
        user_id: userId,
        trait: trait.trait,
        enabled: trait.enabled,
        position: trait.position
      }));

      const { data, error } = await supabase
        .from('ideal_client_traits')
        .insert(traitsToInsert)
        .select();

      if (error) {
        console.error("Error al crear características por defecto:", error);
        setDefaultTraits();
        return;
      }

      if (data) {
        const loadedTraits = data.map(item => ({
          id: item.id,
          trait: item.trait,
          enabled: item.enabled,
          position: item.position
        }));
        setTraits(loadedTraits);
      }
    } catch (error) {
      console.error("Error al crear características por defecto:", error);
      setDefaultTraits();
    }
  };

  const saveTraits = async () => {
    try {
      setIsSaving(true);
      
      // Verificar si el usuario está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para guardar las características",
          variant: "destructive"
        });
        return;
      }

      // Primero, eliminar todas las características existentes del usuario
      const { error: deleteError } = await supabase
        .from('ideal_client_traits')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error("Error al eliminar características existentes:", deleteError);
        toast({
          title: "Error",
          description: "No se pudieron actualizar las características",
          variant: "destructive"
        });
        return;
      }

      // Luego, insertar las nuevas características
      const traitsToInsert = traits.map((trait, index) => ({
        user_id: user.id,
        trait: trait.trait,
        enabled: trait.enabled,
        position: index
      }));

      const { data, error } = await supabase
        .from('ideal_client_traits')
        .insert(traitsToInsert)
        .select();

      if (error) {
        console.error("Error al guardar características:", error);
        toast({
          title: "Error",
          description: "No se pudieron guardar las características",
          variant: "destructive"
        });
        return;
      }

      // Actualizar los IDs en el estado local
      if (data) {
        const updatedTraits = data.map(item => ({
          id: item.id,
          trait: item.trait,
          enabled: item.enabled,
          position: item.position
        }));
        setTraits(updatedTraits);
      }

      console.log("Características guardadas en la base de datos:", data);
      toast({
        title: "Características guardadas",
        description: "Las características del cliente ideal se han actualizado correctamente en la base de datos",
      });
    } catch (error) {
      console.error("Error al guardar características:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las características",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addTrait = () => {
    if (newTrait.trim() && traits.length < 6) {
      setTraits([...traits, { trait: newTrait.trim(), enabled: true, position: traits.length }]);
      setNewTrait('');
    }
  };

  const removeTrait = (index: number) => {
    if (traits.length > 1) {
      const updatedTraits = traits.filter((_, i) => i !== index);
      // Reajustar las posiciones
      const reindexedTraits = updatedTraits.map((trait, i) => ({ ...trait, position: i }));
      setTraits(reindexedTraits);
    }
  };

  const updateTrait = (index: number, newTraitText: string) => {
    const updatedTraits = [...traits];
    updatedTraits[index].trait = newTraitText;
    setTraits(updatedTraits);
  };

  const toggleTrait = (index: number) => {
    const updatedTraits = [...traits];
    updatedTraits[index].enabled = !updatedTraits[index].enabled;
    setTraits(updatedTraits);
  };

  const enabledTraitsCount = traits.filter(t => t.enabled).length;

  if (isLoading) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
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
          <div key={trait.id || index} className="space-y-2 p-4 border border-gray-200 rounded-lg">
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
        <p><strong>Cómo funciona:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>La IA analiza automáticamente las conversaciones</li>
          <li>Detecta cuando los prospectos cumplen estas características</li>
          <li>Asigna puntos de compatibilidad (estrellitas) basándose en las características cumplidas</li>
          <li>Los prospectos se ordenan automáticamente por compatibilidad</li>
          <li>Ahora tus características se guardan en la base de datos y se sincronizan entre dispositivos</li>
        </ul>
      </div>
    </div>
  );
};

export default IdealClientTraits;
