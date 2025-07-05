import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Image, Video, Users, Heart, MessageCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InstagramPost, getInstagramPosts, formatPostDate, truncateCaption } from '@/services/instagramPostsService';

interface InstagramPostSelectorProps {
  onPostSelected: (post: InstagramPost) => void;
  onBack: () => void;
  showAutoresponderSelection?: boolean;
}

const InstagramPostSelector = ({ 
  onPostSelected, 
  onBack, 
  showAutoresponderSelection = false 
}: InstagramPostSelectorProps) => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      console.log('📱 Cargando posts de Instagram...');
      
      const instagramPosts = await getInstagramPosts();
      setPosts(instagramPosts);
      
      console.log('✅ Posts cargados:', instagramPosts.length);
      
      if (instagramPosts.length === 0) {
        toast({
          title: "Sin posts",
          description: "No se encontraron posts en tu cuenta de Instagram",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('❌ Error cargando posts:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      toast({
        title: "Error cargando posts",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostSelect = (post: InstagramPost) => {
    setSelectedPost(post);
    if (showAutoresponderSelection) {
      onPostSelected(post);
    } else {
      onPostSelected(post);
    }
  };

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'VIDEO':
        return <Video className="w-4 h-4" />;
      case 'CAROUSEL_ALBUM':
        return <Users className="w-4 h-4" />;
      default:
        return <Image className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle>Selecciona un Post de Instagram</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-gray-600">Cargando tus posts de Instagram...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle className="text-purple-900">
              {showAutoresponderSelection 
                ? "Selecciona un Post para Asignar Autoresponder"
                : "Selecciona un Post para Comentarios Automáticos"
              }
            </CardTitle>
            <p className="text-sm text-purple-700 mt-1">
              {showAutoresponderSelection
                ? "Elige el post donde quieres asignar un autoresponder existente o crear uno nuevo"
                : "Elige el post donde quieres detectar comentarios con palabras clave"
              }
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay posts disponibles
            </h3>
            <p className="text-gray-600 mb-4">
              No se encontraron posts en tu cuenta de Instagram
            </p>
            <Button onClick={loadPosts} variant="outline">
              Intentar de nuevo
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <Card 
                key={post.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                  selectedPost?.id === post.id 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => handlePostSelect(post)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={post.thumbnail_url || post.media_url} 
                          alt="Post thumbnail"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {getMediaIcon(post.media_type)}
                            {post.media_type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatPostDate(post.timestamp)}
                          </span>
                        </div>
                        <a 
                          href={post.permalink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-purple-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {truncateCaption(post.caption)}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {post.like_count !== undefined && (
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {post.like_count.toLocaleString()}
                          </div>
                        )}
                        {post.comments_count !== undefined && (
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {post.comments_count.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InstagramPostSelector;
