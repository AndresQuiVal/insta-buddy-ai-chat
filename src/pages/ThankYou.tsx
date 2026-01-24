import { Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ThankYou = () => {
  const handleWhatsAppSupport = () => {
    window.open("https://wa.me/+5218000000000?text=Hola,%20acabo%20de%20hacer%20mi%20pago%20en%20Hower%20y%20necesito%20ayuda", "_blank");
  };

  return (
    <div className="min-h-screen bg-[#7C3AED] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
        ¡Verifica tu correo y Crea tu cuenta!
      </h1>

      {/* Main Card */}
      <Card className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl">
        {/* Email Icon and Title */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">📧</span>
          <h2 className="text-xl font-bold text-[#7C3AED]">Revisa tu correo</h2>
        </div>

        {/* Instructions */}
        <p className="text-center text-gray-600 mb-2">
          Confirma tu cuenta desde el email que te enviamos.
        </p>
        <p className="text-center font-bold text-gray-800 mb-6">
          ¡Solo haz clic en el enlace!
        </p>

        {/* Mock Email Preview */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Mail className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">Correo</span>
                <span className="text-xs text-gray-400">ahora</span>
              </div>
              <p className="font-bold text-gray-900 text-sm mt-1">
                ¡Crea tu cuenta - Hower!
              </p>
              <p className="text-gray-500 text-xs">
                Crea tu cuenta en Hower...
              </p>
            </div>
          </div>
        </div>

        {/* Spam Notice */}
        <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-100">
          <p className="text-center text-sm text-gray-600">
            ¿No lo ves? Busca en la carpeta de "<span className="font-bold text-gray-800">Spam</span>" o "<span className="font-bold text-gray-800">No Deseados</span>".
          </p>
          <p className="text-center text-sm text-gray-600 mt-1">
            Si no aparece, contáctanos:
          </p>
        </div>

        {/* WhatsApp Support Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleWhatsAppSupport}
            className="bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold px-8 py-3 rounded-full flex items-center gap-2 shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            Soporte
          </Button>
        </div>
      </Card>

      {/* Footer Note */}
      <p className="text-white/80 text-sm text-center mt-8 max-w-md">
        Gracias por confiar en Hower. Tu cuenta estará lista en minutos.
      </p>
    </div>
  );
};

export default ThankYou;
