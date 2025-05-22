
import React from 'react';
import { Bot, Settings, Zap, Clock } from 'lucide-react';

interface ConfigPanelProps {
  config: {
    name: string;
    personality: string;
    responseDelay: number;
    autoRespond: boolean;
  };
  onConfigChange: (config: any) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onConfigChange }) => {
  const updateConfig = (key: string, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full">
      <div className="p-4 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-800">Configuración IA</h2>
        </div>
      </div>

      <div className="p-4 space-y-6">
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
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Ej: AsistenteIA"
          />
        </div>

        {/* Personalidad */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Personalidad</label>
          <select
            value={config.personality}
            onChange={(e) => updateConfig('personality', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="amigable">Amigable</option>
            <option value="profesional">Profesional</option>
            <option value="casual">Casual</option>
          </select>
        </div>

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
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-400"
            />
            <span className="ml-2 text-sm text-gray-600">
              Responder automáticamente a los mensajes
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
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-center">
            {config.responseDelay}ms ({(config.responseDelay / 1000).toFixed(1)}s)
          </div>
        </div>

        {/* Estadísticas */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Estadísticas</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Conversaciones activas:</span>
              <span className="font-medium text-purple-600">4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mensajes enviados hoy:</span>
              <span className="font-medium text-purple-600">23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tiempo de respuesta promedio:</span>
              <span className="font-medium text-purple-600">1.8s</span>
            </div>
          </div>
        </div>

        {/* Conectar Instagram */}
        <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg p-4 border border-orange-200">
          <h3 className="text-sm font-medium text-orange-800 mb-2">🔗 Conectar Instagram Real</h3>
          <p className="text-xs text-orange-700 mb-3">
            Para conectar con Instagram real, necesitas configurar la integración con Supabase.
          </p>
          <button className="w-full px-3 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm rounded-lg hover:shadow-lg transition-all duration-200">
            Configurar Integración
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
