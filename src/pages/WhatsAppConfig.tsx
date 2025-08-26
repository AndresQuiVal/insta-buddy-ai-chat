import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const WhatsAppConfig: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weekSchedule, setWeekSchedule] = useState({
    monday: { enabled: false, time: '09:00' },
    tuesday: { enabled: false, time: '09:00' },
    wednesday: { enabled: false, time: '09:00' },
    thursday: { enabled: false, time: '09:00' },
    friday: { enabled: false, time: '09:00' },
    saturday: { enabled: false, time: '09:00' },
    sunday: { enabled: false, time: '09:00' },
  });
  const [userTimezone, setUserTimezone] = useState('');
  const [detectedTimezone, setDetectedTimezone] = useState('');

  // Load existing configuration
  useEffect(() => {
    // Detect user timezone automatically
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setDetectedTimezone(detected);
    setUserTimezone(detected); // Set as default
    
    loadConfiguration();
    
    // SEO
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
  
  const loadConfiguration = async () => {
    try {
      setLoading(true);
      
      // Get current Instagram user - usar la clave correcta
      const instagramUserData = localStorage.getItem('hower-instagram-user');
      if (!instagramUserData) {
        toast({
          title: "Error",
          description: "No se encontró usuario de Instagram. Conéctate primero.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
      
      const instagramUser = JSON.parse(instagramUserData);
      console.log('Instagram user data:', instagramUser);
      
      // Obtener el instagram_user_id de la estructura correcta
      const instagramUserId = instagramUser.instagram?.id || instagramUser.facebook?.id;
      
      if (!instagramUserId) {
        toast({
          title: "Error",
          description: "No se encontró ID de Instagram. Reconéctate por favor.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
      
      console.log('Using Instagram user ID:', instagramUserId);
      
      // Load WhatsApp settings
      const { data: settings, error: settingsError } = await supabase
        .from('whatsapp_notification_settings')
        .select('*')
        .eq('instagram_user_id', instagramUserId)
        .maybeSingle();
        
      if (settingsError) {
        console.error('Error loading WhatsApp settings:', settingsError);
      } else if (settings) {
        setWhatsappNumber(settings.whatsapp_number || '');
        setUserTimezone(settings.timezone || detectedTimezone);
      }
      
      // Load schedule days
      const { data: scheduleDays, error: scheduleError } = await supabase
        .from('whatsapp_schedule_days')
        .select('*')
        .eq('instagram_user_id', instagramUserId);
        
      if (scheduleError) {
        console.error('Error loading schedule:', scheduleError);
      } else if (scheduleDays && scheduleDays.length > 0) {
        const newSchedule = { ...weekSchedule };
        scheduleDays.forEach(day => {
          const dayName = getDayName(day.day_of_week);
          if (dayName) {
            newSchedule[dayName as keyof typeof newSchedule] = {
              enabled: day.enabled,
              time: day.notification_time.substring(0, 5) // HH:MM format
            };
          }
        });
        setWeekSchedule(newSchedule);
      }
      
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({
        title: "Error",
        description: "Error al cargar la configuración",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getDayName = (dayOfWeek: number): string | null => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayOfWeek] || null;
  };
  
  const getDayOfWeek = (dayName: string): number => {
    const days: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    return days[dayName];
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      
      // Get current Instagram user - usar la clave correcta
      const instagramUserData = localStorage.getItem('hower-instagram-user');
      if (!instagramUserData) {
        toast({
          title: "Error",
          description: "No se encontró usuario de Instagram",
          variant: "destructive"
        });
        return;
      }
      
      const instagramUser = JSON.parse(instagramUserData);
      const instagramUserId = instagramUser.instagram?.id || instagramUser.facebook?.id;
      
      if (!instagramUserId) {
        toast({
          title: "Error",  
          description: "No se encontró ID de Instagram. Reconéctate por favor.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('Saving config for Instagram user ID:', instagramUserId);
      
      // Validate WhatsApp number
      if (!whatsappNumber.trim()) {
        toast({
          title: "Error",
          description: "Por favor ingresa tu número de WhatsApp",
          variant: "destructive"
        });
        return;
      }
      
      // Check if user exists in whatsapp_notification_settings
      const { data: existingSettings } = await supabase
        .from('whatsapp_notification_settings')
        .select('id')
        .eq('instagram_user_id', instagramUserId)
        .maybeSingle();
      
      // Save or update WhatsApp settings
      const settingsData = {
        instagram_user_id: instagramUserId,
        whatsapp_number: whatsappNumber.trim(),
        enabled: true,
        notification_time: '09:00:00',
        notification_days: [1, 2, 3, 4, 5], // Default Monday to Friday
        timezone: userTimezone
      };
      
      let settingsError;
      if (existingSettings) {
        // Update existing
        const { error } = await supabase
          .from('whatsapp_notification_settings')
          .update(settingsData)
          .eq('instagram_user_id', instagramUserId);
        settingsError = error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('whatsapp_notification_settings')
          .insert(settingsData);
        settingsError = error;
      }
        
      if (settingsError) {
        console.error('Error saving WhatsApp settings:', settingsError);
        toast({
          title: "Error",
          description: `Error al guardar la configuración de WhatsApp: ${settingsError.message}`,
          variant: "destructive"
        });
        return;
      }
      
      // Delete existing schedule days for this user
      await supabase
        .from('whatsapp_schedule_days')
        .delete()
        .eq('instagram_user_id', instagramUserId);
      
      // Save new schedule days
      const scheduleDaysToInsert = Object.entries(weekSchedule)
        .filter(([, config]) => config.enabled)
        .map(([dayName, config]) => ({
          instagram_user_id: instagramUserId,
          day_of_week: getDayOfWeek(dayName),
          enabled: true,
          notification_time: `${config.time}:00`
        }));
      
      if (scheduleDaysToInsert.length > 0) {
        const { error: scheduleError } = await supabase
          .from('whatsapp_schedule_days')
          .insert(scheduleDaysToInsert);
          
        if (scheduleError) {
          console.error('Error saving schedule:', scheduleError);
          toast({
            title: "Error",
            description: "Error al guardar los horarios",
            variant: "destructive"
          });
          return;
        }
      }
      
      toast({
        title: "✅ Configuración guardada",
        description: "Tu configuración de WhatsApp ha sido actualizada correctamente."
      });
      
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "Error al guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
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

            {/* Zona Horaria */}
            <div className="mb-8">
              <Label htmlFor="timezone" className="text-sm font-poppins font-bold text-green-800">
                🌍 Zona Horaria
              </Label>
              <div className="mt-2 space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Detectado automáticamente:</span> {detectedTimezone}
                  </p>
                </div>
                <select
                  id="timezone"
                  value={userTimezone}
                  onChange={(e) => setUserTimezone(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                >
                  <option value="America/Mexico_City">🇲🇽 México (America/Mexico_City)</option>
                  <option value="America/New_York">🇺🇸 Nueva York (America/New_York)</option>
                  <option value="America/Los_Angeles">🇺🇸 Los Ángeles (America/Los_Angeles)</option>
                  <option value="America/Chicago">🇺🇸 Chicago (America/Chicago)</option>
                  <option value="America/Denver">🇺🇸 Denver (America/Denver)</option>
                  <option value="America/Bogota">🇨🇴 Bogotá (America/Bogota)</option>
                  <option value="America/Lima">🇵🇪 Lima (America/Lima)</option>
                  <option value="America/Argentina/Buenos_Aires">🇦🇷 Buenos Aires (America/Argentina/Buenos_Aires)</option>
                  <option value="America/Santiago">🇨🇱 Santiago (America/Santiago)</option>
                  <option value="Europe/Madrid">🇪🇸 Madrid (Europe/Madrid)</option>
                  <option value="Europe/London">🇬🇧 Londres (Europe/London)</option>
                  <option value="Europe/Paris">🇫🇷 París (Europe/Paris)</option>
                  <option value="Europe/Berlin">🇩🇪 Berlín (Europe/Berlin)</option>
                  <option value="Asia/Tokyo">🇯🇵 Tokio (Asia/Tokyo)</option>
                  <option value="Australia/Sydney">🇦🇺 Sidney (Australia/Sydney)</option>
                  <option value={detectedTimezone}>{detectedTimezone !== userTimezone ? `🔄 Usar detectado: ${detectedTimezone}` : '✅ Zona detectada'}</option>
                </select>
                <p className="text-xs text-gray-500">
                  Las notificaciones se enviarán según esta zona horaria
                </p>
              </div>
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
                disabled={saving || loading}
                className="bg-green-600 hover:bg-green-700 text-white font-poppins px-8 py-3"
              >
                <Settings className="h-5 w-5 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Configuración'}
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