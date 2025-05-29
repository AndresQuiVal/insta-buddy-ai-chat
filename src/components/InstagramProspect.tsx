import React, { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Instagram, UserPlus } from 'lucide-react';

const BASE_URL = 'https://www.howersoftware.io';

const InstagramProspect = () => {
  const [currentSlide, setCurrentSlide] = useState(3);
  const [instagramAccount, setInstagramAccount] = useState('');
  const [message, setMessage] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [messagesPerDay, setMessagesPerDay] = useState(20);
  const [followProspects, setFollowProspects] = useState(false);
  const [prospectType, setProspectType] = useState<'post' | 'followers'>('followers');
  const [showTemplates, setShowTemplates] = useState(false);

  const nextSlide = () => {
    if (currentSlide < 9) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 3) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = {
        instagramAccount,
        message,
        isComment: prospectType === 'post' ? 'true' : 'false'
      };

      const response = await fetch(`${BASE_URL}/clients/welcome-success/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(formData)
      });

      if (response.ok) {
        window.location.href = `${BASE_URL}/clients/dashboard?isnew=true`;
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

  const insertNameToken = () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const token = '[NOMBRE]';
      
      const newText = text.substring(0, start) + token + text.substring(end);
      setMessage(newText);
      
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }
  };

  const insertTemplate = (templateMessage: string) => {
    let finalMessage = templateMessage;
    
    // Reemplazar la cuenta en el mensaje
    if (instagramAccount && !instagramAccount.includes("www.instagram.com")) {
      finalMessage = finalMessage.replaceAll("cuentadelapublicacion", instagramAccount);
    }

    // Insertar el mensaje en el textarea
    setMessage(prev => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const cursorPosition = textarea.selectionStart || textarea.value.length;
        const textBeforeCursor = prev.substring(0, cursorPosition);
        const textAfterCursor = prev.substring(cursorPosition);
        return textBeforeCursor + finalMessage.trim() + textAfterCursor;
      }
      return prev + finalMessage.trim();
    });

    setShowTemplates(false);
    toast({
      title: "¡Éxito!",
      description: "Plantilla insertada correctamente",
    });
  };

  const renderTemplatesPopup = () => {
    if (!showTemplates) return null;

    const templates = [
      {
        title: "Plantilla 1",
        message: "[NOMBRE] oye! vi que sigues a @cuentadelapublicacion! (p.d. imagino lo sigues por que { introduce el problema del prospecto } , cierto?), me tomé el tiempo de investigar tu perfil y basado en tu persona hice { regalo personalizado para el prospecto }, te gustaría { recibirlo / conectarnos / etc }?",
        type: "followers"
      },
      {
        title: "Plantilla 2",
        message: "Hey [NOMBRE]!! cómo vas? oye, vi tu comentario en un post de @cuentadelapublicacion de { introduce el problema del prospecto }, investigue tu perfil y basado en tu persona hice { regalo personalizado para el prospecto }, te gustaría { recibirlo / conectarnos / etc }?",
        type: "post"
      },
      {
        title: "Plantilla 3",
        message: "Holaa [NOMBRE]! oye, vi que comentaste en una publicación de @cuentadelapublicacion cierto? viendo tu perfil hice para ti { regalo personalizado para el prospecto } ¿te parece si { te lo envío / conectamos / etc }?",
        type: "post"
      },
      {
        title: "Plantilla 4",
        message: "[NOMBRE]! se que no es normal esto pero hice { regalo personalizado para el prospecto } para ti, porque vi que comentaste en un post de @cuentadelapublicacion sobre { introduce el problema del prospecto } (p.d. { tranquilo / tranquila }, lo hago para que conozcas un poco más de lo que hago sobre { introduce tu nicho }) ¿te parece si { te lo envío / conectamos / etc }?",
        type: "post"
      },
      {
        title: "Plantilla 5",
        message: "[NOMBRE]! ¿cómo estás? pregunta, conoces a @cuentadelapublicacion? vi que seguiste recientemente a la cuenta por que tienes { introduce el problema del prospecto } y me imagino que { regalo personalizado para el prospecto } te puede ayudar cierto? (p.d. hice justo ese regalo para ti con la intención de que sepas como puedo ayudarte) ¿Te paso mi { regalo } y me dices si te ayuda?",
        type: "followers"
      }
    ];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Plantillas de Mensajes</h2>
            <Button variant="ghost" onClick={() => setShowTemplates(false)}>Cerrar</Button>
          </div>

          <div className="space-y-4">
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
              onClick={() => window.open('https://chatgpt.com/g/g-67d37e911af88191b2c6bc19ae400953-hower-ai-messages', '_blank')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" className="mr-2" viewBox="0 0 512 512">
                <path fill="currentColor" d="M184 0c30.9 0 56 25.1 56 56l0 400c0 30.9-25.1 56-56 56c-28.9 0-52.7-21.9-55.7-50.1c-5.2 1.4-10.7 2.1-16.3 2.1c-35.3 0-64-28.7-64-64c0-7.4 1.3-14.6 3.6-21.2C21.4 367.4 0 338.2 0 304c0-31.9 18.7-59.5 45.8-72.3C37.1 220.8 32 207 32 192c0-30.7 21.6-56.3 50.4-62.6C80.8 123.9 80 118 80 112c0-29.9 20.6-55.1 48.3-62.1C131.3 21.9 155.1 0 184 0zM328 0c28.9 0 52.6 21.9 55.7 49.9c27.8 7 48.3 32.1 48.3 62.1c0 6-.8 11.9-2.4 17.4c28.8 6.2 50.4 31.9 50.4 62.6c0 15-5.1 28.8-13.8 39.7C493.3 244.5 512 272.1 512 304c0 34.2-21.4 63.4-51.6 74.8c2.3 6.6 3.6 13.8 3.6 21.2c0 35.3-28.7 64-64 64c-5.6 0-11.1-.7-16.3-2.1c-3 28.2-26.8 50.1-55.7 50.1c-30.9 0-56-25.1-56-56l0-400c0-30.9 25.1-56 56-56z" />
              </svg>
              Generar Mensaje con IA
            </Button>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">Plantillas de {prospectType === 'post' ? 'Comentarios' : 'Seguidores'}</h3>
                <div className="space-y-4">
                  {templates
                    .filter(t => t.type === prospectType)
                    .map((template, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => insertTemplate(template.message)}
                      >
                        <h4 className="font-medium mb-2">{template.title}</h4>
                        <p className="text-sm text-gray-600 italic">{template.message}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <a
                href="https://docs.google.com/document/d/1zXuNloBHxX6rn7SfEYr889HinphMFxqFcbNzWC0BC48/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700"
              >
                Ver más plantillas
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Instagram className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-800">Prospecta</h3>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                ¿Hacia que <span className="bg-purple-600 text-white px-3 py-1 rounded-lg">prospectos</span> contactar?
              </h3>

              <div className="max-w-2xl mx-auto space-y-8">
                {/* Opción 1: Comentan un post */}
                <div 
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    setProspectType('post');
                    setCurrentSlide(4);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <svg viewBox="0 0 24 24" width="24" height="24" className="text-white">
                        <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-600">Gente que comentó un</span>
                      <div className="inline-block bg-purple-100 text-purple-700 px-4 py-1 rounded-full ml-2">post</div>
                    </div>
                  </div>
                </div>

                {/* Opción 2: Siguen una cuenta */}
                <div 
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    setProspectType('followers');
                    setCurrentSlide(4);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <svg viewBox="0 0 24 24" width="24" height="24" className="text-white">
                        <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-600">Gente que sigue a una</span>
                      <div className="inline-block bg-purple-100 text-purple-700 px-4 py-1 rounded-full ml-2">cuenta</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl p-6">
              <Button
                onClick={() => setCurrentSlide(3)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8"
                variant="ghost"
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Volver
              </Button>

              {prospectType === 'post' ? (
                <div id="searchByPostContent" className="space-y-4">
                  <h4 className="text-lg font-semibold text-center">
                    Introduce el <span className="bg-purple-600 text-white px-3 py-1 rounded-lg">URL del post</span>
                  </h4>
                  <div className="relative">
                    <Input
                      type="text"
                      value={instagramAccount}
                      onChange={(e) => setInstagramAccount(e.target.value.replace(/\s+/g, ''))}
                      placeholder="Introduce la URL del post..."
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-center">
                    <Button
                      onClick={() => {
                        if (!instagramAccount) {
                          toast({
                            title: "Error",
                            description: "Introduce la URL del post",
                            variant: "destructive"
                          });
                          return;
                        }
                        setCurrentSlide(5);
                      }}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              ) : (
                <div id="searchByFollowersContent" className="space-y-4">
                  <h4 className="text-lg font-semibold text-center">
                    Introduce la cuenta a prospectar a <span className="bg-purple-600 text-white px-3 py-1 rounded-lg">sus seguidores</span>
                  </h4>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                    <Input
                      type="text"
                      value={instagramAccount}
                      onChange={(e) => setInstagramAccount(e.target.value.replace(/\s+/g, ''))}
                      placeholder="Introduce la cuenta de Instagram"
                      className="pl-8"
                    />
                  </div>
                  <div className="flex justify-center">
                    <Button
                      onClick={() => {
                        if (!instagramAccount) {
                          toast({
                            title: "Error",
                            description: "Introduce una cuenta de Instagram",
                            variant: "destructive"
                          });
                          return;
                        }
                        setCurrentSlide(5);
                      }}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl p-6">
              <Button
                onClick={() => setCurrentSlide(4)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8"
                variant="ghost"
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Volver
              </Button>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-center">
                  Introduce el mensaje para prospectar
                </h4>

                {/* Botones de acción */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => setShowTemplates(true)}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" className="text-purple-600">
                      <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
                    </svg>
                    Plantillas
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => window.open('https://chatgpt.com/g/g-67d37e911af88191b2c6bc19ae400953-hower-ai-messages', '_blank')}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" className="text-purple-600">
                      <path fill="currentColor" d="M21 11.5v-1c0-.8-.7-1.5-1.5-1.5H16v6h1.5v-2h2v-1h-2v-1h2.5c.8 0 1.5-.7 1.5-1.5zm-10.5 0v-1c0-.8-.7-1.5-1.5-1.5H5v6h4c.8 0 1.5-.7 1.5-1.5v-1c0-.8-.7-1.5-1.5-1.5h-2v-1h2zm-2 2.5h-2v-1h2v1z"/>
                    </svg>
                    Generar con IA
                  </Button>
                </div>

                {/* Botón de insertar nombre */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={insertNameToken}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Introducir nombre
                  </Button>
                  <small className="text-gray-500 block text-center">
                    Al dar clic a 'Introducir nombre', se insertará la palabra [NOMBRE] que será reemplazada automáticamente por el nombre de cada persona
                  </small>
                </div>

                {/* Área de texto */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu mensaje aquí..."
                  className="w-full min-h-[150px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />

                {/* Botones de navegación */}
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => setCurrentSlide(4)}>
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
                      setCurrentSlide(6);
                    }}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            </div>
            {renderTemplatesPopup()}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl p-6">
              <Button
                onClick={() => setCurrentSlide(5)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8"
                variant="ghost"
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Volver
              </Button>

              <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                ¿Qué <span className="bg-purple-600 text-white px-3 py-1 rounded-lg">tipo</span> de prospectos quieres prospectar?
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Quiero prospectar a este género:
                  </label>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={selectedGender === 'male'}
                        onChange={(e) => setSelectedGender(e.target.value)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-gray-700">Masculino</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={selectedGender === 'female'}
                        onChange={(e) => setSelectedGender(e.target.value)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-gray-700">Femenino</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="gender"
                        value="any"
                        checked={selectedGender === 'any'}
                        onChange={(e) => setSelectedGender(e.target.value)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-gray-700">No me importa</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      if (!selectedGender) {
                        toast({
                          title: "Error",
                          description: "Selecciona un género",
                          variant: "destructive"
                        });
                        return;
                      }
                      setCurrentSlide(7);
                    }}
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl p-6">
              <Button
                onClick={() => setCurrentSlide(6)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8"
                variant="ghost"
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Volver
              </Button>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Cuántos mensajes enviar al día?
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    value={messagesPerDay}
                    onChange={(e) => setMessagesPerDay(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>20</span>
                    <span>80</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    ¿Seguir a los prospectos?
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={followProspects}
                      onChange={(e) => setFollowProspects(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setCurrentSlide(8)}>
                    Continuar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl p-6">
              <Button
                onClick={() => setCurrentSlide(7)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8"
                variant="ghost"
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
                Volver
              </Button>

              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                  ¡Antes de <span className="bg-purple-600 text-white px-3 py-1 rounded-lg">Enviar!</span>
                </h3>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600 italic border-l-2 border-purple-400 pl-3">
                    IMPORTANTE: Hower va a generar 10 versiones de mensajes con I.A. a partir de tu mensaje para mejorar las respuestas (Puedes cambiar esto una vez instalado Hower)
                  </p>

                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => setCurrentSlide(7)}>
                      Volver
                    </Button>
                    <Button onClick={() => setCurrentSlide(9)}>
                      Confirmar y Empezar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl p-6">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                  Confirmar y <span className="bg-purple-600 text-white px-3 py-1 rounded-lg">Enviar</span>
                </h3>

                <div className="flex justify-center">
                  <Button onClick={handleSubmit} className="w-full">
                    Confirmar y Enviar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {renderSlide()}
    </div>
  );
};

export default InstagramProspect; 