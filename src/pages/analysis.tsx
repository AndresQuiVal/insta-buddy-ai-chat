import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdvancedMetrics from '@/components/AdvancedMetrics';
import { useRouter } from 'next/router';

const AnalysisPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
          variant="ghost"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Button>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Análisis Detallado</h1>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <AdvancedMetrics />
      </div>
    </div>
  );
};

export default AnalysisPage; 