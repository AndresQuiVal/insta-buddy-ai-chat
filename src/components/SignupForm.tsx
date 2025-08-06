import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    niche: '',
    nicheDetail: '',
    countryCode: '+52',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.name || !formData.email || !formData.niche || !formData.phone || !formData.countryCode || 
        ((formData.niche === 'coach' || formData.niche === 'otro' || formData.niche === 'infoproductor') && !formData.nicheDetail)) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Guardar datos en la base de datos
      const { error } = await supabase
        .from('profiles')
        .insert({
          name: formData.name,
          email: formData.email,
          niche: formData.niche,
          niche_detail: formData.nicheDetail || null,
          country_code: formData.countryCode,
          phone: formData.phone
        });

      if (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "Error al registrar",
          description: error.message || "Hubo un problema al guardar tus datos",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "¡Registro exitoso!",
        description: "Ahora conecta tu cuenta de Instagram para continuar",
      });
      
      // Redirigir a la página principal
      navigate('/');
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un problema al procesar tu registro",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <Card className="bg-white/90 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              ¡Comienza ahora!
            </h1>
            <p className="text-gray-600 text-lg mb-2">
              Prueba gratuita de 7 días
            </p>
            <p className="text-sm text-gray-500">
              Sin compromiso, cancela cuando quieras
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-gray-700 font-medium">
                Nombre completo
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-2 rounded-xl border-gray-200 focus:border-purple-500"
                placeholder="Tu nombre"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-2 rounded-xl border-gray-200 focus:border-purple-500"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <Label className="text-gray-700 font-medium">
                ¿De qué nicho vienes?
              </Label>
              <Select 
                onValueChange={(value) => setFormData(prev => ({ ...prev, niche: value, nicheDetail: '' }))} 
                value={formData.niche}
              >
                <SelectTrigger className="mt-2 rounded-xl border-gray-200 focus:border-purple-500">
                  <SelectValue placeholder="Selecciona tu nicho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coach">Coach - Mentor</SelectItem>
                  <SelectItem value="infoproductor">Infoproductor</SelectItem>
                  <SelectItem value="trafficker">Trafficker</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campo condicional para especificar el nicho */}
            {(formData.niche === 'coach' || formData.niche === 'otro') && (
              <div>
                <Label className="text-gray-700 font-medium">
                  {formData.niche === 'coach' ? '¿Coach/mentor de qué nicho?' : 'Especifica tu nicho'}
                </Label>
                <Input 
                  placeholder={formData.niche === 'coach' ? 'Ej: Fitness, Business, Life Coach...' : 'Describe tu nicho...'}
                  onChange={(e) => setFormData(prev => ({ ...prev, nicheDetail: e.target.value }))}
                  value={formData.nicheDetail}
                  className="mt-2 rounded-xl border-gray-200 focus:border-purple-500"
                  required
                />
              </div>
            )}

            {formData.niche === 'infoproductor' && (
              <div>
                <Label className="text-gray-700 font-medium">
                  ¿Qué tipo de infoproductos vendes?
                </Label>
                <Input 
                  placeholder="Ej: Cursos de marketing, ebooks, masterclasses..."
                  onChange={(e) => setFormData(prev => ({ ...prev, nicheDetail: e.target.value }))}
                  value={formData.nicheDetail}
                  className="mt-2 rounded-xl border-gray-200 focus:border-purple-500"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                Número de teléfono
              </Label>
              <div className="flex gap-2 mt-2">
                <Select 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))} 
                  value={formData.countryCode}
                >
                  <SelectTrigger className="w-32 rounded-xl border-gray-200 focus:border-purple-500">
                    <SelectValue placeholder="Código" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+1">🇺🇸 +1</SelectItem>
                    <SelectItem value="+52">🇲🇽 +52</SelectItem>
                    <SelectItem value="+34">🇪🇸 +34</SelectItem>
                    <SelectItem value="+54">🇦🇷 +54</SelectItem>
                    <SelectItem value="+57">🇨🇴 +57</SelectItem>
                    <SelectItem value="+51">🇵🇪 +51</SelectItem>
                    <SelectItem value="+56">🇨🇱 +56</SelectItem>
                    <SelectItem value="+598">🇺🇾 +598</SelectItem>
                    <SelectItem value="+506">🇨🇷 +506</SelectItem>
                    <SelectItem value="+507">🇵🇦 +507</SelectItem>
                    <SelectItem value="+503">🇸🇻 +503</SelectItem>
                    <SelectItem value="+504">🇭🇳 +504</SelectItem>
                    <SelectItem value="+502">🇬🇹 +502</SelectItem>
                    <SelectItem value="+505">🇳🇮 +505</SelectItem>
                    <SelectItem value="+591">🇧🇴 +591</SelectItem>
                    <SelectItem value="+593">🇪🇨 +593</SelectItem>
                    <SelectItem value="+595">🇵🇾 +595</SelectItem>
                    <SelectItem value="+58">🇻🇪 +58</SelectItem>
                    <SelectItem value="+1809">🇩🇴 +1809</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="flex-1 rounded-xl border-gray-200 focus:border-purple-500"
                  placeholder="1234567890"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Para recibir soporte personalizado en WhatsApp. No recibirás promocionales, solo ayuda cuando la necesites.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
            >
              {isSubmitting ? 'Procesando...' : 'Comenzar prueba gratuita'}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            Al registrarte aceptas nuestros términos y condiciones
          </p>
        </Card>
      </div>
    </div>
  );
};

export default SignupForm;