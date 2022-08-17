import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { globalStyles } from '@/styles/global';

import { Router } from './routes/Router';

const queryClient = new QueryClient();

function App() {
  globalStyles();
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
