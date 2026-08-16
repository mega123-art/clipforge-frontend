import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Remounting a screen within 30s reuses the cache instead of refetching.
      // Individual queries raise this (catalogues) or lower it (live job state).
      staleTime: 30_000,
      // Cache survives 10min of the screen being unmounted, so back-navigation
      // renders instantly from cache and revalidates behind the scenes.
      gcTime: 10 * 60_000,
      refetchOnReconnect: true,
    },
  },
})

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)
