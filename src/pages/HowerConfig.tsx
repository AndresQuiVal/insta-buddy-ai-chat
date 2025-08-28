import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import HowerConfig from '@/components/HowerConfig';

const HowerConfigPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        
        <HowerConfig />
      </div>
    </div>
  );
};

export default HowerConfigPage;