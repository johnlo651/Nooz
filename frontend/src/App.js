import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./utils/auth";
import { TTSProvider } from "./utils/tts";
import { Home } from "./pages/Home";
import { ArticleDetail } from "./pages/ArticleDetail";
import { AdminLogin } from "./pages/AdminLogin";
import { TTSPlayer } from "./components/TTSPlayer";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <AuthProvider>
      <TTSProvider>
        <div className="App">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/article/:id" element={<ArticleDetail />} />
              <Route path="/admin/login" element={<AdminLogin />} />
            </Routes>
          </BrowserRouter>
          <TTSPlayer />
          <Toaster />
        </div>
      </TTSProvider>
    </AuthProvider>
  );
}

export default App;
