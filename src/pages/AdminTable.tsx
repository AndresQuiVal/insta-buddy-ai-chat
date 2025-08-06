
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Lock, Users, Calendar, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdminData {
  correo: string;
  telefono: string;
  telefono_completo: string;
  whatsapp_link: string;
  instagram_ligado: string;
  ultimo_autoresponder: string;
  cantidad_autoresponders: number;
  fecha_registro: string;
  dias_desde_registro: number;
  raw_created_at: string;
}

interface Stats {
  total_users: number;
  today_users: number;
  week_users: number;
  month_users: number;
}

export default function AdminTable() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({ total_users: 0, today_users: 0, week_users: 0, month_users: 0 });
  const [sortBy, setSortBy] = useState<'fecha' | 'dias'>('fecha');
  const [filterBy, setFilterBy] = useState<'todos' | 'hoy' | 'semana' | 'mes'>('todos');

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
      console.log('🔍 Cargando datos de usuarios...');
      
      // Obtener todos los perfiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('❌ Error obteniendo perfiles:', profilesError);
        throw profilesError;
      }

      console.log('📊 Perfiles encontrados:', profiles?.length || 0);

      const adminData: AdminData[] = [];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let todayCount = 0;
      let weekCount = 0;
      let monthCount = 0;

      for (const profile of profiles || []) {
        try {
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

          // Crear teléfono completo con código de país
          const telefonoCompleto = profile.country_code && profile.phone 
            ? `${profile.country_code}${profile.phone}`
            : profile.phone || '';
          
          const whatsappLink = telefonoCompleto ? `https://wa.me/${telefonoCompleto.replace(/[^0-9]/g, '')}` : '';
          
          // Calcular días desde el registro
          const fechaRegistro = new Date(profile.created_at);
          const diasDesdeRegistro = Math.floor((now.getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24));
          
          // Contar para estadísticas
          if (fechaRegistro >= today) todayCount++;
          if (fechaRegistro >= weekAgo) weekCount++;
          if (fechaRegistro >= monthAgo) monthCount++;
          
          console.log('📝 Procesando perfil:', profile.email, 'Creado:', profile.created_at, 'Días:', diasDesdeRegistro);
          
          adminData.push({
            correo: profile.email || '',
            telefono: profile.phone || '',
            telefono_completo: telefonoCompleto,
            whatsapp_link: whatsappLink,
            instagram_ligado: instagramUser?.username || 'No conectado',
            ultimo_autoresponder: lastMessage?.autoresponder_messages?.message_text?.substring(0, 50) + '...' || 'Ninguno',
            cantidad_autoresponders: autoresponderCount || 0,
            fecha_registro: fechaRegistro.toLocaleDateString('es-ES'),
            dias_desde_registro: diasDesdeRegistro,
            raw_created_at: profile.created_at
          });
        } catch (error) {
          console.error('⚠️ Error procesando perfil:', profile.email, error);
          // Continuar con el siguiente perfil
        }
      }

      // Actualizar estadísticas
      setStats({
        total_users: adminData.length,
        today_users: todayCount,
        week_users: weekCount,
        month_users: monthCount
      });

      setData(adminData);
      console.log('✅ Datos cargados exitosamente. Total usuarios:', adminData.length);
      console.log('📈 Estadísticas - Hoy:', todayCount, 'Semana:', weekCount, 'Mes:', monthCount);
      
    } catch (error) {
      console.error('💥 Error loading data:', error);
      alert('Error cargando datos: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar datos
  const getFilteredAndSortedData = () => {
    let filteredData = [...data];
    const now = new Date();
    
    // Aplicar filtros
    switch (filterBy) {
      case 'hoy':
        filteredData = filteredData.filter(row => {
          const createdDate = new Date(row.raw_created_at);
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return createdDate >= today;
        });
        break;
      case 'semana':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = filteredData.filter(row => {
          const createdDate = new Date(row.raw_created_at);
          return createdDate >= weekAgo;
        });
        break;
      case 'mes':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredData = filteredData.filter(row => {
          const createdDate = new Date(row.raw_created_at);
          return createdDate >= monthAgo;
        });
        break;
    }
    
    // Aplicar ordenamiento
    if (sortBy === 'fecha') {
      filteredData.sort((a, b) => new Date(b.raw_created_at).getTime() - new Date(a.raw_created_at).getTime());
    } else {
      filteredData.sort((a, b) => a.dias_desde_registro - b.dias_desde_registro);
    }
    
    return filteredData;
  };

  const filteredData = getFilteredAndSortedData();

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
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_users}</p>
                  <p className="text-xs text-muted-foreground">Total Usuarios</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.today_users}</p>
                  <p className="text-xs text-muted-foreground">Hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.week_users}</p>
                  <p className="text-xs text-muted-foreground">Esta Semana</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">{stats.month_users}</p>
                  <p className="text-xs text-muted-foreground">Este Mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla Principal */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuarios Hower Assistant ({filteredData.length})
              </CardTitle>
              
              <div className="flex flex-col md:flex-row gap-2">
                <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Filtrar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="hoy">Hoy</SelectItem>
                    <SelectItem value="semana">Esta Semana</SelectItem>
                    <SelectItem value="mes">Este Mes</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fecha">Más Recientes</SelectItem>
                    <SelectItem value="dias">Menos Días</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button onClick={loadData} disabled={loading} variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Correo</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>Último Autoresponder</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead>Días</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Cargando datos...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No hay datos disponibles para el filtro seleccionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.correo}</TableCell>
                        <TableCell className="font-mono">{row.telefono_completo}</TableCell>
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
                          <Badge variant={row.dias_desde_registro <= 7 ? 'default' : row.dias_desde_registro <= 30 ? 'secondary' : 'outline'}>
                            {row.dias_desde_registro} días
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
