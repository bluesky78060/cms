import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AppProvider } from './contexts/AppContext';
import './index.css';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const basePath = ((): string => {
  const fromEnv = process.env.REACT_APP_BASE_PATH;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return window.location.pathname.startsWith('/cms') ? '/cms' : '/';
})();

const RouterImpl: any = (process.env.REACT_APP_USE_HASH_ROUTER === '1') ? HashRouter : BrowserRouter;

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <RouterImpl basename={basePath}>
          <App />
        </RouterImpl>
      </AppProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
