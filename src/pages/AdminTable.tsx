import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Lock } from 'lucide-react';

interface AdminData {
  correo: string;
  telefono: string;
  whatsapp_link: string;
  instagram_ligado: string;
  ultimo_autoresponder: string;
  cantidad_autoresponders: number;
  fecha_registro: string;
  dias_desde_registro: number;
}

export default function AdminTable() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAuth = () => {
    if (password === 'hower123') {
      setIsAuthenticated(true);
      loadData();
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Obtener todos los perfiles con sus datos de Instagram y autoresponders
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const adminData: AdminData[] = [];

      for (const profile of profiles || []) {
        // Buscar usuario de Instagram asociado
        const { data: instagramUser } = await supabase
          .from('instagram_users')
          .select('username, instagram_user_id')
          .limit(1)
          .single();

        // Contar autoresponders
        const { count: autoresponderCount } = await supabase
          .from('autoresponder_messages')
          .select('*', { count: 'exact', head: true })
          .eq('instagram_user_id_ref', instagramUser?.instagram_user_id || '');

        // Obtener último mensaje de autoresponder enviado
        const { data: lastMessage } = await supabase
          .from('autoresponder_sent_log')
          .select(`
            sent_at,
            autoresponder_messages(message_text)
          `)
          .order('sent_at', { ascending: false })
          .limit(1)
          .single();

        const whatsappLink = profile.phone ? `https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}` : '';
        
        // Calcular días desde el registro
        const fechaRegistro = new Date(profile.created_at);
        const ahora = new Date();
        const diasDesdeRegistro = Math.floor((ahora.getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24));
        
        adminData.push({
          correo: profile.email || '',
          telefono: profile.phone || '',
          whatsapp_link: whatsappLink,
          instagram_ligado: instagramUser?.username || 'No conectado',
          ultimo_autoresponder: lastMessage?.autoresponder_messages?.message_text?.substring(0, 50) + '...' || 'Ninguno',
          cantidad_autoresponders: autoresponderCount || 0,
          fecha_registro: fechaRegistro.toLocaleDateString('es-ES'),
          dias_desde_registro: diasDesdeRegistro
        });
      }

      setData(adminData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              Acceso Administrativo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Ingrese la contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
            />
            <Button onClick={handleAuth} className="w-full">
              Acceder
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Tabla Administrativa - Usuarios Hower Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Correo</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Instagram Ligado</TableHead>
                    <TableHead>Último Autoresponder</TableHead>
                    <TableHead>Cantidad Autoresponders</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead>Días desde Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Cargando datos...
                      </TableCell>
                    </TableRow>
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No hay datos disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.correo}</TableCell>
                        <TableCell>{row.telefono}</TableCell>
                        <TableCell>
                          {row.whatsapp_link ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={row.whatsapp_link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                WhatsApp
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.instagram_ligado === 'No conectado' ? 'secondary' : 'default'}>
                            {row.instagram_ligado}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={row.ultimo_autoresponder}>
                          {row.ultimo_autoresponder}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {row.cantidad_autoresponders}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.fecha_registro}</TableCell>
                        <TableCell>
                          <Badge variant={row.dias_desde_registro <= 7 ? 'default' : 'secondary'}>
                            {row.dias_desde_registro} días
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Total de registros: {data.length}
              </p>
              <Button onClick={loadData} disabled={loading}>
                Actualizar Datos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}