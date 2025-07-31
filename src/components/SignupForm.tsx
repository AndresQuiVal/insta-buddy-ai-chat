import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.name || !formData.email) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // Simular envío del formulario
    setTimeout(() => {
      toast({
        title: "¡Registro exitoso!",
        description: "Ahora conecta tu cuenta de Instagram para continuar",
      });
      
      // Redirigir a la página de conexión de Instagram
      navigate('/instagram-callback');
      setIsSubmitting(false);
    }, 1000);
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