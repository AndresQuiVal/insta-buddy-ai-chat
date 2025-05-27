
import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Brain, CheckCircle, AlertTriangle, Info, Lightbulb } from 'lucide-react';

interface AIRecommendation {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  action?: string;
}

interface RecommendationsCarouselProps {
  recommendations: AIRecommendation[];
}

const RecommendationsCarousel: React.FC<RecommendationsCarouselProps> = ({ recommendations }) => {
  if (recommendations.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-800">Recomendaciones de Hower Assistant</h3>
      </div>
      
      <Carousel className="w-full max-w-5xl mx-auto">
        <CarouselContent>
          {recommendations.map((rec, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/2">
              <div
                className={`p-6 rounded-xl border-l-4 h-full ${
                  rec.type === 'success' ? 'bg-green-50 border-green-500' :
                  rec.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                  rec.type === 'danger' ? 'bg-red-50 border-red-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {rec.type === 'success' && <CheckCircle className="w-6 h-6 text-green-500" />}
                    {rec.type === 'warning' && <AlertTriangle className="w-6 h-6 text-yellow-500" />}
                    {rec.type === 'danger' && <AlertTriangle className="w-6 h-6 text-red-500" />}
                    {rec.type === 'info' && <Info className="w-6 h-6 text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-2">{rec.title}</h4>
                    <p className="text-gray-600 mb-3 text-sm">{rec.message}</p>
                    {rec.action && (
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Lightbulb className="w-4 h-4" />
                        <span>{rec.action}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default RecommendationsCarousel;
