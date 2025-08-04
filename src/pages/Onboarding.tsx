import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Instagram, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { initiateInstagramAuth, checkInstagramConnection } from '@/services/instagramService';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null); // null = checking, true = first time, false = returning user
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [connectedInstagramData, setConnectedInstagramData] = useState<any>(null);
  
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    niche: '',
    nicheDetail: '',
    phone: ''
  });
  
  const [onboardingData, setOnboardingData] = useState({
    personality: '',
    idealCustomer: {
      trait1: '',
      trait2: '',
      trait3: '',
      trait4: ''
    },
    instagramConnected: false
  });

  // Verificar si la cuenta de Instagram ya existe en la BD
  const checkExistingInstagramUser = async (instagramData: any) => {
    setIsCheckingUser(true);
    try {
      const instagramUserId = instagramData.instagram?.id;
      
      if (!instagramUserId) {
        setIsFirstTime(true);
        setIsCheckingUser(false);
        return;
      }

      const { data, error } = await supabase
        .from('instagram_users')
        .select('*')
        .eq('instagram_user_id', instagramUserId)
        .maybeSingle();

      if (error) {
        console.error('Error checking user:', error);
        setIsFirstTime(true);
      } else if (data) {
        // Usuario existente - saltar al paso de personalidad
        setIsFirstTime(false);
        setStep(3); // Saltar directo al paso de personalidad
        toast({
          title: "¡Bienvenido de vuelta!",
          description: "Tu cuenta ya está registrada. Continúa configurando tu asistente."
        });
      } else {
        // Primera vez - mostrar signup
        setIsFirstTime(true);
        setStep(2); // Ir al paso de signup
      }
    } catch (error) {
      console.error('Error:', error);
      setIsFirstTime(true);
    } finally {
      setIsCheckingUser(false);
    }
  };

  useEffect(() => {
    // Verificar si ya hay una conexión a Instagram
    if (step === 1) {
      const savedUserData = localStorage.getItem('hower-instagram-user');
      if (savedUserData) {
        const userData = JSON.parse(savedUserData);
        setConnectedInstagramData(userData);
        setOnboardingData(prev => ({
          ...prev,
          instagramConnected: true
        }));
        
        // Verificar si es primera vez
        checkExistingInstagramUser(userData);
      }
    }
  }, [step]);

  const handleNext = async () => {
    if (step === 2 && isFirstTime) {
      // Guardar datos de signup en la BD
      try {
        const { error } = await supabase
          .from('profiles')
          .insert({
            name: signupData.name,
            email: signupData.email,
            niche: signupData.niche,
            niche_detail: signupData.nicheDetail || null,
            phone: signupData.phone
          });

        if (error) {
          toast({
            title: "Error al guardar",
            description: "Hubo un problema al guardar tus datos. Inténtalo de nuevo.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Datos guardados",
          description: "Tu información se ha guardado correctamente."
        });
      } catch (error) {
        console.error('Error saving signup data:', error);
        toast({
          title: "Error inesperado",
          description: "Hubo un problema al procesar tu información.",
          variant: "destructive"
        });
        return;
      }
    }

    if (step < 5) {
      setStep(step + 1);
    } else {
      // Marcar el onboarding como completado en localStorage
      localStorage.setItem('hower-onboarded', 'true');
      // Navegar al dashboard principal
      navigate('/');
    }
  };

  const updateOnboardingData = (field: string, value: string) => {
    if (field === 'trait1' || field === 'trait2' || field === 'trait3' || field === 'trait4') {
      setOnboardingData({
        ...onboardingData,
        idealCustomer: {
          ...onboardingData.idealCustomer,
          [field]: value
        }
      });
    } else {
      setOnboardingData({
        ...onboardingData,
        [field]: value
      });
    }
  };

  const updateSignupData = (field: string, value: string) => {
    setSignupData({
      ...signupData,
      [field]: value
    });
  };

  const handleNicheChange = (value: string) => {
    setSignupData({
      ...signupData,
      niche: value,
      nicheDetail: '' // Reset detail when niche changes
    });
  };

  const handleInstagramConnect = () => {
    if (onboardingData.instagramConnected) {
      toast({
        title: "Ya estás conectado",
        description: "Tu cuenta de Instagram ya está vinculada con Hower"
      });
      return;
    }
    
    // Usar la versión hardcoded de la autenticación
    const success = initiateInstagramAuth();
    
    // Note: La lógica de verificación se maneja en el useEffect
    // cuando detecta que hay datos en localStorage
  };

  const getProgressPercentage = () => {
    const totalSteps = isFirstTime ? 5 : 4; // 4 steps if returning user (skip signup)
    const currentStep = isFirstTime ? step : (step - 1); // Adjust for skipped step
    return (currentStep / totalSteps) * 100;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-primary mb-2">Hower <span className="font-bold">Assistant</span></h1>
          <p className="text-sm sm:text-base text-gray-600">Configura tu asistente IA para Instagram</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 h-2 rounded-full mb-6 sm:mb-10">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>

        <Card className="p-4 sm:p-6 lg:p-8 shadow-lg border-0">
          {/* Step 1: Conectar Instagram */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2 text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-primary">Conecta tu Instagram</h2>
                <p className="text-sm sm:text-base text-gray-500">Primero, vincula tu cuenta de Instagram para que Hower pueda gestionar tus mensajes</p>
              </div>
              
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center">
                  <Instagram className="w-10 h-10 sm:w-12 sm:h-12 text-pink-600" />
                </div>
                
                {isCheckingUser ? (
                  <div className="flex flex-col items-center text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                    <div className="text-gray-600">Verificando tu cuenta...</div>
                  </div>
                ) : onboardingData.instagramConnected ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="text-green-500 font-medium">¡Cuenta conectada con éxito!</div>
                    <p className="text-gray-500 text-sm mt-1">Tu cuenta de Instagram está vinculada con Hower</p>
                  </div>
                ) : (
                  <Button 
                    onClick={handleInstagramConnect}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 sm:px-8 sm:py-3"
                  >
                    Conectar con Instagram
                  </Button>
                )}
              </div>
              
              {onboardingData.instagramConnected && !isCheckingUser && isFirstTime !== null && (
                <Button 
                  onClick={handleNext}
                  className="w-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-2"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* Step 2: Datos de signup (solo si es primera vez) */}
          {step === 2 && isFirstTime && (
            <div className="space-y-6">
              <div className="space-y-2 text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-primary">¡Bienvenido a Hower!</h2>
                <p className="text-sm sm:text-base text-gray-500">Como es tu primera vez, necesitamos algunos datos básicos</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">Nombre completo</Label>
                  <Input
                    id="name"
                    type="text"
                    value={signupData.name}
                    onChange={(e) => updateSignupData('name', e.target.value)}
                    className="mt-2"
                    placeholder="Tu nombre"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) => updateSignupData('email', e.target.value)}
                    className="mt-2"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">¿De qué nicho vienes?</Label>
                  <Select 
                    onValueChange={handleNicheChange} 
                    value={signupData.niche}
                  >
                    <SelectTrigger className="mt-2">
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
                {(signupData.niche === 'coach' || signupData.niche === 'otro') && (
                  <div>
                    <Label className="text-gray-700 font-medium">
                      {signupData.niche === 'coach' ? '¿Coach/mentor de qué nicho?' : 'Especifica tu nicho'}
                    </Label>
                    <Input 
                      placeholder={signupData.niche === 'coach' ? 'Ej: Fitness, Business, Life Coach...' : 'Describe tu nicho...'}
                      onChange={(e) => updateSignupData('nicheDetail', e.target.value)}
                      value={signupData.nicheDetail}
                      className="mt-2"
                      required
                    />
                  </div>
                )}

                {signupData.niche === 'infoproductor' && (
                  <div>
                    <Label className="text-gray-700 font-medium">¿Qué tipo de infoproductos vendes?</Label>
                    <Input 
                      placeholder="Ej: Cursos de marketing, ebooks, masterclasses..."
                      onChange={(e) => updateSignupData('nicheDetail', e.target.value)}
                      value={signupData.nicheDetail}
                      className="mt-2"
                      required
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="phone" className="text-gray-700 font-medium">Número de teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={signupData.phone}
                    onChange={(e) => updateSignupData('phone', e.target.value)}
                    className="mt-2"
                    placeholder="Ej: +521234567890"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para recibir soporte personalizado en WhatsApp. No recibirás promocionales, solo ayuda cuando la necesites.
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-2"
                disabled={!signupData.name || !signupData.email || !signupData.niche || !signupData.phone || 
                  ((signupData.niche === 'coach' || signupData.niche === 'otro' || signupData.niche === 'infoproductor') && !signupData.nicheDetail)}
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 3: Personalidad */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2 text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-primary">Personalidad de tu marca</h2>
                <p className="text-sm sm:text-base text-gray-500">Cuéntanos un poco sobre la personalidad de tu marca o negocio</p>
              </div>
              
              <Textarea 
                placeholder="Describe la personalidad, tono y valores de tu marca..."
                rows={5}
                onChange={(e) => updateOnboardingData('personality', e.target.value)}
                value={onboardingData.personality}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm sm:text-base"
              />
              
              <Button 
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-2"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 4: Cliente ideal */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-2 text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-primary">Cliente ideal</h2>
                <p className="text-sm sm:text-base text-gray-500">Define las 4 características que debe tener tu cliente ideal</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Característica 1</label>
                  <Input 
                    placeholder="Ej: Interesado en marketing digital"
                    onChange={(e) => updateOnboardingData('trait1', e.target.value)}
                    value={onboardingData.idealCustomer.trait1}
                    className="w-full text-sm sm:text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Característica 2</label>
                  <Input 
                    placeholder="Ej: Dueño de negocio"
                    onChange={(e) => updateOnboardingData('trait2', e.target.value)}
                    value={onboardingData.idealCustomer.trait2}
                    className="w-full text-sm sm:text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Característica 3</label>
                  <Input 
                    placeholder="Ej: Presupuesto mínimo de $1000"
                    onChange={(e) => updateOnboardingData('trait3', e.target.value)}
                    value={onboardingData.idealCustomer.trait3}
                    className="w-full text-sm sm:text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Característica 4</label>
                  <Input 
                    placeholder="Ej: Busca resultados a corto plazo"
                    onChange={(e) => updateOnboardingData('trait4', e.target.value)}
                    value={onboardingData.idealCustomer.trait4}
                    className="w-full text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-2"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 5: Finalización */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-2 text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-primary">¡Todo listo!</h2>
                <p className="text-sm sm:text-base text-gray-500">Hower está configurado y listo para ayudarte a filtrar prospectos</p>
              </div>
              
              <div className="py-6 sm:py-8 flex flex-col items-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <div className="space-y-2 text-center">
                  <h3 className="text-base sm:text-lg font-medium">Tu asistente IA está activado</h3>
                  <p className="text-sm sm:text-base text-gray-500 px-4">Ahora podrás ver tus conversaciones organizadas por nivel de compatibilidad con tu cliente ideal</p>
                </div>
              </div>
              
              <Button 
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary-dark text-white"
              >
                Ir al dashboard
              </Button>
            </div>
          )}
          
          {/* Step indicator */}
          <div className="flex justify-center mt-6 sm:mt-8">
            {Array.from({ length: isFirstTime ? 5 : 4 }, (_, i) => i + 1).map((i) => (
              <div 
                key={i} 
                className={`w-2.5 h-2.5 rounded-full mx-1 ${
                  i === (isFirstTime ? step : step - 1) ? 'bg-primary' : 'bg-gray-200'
                }`}
              ></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;