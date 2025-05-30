
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricTooltipProps {
  children: React.ReactNode;
  title: string;
  description: string;
  examples?: string[];
}

const MetricTooltip: React.FC<MetricTooltipProps> = ({ 
  children, 
  title, 
  description, 
  examples 
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-gray-600">{description}</p>
            {examples && examples.length > 0 && (
              <div className="text-xs text-gray-500">
                <div className="font-medium">Ejemplos:</div>
                <ul className="list-disc list-inside space-y-1">
                  {examples.map((example, index) => (
                    <li key={index}>{example}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MetricTooltip;
