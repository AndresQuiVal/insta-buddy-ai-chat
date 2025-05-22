
import React from 'react';
import { Bot, Settings, Zap, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

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

  // Lista simulada de características para el cliente ideal
  const [traits, setTraits] = React.useState<TraitConfig[]>([
    { trait: "Interesado en nuestros productos", enabled: true },
    { trait: "Tiene presupuesto adecuado", enabled: true },
    { trait: "Listo para comprar", enabled: true },
    { trait: "Ubicado en nuestra zona de servicio", enabled: true },
  ]);

  const updateTrait = (index: number, enabled: boolean) => {
    const newTraits = [...traits];
    newTraits[index].enabled = enabled;
    setTraits(newTraits);
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
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Personalidad de la IA</label>
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

        {/* Características del cliente ideal */}
        <Card className="border border-gray-200">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Star className="w-4 h-4 text-primary" /> Características del Cliente Ideal
            </h3>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {traits.map((trait, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600">{trait.trait}</span>
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
            ))}
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
            Tiempo de Respuesta (ms)
          </label>
          <input
            type="range"
            min="500"
            max="5000"
            step="500"
            value={config.responseDelay}
            onChange={(e) => updateConfig('responseDelay', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="text-xs text-gray-500 text-center">
            {config.responseDelay}ms ({(config.responseDelay / 1000).toFixed(1)}s)
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
              Cuenta conectada
            </p>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-xs text-green-600">Activo</span>
            </div>
          </div>
          <button className="w-full px-3 py-2 mt-3 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors">
            Actualizar conexión
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
