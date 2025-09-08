import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { AppProvider } from './contexts/AppContext';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Invoices from './components/Invoices';
import Clients from './components/Clients';
import WorkItems from './components/WorkItems';
import CompanyInfo from './components/CompanyInfo';
import DataStorage from './components/DataStorage';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/work-items" element={<WorkItems />} />
              <Route path="/company-info" element={<CompanyInfo />} />
              <Route path="/data-storage" element={<DataStorage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;