import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppAnalytics from '@/components/AppAnalytics';
import { useNavigate } from 'react-router-dom';

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
            variant="ghost"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </div>
        
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl p-8">
          <AppAnalytics />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;