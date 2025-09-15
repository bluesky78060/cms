import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { UserProvider, useUser } from './contexts/UserContext';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Invoices from './components/Invoices';
import Clients from './components/Clients';
import WorkItems from './components/WorkItems';
import Estimates from './components/Estimates';
import CompanyInfo from './components/CompanyInfo';
import AdminPanel from './components/AdminPanel';

function AppContent() {
  const { isLoggedIn } = useUser();

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/estimates" element={<Estimates />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/work-items" element={<WorkItems />} />
          <Route path="/company-info" element={<CompanyInfo />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
