import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter as Router } from "react-router-dom";
import { LocationProvide } from "./context/LocationContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";


const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LocationProvide>
            <App />
            <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
          </LocationProvide>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  </StrictMode>
);
