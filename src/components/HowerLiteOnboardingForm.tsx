import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, Mail, User, Globe } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  niche: string;
  nicheDetail: string;
}

interface HowerLiteOnboardingFormProps {
  onComplete?: (data: FormData) => void;
  instagramUserId?: string;
}

const countries = [
  { code: '+1', name: 'Estados Unidos / Canadá', flag: '🇺🇸' },
  { code: '+52', name: 'México', flag: '🇲🇽' },
  { code: '+34', name: 'España', flag: '🇪🇸' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: '+51', name: 'Perú', flag: '🇵🇪' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' },
];

const niches = [
  'Coaching',
  'Consultoria',
  'Marketing Digital',
  'Bienes Raíces',
  'Fitness',
  'Nutrición',
  'Educación Online',
  'E-commerce',
  'Servicios Profesionales',
  'Otro'
];

export default function HowerLiteOnboardingForm({ onComplete, instagramUserId }: HowerLiteOnboardingFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    countryCode: '+52',
    niche: '',
    nicheDetail: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push('Nombre es requerido');
    if (!formData.email.trim()) errors.push('Email es requerido');
    if (!formData.phone.trim()) errors.push('Teléfono es requerido');
    if (!formData.niche) errors.push('Nicho es requerido');
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Email no válido');
    }
    
    // Validar teléfono (solo números)
    const phoneRegex = /^\d+$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      errors.push('Teléfono debe contener solo números');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }

    if (!instagramUserId) {
      toast.error('Error: No se pudo identificar el usuario de Instagram');
      return;
    }

    setLoading(true);

    try {
      // Guardar perfil de Hower Lite
      const { error: profileError } = await supabase
        .from('hower_lite_profiles')
        .insert({
          instagram_user_id: instagramUserId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone.replace(/\s/g, ''),
          country_code: formData.countryCode,
          niche: formData.niche,
          niche_detail: formData.nicheDetail
        });

      if (profileError) {
        // Si ya existe, actualizar
        const { error: updateError } = await supabase
          .from('hower_lite_profiles')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone.replace(/\s/g, ''),
            country_code: formData.countryCode,
            niche: formData.niche,
            niche_detail: formData.nicheDetail
          })
          .eq('instagram_user_id', instagramUserId);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }
      }

      // Crear configuración de WhatsApp por defecto
      const { error: whatsappError } = await supabase
        .from('whatsapp_notification_settings')
        .insert({
          instagram_user_id: instagramUserId,
          enabled: true,
          notification_time: '09:00:00',
          notification_days: [1, 2, 3, 4, 5], // Lunes a viernes
          timezone: 'America/Mexico_City'
        });

      if (whatsappError && whatsappError.code !== '23505') { // 23505 = unique constraint violation
        console.error('Error creating WhatsApp settings:', whatsappError);
        // No fallar por esto, solo logear
      }

      toast.success('¡Perfil guardado exitosamente!');
      onComplete?.(formData);

    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar el perfil. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Configurar tu perfil Hower Lite
        </CardTitle>
        <CardDescription>
          Completa tu información para comenzar a usar Hower Lite y recibir notificaciones de WhatsApp
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Información Personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Tu nombre completo"
                  disabled={loading}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="tu@email.com"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <Label htmlFor="phone">Teléfono WhatsApp *</Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.countryCode} 
                  onValueChange={(value) => handleInputChange('countryCode', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <span className="flex items-center gap-2">
                          {country.flag} {country.code}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="123456789"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Número donde recibirás las notificaciones diarias
              </p>
            </div>
          </div>

          {/* Información de Negocio */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Información de Negocio
            </h3>
            
            <div>
              <Label htmlFor="niche">¿A qué te dedicas? *</Label>
              <Select 
                value={formData.niche} 
                onValueChange={(value) => handleInputChange('niche', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu nicho" />
                </SelectTrigger>
                <SelectContent>
                  {niches.map((niche) => (
                    <SelectItem key={niche} value={niche}>
                      {niche}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.niche === 'Otro' && (
              <div>
                <Label htmlFor="nicheDetail">Especifica tu nicho</Label>
                <Input
                  id="nicheDetail"
                  value={formData.nicheDetail}
                  onChange={(e) => handleInputChange('nicheDetail', e.target.value)}
                  placeholder="Describe a qué te dedicas"
                  disabled={loading}
                />
              </div>
            )}

            {formData.niche && formData.niche !== 'Otro' && (
              <div>
                <Label htmlFor="nicheDetail">Detalles adicionales (opcional)</Label>
                <Textarea
                  id="nicheDetail"
                  value={formData.nicheDetail}
                  onChange={(e) => handleInputChange('nicheDetail', e.target.value)}
                  placeholder="Cuéntanos más sobre tu negocio..."
                  rows={3}
                  disabled={loading}
                />
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar y Continuar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}