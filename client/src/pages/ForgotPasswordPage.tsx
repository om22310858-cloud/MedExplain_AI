import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card.js';
import { Alert } from '../components/common/Alert.js';
import { HeartPulse, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setDevResetToken(null);

    try {
      const token = await authService.forgotPassword(email);
      setSuccessMessage(
        'If this email belongs to an account, a local reset token may be shown below. No email was sent unless an SMTP provider is actually configured on the server.'
      );
      if (token) {
        setDevResetToken(token);
      }
    } catch (err: any) {
      setErrorMessage(err.customMessage || 'Failed to submit password reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md">
            <HeartPulse className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground">
            We'll help you regain access to your medical account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              Local development does not send password-reset emails. If the account exists, a one-time development token is shown on this page. No email is delivered unless SMTP is configured.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive" title="Error">
                  {errorMessage}
                </Alert>
              )}
              {successMessage && (
                <Alert variant="success" title="Request Received">
                  {successMessage}
                </Alert>
              )}

              {devResetToken && (
                <div className="rounded-lg border border-primary-200 bg-primary-50 dark:bg-primary-950/50 p-3.5 space-y-2 text-xs">
                  <p className="font-semibold text-primary-900 dark:text-primary-100">
                    Development Reset Link Generated:
                  </p>
                  <p className="text-muted-foreground break-all font-mono">
                    Token: {devResetToken}
                  </p>
                  <Link
                    to={`/reset-password?token=${devResetToken}`}
                    className="inline-block text-primary-600 font-semibold hover:underline"
                  >
                    Click here to proceed to password reset →
                  </Link>
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Request Reset Link
              </Button>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
