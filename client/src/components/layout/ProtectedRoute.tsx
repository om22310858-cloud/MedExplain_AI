import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { HeartPulse } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white animate-pulse shadow-md">
          <HeartPulse className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Loading MedExplain_AI...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
