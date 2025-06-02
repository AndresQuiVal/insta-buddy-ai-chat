
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Star, Plus, Trash2, Save, Loader2 } from 'lucide-react';

interface Trait {
  trait: string;
  enabled: boolean;
  position: number;
}

const IdealClientTraits: React.FC = () => {
  const [traits, setTraits] = useState<Trait[]>([]);
  const [newTrait, setNewTrait] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Cargar características desde localStorage
  useEffect(() => {
    loadTraitsFromStorage();
  }, []);

  const loadTraitsFromStorage = () => {
    try {
      const savedTraits = localStorage.getItem('hower-ideal-client-traits');
      if (savedTraits) {
        const parsedTraits = JSON.parse(savedTraits);
        setTraits(parsedTraits);
        console.log("✅ Características cargadas desde localStorage:", parsedTraits);
      } else {
        setDefaultTraits();
      }
    } catch (error) {
      console.error("Error al cargar características desde localStorage:", error);
      setDefaultTraits();
    }
  };

  const setDefaultTraits = () => {
    const defaultTraits = [
      { trait: "Interesado en nuestros productos o servicios", enabled: true, position: 0 },
      { trait: "Tiene presupuesto adecuado para adquirir nuestras soluciones", enabled: true, position: 1 },
      { trait: "Está listo para tomar una decisión de compra", enabled: true, position: 2 },
      { trait: "Se encuentra en nuestra zona de servicio", enabled: true, position: 3 }
    ];
    setTraits(defaultTraits);
    saveTraitsToStorage(defaultTraits);
  };

  const saveTraitsToStorage = (traitsToSave: Trait[]) => {
    try {
      localStorage.setItem('hower-ideal-client-traits', JSON.stringify(traitsToSave));
      console.log("💾 Características guardadas en localStorage:", traitsToSave);
      
      // Disparar evento para que otros componentes se actualicen
      window.dispatchEvent(new CustomEvent('traits-updated', { detail: traitsToSave }));
    } catch (error) {
      console.error("Error al guardar características en localStorage:", error);
    }
  };

  const saveTraits = () => {
    setIsSaving(true);
    
    setTimeout(() => {
      saveTraitsToStorage(traits);
      setIsSaving(false);
      
      toast({
        title: "Características guardadas",
        description: "Las características del cliente ideal se han actualizado correctamente",
      });
    }, 500);
  };

  const addTrait = () => {
    if (newTrait.trim() && traits.length < 6) {
      const newTraits = [...traits, { trait: newTrait.trim(), enabled: true, position: traits.length }];
      setTraits(newTraits);
      setNewTrait('');
      saveTraitsToStorage(newTraits);
    }
  };

  const removeTrait = (index: number) => {
    if (traits.length > 1) {
      const updatedTraits = traits.filter((_, i) => i !== index);
      const reindexedTraits = updatedTraits.map((trait, i) => ({ ...trait, position: i }));
      setTraits(reindexedTraits);
      saveTraitsToStorage(reindexedTraits);
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
    saveTraitsToStorage(updatedTraits);
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
          <li>💾 Todo se guarda localmente en tu navegador</li>
        </ul>
      </div>
    </div>
  );
};

export default IdealClientTraits;
