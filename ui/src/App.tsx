import { globalStyles } from '@/styles/global';

import { Router } from './routes/Router';
import { QueryProvider } from './utils/queryClient';

function App() {
  globalStyles();
  return (
    <QueryProvider>
      <Router />
    </QueryProvider>
  );
}

export default App;
