import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function TestWhatsAppDirect() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testWhatsApp = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🧪 Enviando prueba directa de WhatsApp...');
      
      // Llamar directamente a la edge function
      const response = await fetch(
        'https://rpogkbqcuqrihynbpnsi.supabase.co/functions/v1/test-whatsapp-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwb2drYnFjdXFyaWh5bmJwbnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDczNzAsImV4cCI6MjA2Mzc4MzM3MH0.9x4X9Dqc_eIkgaG4LAecrG9PIGXZEEqxYIMbLBtXjNQ`
          },
          body: JSON.stringify({
            instagram_user_id: '17841476743432622'
          })
        }
      );
      
      const data = await response.json();
      console.log('✅ Respuesta:', data);
      
      setResult(data);
      
      if (data.success) {
        toast({
          title: "¡WhatsApp enviado!",
          description: `Mensaje enviado a ${data.whatsapp_number}`
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "No se pudo enviar el mensaje",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Test WhatsApp Directo</h2>
      
      <Button 
        onClick={testWhatsApp}
        disabled={loading}
        className="mb-4"
      >
        {loading ? "Enviando..." : "🧪 Enviar WhatsApp a +523338459844"}
      </Button>
      
      {result && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">
            {result.success ? "✅ Éxito" : "❌ Error"}
          </h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
}
