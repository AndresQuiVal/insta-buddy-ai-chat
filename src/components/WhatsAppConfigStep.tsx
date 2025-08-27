import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Phone, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppConfigStepProps {
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
}

const WhatsAppConfigStep: React.FC<WhatsAppConfigStepProps> = ({ onBack, onNext, loading }) => {
  const { toast } = useToast();
  const [countryCode, setCountryCode] = useState('+52');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [timezone, setTimezone] = useState('');
  const [detectedTimezone, setDetectedTimezone] = useState('');
  const [saving, setSaving] = useState(false);
  const [weekSchedule, setWeekSchedule] = useState({
    monday: { enabled: true, time: '09:00' },
    tuesday: { enabled: true, time: '09:00' },
    wednesday: { enabled: true, time: '09:00' },
    thursday: { enabled: true, time: '09:00' },
    friday: { enabled: true, time: '09:00' },
    saturday: { enabled: false, time: '09:00' },
    sunday: { enabled: false, time: '09:00' },
  });

  // Detect user's timezone automatically
  useEffect(() => {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTimezone(userTimezone);
      setTimezone(userTimezone);
    } catch (error) {
      console.error('Error detecting timezone:', error);
      setDetectedTimezone('America/Mexico_City');
      setTimezone('America/Mexico_City');
    }
  }, []);

  const countryCodes = [
    { value: '+52', label: '🇲🇽 +52', country: 'México' },
    { value: '+1', label: '🇺🇸 +1', country: 'Estados Unidos' },
    { value: '+54', label: '🇦🇷 +54', country: 'Argentina' },
    { value: '+55', label: '🇧🇷 +55', country: 'Brasil' },
    { value: '+57', label: '🇨🇴 +57', country: 'Colombia' },
    { value: '+51', label: '🇵🇪 +51', country: 'Perú' },
    { value: '+56', label: '🇨🇱 +56', country: 'Chile' },
    { value: '+58', label: '🇻🇪 +58', country: 'Venezuela' },
    { value: '+593', label: '🇪🇨 +593', country: 'Ecuador' },
    { value: '+34', label: '🇪🇸 +34', country: 'España' },
  ];

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
  ];

  const getDayOfWeek = (dayName: string): number => {
    const days: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    return days[dayName];
  };

  const handleSaveWhatsApp = async () => {
    try {
      if (!phoneNumber.trim()) {
        toast({
          title: "Error",
          description: "Por favor ingresa tu número de WhatsApp",
          variant: "destructive"
        });
        return;
      }

      setSaving(true);
      
      // Get Instagram user ID
      const instagramUserData = localStorage.getItem('hower-instagram-user');
      if (!instagramUserData) {
        throw new Error('No se encontró usuario de Instagram');
      }
      
      const instagramUser = JSON.parse(instagramUserData);
      const instagramUserId = instagramUser.instagram?.id || instagramUser.facebook?.id;
      
      if (!instagramUserId) {
        throw new Error('No se encontró ID de Instagram');
      }

      const fullNumber = countryCode + phoneNumber;

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
        throw settingsError;
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
          throw scheduleError;
        }
      }

      toast({
        title: "✅ WhatsApp configurado",
        description: "Recibirás notificaciones automáticas de prospección"
      });

      // Proceed to next step
      onNext();

    } catch (error) {
      console.error('Error saving WhatsApp configuration:', error);
      toast({
        title: "Error",
        description: "No se pudo configurar WhatsApp. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Phone className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold">
          Configura notificaciones WhatsApp
        </CardTitle>
        <p className="text-muted-foreground">
          Nunca más olvides hacer seguimiento a tus prospectos
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* WhatsApp Number */}
        <div>
          <Label htmlFor="whatsapp-number" className="text-sm font-medium mb-2 block">
            📞 Número de WhatsApp
          </Label>
          <div className="flex gap-2">
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="País" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50 max-h-60 overflow-auto">
                {countryCodes.map((code) => (
                  <SelectItem key={code.value} value={code.value} className="hover:bg-gray-100 cursor-pointer">
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
          <p className="text-xs text-muted-foreground mt-1">
            Tu número completo será: {countryCode} {phoneNumber}
          </p>
        </div>

        {/* Timezone */}
        <div>
          <Label htmlFor="timezone" className="text-sm font-medium mb-2 block">
            🌍 Zona Horaria
          </Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu zona horaria" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50 max-h-60 overflow-auto">
              {commonTimezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value} className="hover:bg-gray-100 cursor-pointer">
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {detectedTimezone && (
            <p className="text-xs text-muted-foreground mt-1">
              🔍 Detectada automáticamente: {detectedTimezone}
            </p>
          )}
        </div>

        {/* Weekly Schedule */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            📅 Horarios de notificación
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(weekSchedule).map(([day, config]) => (
              <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={day}
                    checked={config.enabled}
                    onChange={(e) => setWeekSchedule(prev => ({
                      ...prev,
                      [day]: { ...prev[day as keyof typeof prev], enabled: e.target.checked }
                    }))}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor={day} className="text-sm font-medium capitalize">
                    {day === 'monday' ? 'Lunes' :
                     day === 'tuesday' ? 'Martes' :
                     day === 'wednesday' ? 'Miércoles' :
                     day === 'thursday' ? 'Jueves' :
                     day === 'friday' ? 'Viernes' :
                     day === 'saturday' ? 'Sábado' : 'Domingo'}
                  </label>
                </div>
                <Input
                  type="time"
                  value={config.time}
                  onChange={(e) => setWeekSchedule(prev => ({
                    ...prev,
                    [day]: { ...prev[day as keyof typeof prev], time: e.target.value }
                  }))}
                  disabled={!config.enabled}
                  className="w-20 text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={handleSkip}
              variant="ghost"
              disabled={saving || loading}
            >
              Saltar por ahora
            </Button>
            <Button
              onClick={handleSaveWhatsApp}
              disabled={saving || loading}
              className="flex items-center gap-2"
            >
              {saving || loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Configurar y Continuar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppConfigStep;