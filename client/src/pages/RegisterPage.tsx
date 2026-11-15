import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card.js';
import { Alert } from '../components/common/Alert.js';
import { HeartPulse } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      setFieldErrors({ confirmPassword: ['Passwords do not match'] });
      return;
    }

    if (!acceptTerms) {
      setErrorMessage('You must accept the terms of service and privacy notice to continue.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name,
        email,
        password,
        confirmPassword,
        acceptTerms,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.customMessage || 'Registration failed. Please check the entered data.');
      if (err.validationErrors) {
        setFieldErrors(err.validationErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md">
            <HeartPulse className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create Your Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Start organizing and understanding your medical reports with AI
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Enter your details to create a free personal health portal</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive" title="Registration Failed">
                  {errorMessage}
                </Alert>
              )}

              <Input
                label="Full Name"
                placeholder="e.g. Sanika Patil"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={fieldErrors.name?.[0]}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email?.[0]}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                placeholder="At least 8 characters, letters & numbers"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password?.[0]}
                helperText="Must be at least 8 characters with at least one letter and one number"
                required
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={fieldErrors.confirmPassword?.[0]}
                required
                autoComplete="new-password"
              />

              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary mt-0.5"
                  required
                />
                <label
                  htmlFor="acceptTerms"
                  className="text-xs text-muted-foreground select-none cursor-pointer leading-relaxed"
                >
                  I acknowledge that MedExplain_AI provides educational laboratory report explanations
                  and document storage, and does not provide medical diagnoses or replace medical professionals.
                </label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Create Account
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:underline font-semibold">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
