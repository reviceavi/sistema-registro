import React from 'react';
import FirebaseLogin from './components/FirebaseLogin';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Inicio from './pages/Inicio';
import BuscarVictimas from './pages/BuscarVictimas';
import BuscarVictimasNoSQL from './pages/BuscarVictimasNoSQL';
import BuscarCIE from './pages/BuscarCIE';
import ControlGestion from './pages/ControlGestion';
import NuevoRegistroModerno from './pages/NuevoRegistroModerno';
import Registros from './pages/Registros';
import RelovIA from './pages/RelovIA';
import AdminBaseUPC from './pages/AdminBaseUPC';
import NuevoOficio from './pages/NuevoOficio';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ProtectedRoute>
          <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #b28e5c 0%, #9d2148 100%)'}}>            
            <main className="pb-8">
              <Routes>
                <Route path="/" element={<Inicio />} />
                <Route path="/buscar-victimas" element={<BuscarVictimas />} />
                <Route path="/buscar-victimas-nosql" element={<BuscarVictimasNoSQL />} />
                <Route path="/buscar-cie" element={<BuscarCIE />} />
                <Route path="/admin/base-upc" element={<AdminBaseUPC />} />
                <Route path="/control-gestion" element={<ControlGestion />} />
                <Route path="/nuevo-registro" element={<NuevoRegistroModerno />} />
                <Route path="/nuevo-oficio" element={<NuevoOficio />} />
                <Route path="/registros" element={<Registros />} />
                <Route path="/registro-revision" element={<Registros />} />
                <Route path="/relovia" element={<RelovIA />} />
                <Route path="/firebase-login" element={<FirebaseLogin />} />
              </Routes>
            </main>
            
            <footer className="border-t border-white border-opacity-20 py-6" style={{backgroundColor: '#9d2148'}}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center text-sm">
                  <p className="font-semibold" style={{color: '#ffffff'}}>© 2025 Sistema del Registro de Víctimas - Ciudad de México</p>
                  <p className="mt-1" style={{color: '#ffffff', opacity: 0.9}}>
                    Desarrollado por Michel Cano Hernández
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </ProtectedRoute>
      </Router>
    </AuthProvider>
  );
}

export default App;
