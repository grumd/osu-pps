import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { DEBUG_FETCH } from '@/constants/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000, // 1 hour
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      networkMode: DEBUG_FETCH ? 'always' : 'online',
    },
  },
});

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
