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
    title: '¡Bienvenido a tu Dashboard de Prospectos! 🎉',
    description: 'Te voy a mostrar paso a paso cómo usar esta herramienta para conseguir más clientes. ¡Empezamos!',
    target: '[data-onboarding="main-title"]',
    position: 'bottom'
  },
  {
    id: 'progress',
    title: 'Tu Progreso Diario 📊',
    description: 'Aquí ves cuántos prospectos has contactado hoy y tu progreso hacia la meta. ¡La constancia es clave!',
    target: '[data-onboarding="progress-bar"]',
    position: 'bottom'
  },
  {
    id: 'pending-prospects',
    title: 'Prospectos Pendientes 🎯',
    description: 'Estos son los nuevos prospectos que debes contactar HOY. Haz clic en cada uno para enviar el primer mensaje.',
    target: '[data-onboarding="pending-section"]',
    position: 'right',
    action: 'Haz clic en un prospecto para comenzar'
  },
  {
    id: 'follow-up',
    title: 'Seguimientos Importantes ⏰',
    description: 'Aquí están los prospectos que ya contactaste antes y necesitan seguimiento. ¡No los dejes enfriar!',
    target: '[data-onboarding="followup-section"]',
    position: 'right',
    action: 'Revisa quién necesita seguimiento'
  },
  {
    id: 'tip-section',
    title: 'Tip Pro del Día 💡',
    description: 'Cada día encuentras aquí un consejo probado para mejorar tus resultados. ¡Son oro puro!',
    target: '[data-onboarding="tip-section"]',
    position: 'top'
  },
  {
    id: 'prospect-card',
    title: 'Tarjeta de Prospecto 👤',
    description: 'Cada tarjeta muestra la info del prospecto, el mensaje sugerido y botones para actuar. Todo lo que necesitas en un lugar.',
    target: '[data-onboarding="prospect-card"]',
    position: 'left'
  },
  {
    id: 'instagram-button',
    title: 'Botón de Instagram 📱',
    description: 'Este botón te lleva directo al perfil del prospecto en Instagram. Úsalo para enviar mensajes personalizados.',
    target: '[data-onboarding="instagram-button"]',
    position: 'top',
    action: 'Clic aquí para ir a Instagram'
  },
  {
    id: 'mark-complete',
    title: 'Marcar como Completado ✅',
    description: 'Después de contactar al prospecto, marca la tarea como completada para llevar un registro preciso.',
    target: '[data-onboarding="complete-button"]',
    position: 'top',
    action: 'Marca cuando hayas enviado el mensaje'
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
    const targetElement = document.querySelector(currentStepData.target);
    if (!targetElement) return { top: '50%', left: '50%' };

    const rect = targetElement.getBoundingClientRect();
    const position = currentStepData.position;

    switch (position) {
      case 'top':
        return {
          top: `${rect.top - 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, 0)'
        };
      case 'left':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - 20}px`,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 20}px`,
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
        className="fixed z-[10000] w-80 shadow-2xl border-primary/30"
        style={tooltipStyle}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-primary">
              {currentStepData.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground/80">
            {currentStepData.description}
          </p>
          
          {currentStepData.action && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
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
          
          {/* Botones de navegación */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Anterior
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="h-3 w-3 mr-1" />
              Saltar tour
            </Button>
            
            <Button
              onClick={nextStep}
              size="sm"
              className="flex items-center gap-1"
            >
              {isLastStep ? (
                <>
                  <Play className="h-3 w-3" />
                  ¡Empezar!
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};