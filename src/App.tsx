import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Auth from "./pages/Auth";
import ApeWorkspace from "./pages/ApeWorkspace";
import PEForm from "./pages/healthtrends/PEForm";
import Encoder from "./pages/Encoder";
import Doctor from "./pages/Doctor";
import Patient from "./pages/Patient";
import Xray from "./pages/Xray";
import NotFound from "./pages/NotFound";

function LegacyPeExamRedirect() {
  const { examCode } = useParams<{ examCode: string }>();
  if (!examCode) return <Navigate to="/" replace />;
  return <Navigate to={`/pe/${encodeURIComponent(examCode)}`} replace />;
}

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ApeWorkspace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pe/:examCode" element={<PEForm />} />

            <Route path="/healthtrends" element={<Navigate to={{ pathname: "/", search: "?tab=registry" }} replace />} />
            <Route
              path="/healthtrends/pe-encoding"
              element={<Navigate to={{ pathname: "/", search: "?tab=pe-encoding" }} replace />}
            />
            <Route path="/healthtrends/pe/:examCode" element={<LegacyPeExamRedirect />} />

            <Route path="/encoder" element={<Encoder />} />
            <Route path="/doctor" element={<Doctor />} />
            <Route path="/patient" element={<Patient />} />
            <Route path="/xray" element={<Xray />} />
            <Route path="/admin" element={<Navigate to={{ pathname: "/", search: "?tab=admin" }} replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
