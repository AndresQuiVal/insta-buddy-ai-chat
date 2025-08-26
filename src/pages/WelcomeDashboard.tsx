import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, ArrowRight } from 'lucide-react';

const WelcomeDashboard = () => {
  const navigate = useNavigate();

  const handleAutoresponder = () => {
    navigate('/');
  };

  const handleCRM = () => {
    navigate('/tasks-to-do');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-4">
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="https://i.ibb.co/bMLhkc7G/Hower-logo.png"
              alt="Hower"
              className="w-24 h-24 rounded-3xl object-cover mx-auto mb-6 shadow-lg"
            />
            <h1 className="text-4xl font-light bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              ¡Bienvenido a Hower!
            </h1>
            <p className="text-gray-600 text-lg">
              ¿A dónde quieres ir hoy?
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* CRM Card - MOVED FIRST */}
          <Card className="bg-white/90 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-[1.02]" onClick={handleCRM}>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Administra tus prospectos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Administra tus prospectos, haz seguimiento de leads y obtén tus números de manera eficiente.
              </p>
              <Button 
                onClick={handleCRM}
                className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 border-0"
              >
                Ir al CRM
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Autoresponder Card - MOVED SECOND */}
          <Card className="bg-white/90 backdrop-blur-lg border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-[1.02]" onClick={handleAutoresponder}>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
               <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                 Próximamente
               </CardTitle>
             </CardHeader>
             <CardContent className="text-center">
               <Button 
                 onClick={handleAutoresponder}
                 className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 border-0"
               >
                Ir al Autoresponder
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer info */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            Puedes cambiar entre estas opciones en cualquier momento desde el panel principal
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeDashboard;