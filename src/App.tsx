
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";

import AutoresponderOnboarding from "./pages/AutoresponderOnboarding";
import Guides from "./pages/Guides";
import InstagramCallback from "./pages/InstagramCallback";
import Settings from "./pages/Settings";
import Beta from "./pages/Beta";
import BetaOptimized from "./pages/BetaOptimized";
import ProspectsDemo from "./pages/ProspectsDemo";
import Debug from "./pages/Debug";
import Hower15 from "./pages/Hower15";
import Pricing from "./pages/Pricing";
import PricingIncruises from "./pages/PricingIncruises";
import NotFound from "./pages/NotFound";
import SignupForm from "./components/SignupForm";
import AdminTable from "./pages/AdminTable";
import Analytics from "./pages/Analytics";
import Prospects from "./pages/Prospects";
import TasksToDo from "./pages/TasksToDo";
import HowerLiteOnboarding from "./pages/HowerLiteOnboarding";
import DreamCustomerRadarGuide from "./pages/DreamCustomerRadarGuide";
import DreamCustomerRadarGame from "./pages/DreamCustomerRadarGame";
import ThreeMonthPlan from "./pages/ThreeMonthPlan";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/autoresponder-onboarding" element={<AutoresponderOnboarding />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/beta" element={<Beta />} />
            <Route path="/beta-optimized" element={<BetaOptimized />} />
            <Route path="/signup" element={<SignupForm />} />
          <Route path="/prospects-demo" element={<ProspectsDemo />} />
          <Route path="/debug" element={<Debug />} />
          <Route path="/hower-1-5" element={<Hower15 />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/pricing-incruises" element={<PricingIncruises />} />
          <Route path="/admin-table" element={<AdminTable />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/auth/instagram/callback" element={<InstagramCallback />} />
          <Route path="/prospects" element={<Prospects />} />
          <Route path="/hower-lite-onboarding" element={<HowerLiteOnboarding />} />
          <Route path="/tasks-to-do" element={<TasksToDo />} />
          <Route path="/dream-customer-radar-guide" element={<DreamCustomerRadarGuide />} />
          <Route path="/dream-customer-radar" element={<DreamCustomerRadarGame />} />
          <Route path="/3-month-plan" element={<ThreeMonthPlan />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
