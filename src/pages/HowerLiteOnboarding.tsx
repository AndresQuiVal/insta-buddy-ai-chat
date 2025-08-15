import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Instagram, MessageCircle, Clock, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { initiateInstagramAuth } from "@/services/instagramService";

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
    phone: "",
    morning_time: "09:00",
    afternoon_time: "15:00",
    evening_time: "19:00"
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInstagramConnect = () => {
    const success = initiateInstagramAuth();
    if (success) {
      setInstagramConnected(true);
      toast({
        title: "✅ Instagram conectado",
        description: "Tu cuenta se ha vinculado correctamente"
      });
    } else {
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
        return whatsappData.phone;
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
            <p className="text-gray-600 max-w-md mx-auto">
              Necesitamos acceso a tu cuenta de Instagram para analizar tus seguidores y encontrar prospectos ideales.
            </p>
            
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

            <div>
              <Label htmlFor="phone">Número de WhatsApp *</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                value={whatsappData.phone}
                onChange={(e) => setWhatsappData({...whatsappData, phone: e.target.value})}
              />
            </div>

            <div>
              <Label className="text-lg font-medium mb-4 block">Horarios preferidos para recordatorios</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="morning_time" className="text-sm">Mañana</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <Input
                      id="morning_time"
                      type="time"
                      value={whatsappData.morning_time}
                      onChange={(e) => setWhatsappData({...whatsappData, morning_time: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="afternoon_time" className="text-sm">Tarde</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <Input
                      id="afternoon_time"
                      type="time"
                      value={whatsappData.afternoon_time}
                      onChange={(e) => setWhatsappData({...whatsappData, afternoon_time: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="evening_time" className="text-sm">Noche</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <Input
                      id="evening_time"
                      type="time"
                      value={whatsappData.evening_time}
                      onChange={(e) => setWhatsappData({...whatsappData, evening_time: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-blue-600">💡</span>
                <span className="font-medium text-blue-800">Tip:</span>
              </div>
              <p className="text-blue-700 text-sm">
                Los recordatorios te ayudarán a mantener la consistencia en tu prospección. 
                Recibirás mensajes motivacionales y recordatorios de tareas pendientes.
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
              src="/src/assets/hower-logo.png"
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