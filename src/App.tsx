import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import Encoder from "./pages/Encoder";
import Doctor from "./pages/Doctor";
import Patient from "./pages/Patient";
import Admin from "./pages/Admin";
import Xray from "./pages/Xray";
import HealthTrendsDashboard from "./pages/healthtrends/Dashboard";
import PEEncoding from "./pages/healthtrends/PEEncoding";
import PEForm from "./pages/healthtrends/PEForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/encoder" element={<Encoder />} />
            <Route path="/doctor" element={<Doctor />} />
            <Route path="/patient" element={<Patient />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/xray" element={<Xray />} />
            <Route path="/healthtrends" element={<HealthTrendsDashboard />} />
            <Route path="/healthtrends/pe-encoding" element={<PEEncoding />} />
            <Route path="/healthtrends/pe/:examCode" element={<PEForm />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
