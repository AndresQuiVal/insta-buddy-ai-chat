import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Instagram, MessageCircle, Clock, ArrowRight, ArrowLeft, CheckCircle, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { initiateInstagramAuth } from "@/services/instagramService";
import howerLogo from "@/assets/hower-logo.png";

const HowerLiteOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [clientData, setClientData] = useState({
    age: "",
    gender: "",
    pain_points: "",
    hobbies: "",
    location: "",
    income_level: ""
  });
  const [whatsappData, setWhatsappData] = useState({
    countryCode: "+52",
    phone: "",
    time: "09:00",
    days: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    }
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Verificar si ya regresó exitosamente del auth de Instagram
    const instagramAuthSuccess = localStorage.getItem('instagram_auth_success');
    if (instagramAuthSuccess === 'true') {
      console.log('🎉 Detectado auth exitoso de Instagram, actualizando estado...');
      setInstagramConnected(true);
      setCurrentStep(2);
      localStorage.removeItem('instagram_auth_success'); // Limpiar flag
      toast({
        title: "✅ Instagram conectado",
        description: "Tu cuenta se ha vinculado correctamente"
      });
    }

    // Escuchar cuando regrese del auth de Instagram (fallback)
    const handleInstagramAuthSuccess = () => {
      console.log('🎉 Evento instagram-auth-success recibido');
      setInstagramConnected(true);
      setCurrentStep(2);
      toast({
        title: "✅ Instagram conectado",
        description: "Tu cuenta se ha vinculado correctamente"
      });
    };

    window.addEventListener('instagram-auth-success', handleInstagramAuthSuccess);
    
    return () => {
      window.removeEventListener('instagram-auth-success', handleInstagramAuthSuccess);
    };
  }, [toast]);

  const handleInstagramConnect = () => {
    console.log('🔗 Iniciando conexión con Instagram desde onboarding...');
    // Marcar que venimos del onboarding
    localStorage.setItem('instagram_auth_source', 'onboarding');
    const success = initiateInstagramAuth();
    if (!success) {
      toast({
        title: "Error",
        description: "No se pudo conectar con Instagram",
        variant: "destructive"
      });
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Guardar datos y navegar a tasks-to-do
      localStorage.setItem('hower_lite_setup_complete', 'true');
      localStorage.setItem('ideal_client_data', JSON.stringify(clientData));
      localStorage.setItem('whatsapp_config', JSON.stringify(whatsappData));
      
      toast({
        title: "🎉 ¡Configuración completada!",
        description: "Ya puedes comenzar a prospectar con Hower LITE"
      });
      navigate('/tasks-to-do');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return instagramConnected;
      case 2:
        return clientData.age && clientData.gender && clientData.pain_points;
      case 3:
        return whatsappData.phone && Object.values(whatsappData.days).some(day => day);
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
              <Instagram className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Conecta tu Instagram</h2>
            
            {!instagramConnected ? (
              <Button
                onClick={handleInstagramConnect}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3"
                size="lg"
              >
                <Instagram className="w-5 h-5 mr-2" />
                Conectar Instagram
              </Button>
            ) : (
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="w-6 h-6" />
                <span className="font-medium">Instagram conectado correctamente</span>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-100 to-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Describe tu Cliente Ideal</h2>
              <p className="text-gray-600">Mientras más específico seas, mejores prospectos encontraremos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Edad promedio</Label>
                <Input
                  id="age"
                  placeholder="25-35 años"
                  value={clientData.age}
                  onChange={(e) => setClientData({...clientData, age: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="gender">Género</Label>
                <Input
                  id="gender"
                  placeholder="Mujeres, Hombres, Ambos"
                  value={clientData.gender}
                  onChange={(e) => setClientData({...clientData, gender: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pain_points">¿Cuáles son sus principales dolores/problemas? *</Label>
              <Textarea
                id="pain_points"
                placeholder="Ejemplo: Falta de tiempo para hacer ejercicio, estrés laboral, problemas de autoestima..."
                value={clientData.pain_points}
                onChange={(e) => setClientData({...clientData, pain_points: e.target.value})}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="hobbies">Hobbies e intereses</Label>
              <Input
                id="hobbies"
                placeholder="Fitness, viajes, lectura, tecnología..."
                value={clientData.hobbies}
                onChange={(e) => setClientData({...clientData, hobbies: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ciudad, País"
                  value={clientData.location}
                  onChange={(e) => setClientData({...clientData, location: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="income_level">Nivel de ingresos</Label>
                <Input
                  id="income_level"
                  placeholder="Bajo, Medio, Alto"
                  value={clientData.income_level}
                  onChange={(e) => setClientData({...clientData, income_level: e.target.value})}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Configura tus Recordatorios</h2>
              <p className="text-gray-600">La IA te enviará recordatorios para prospectar en los mejores momentos</p>
            </div>

            {/* Configuración de WhatsApp en formato cuaderno */}
            <div 
              className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200"
              style={{
                backgroundImage: 'linear-gradient(90deg, #e0e7ff 1px, transparent 1px)',
                backgroundSize: '20px 1px',
                backgroundPosition: '0 20px'
              }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <Phone className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-blue-800 font-mono">📱 Configuración de WhatsApp</h3>
              </div>
              
              {/* Número de WhatsApp con selector de país */}
              <div className="mb-4">
                <Label className="text-sm font-mono font-bold text-gray-700">Número de WhatsApp *</Label>
                <div className="flex space-x-2 mt-1">
                  <Select
                    value={whatsappData.countryCode}
                    onValueChange={(value) => setWhatsappData({...whatsappData, countryCode: value})}
                  >
                    <SelectTrigger className="w-24 bg-white font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+52">🇲🇽 +52</SelectItem>
                      <SelectItem value="+34">🇪🇸 +34</SelectItem>
                      <SelectItem value="+57">🇨🇴 +57</SelectItem>
                      <SelectItem value="+54">🇦🇷 +54</SelectItem>
                      <SelectItem value="+56">🇨🇱 +56</SelectItem>
                      <SelectItem value="+51">🇵🇪 +51</SelectItem>
                      <SelectItem value="+593">🇪🇨 +593</SelectItem>
                      <SelectItem value="+58">🇻🇪 +58</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="1234567890"
                    value={whatsappData.phone}
                    onChange={(e) => setWhatsappData({...whatsappData, phone: e.target.value})}
                    className="flex-1 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Días de la semana */}
              <div className="mb-4">
                <Label className="text-sm font-mono font-bold text-gray-700 mb-3 block">
                  📅 Días para recibir recordatorios *
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'monday', label: 'Lunes' },
                    { key: 'tuesday', label: 'Martes' },
                    { key: 'wednesday', label: 'Miércoles' },
                    { key: 'thursday', label: 'Jueves' },
                    { key: 'friday', label: 'Viernes' },
                    { key: 'saturday', label: 'Sábado' },
                    { key: 'sunday', label: 'Domingo' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2 bg-white p-2 rounded border">
                      <Checkbox
                        id={key}
                        checked={whatsappData.days[key as keyof typeof whatsappData.days]}
                        onCheckedChange={(checked) => 
                          setWhatsappData({
                            ...whatsappData, 
                            days: { ...whatsappData.days, [key]: checked }
                          })
                        }
                      />
                      <Label htmlFor={key} className="text-xs font-mono cursor-pointer">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hora preferida */}
              <div>
                <Label className="text-sm font-mono font-bold text-gray-700 mb-2 block">
                  🕐 Hora preferida para recordatorios
                </Label>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <Input
                    type="time"
                    value={whatsappData.time}
                    onChange={(e) => setWhatsappData({...whatsappData, time: e.target.value})}
                    className="bg-white font-mono max-w-32"
                  />
                  <span className="text-sm text-gray-500 font-mono">
                    ({new Date(`2000-01-01T${whatsappData.time}`).toLocaleTimeString('es-ES', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })})
                  </span>
                </div>
              </div>
            </div>

            {/* Tip motivacional */}
            <div 
              className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4"
              style={{
                backgroundImage: 'linear-gradient(90deg, #fef3c7 1px, transparent 1px)',
                backgroundSize: '20px 1px',
                backgroundPosition: '0 15px'
              }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-yellow-600 text-lg">🚀</span>
                <span className="font-bold font-mono text-yellow-800">¡Tip de éxito!</span>
              </div>
              <p className="text-yellow-700 text-sm font-mono">
                La constancia es clave en la prospección. Los recordatorios te ayudarán a mantener 
                el ritmo perfecto para convertir seguidores en clientes potenciales.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img
              src={howerLogo}
              alt="Hower"
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <span className="text-3xl font-poppins font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Hower
              </span>
              <span className="text-3xl font-handwriting ml-2 text-gray-700 transform -rotate-2 inline-block">
                LITE
              </span>
            </div>
          </div>
          <p className="text-gray-600 text-lg">Configuración inicial - Paso {currentStep} de 3</p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step <= currentStep
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="max-w-2xl mx-auto bg-white/90 backdrop-blur-lg border-0 shadow-2xl">
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="max-w-2xl mx-auto mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6"
          >
            {currentStep === 3 ? 'Completar' : 'Siguiente'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HowerLiteOnboarding;