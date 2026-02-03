import { useEffect, Suspense, lazy, memo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { PageLoading } from '@/components/ui/Loading';

// Lazy load all pages for better performance
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Applications = lazy(() => import('@/pages/Applications').then(m => ({ default: m.Applications })));
const Chat = lazy(() => import('@/pages/Chat').then(m => ({ default: m.Chat })));
const HeroSettings = lazy(() => import('@/pages/HeroSettings').then(m => ({ default: m.HeroSettings })));
const StatsSettings = lazy(() => import('@/pages/StatsSettings').then(m => ({ default: m.StatsSettings })));
const FeaturesSettings = lazy(() => import('@/pages/FeaturesSettings').then(m => ({ default: m.FeaturesSettings })));
const ProgramsSettings = lazy(() => import('@/pages/ProgramsSettings').then(m => ({ default: m.ProgramsSettings })));
const CountriesSettings = lazy(() => import('@/pages/CountriesSettings').then(m => ({ default: m.CountriesSettings })));
const StepsSettings = lazy(() => import('@/pages/StepsSettings').then(m => ({ default: m.StepsSettings })));
const VideoSettings = lazy(() => import('@/pages/VideoSettings').then(m => ({ default: m.VideoSettings })));
const TestimonialsSettings = lazy(() => import('@/pages/TestimonialsSettings').then(m => ({ default: m.TestimonialsSettings })));
const TipsSettings = lazy(() => import('@/pages/TipsSettings').then(m => ({ default: m.TipsSettings })));
const FaqSettings = lazy(() => import('@/pages/FaqSettings').then(m => ({ default: m.FaqSettings })));
const ContactSettings = lazy(() => import('@/pages/ContactSettings').then(m => ({ default: m.ContactSettings })));
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })));

// Configure query client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Protected route wrapper
const ProtectedRoute = memo(function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
});

// App routes component
function AppRoutes() {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="chat" element={<Chat />} />
          <Route path="hero" element={<HeroSettings />} />
          <Route path="stats" element={<StatsSettings />} />
          <Route path="features" element={<FeaturesSettings />} />
          <Route path="programs" element={<ProgramsSettings />} />
          <Route path="countries" element={<CountriesSettings />} />
          <Route path="steps" element={<StepsSettings />} />
          <Route path="video" element={<VideoSettings />} />
          <Route path="testimonials" element={<TestimonialsSettings />} />
          <Route path="tips" element={<TipsSettings />} />
          <Route path="faq" element={<FaqSettings />} />
          <Route path="contact" element={<ContactSettings />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
