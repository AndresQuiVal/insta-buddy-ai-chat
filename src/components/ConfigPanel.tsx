
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TokenManager from '@/components/TokenManager';
import PersonalityEditor from '@/components/PersonalityEditor';
import IdealClientTraits from '@/components/IdealClientTraits';
import OpenAIKeyManager from '@/components/OpenAIKeyManager';

const ConfigPanel = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="openai" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="openai">OpenAI Key</TabsTrigger>
          <TabsTrigger value="personality">Personalidad IA</TabsTrigger>
          <TabsTrigger value="traits">Cliente Ideal</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>
        
        <TabsContent value="openai" className="mt-6">
          <OpenAIKeyManager />
        </TabsContent>
        
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
