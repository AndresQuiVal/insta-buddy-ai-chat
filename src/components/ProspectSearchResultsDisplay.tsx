import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, Users, MessageCircle, Star, Clock, Calendar } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface ProspectSearchResult {
  id: string;
  result_type: 'post' | 'account';
  instagram_url: string;
  title: string;
  description: string;
  comments_count: number;
  publish_date: string;
  is_recent: boolean;
  has_keywords: boolean;
  search_keywords: string[];
  created_at: string;
}

interface ProspectSearchResultsDisplayProps {
  posts: ProspectSearchResult[];
  accounts: ProspectSearchResult[];
  isLoading: boolean;
  error: string | null;
}

const ProspectSearchResultsDisplay: React.FC<ProspectSearchResultsDisplayProps> = ({
  posts,
  accounts,
  isLoading,
  error
}) => {
  const [selectedPost, setSelectedPost] = useState<ProspectSearchResult | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<ProspectSearchResult | null>(null);
  const [postsOpen, setPostsOpen] = useState(true);
  const [accountsOpen, setAccountsOpen] = useState(true);

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Nuevos Prospectos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando nuevos prospectos...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Nuevos Prospectos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0 && accounts.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Nuevos Prospectos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No hay nuevos prospectos disponibles. Los prospectos se actualizan automáticamente con las notificaciones de WhatsApp.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Nuevos Prospectos
            <Badge variant="secondary" className="ml-2">
              {posts.length + accounts.length} resultados
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sección de Posts */}
          {posts.length > 0 && (
            <Collapsible open={postsOpen} onOpenChange={setPostsOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5" />
                    <h3 className="font-semibold">Gente que comentó un post</h3>
                    <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                      {posts.length}
                    </Badge>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${postsOpen ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">¿Qué verás aquí?</h4>
                      <p className="text-sm text-blue-800">
                        Posts/reels de Instagram donde las personas que comentaron <strong>pueden ser tus prospectos!</strong>
                      </p>
                      <p className="text-sm text-blue-800 mt-2">
                        <strong>🎯 ¿Qué hago ahora?</strong> Haz click en cada card para ver las opciones de prospección.
                      </p>
                    </div>
                  </div>
                </div>
                
                {posts.map((post) => (
                  <Card 
                    key={post.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-blue-200"
                    onClick={() => setSelectedPost(post)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-700 mb-2">{post.title}</h4>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {post.has_keywords && (
                              <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                Mejor resultado
                              </Badge>
                            )}
                            
                            {post.comments_count > 0 && (
                              <Badge variant="outline" className="text-blue-600 border-blue-300">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                {post.comments_count.toLocaleString()} comentarios
                              </Badge>
                            )}
                            
                            {post.publish_date && (
                              <Badge 
                                variant="outline" 
                                className={`${post.is_recent ? 'text-green-600 border-green-300' : 'text-gray-600 border-gray-300'}`}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {post.publish_date} - {post.is_recent ? 'Muy reciente' : 'No tan reciente'}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            <strong>📝 Descripción:</strong> {post.description}
                          </p>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a href={post.instagram_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Ver en Instagram
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Sección de Cuentas */}
          {accounts.length > 0 && (
            <Collapsible open={accountsOpen} onOpenChange={setAccountsOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg cursor-pointer hover:from-green-600 hover:to-green-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    <h3 className="font-semibold">Gente que sigue una cuenta</h3>
                    <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                      {accounts.length}
                    </Badge>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${accountsOpen ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Users className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900 mb-1">¿Qué verás aquí?</h4>
                      <p className="text-sm text-green-800">
                        Cuentas de Instagram cuyos seguidores <strong>pueden ser tus prospectos!</strong>
                      </p>
                      <p className="text-sm text-green-800 mt-2">
                        <strong>🎯 ¿Qué hago ahora?</strong> Haz click en cada card para ver las opciones de prospección.
                      </p>
                    </div>
                  </div>
                </div>
                
                {accounts.map((account) => (
                  <Card 
                    key={account.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-green-200"
                    onClick={() => setSelectedAccount(account)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-green-700 mb-2">{account.title}</h4>
                          
                          {account.has_keywords && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                Mejor resultado
                              </Badge>
                            </div>
                          )}
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            <strong>📝 Descripción:</strong> {account.description}
                          </p>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a href={account.instagram_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Ver en Instagram
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Posts */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Contacta a los que comentaron así...
            </DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">{selectedPost.title}</h4>
                <p className="text-sm text-blue-800">{selectedPost.description}</p>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Para contactar a las personas que comentaron en este post:
                </p>
                
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Ve al post en Instagram haciendo click en "Ver en Instagram"</li>
                  <li>Busca comentarios de personas que puedan ser tu cliente ideal</li>
                  <li>Ve a sus perfiles y envíales un mensaje directo</li>
                  <li>Usa un mensaje personalizado basado en su comentario</li>
                </ol>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="default"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <a href={selectedPost.instagram_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver en Instagram
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para Cuentas */}
      <Dialog open={!!selectedAccount} onOpenChange={() => setSelectedAccount(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Contacta a los que siguen una cuenta así...
            </DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">{selectedAccount.title}</h4>
                <p className="text-sm text-green-800">{selectedAccount.description}</p>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Para contactar a los seguidores de esta cuenta:
                </p>
                
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Ve a la cuenta en Instagram haciendo click en "Ver en Instagram"</li>
                  <li>Haz click en el número de seguidores para ver la lista</li>
                  <li>Busca perfiles que puedan ser tu cliente ideal</li>
                  <li>Ve a sus perfiles y envíales un mensaje directo</li>
                  <li>Menciona que encontraste su perfil porque sigue a esta cuenta</li>
                </ol>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="default"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <a href={selectedAccount.instagram_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver en Instagram
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProspectSearchResultsDisplay;