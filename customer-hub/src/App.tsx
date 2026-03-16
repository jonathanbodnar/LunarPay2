import { Routes, Route } from "react-router-dom";
import TenantWrapper from "./components/shared/TenantWrapper";
import React from "react";
import { ThemeProvider } from "./components/shared/ThemeProvider";
import NotFound from "./components/ui/not-found";
import { Toaster } from "sonner";

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="apollo-ui-theme">
      <Toaster />
      <Routes>
        <Route path="/:tenant/*" element={<TenantWrapper />} />
        <Route path="*" element={<NotFound 
            extraInfo={import.meta.env.MODE === 'development' ? 'Use /{companycode} where company code is an existing company identifier' : ''} />}
        />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
