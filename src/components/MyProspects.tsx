
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import InstagramMessages from '@/components/InstagramMessages';
import ProspectList from '@/components/ProspectList';
import AutoresponderManager from '@/components/AutoresponderManager';
import InstagramProfileManager from '@/components/InstagramProfileManager';

const MyProspects = () => {
  const [activeTab, setActiveTab] = useState('profiles');

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prospects">Prospectos</TabsTrigger>
          <TabsTrigger value="messages">Mensajes</TabsTrigger>
          <TabsTrigger value="autoresponder">Autoresponder</TabsTrigger>
        </TabsList>
        <TabsContent value="prospects" className="mt-6">
          <ProspectList />
        </TabsContent>
        <TabsContent value="messages" className="mt-6">
          <InstagramMessages />
        </TabsContent>
        <TabsContent value="autoresponder" className="mt-6">
          <AutoresponderManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyProspects;
