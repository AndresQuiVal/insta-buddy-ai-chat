import React, { useState, useEffect } from 'react';
import { Bot, Settings, Zap, Clock, Star, MessageSquare, AlertCircle, Edit2, Save, Plus, Trash2, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { initiateInstagramAuth, disconnectInstagram, checkInstagramConnection } from '@/services/instagramService';
import { isOpenAIConfigured, createSystemPrompt } from '@/services/openaiService';
import { toast } from '@/hooks/use-toast';

interface ConfigPanelProps {
  config: {
    name: string;
    personality: string;
    responseDelay: number;
    autoRespond: boolean;
  };
  onConfigChange: (config: any) => void;
}

interface TraitConfig {
  trait: string;
  enabled: boolean;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onConfigChange }) => {
  const updateConfig = (key: string, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  // Lista de características para el cliente ideal
  const [traits, setTraits] = useState<TraitConfig[]>(() => {
    // Intentar cargar desde localStorage al iniciar
    const savedTraits = localStorage.getItem('hower-ideal-client-traits');
    if (savedTraits) {
      return JSON.parse(savedTraits);
    }
    // Valores por defecto
    return [
      { trait: "Interesado en nuestros productos", enabled: true },
      { trait: "Tiene presupuesto adecuado", enabled: true },
      { trait: "Listo para comprar", enabled: true },
      { trait: "Ubicado en nuestra zona de servicio", enabled: true },
    ];
  });

  // Estado para edición de rasgos
  const [editingTrait, setEditingTrait] = useState<number | null>(null);
  const [traitText, setTraitText] = useState<string>("");
  const [newTraitText, setNewTraitText] = useState<string>("");
  const [showAddTrait, setShowAddTrait] = useState<boolean>(false);
  
  // Estado para configuración de personalidad
  const [editingPersonality, setEditingPersonality] = useState<boolean>(false);
  const [personalityDescription, setPersonalityDescription] = useState<string>(
    config.personality === 'amigable' 
      ? "Amigable, cercano y empático. Usa un tono conversacional y cálido, haciendo preguntas abiertas para generar confianza." 
      : config.personality === 'profesional'
      ? "Formal, respetuoso y directo. Utiliza un lenguaje preciso y técnico cuando es necesario, manteniendo siempre la cortesía."
      : "Casual y relajado. Utiliza expresiones cotidianas, es dinámico y muestra entusiasmo en la conversación."
  );

  // Estado para el prompt del sistema
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [editingPrompt, setEditingPrompt] = useState<boolean>(false);
  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    // Intentar cargar desde localStorage al iniciar
    const savedPrompt = localStorage.getItem('hower-system-prompt');
    if (savedPrompt) {
      return savedPrompt;
    }
    // Generar prompt por defecto
    return createSystemPrompt({
      businessName: config.name,
      businessDescription: "Asistente virtual que ayuda a filtrar prospectos potenciales.",
      tone: personalityDescription,
      idealClientTraits: traits.filter(t => t.enabled).map(t => t.trait)
    });
  });

  // Guardar traits en localStorage cada vez que cambien
  useEffect(() => {
    localStorage.setItem('hower-ideal-client-traits', JSON.stringify(traits));
    
    // Actualizar el prompt si no está siendo editado manualmente
    if (!editingPrompt) {
      const newPrompt = createSystemPrompt({
        businessName: config.name,
        businessDescription: "Asistente virtual que ayuda a filtrar prospectos potenciales.",
        tone: personalityDescription,
        idealClientTraits: traits.filter(t => t.enabled).map(t => t.trait)
      });
      setSystemPrompt(newPrompt);
      localStorage.setItem('hower-system-prompt', newPrompt);
    }
  }, [traits, config.name, personalityDescription, editingPrompt]);

  const updateTrait = (index: number, enabled: boolean) => {
    const newTraits = [...traits];
    newTraits[index].enabled = enabled;
    setTraits(newTraits);
    toast({
      title: enabled ? "Característica activada" : "Característica desactivada",
      description: `${traits[index].trait} ha sido ${enabled ? 'activada' : 'desactivada'}.`,
    });
  };

  const startEditTrait = (index: number) => {
    setEditingTrait(index);
    setTraitText(traits[index].trait);
  };

  const saveTrait = () => {
    if (editingTrait !== null) {
      if (!traitText.trim()) {
        toast({
          title: "Error",
          description: "La característica no puede estar vacía",
          variant: "destructive"
        });
        return;
      }

      const newTraits = [...traits];
      newTraits[editingTrait].trait = traitText;
      setTraits(newTraits);
      setEditingTrait(null);
      
      toast({
        title: "Característica actualizada",
        description: "Se ha actualizado la característica correctamente."
      });
    }
  };
  
  const addNewTrait = () => {
    if (!newTraitText.trim()) {
      toast({
        title: "Error",
        description: "La característica no puede estar vacía",
        variant: "destructive"
      });
      return;
    }
    
    setTraits([...traits, { trait: newTraitText, enabled: true }]);
    setNewTraitText("");
    setShowAddTrait(false);
    
    toast({
      title: "Característica añadida",
      description: "Se ha añadido una nueva característica de cliente ideal."
    });
  };
  
  const deleteTrait = (index: number) => {
    if (traits.length <= 1) {
      toast({
        title: "No se puede eliminar",
        description: "Debe haber al menos una característica de cliente ideal.",
        variant: "destructive"
      });
      return;
    }
    
    const newTraits = [...traits];
    newTraits.splice(index, 1);
    setTraits(newTraits);
    
    toast({
      title: "Característica eliminada",
      description: "Se ha eliminado la característica correctamente."
    });
  };

  const savePersonalityDescription = () => {
    setEditingPersonality(false);
    toast({
      title: "Personalidad actualizada",
      description: "Se ha actualizado la descripción de personalidad."
    });
  };

  const saveSystemPrompt = () => {
    localStorage.setItem('hower-system-prompt', systemPrompt);
    setEditingPrompt(false);
    toast({
      title: "Prompt actualizado",
      description: "Se ha guardado el prompt del sistema correctamente."
    });
  };

  const resetSystemPrompt = () => {
    const newPrompt = createSystemPrompt({
      businessName: config.name,
      businessDescription: "Asistente virtual que ayuda a filtrar prospectos potenciales.",
      tone: personalityDescription,
      idealClientTraits: traits.filter(t => t.enabled).map(t => t.trait)
    });
    setSystemPrompt(newPrompt);
    localStorage.setItem('hower-system-prompt', newPrompt);
    setEditingPrompt(false);
    toast({
      title: "Prompt restablecido",
      description: "Se ha restablecido el prompt del sistema a los valores por defecto."
    });
  };

  const [openAIKey, setOpenAIKey] = useState<string>('');
  const [openAIConfigured, setOpenAIConfigured] = useState<boolean>(isOpenAIConfigured());

  const [instagramConnected, setInstagramConnected] = useState<boolean>(checkInstagramConnection());

  const handleInstagramConnection = () => {
    if (instagramConnected) {
      // Desconectar Instagram
      const disconnected = disconnectInstagram();
      if (disconnected) {
        setInstagramConnected(false);
      }
    } else {
      // Conectar Instagram usando la versión hardcoded
      const success = initiateInstagramAuth();
      if (success) {
        setInstagramConnected(true);
      }
    }
  };

  // Simulación de guardar la API key de OpenAI
  const handleOpenAISetup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!openAIKey.trim()) {
      return;
    }
    
    // En una implementación real, esto guardaría la clave en un lugar seguro como Supabase
    localStorage.setItem('hower-openai-key-demo', openAIKey);
    setOpenAIConfigured(true);
    
    // Limpiar el campo después de guardar
    setOpenAIKey('');
  };

  // Helper function to format time display
  const formatTimeDisplay = (milliseconds: number): string => {
    if (milliseconds < 60000) {
      // Less than a minute - show in seconds
      return `${(milliseconds / 1000).toFixed(0)}s`;
    } else if (milliseconds < 3600000) {
      // Less than an hour - show in minutes
      return `${(milliseconds / 60000).toFixed(0)}m`;
    } else {
      // More than an hour - show in hours
      return `${(milliseconds / 3600000).toFixed(1)}h`;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-800">Configuración Hower</h2>
        </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-72px)]">
        {/* Nombre del asistente */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Bot className="w-4 h-4" />
            Nombre del Asistente
          </label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => updateConfig('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ej: Hower"
          />
        </div>

        {/* Personalidad */}
        <Card className="border border-gray-200">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Bot className="w-4 h-4 text-primary" /> Personalidad de la IA
              </h3>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Tipo de personalidad</label>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {config.personality === 'amigable' ? 'Amigable' : 
                   config.personality === 'profesional' ? 'Profesional' : 'Casual'}
                </span>
              </div>
              
              <select
                value={config.personality}
                onChange={(e) => updateConfig('personality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="amigable">Amigable</option>
                <option value="profesional">Profesional</option>
                <option value="casual">Casual</option>
              </select>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">
                  Descripción detallada
                </label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setEditingPersonality(!editingPersonality)}
                  className="h-8 px-2"
                >
                  {editingPersonality ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                </Button>
              </div>
              
              {editingPersonality ? (
                <div className="space-y-2">
                  <Textarea
                    value={personalityDescription}
                    onChange={(e) => setPersonalityDescription(e.target.value)}
                    className="w-full min-h-[100px]"
                    placeholder="Describe la personalidad en detalle..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingPersonality(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={savePersonalityDescription}
                    >
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {personalityDescription}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Prompt del Sistema */}
        <Card className="border border-gray-200">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Bot className="w-4 h-4 text-primary" /> Prompt del Sistema
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPrompt(!showPrompt)}
                className="h-8 px-2"
              >
                {showPrompt ? "Ocultar" : "Ver prompt"}
              </Button>
            </div>
          </CardHeader>
          {showPrompt && (
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Prompt actual</span>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingPrompt(!editingPrompt)}
                    className="h-8 px-2"
                  >
                    {editingPrompt ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {editingPrompt ? (
                <div className="space-y-3">
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full min-h-[200px] text-xs"
                    placeholder="Editar prompt del sistema..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetSystemPrompt}
                    >
                      Restablecer
                    </Button>
                    <Button 
                      size="sm"
                      onClick={saveSystemPrompt}
                    >
                      Guardar Prompt
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-mono bg-gray-50 p-3 rounded-md border border-gray-100 overflow-auto max-h-[200px] whitespace-pre-wrap">
                  {systemPrompt}
                </div>
              )}
              
              <div className="text-xs text-gray-600 bg-gray-50/50 p-3 rounded-md border border-gray-100">
                <p className="font-medium mb-1">Información:</p>
                <p>Este es el prompt que recibe ChatGPT para definir su comportamiento. Incluye la personalidad configurada y las características de cliente ideal activadas.</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Configuración de OpenAI */}
        <Card className="border border-gray-200">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-primary" /> Configuración de ChatGPT
            </h3>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-600">Estado:</span>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 ${openAIConfigured ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></span>
                <span className={`text-xs ${openAIConfigured ? 'text-green-600' : 'text-red-600'}`}>
                  {openAIConfigured ? 'Configurado' : 'No configurado'}
                </span>
              </div>
            </div>

            {!openAIConfigured && (
              <form onSubmit={handleOpenAISetup} className="mt-2">
                <input
                  type="password"
                  value={openAIKey}
                  onChange={(e) => setOpenAIKey(e.target.value)}
                  placeholder="Ingresa tu API key de OpenAI"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                />
                <button
                  type="submit"
                  className="w-full px-3 py-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg transition-colors"
                >
                  Configurar OpenAI
                </button>
              </form>
            )}

            {openAIConfigured && (
              <p className="text-xs text-gray-500 mt-1">
                ChatGPT está configurado y listo para responder automáticamente a tus prospectos.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Características del cliente ideal */}
        <Card className="border border-gray-200">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Star className="w-4 h-4 text-primary" /> Características del Cliente Ideal
              </h3>
              <div className="flex items-center">
                <AlertCircle className="w-3.5 h-3.5 text-primary mr-1" />
                <span className="text-xs text-gray-500">La IA evaluará estos puntos</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
              La IA evaluará si los prospectos cumplen con estas características durante la conversación, 
              sin revelarles que están siendo evaluados.
            </div>
            
            {traits.map((trait, index) => (
              <div key={index} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  {editingTrait === index ? (
                    <div className="flex-1 flex gap-2">
                      <Input 
                        value={traitText} 
                        onChange={(e) => setTraitText(e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="sm" onClick={() => setEditingTrait(null)}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={saveTrait}>
                        Guardar
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 flex-1">
                        <span className={`text-sm ${trait.enabled ? 'text-gray-600' : 'text-gray-400 line-through'}`}>
                          {trait.trait}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => startEditTrait(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteTrait(index)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={trait.enabled}
                            onChange={(e) => updateTrait(index, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {showAddTrait ? (
              <div className="mt-3 flex gap-2">
                <Input 
                  value={newTraitText} 
                  onChange={(e) => setNewTraitText(e.target.value)}
                  placeholder="Ingresa una nueva característica"
                  className="flex-1"
                />
                <Button variant="ghost" size="sm" onClick={() => setShowAddTrait(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={addNewTrait}>
                  Añadir
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2" 
                onClick={() => setShowAddTrait(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Añadir característica
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Respuesta automática */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Zap className="w-4 h-4" />
            Respuesta Automática
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={config.autoRespond}
              onChange={(e) => updateConfig('autoRespond', e.target.checked)}
              className="sr-only peer"
              id="autoresponder-toggle"
            />
            <label
              htmlFor="autoresponder-toggle"
              className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary cursor-pointer"
            ></label>
            <span className="ml-3 text-sm text-gray-600">
              {config.autoRespond ? "Activado" : "Desactivado"}
            </span>
          </div>
        </div>

        {/* Delay de respuesta */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Clock className="w-4 h-4" />
            Tiempo de Respuesta
          </label>
          <input
            type="range"
            min="10000"
            max="3600000"
            step="10000"
            value={config.responseDelay}
            onChange={(e) => updateConfig('responseDelay', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="text-xs text-gray-500 text-center">
            {formatTimeDisplay(config.responseDelay)}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="bg-gray-50 rounded-lg p-4 mt-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Estadísticas</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Conversaciones activas:</span>
              <span className="font-medium text-primary">5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mensajes enviados hoy:</span>
              <span className="font-medium text-primary">23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tiempo de respuesta promedio:</span>
              <span className="font-medium text-primary">1.8s</span>
            </div>
          </div>
        </div>

        {/* Conectar Instagram */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">🔗 Estado de Instagram</h3>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Cuenta {instagramConnected ? 'conectada' : 'desconectada'}
            </p>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 ${instagramConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></span>
              <span className={`text-xs ${instagramConnected ? 'text-green-600' : 'text-red-600'}`}>
                {instagramConnected ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
          <button 
            onClick={handleInstagramConnection}
            className={`w-full px-3 py-2 mt-3 ${
              instagramConnected 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-primary hover:bg-primary-dark'
            } text-white text-sm rounded-lg transition-colors`}
          >
            {instagramConnected ? 'Desconectar Instagram' : 'Conectar Instagram'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
