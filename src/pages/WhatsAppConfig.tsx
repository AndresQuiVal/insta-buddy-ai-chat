import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Phone, Settings, ArrowLeft, Globe, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const WhatsAppConfig: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+52');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timezone, setTimezone] = useState('');
  const [detectedTimezone, setDetectedTimezone] = useState('');
  const [copyTimeDialogOpen, setCopyTimeDialogOpen] = useState(false);
  const [timeToApply, setTimeToApply] = useState('');
  const [weekSchedule, setWeekSchedule] = useState({
    monday: { enabled: false, time: '09:00' },
    tuesday: { enabled: false, time: '09:00' },
    wednesday: { enabled: false, time: '09:00' },
    thursday: { enabled: false, time: '09:00' },
    friday: { enabled: false, time: '09:00' },
    saturday: { enabled: false, time: '09:00' },
    sunday: { enabled: false, time: '09:00' },
  });

  // Detect user's timezone automatically
  useEffect(() => {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTimezone(userTimezone);
      setTimezone(userTimezone); // Set as default
      console.log('Detected timezone:', userTimezone);
    } catch (error) {
      console.error('Error detecting timezone:', error);
      setDetectedTimezone('America/Mexico_City'); // Fallback
      setTimezone('America/Mexico_City');
    }
  }, []);

  // Load existing configuration
  useEffect(() => {
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
        const fullNumber = settings.whatsapp_number || '';
        setWhatsappNumber(fullNumber);
        // Extract country code and number
        if (fullNumber.startsWith('+')) {
          const match = fullNumber.match(/^(\+\d{1,4})(.*)$/);
          if (match) {
            setCountryCode(match[1]);
            setPhoneNumber(match[2]);
          }
        } else {
          setPhoneNumber(fullNumber);
        }
        setTimezone(settings.timezone || detectedTimezone);
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
      const fullNumber = countryCode + phoneNumber;
      if (!phoneNumber.trim()) {
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
        whatsapp_number: fullNumber.trim(),
        enabled: true,
        notification_time: '09:00:00',
        notification_days: [1, 2, 3, 4, 5], // Default Monday to Friday
        timezone: timezone
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

  // Country codes for phone numbers
  const countryCodes = [
    { value: '+52', label: '🇲🇽 México (+52)', country: 'México' },
    { value: '+1', label: '🇺🇸 Estados Unidos (+1)', country: 'Estados Unidos' },
    { value: '+54', label: '🇦🇷 Argentina (+54)', country: 'Argentina' },
    { value: '+55', label: '🇧🇷 Brasil (+55)', country: 'Brasil' },
    { value: '+57', label: '🇨🇴 Colombia (+57)', country: 'Colombia' },
    { value: '+51', label: '🇵🇪 Perú (+51)', country: 'Perú' },
    { value: '+56', label: '🇨🇱 Chile (+56)', country: 'Chile' },
    { value: '+58', label: '🇻🇪 Venezuela (+58)', country: 'Venezuela' },
    { value: '+593', label: '🇪🇨 Ecuador (+593)', country: 'Ecuador' },
    { value: '+34', label: '🇪🇸 España (+34)', country: 'España' },
    { value: '+44', label: '🇬🇧 Reino Unido (+44)', country: 'Reino Unido' },
    { value: '+33', label: '🇫🇷 Francia (+33)', country: 'Francia' },
    { value: '+49', label: '🇩🇪 Alemania (+49)', country: 'Alemania' },
    { value: '+39', label: '🇮🇹 Italia (+39)', country: 'Italia' },
  ];

  // Common timezones for the selector
  const commonTimezones = [
    { value: 'America/Mexico_City', label: 'México (UTC-6)' },
    { value: 'America/New_York', label: 'Nueva York (UTC-5)' },
    { value: 'America/Chicago', label: 'Chicago (UTC-6)' },
    { value: 'America/Denver', label: 'Denver (UTC-7)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (UTC-3)' },
    { value: 'America/Lima', label: 'Lima (UTC-5)' },
    { value: 'America/Bogota', label: 'Bogotá (UTC-5)' },
    { value: 'Europe/Madrid', label: 'Madrid (UTC+1)' },
    { value: 'Europe/London', label: 'Londres (UTC+0)' },
    { value: 'Europe/Paris', label: 'París (UTC+1)' },
    { value: 'Asia/Tokyo', label: 'Tokio (UTC+9)' },
  ];

  // Copy time to all active days function
  const copyTimeToActiveDays = () => {
    if (!timeToApply) return;
    
    setWeekSchedule(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(day => {
        if (updated[day as keyof typeof updated].enabled) {
          updated[day as keyof typeof updated].time = timeToApply;
        }
      });
      return updated;
    });
    
    setCopyTimeDialogOpen(false);
    setTimeToApply('');
    
    toast({
      title: "✅ Horario copiado",
      description: "Se aplicó el horario a todos los días activos"
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
              <div className="flex gap-2 mt-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Código país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map((code) => (
                      <SelectItem key={code.value} value={code.value}>
                        {code.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="whatsapp-number"
                  type="tel"
                  placeholder="234 567 8900"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tu número completo será: {countryCode} {phoneNumber}
              </p>
            </div>

            {/* Zona Horaria */}
            <div className="mb-8">
              <Label htmlFor="timezone" className="text-sm font-poppins font-bold text-green-800">
                🌍 Zona Horaria
              </Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecciona tu zona horaria" />
                </SelectTrigger>
                <SelectContent>
                  {commonTimezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <Globe className="h-3 w-3" />
                <span>
                  Detectado automáticamente: {detectedTimezone}
                  {timezone === detectedTimezone && " (seleccionado)"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Los mensajes se enviarán según esta zona horaria
              </p>
            </div>

            {/* Horarios por día */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-poppins font-bold text-green-800">⏰ Horarios de Mensajes</h3>
                  <p className="text-sm text-gray-600">
                    Selecciona los días y horarios en que quieres recibir notificaciones
                  </p>
                </div>
                <Dialog open={copyTimeDialogOpen} onOpenChange={setCopyTimeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => {
                        // Get the first active day's time as default
                        const firstActiveTime = Object.values(weekSchedule).find(config => config.enabled)?.time || '09:00';
                        setTimeToApply(firstActiveTime);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Copiar horario
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Copiar horario a todos los días activos</DialogTitle>
                      <DialogDescription>
                        ¿Quieres aplicar este horario a todos los días que están activos?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="time-to-copy" className="text-sm font-medium">
                        Horario a aplicar:
                      </Label>
                      <Input
                        id="time-to-copy"
                        type="time"
                        value={timeToApply}
                        onChange={(e) => setTimeToApply(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCopyTimeDialogOpen(false)}>
                        No
                      </Button>
                      <Button onClick={copyTimeToActiveDays} className="bg-green-600 hover:bg-green-700">
                        Sí, aplicar horario
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
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
                      <div className="flex gap-2 items-center">
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
                          className="text-sm flex-1"
                        />
                        {config.enabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTimeToApply(config.time);
                              setCopyTimeDialogOpen(true);
                            }}
                            className="p-2"
                            title="Copiar este horario a todos los días activos"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
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