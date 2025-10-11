import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Encoder from "./pages/Encoder";
import Doctor from "./pages/Doctor";
import Patient from "./pages/Patient";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { initializeMockData } from "./utils/mockData";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initializeMockData();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/encoder" element={<Encoder />} />
            <Route path="/doctor" element={<Doctor />} />
            <Route path="/patient" element={<Patient />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
