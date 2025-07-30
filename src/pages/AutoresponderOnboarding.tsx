import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, MessageCircle, HelpCircle, Instagram, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { supabase } from '@/integrations/supabase/client';
import InstagramPostSelector from '@/components/InstagramPostSelector';

const AutoresponderOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useInstagramUsers();
  const [step, setStep] = useState(1);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [autoresponderData, setAutoresponderData] = useState({
    name: '',
    message: '',
    useKeywords: false,
    keywords: [] as string[],
    isActive: true,
    type: 'general', // 'general' o 'specific'
    selectedPost: null as any
  });

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleCreateAutoresponder();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateAutoresponderData = (field: string, value: any) => {
    setAutoresponderData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim().toLowerCase())) {
      const updatedKeywords = [...keywords, newKeyword.trim().toLowerCase()];
      setKeywords(updatedKeywords);
      updateAutoresponderData('keywords', updatedKeywords);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const updatedKeywords = keywords.filter(keyword => keyword !== keywordToRemove);
    setKeywords(updatedKeywords);
    updateAutoresponderData('keywords', updatedKeywords);
  };

  const handleKeywordInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleCreateAutoresponder = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "No hay usuario autenticado"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const autoresponderDataToSave = {
        name: autoresponderData.name,
        message_text: autoresponderData.message,
        instagram_user_id_ref: currentUser.instagram_user_id,
        is_active: autoresponderData.isActive,
        use_keywords: autoresponderData.useKeywords,
        keywords: autoresponderData.useKeywords ? autoresponderData.keywords : null,
        send_only_first_message: false,
        use_buttons: false,
        buttons: null
      };

      const { data, error } = await supabase
        .from('autoresponder_messages')
        .insert([autoresponderDataToSave])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "¡Autorespondedor creado!",
        description: "Tu primer autorespondedor ha sido configurado exitosamente"
      });

      // Marcar onboarding como completado
      localStorage.setItem('autoresponder-onboarding-completed', 'true');
      
      // Navegar al dashboard
      navigate('/');
      
    } catch (error: any) {
      console.error('Error creando autorespondedor:', error);
      toast({
        title: "Error",
        description: error.message || "Error al crear el autorespondedor"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToGuides = () => {
    navigate('/guides');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="https://i.ibb.co/bMLhkc7G/Hower-logo.png"
              alt="Logo Hower"
              className="w-12 h-12 rounded-2xl object-cover"
            />
            <h1 className="text-4xl font-light bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Hower <span className="font-bold">Assistant</span>
            </h1>
          </div>
          <p className="text-gray-600">Configura tu primer autorespondedor para Instagram</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/50 h-2 rounded-full mb-10">
          <div 
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${step * 20}%` }}
          ></div>
        </div>

        <Card className="p-8 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          {/* Step 1: Introducción */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-10 h-10 text-purple-600" />
                </div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-2">¡Bienvenido a los Autorespondedores!</h2>
                <p className="text-gray-600 text-lg">Te ayudaremos a configurar tu primer autorespondedor paso a paso</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">¿Qué es un autorespondedor?</h3>
                <p className="text-gray-700 mb-4">
                  Un autorespondedor es una herramienta que automáticamente responde a los comentarios 
                  en tus posts de Instagram con mensajes directos personalizados.
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Responde automáticamente a comentarios específicos
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Envía mensajes directos personalizados
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Filtra leads de calidad automáticamente
                  </li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={navigateToGuides}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2 border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <HelpCircle className="w-4 h-4" />
                  Ver guías detalladas
                </Button>
                <Button 
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center justify-center gap-2"
                >
                  Empezar configuración <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Tipo de autorespondedor */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">¿Para qué posts quieres configurarlo?</h2>
                <p className="text-gray-600">Elige si será para todos tus posts o solo para posts específicos</p>
              </div>
              
              <div className="grid gap-4">
                <div 
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    autoresponderData.type === 'general' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateAutoresponderData('type', 'general')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <Check className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">Autorespondedor General</h3>
                      <p className="text-gray-600 text-sm">Se aplicará automáticamente a todos tus posts nuevos</p>
                      <p className="text-green-600 text-sm font-medium mt-1">✨ Recomendado para empezar</p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    autoresponderData.type === 'specific' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateAutoresponderData('type', 'specific')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <Instagram className="w-6 h-6 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">Post Específico</h3>
                      <p className="text-gray-600 text-sm">Solo funcionará en un post que selecciones</p>
                      <p className="text-blue-600 text-sm font-medium mt-1">🎯 Para promociones específicas</p>
                    </div>
                  </div>
                 </div>
               </div>
               
               {/* Botones de navegación siempre visibles */}
               <div className="flex gap-4">
                 <Button 
                   onClick={handleBack}
                   variant="outline"
                   className="flex-1 flex items-center justify-center gap-2"
                 >
                   <ArrowLeft className="w-4 h-4" />
                   Anterior
                 </Button>
                 <Button 
                   onClick={handleNext}
                   disabled={!autoresponderData.type || (autoresponderData.type === 'specific' && !autoresponderData.selectedPost)}
                   className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center justify-center gap-2"
                 >
                   Continuar <ArrowRight className="w-4 h-4" />
                 </Button>
               </div>
               
               {/* Mostrar selector de posts si es específico */}
               {autoresponderData.type === 'specific' && (
                 <div className="bg-blue-50 rounded-lg p-6">
                   <h3 className="text-lg font-semibold text-blue-900 mb-4">Selecciona un post de Instagram</h3>
                   <p className="text-blue-700 text-sm mb-4">
                     Elige el post específico donde quieres que funcione este autorespondedor
                   </p>
                   <InstagramPostSelector
                     onPostSelected={(post) => updateAutoresponderData('selectedPost', post)}
                     onBack={() => updateAutoresponderData('type', '')}
                     showAutoresponderSelection={false}
                   />
                 </div>
               )}
            
            </div>
          )}

          {/* Step 3: Nombre del autorespondedor */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Nombre de tu autorespondedor</h2>
                <p className="text-gray-600">Dale un nombre descriptivo para identificarlo fácilmente</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del autorespondedor</label>
                  <Input 
                    placeholder="Ej: Leads para curso de marketing"
                    onChange={(e) => updateAutoresponderData('name', e.target.value)}
                    value={autoresponderData.name}
                    className="w-full text-lg"
                  />
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Consejos para el nombre:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Usa nombres descriptivos como "Leads para consultoría"</li>
                    <li>• Incluye el tipo de producto o servicio</li>
                    <li>• Evita nombres genéricos como "Autorespondedor 1"</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!autoresponderData.name.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center justify-center gap-2"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Mensaje del autorespondedor */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Mensaje automático</h2>
                <p className="text-gray-600">Este mensaje se enviará automáticamente por DM a quienes comenten</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje que se enviará por DM</label>
                  <Textarea 
                    placeholder="¡Hola! Vi tu comentario y me da mucho gusto tu interés. Te voy a enviar más información sobre..."
                    rows={6}
                    onChange={(e) => updateAutoresponderData('message', e.target.value)}
                    value={autoresponderData.message}
                    className="w-full"
                  />
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">✨ Mejores prácticas:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Personaliza el saludo: "¡Hola! Vi tu comentario..."</li>
                    <li>• Explica por qué les escribes</li>
                    <li>• Ofrece valor inmediato</li>
                    <li>• Incluye una llamada a la acción clara</li>
                    <li>• Mantén un tono amigable y profesional</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!autoresponderData.message.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center justify-center gap-2"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Configuración final */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Configuración final</h2>
                <p className="text-gray-600">Configura las opciones avanzadas de tu autorespondedor</p>
              </div>
              
              <div className="space-y-6">
                {/* Keywords option */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Usar palabras clave</h3>
                      <p className="text-gray-600 text-sm">Solo responder a comentarios que contengan palabras específicas</p>
                    </div>
                    <Switch
                      checked={autoresponderData.useKeywords}
                      onCheckedChange={(checked) => updateAutoresponderData('useKeywords', checked)}
                    />
                  </div>
                  
                  {autoresponderData.useKeywords && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Palabras clave</label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Escribe una palabra clave y presiona Enter"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            onKeyPress={handleKeywordInputKeyPress}
                            className="flex-1"
                          />
                          <Button 
                            onClick={addKeyword}
                            type="button"
                            variant="outline"
                            size="sm"
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>
                      
                      {keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {keywords.map((keyword, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="flex items-center gap-2 px-3 py-1"
                            >
                              {keyword}
                              <X 
                                className="w-3 h-3 cursor-pointer hover:text-red-600" 
                                onClick={() => removeKeyword(keyword)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          💡 Si no activas palabras clave, el autorespondedor responderá a TODOS los comentarios
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Estado del autorespondedor</h3>
                      <p className="text-gray-600 text-sm">Activar o desactivar este autorespondedor</p>
                    </div>
                    <Switch
                      checked={autoresponderData.isActive}
                      onCheckedChange={(checked) => updateAutoresponderData('isActive', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Instagram className="w-4 h-4" />
                      Crear autorespondedor
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Step indicator */}
          <div className="flex justify-center mt-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full mx-1 transition-all duration-300 ${
                  i === step 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                    : i < step 
                    ? 'bg-green-500' 
                    : 'bg-gray-200'
                }`}
              ></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AutoresponderOnboarding;