
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TokenManager from '@/components/TokenManager';
import PersonalityEditor from '@/components/PersonalityEditor';
import IdealClientTraits from '@/components/IdealClientTraits';

const ConfigPanel = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="personality" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personality">Personalidad IA</TabsTrigger>
          <TabsTrigger value="traits">Cliente Ideal</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>
        
        <TabsContent value="personality" className="mt-6">
          <PersonalityEditor />
        </TabsContent>
        
        <TabsContent value="traits" className="mt-6">
          <IdealClientTraits />
        </TabsContent>
        
        <TabsContent value="tokens" className="mt-6">
          <TokenManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfigPanel;
