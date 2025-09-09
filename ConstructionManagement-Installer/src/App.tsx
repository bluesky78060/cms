import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkLogForm from './pages/WorkLogForm';
import InvoiceList from './pages/InvoiceList';
import ClientList from './pages/ClientList';
import ProjectList from './pages/ProjectList';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<ClientList />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/work-logs" element={<WorkLogForm />} />
        <Route path="/invoices" element={<InvoiceList />} />
      </Routes>
    </Layout>
  );
}

export default App;