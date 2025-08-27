import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProspectResult {
  id: string;
  result_type: 'post' | 'account';
  instagram_url: string;
  title: string;
  description: string;
  comments_count: number;
  is_recent: boolean;
  has_keywords: boolean;
  publish_date: string;
  search_keywords: string[];
  created_at: string;
}

interface NewProspectsResultsProps {
  instagramUserId: string;
  onCountChange?: (count: number) => void;
}

const NewProspectsResults: React.FC<NewProspectsResultsProps> = ({ instagramUserId, onCountChange }) => {
  const [results, setResults] = useState<ProspectResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<ProspectResult | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadResults();
  }, [instagramUserId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('prospect_search_results')
        .select('*')
        .eq('instagram_user_id', instagramUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading prospect results:', error);
        toast({
          title: "Error",
          description: "Error al cargar los nuevos prospectos",
          variant: "destructive",
        });
        return;
      }

      setResults((data || []) as ProspectResult[]);
      
      // Notificar el cambio de count al componente padre
      if (onCountChange) {
        onCountChange((data || []).length);
      }
    } catch (error) {
      console.error('Error in loadResults:', error);
    } finally {
      setLoading(false);
    }
  };

  const posts = results.filter(r => r.result_type === 'post');
  const accounts = results.filter(r => r.result_type === 'account');

  const extractAndTruncateDescription = (description: string) => {
    if (!description) return '';
    
    const colonQuoteIndex = description.indexOf(': "');
    if (colonQuoteIndex === -1) {
      return description.length > 75 ? description.substring(0, 75) + '...' : description;
    }
    
    const textAfterColonQuote = description.substring(colonQuoteIndex + 3);
    
    if (textAfterColonQuote.length > 75) {
      return textAfterColonQuote.substring(0, 75) + '...';
    }
    
    return textAfterColonQuote;
  };

  const handleCardClick = (result: ProspectResult) => {
    setSelectedResult(result);
    setShowDialog(true);
  };

  const getDialogTitle = (result: ProspectResult) => {
    if (result.result_type === 'post') {
      return 'Contacta a los que comentaron así...';
    } else {
      return 'Contacta a los que siguen una cuenta así...';
    }
  };

  const getDialogContent = (result: ProspectResult) => {
    if (result.result_type === 'post') {
      return `Para prospectar en este ${result.title.toLowerCase()}, ve al enlace, revisa los comentarios y contacta directamente a las personas que comentaron. Los comentarios más recientes suelen tener mejores tasas de respuesta.`;
    } else {
      return `Para prospectar en esta cuenta, ve al perfil, revisa sus seguidores y contacta directamente a las personas que siguen esta cuenta. Los seguidores más activos suelen tener mejores tasas de respuesta.`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay nuevos prospectos disponibles.</p>
        <p className="text-sm mt-2">Los nuevos prospectos se generan automáticamente cuando recibes notificaciones.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Posts Section */}
      {posts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Gente que comentó un post</h3>
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-medium">
              {posts.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {posts.map((post) => (
              <Card 
                key={post.id} 
                className="cursor-pointer hover:shadow-md transition-shadow border-primary/20"
                onClick={() => handleCardClick(post)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm font-medium">
                          {post.title}
                        </span>
                        {post.is_recent && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs">
                            Reciente
                          </span>
                        )}
                      </div>
                      
                      {post.comments_count > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments_count} comentarios</span>
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground">
                        <strong>Descripción:</strong> {extractAndTruncateDescription(post.description)}
                      </p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={post.instagram_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Instagram
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Accounts Section */}
      {accounts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Gente que sigue una cuenta</h3>
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-medium">
              {accounts.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {accounts.map((account) => (
              <Card 
                key={account.id} 
                className="cursor-pointer hover:shadow-md transition-shadow border-green-200"
                onClick={() => handleCardClick(account)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
                          {account.title}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        <strong>Descripción:</strong> {extractAndTruncateDescription(account.description)}
                      </p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={account.instagram_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Instagram
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dialog for contact instructions */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedResult?.result_type === 'post' ? (
                <MessageCircle className="h-5 w-5 text-primary" />
              ) : (
                <Users className="h-5 w-5 text-green-600" />
              )}
              {selectedResult && getDialogTitle(selectedResult)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedResult && getDialogContent(selectedResult)}
            </p>
            
            {selectedResult && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Enlace de Instagram:</p>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full"
                >
                  <a href={selectedResult.instagram_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir en Instagram
                  </a>
                </Button>
              </div>
            )}
            
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> Los mejores momentos para contactar son entre las 10 AM y 4 PM, 
                cuando las personas están más activas en redes sociales.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewProspectsResults;