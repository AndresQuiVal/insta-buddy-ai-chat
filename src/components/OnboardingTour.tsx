import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ArrowLeft, ArrowRight, Play, SkipForward } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector del elemento a destacar
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string; // Acción sugerida
}

interface OnboardingTourProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido! 👋',
    description: 'Te explico tu dashboard en 8 pasos',
    target: '[data-onboarding="main-title"]',
    position: 'bottom'
  },
  {
    id: 'pending-prospects',
    title: 'Prospectos sin responder 🎯',
    description: 'Usuarios prospectados con Hower que NO han respondido en Instagram',
    target: '[data-onboarding="pending-section"]',
    position: 'right',
    action: 'Toca para ver la lista'
  },
  {
    id: 'prospect-card',
    title: 'Card de prospecto 👤',
    description: 'Toca una card → Ve mensaje sugerido → Botón Instagram → Envía → Marca ✅',
    target: '[data-onboarding="pending-section"]',
    position: 'right',
    action: 'Así funciona el flujo completo'
  },
  {
    id: 'follow-up',
    title: 'Seguimientos ⏰',
    description: 'Prospectos que YA contactaste pero necesitan 2do o 3er mensaje',
    target: '[data-onboarding="followup-section"]',
    position: 'right',
    action: 'Tiene 2 sub-secciones: Ayer y Semana'
  },
  {
    id: 'new-prospects',
    title: 'Nuevas cuentas/posts con prospectos 🔍',
    description: 'Herramienta para encontrar prospectos frescos usando IA',
    target: '[data-onboarding="new-prospects-section"]',
    position: 'right',
    action: 'Busca prospectos ideales automáticamente'
  },
  {
    id: 'tips-in-sections',
    title: 'Tips en cada sección 💡',
    description: 'Cada sección tiene tips específicos. ¡Léelos para mejorar resultados!',
    target: '[data-onboarding="followup-section"]',
    position: 'left',
    action: 'Busca los tips con fondo de colores'
  },
  {
    id: 'tip-section',
    title: 'Tip diario 🚀',
    description: 'Consejo diario para mejorar tu tasa de respuesta',
    target: '[data-onboarding="tip-section"]',
    position: 'top'
  },
  {
    id: 'workflow',
    title: '¡Listo para empezar! ✨',
    description: 'Flujo: Ver pendientes → Ir a Instagram → Enviar mensaje → Marcar ✅ → Repetir',
    target: '[data-onboarding="pending-section"]',
    position: 'left',
    action: '¡A conseguir clientes!'
  }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isVisible,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsActive(true);
      setCurrentStep(0);
    }
  }, [isVisible]);

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const nextStep = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsActive(false);
    onSkip();
  };

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    // Scroll al elemento target
    const targetElement = document.querySelector(currentStepData.target);
    if (targetElement) {
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [currentStep, isActive, currentStepData]);

  if (!isActive || !currentStepData) return null;

  const getTooltipPosition = () => {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // En móvil, siempre en la parte inferior
      return {
        bottom: '20px',
        left: '10px',
        right: '10px',
        transform: 'none'
      };
    }

    const targetElement = document.querySelector(currentStepData.target);
    if (!targetElement) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const rect = targetElement.getBoundingClientRect();
    const position = currentStepData.position;

    switch (position) {
      case 'top':
        return {
          top: `${Math.max(rect.top - 20, 20)}px`,
          left: `${Math.min(rect.left + rect.width / 2, window.innerWidth - 160)}px`,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          top: `${Math.min(rect.bottom + 20, window.innerHeight - 200)}px`,
          left: `${Math.min(rect.left + rect.width / 2, window.innerWidth - 160)}px`,
          transform: 'translate(-50%, 0)'
        };
      case 'left':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${Math.max(rect.left - 20, 20)}px`,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${Math.min(rect.right + 20, window.innerWidth - 320)}px`,
          transform: 'translate(0, -50%)'
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  const tooltipStyle = getTooltipPosition();
  const isMobile = window.innerWidth < 768;

  return (
    <>
      {/* Overlay oscuro */}
      <div className="fixed inset-0 bg-black/60 z-[9998]" />
      
      {/* Spotlight en el elemento actual */}
      <style>
        {`
          [data-onboarding="${currentStepData.id}"], 
          ${currentStepData.target} {
            position: relative !important;
            z-index: 9999 !important;
            box-shadow: 0 0 0 4px rgba(114, 75, 255, 0.5), 0 0 30px rgba(114, 75, 255, 0.3) !important;
            border-radius: 8px !important;
          }
        `}
      </style>

      {/* Tooltip de onboarding */}
      <Card 
        className={`fixed z-[10000] ${isMobile ? 'left-4 right-4 w-auto' : 'w-80'} shadow-2xl border-primary/30`}
        style={tooltipStyle}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base text-primary flex-1">
              {currentStepData.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-6 w-6 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-0">
          <p className="text-sm text-foreground/80 leading-relaxed">
            {currentStepData.description}
          </p>
          
          {currentStepData.action && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-2">
              <p className="text-xs font-medium text-primary">
                💡 {currentStepData.action}
              </p>
            </div>
          )}
          
          {/* Progreso */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Paso {currentStep + 1} de {onboardingSteps.length}</span>
            <div className="flex gap-1">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Botones de navegación - Layout mejorado */}
          <div className="flex flex-col gap-2">
            {/* Botón principal grande */}
            <Button
              onClick={nextStep}
              className="w-full"
              size="sm"
            >
              {isLastStep ? '¡Empezar!' : 'Siguiente'}
            </Button>
            
            {/* Botones secundarios en fila */}
            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex-1"
              >
                Anterior
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="flex-1 text-muted-foreground hover:text-foreground"
              >
                Saltar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};