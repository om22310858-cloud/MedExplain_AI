import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button.js';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-primary-600 mb-4 shadow-xs">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        The medical record, analysis, or page you are looking for does not exist or may have been relocated.
      </p>
      <Link to="/dashboard">
        <Button variant="primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};
