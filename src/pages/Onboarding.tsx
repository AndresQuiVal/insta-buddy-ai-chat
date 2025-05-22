
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Onboarding completo, navegar al dashboard
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

  const handleInstagramConnect = () => {
    // Simular conexión con Instagram
    setOnboardingData({
      ...onboardingData,
      instagramConnected: true
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Hower</h1>
          <p className="text-gray-600">Configura tu asistente IA para Instagram</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 h-2 rounded-full mb-10">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${step * 25}%` }}
          ></div>
        </div>

        <Card className="p-8 shadow-lg border-0">
          {/* Step 1: Personalidad */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2 text-center mb-6">
                <h2 className="text-2xl font-semibold text-primary">Personalidad de tu marca</h2>
                <p className="text-gray-500">Cuéntanos un poco sobre la personalidad de tu marca o negocio</p>
              </div>
              
              <Textarea 
                placeholder="Describe la personalidad, tono y valores de tu marca..."
                rows={6}
                onChange={(e) => updateOnboardingData('personality', e.target.value)}
                value={onboardingData.personality}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              />
              
              <Button 
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-2"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Cliente ideal */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2 text-center mb-6">
                <h2 className="text-2xl font-semibold text-primary">Cliente ideal</h2>
                <p className="text-gray-500">Define las 4 características que debe tener tu cliente ideal</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Característica 1</label>
                  <Input 
                    placeholder="Ej: Interesado en marketing digital"
                    onChange={(e) => updateOnboardingData('trait1', e.target.value)}
                    value={onboardingData.idealCustomer.trait1}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Característica 2</label>
                  <Input 
                    placeholder="Ej: Dueño de negocio"
                    onChange={(e) => updateOnboardingData('trait2', e.target.value)}
                    value={onboardingData.idealCustomer.trait2}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Característica 3</label>
                  <Input 
                    placeholder="Ej: Presupuesto mínimo de $1000"
                    onChange={(e) => updateOnboardingData('trait3', e.target.value)}
                    value={onboardingData.idealCustomer.trait3}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Característica 4</label>
                  <Input 
                    placeholder="Ej: Busca resultados a corto plazo"
                    onChange={(e) => updateOnboardingData('trait4', e.target.value)}
                    value={onboardingData.idealCustomer.trait4}
                    className="w-full"
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

          {/* Step 3: Conectar Instagram */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2 text-center mb-6">
                <h2 className="text-2xl font-semibold text-primary">Conecta tu Instagram</h2>
                <p className="text-gray-500">Vincula tu cuenta de Instagram para que Hower pueda gestionar tus mensajes</p>
              </div>
              
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png" alt="Instagram" className="w-12 h-12" />
                </div>
                
                {onboardingData.instagramConnected ? (
                  <div className="flex flex-col items-center">
                    <div className="text-green-500 font-medium">¡Cuenta conectada con éxito!</div>
                    <p className="text-gray-500 text-sm mt-1">Tu cuenta de Instagram está vinculada con Hower</p>
                  </div>
                ) : (
                  <Button 
                    onClick={handleInstagramConnect}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    Conectar con Instagram
                  </Button>
                )}
              </div>
              
              <Button 
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-2"
                disabled={!onboardingData.instagramConnected}
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 4: Finalización */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-2 text-center mb-6">
                <h2 className="text-2xl font-semibold text-primary">¡Todo listo!</h2>
                <p className="text-gray-500">Hower está configurado y listo para ayudarte a filtrar prospectos</p>
              </div>
              
              <div className="py-8 flex flex-col items-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <div className="space-y-2 text-center">
                  <h3 className="text-lg font-medium">Tu asistente IA está activado</h3>
                  <p className="text-gray-500">Ahora podrás ver tus conversaciones organizadas por nivel de compatibilidad con tu cliente ideal</p>
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
          <div className="flex justify-center mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`w-2.5 h-2.5 rounded-full mx-1 ${
                  i === step ? 'bg-primary' : 'bg-gray-200'
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
