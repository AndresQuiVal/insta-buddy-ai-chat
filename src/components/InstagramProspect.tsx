import React, { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Instagram } from 'lucide-react';

const InstagramProspect = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [instagramAccount, setInstagramAccount] = useState('');
  const [message, setMessage] = useState('');

  const nextSlide = () => {
    if (currentSlide < 2) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = {
        instagramAccount,
        message,
        isComment: 'false'
      };

      const response = await fetch('https://www.howersoftware.io/clients/welcome-success/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(formData)
      });

      if (response.ok) {
        window.location.href = '/clients/dashboard?isnew=true';
      } else {
        toast({
          title: "Error",
          description: "Hubo un problema al enviar los datos.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error en la red.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Instagram className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-800">Prospecta</h3>
        </div>

        <div className="space-y-6">
          {/* Slide 1: Instagram Account */}
          {currentSlide === 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-center">
                Introduce la cuenta a prospectar a sus seguidores
              </h4>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                <Input
                  type="text"
                  value={instagramAccount}
                  onChange={(e) => setInstagramAccount(e.target.value.replace(/\s+/g, ''))}
                  placeholder="Introduce la cuenta de Instagram para prospectar"
                  className="pl-8"
                />
              </div>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/clients/onb/'}
                >
                  Hacerlo más tarde
                </Button>
                <Button
                  onClick={() => {
                    if (!instagramAccount) {
                      toast({
                        title: "Error",
                        description: "Introduce una cuenta de Instagram donde se van a mandar mensaje a sus seguidores!",
                        variant: "destructive"
                      });
                      return;
                    }
                    nextSlide();
                  }}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}

          {/* Slide 2: Message */}
          {currentSlide === 1 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-center">
                Introduce el mensaje para prospectar
              </h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const textarea = document.querySelector('textarea');
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const text = textarea.value;
                      textarea.value = text.substring(0, start) + '[NOMBRE]' + text.substring(end);
                      textarea.focus();
                    }
                  }}
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  Introducir nombre
                </Button>
                <small className="text-gray-500 block text-center">
                  Ese botón insertará un TOKEN que será reemplazado por el nombre de cada persona en el mensaje
                </small>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full min-h-[150px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={prevSlide}>
                  Volver
                </Button>
                <Button
                  onClick={() => {
                    if (!message.trim()) {
                      toast({
                        title: "Error",
                        description: "Introduce el mensaje a enviar!",
                        variant: "destructive"
                      });
                      return;
                    }
                    nextSlide();
                  }}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}

          {/* Slide 3: Confirmation */}
          {currentSlide === 2 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-center">
                Confirmar y empezar
              </h4>
              <p className="text-sm text-gray-600 italic border-l-2 border-purple-400 pl-3">
                IMPORTANTE: Hower va a generar 10 versiones de mensajes con I.A. a partir de tu mensaje para mejorar las respuestas (Puedes cambiar esto una vez instalado Hower)
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={prevSlide}>
                  Volver
                </Button>
                <Button onClick={handleSubmit}>
                  Confirmar y Empezar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstagramProspect; 