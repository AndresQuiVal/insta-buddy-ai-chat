import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, CreditCard, Shield, Calendar, RefreshCw } from "lucide-react";
import howerLogo from "@/assets/hower-logo.png";

type PaymentStatus = "idle" | "processing" | "success" | "error";

const CheckoutMercadoPago = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const AMOUNT = 200;
  const PRODUCT_TITLE = "Hower - Suscripción Mensual";
  const PRODUCT_DESCRIPTION = "Acceso completo a Hower Software para automatizar tu prospección en Instagram";

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa un email válido para continuar",
        variant: "destructive",
      });
      return;
    }

    setPaymentStatus("processing");
    setErrorMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-create-subscription", {
        body: {
          payer_email: email,
          reason: PRODUCT_TITLE,
          transaction_amount: AMOUNT,
        }
      });

      console.log("Subscription response:", data, error);

      if (error) {
        throw new Error(error.message || "Error al crear la suscripción");
      }

      if (data.success && data.init_point) {
        // Redirect to Mercado Pago subscription checkout
        window.location.href = data.init_point;
      } else {
        throw new Error(data.error || "No se pudo crear el link de suscripción");
      }
    } catch (err: any) {
      console.error("Subscription error:", err);
      setPaymentStatus("error");
      setErrorMessage(err.message || "Error al procesar la suscripción");
      toast({
        title: "Error",
        description: err.message || "Error al procesar la suscripción",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={howerLogo} alt="Hower" className="h-12" />
        </div>

        {/* Payment Card */}
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Suscripción Mensual
            </CardTitle>
            <CardDescription className="text-base">
              {PRODUCT_DESCRIPTION}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Amount Display */}
            <div className="bg-primary/5 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Pago mensual</p>
              <p className="text-4xl font-bold text-primary">${AMOUNT} MXN</p>
              <p className="text-sm text-muted-foreground mt-1">{PRODUCT_TITLE}</p>
              
              {/* Subscription Benefits */}
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 py-1 rounded-full">
                  <RefreshCw className="h-3 w-3" />
                  <span>Cobro automático</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 py-1 rounded-full">
                  <Calendar className="h-3 w-3" />
                  <span>Cancela cuando quieras</span>
                </div>
              </div>
            </div>

            {paymentStatus === "processing" && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Creando tu suscripción...</p>
                <p className="text-sm text-muted-foreground">Serás redirigido a Mercado Pago</p>
              </div>
            )}

            {paymentStatus === "error" && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-destructive text-center">{errorMessage}</p>
              </div>
            )}

            {(paymentStatus === "idle" || paymentStatus === "error") && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Tu correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recibirás confirmaciones y recibos en este correo
                  </p>
                </div>

                <Button 
                  onClick={handleSubscribe} 
                  className="w-full h-12 text-lg"
                  disabled={!email}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Suscribirme por ${AMOUNT} MXN/mes
                </Button>

                <div className="text-center text-xs text-muted-foreground space-y-1">
                  <p>• Se te cobrará ${AMOUNT} MXN hoy y cada mes</p>
                  <p>• Puedes cancelar en cualquier momento desde tu cuenta de Mercado Pago</p>
                </div>
              </div>
            )}

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Pago seguro procesado por Mercado Pago</span>
            </div>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center mt-4">
          <Button variant="link" onClick={() => navigate(-1)} className="text-muted-foreground">
            ← Volver
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutMercadoPago;
