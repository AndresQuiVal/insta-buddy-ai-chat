import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const WhatsAppConfig: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [weekSchedule, setWeekSchedule] = useState({
    monday: { enabled: false, time: '09:00' },
    tuesday: { enabled: false, time: '09:00' },
    wednesday: { enabled: false, time: '09:00' },
    thursday: { enabled: false, time: '09:00' },
    friday: { enabled: false, time: '09:00' },
    saturday: { enabled: false, time: '09:00' },
    sunday: { enabled: false, time: '09:00' },
  });

  // SEO
  useEffect(() => {
    document.title = 'Configuración WhatsApp | Hower Assistant';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Configura tu número de WhatsApp y horarios para recibir notificaciones de prospectos.';
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute('content', 'Configura tu número de WhatsApp y horarios para recibir notificaciones de prospectos.');
    }
  }, []);

  const handleSaveConfig = () => {
    // Aquí puedes agregar la lógica para guardar la configuración
    toast({
      title: "Configuración guardada",
      description: "Tu configuración de WhatsApp ha sido actualizada correctamente."
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="main-content">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => navigate('/tasks-to-do')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-3xl font-poppins font-bold text-foreground">
              Configuración WhatsApp
            </h1>
          </div>

          {/* Main Config Card */}
          <div 
            className="bg-white rounded-xl shadow-lg border-l-4 p-6 max-w-4xl mx-auto"
            style={{
              borderLeftColor: '#7a60ff',
              backgroundImage: `
                linear-gradient(90deg, #e5e7eb 1px, transparent 1px),
                linear-gradient(#f0fdf4 0%, #ffffff 100%)
              `,
              backgroundSize: '20px 1px, 100% 100%',
              backgroundPosition: '0 20px, 0 0'
            }}
          >
            <div className="text-center mb-6">
              <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
                <Phone className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-poppins font-bold text-gray-800">
                📱 Configuración de WhatsApp
              </h2>
              <p className="text-gray-600 mt-2">
                Configura tu número y horarios para recibir notificaciones
              </p>
            </div>

            {/* Número de WhatsApp */}
            <div className="mb-8">
              <Label htmlFor="whatsapp-number" className="text-sm font-poppins font-bold text-green-800">
                📞 Número de WhatsApp
              </Label>
              <Input
                id="whatsapp-number"
                type="tel"
                placeholder="+1 234 567 8900"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Incluye el código de país (ej: +52 para México)
              </p>
            </div>

            {/* Horarios por día */}
            <div className="mb-8">
              <h3 className="text-lg font-poppins font-bold text-green-800 mb-4">⏰ Horarios de Mensajes</h3>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona los días y horarios en que quieres recibir notificaciones
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(weekSchedule).map(([day, config]) => {
                  const dayNames = {
                    monday: 'Lunes',
                    tuesday: 'Martes', 
                    wednesday: 'Miércoles',
                    thursday: 'Jueves',
                    friday: 'Viernes',
                    saturday: 'Sábado',
                    sunday: 'Domingo'
                  };
                  
                  return (
                    <div key={day} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-poppins font-bold">
                          {dayNames[day as keyof typeof dayNames]}
                        </Label>
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(e) => {
                            setWeekSchedule(prev => ({
                              ...prev,
                              [day]: { ...prev[day as keyof typeof prev], enabled: e.target.checked }
                            }));
                          }}
                          className="rounded"
                        />
                      </div>
                      <Input
                        type="time"
                        value={config.time}
                        onChange={(e) => {
                          setWeekSchedule(prev => ({
                            ...prev,
                            [day]: { ...prev[day as keyof typeof prev], time: e.target.value }
                          }));
                        }}
                        disabled={!config.enabled}
                        className="text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botón guardar */}
            <div className="text-center">
              <Button 
                onClick={handleSaveConfig}
                className="bg-green-600 hover:bg-green-700 text-white font-poppins px-8 py-3"
              >
                <Settings className="h-5 w-5 mr-2" />
                Guardar Configuración
              </Button>
            </div>
          </div>

          {/* Info adicional */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-poppins font-bold text-blue-800 mb-2">
                💡 ¿Cómo funciona?
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Recibirás mensajes cuando tengas nuevos prospectos pendientes</li>
                <li>• Solo en los días y horarios que configures</li>
                <li>• Los mensajes incluirán un resumen de tus tareas del día</li>
                <li>• Puedes pausar las notificaciones en cualquier momento</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConfig;