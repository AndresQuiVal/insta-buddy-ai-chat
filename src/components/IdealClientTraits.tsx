
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Star, Plus, Trash2, Save } from 'lucide-react';

interface Trait {
  trait: string;
  enabled: boolean;
}

const IdealClientTraits: React.FC = () => {
  const [traits, setTraits] = useState<Trait[]>([
    { trait: "Interesado en nuestros productos o servicios", enabled: true },
    { trait: "Tiene presupuesto adecuado para adquirir nuestras soluciones", enabled: true },
    { trait: "Está listo para tomar una decisión de compra", enabled: true },
    { trait: "Se encuentra en nuestra zona de servicio", enabled: true }
  ]);
  const [newTrait, setNewTrait] = useState('');
  const { toast } = useToast();

  // Cargar características guardadas
  useEffect(() => {
    try {
      const savedTraits = localStorage.getItem('hower-ideal-client-traits');
      if (savedTraits) {
        const parsedTraits = JSON.parse(savedTraits);
        if (Array.isArray(parsedTraits) && parsedTraits.length > 0) {
          setTraits(parsedTraits);
        }
      }
    } catch (error) {
      console.error("Error al cargar características:", error);
    }
  }, []);

  const saveTraits = () => {
    try {
      localStorage.setItem('hower-ideal-client-traits', JSON.stringify(traits));
      console.log("Características guardadas:", traits);
      toast({
        title: "Características guardadas",
        description: "Las características del cliente ideal se han actualizado correctamente",
      });
    } catch (error) {
      console.error("Error al guardar características:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las características",
        variant: "destructive"
      });
    }
  };

  const addTrait = () => {
    if (newTrait.trim() && traits.length < 6) {
      setTraits([...traits, { trait: newTrait.trim(), enabled: true }]);
      setNewTrait('');
    }
  };

  const removeTrait = (index: number) => {
    if (traits.length > 1) {
      setTraits(traits.filter((_, i) => i !== index));
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

      <Button onClick={saveTraits} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        Guardar Características
      </Button>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p><strong>Cómo funciona:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>La IA analiza automáticamente las conversaciones</li>
          <li>Detecta cuando los prospectos cumplen estas características</li>
          <li>Asigna puntos de compatibilidad (estrellitas) basándose en las características cumplidas</li>
          <li>Los prospectos se ordenan automáticamente por compatibilidad</li>
        </ul>
      </div>
    </div>
  );
};

export default IdealClientTraits;
