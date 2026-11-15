import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Alert } from '../components/common/Alert.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Input } from '../components/common/Input.js';

describe('Common UI Components Unit Tests', () => {
  it('renders Button with text and triggers click event', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when isLoading is true', () => {
    render(<Button isLoading>Processing</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders Badge with correct text and variant', () => {
    render(<Badge variant="success">Normal</Badge>);
    const badge = screen.getByText('Normal');
    expect(badge).toBeInTheDocument();
  });

  it('renders Alert with title and description', () => {
    render(
      <Alert variant="warning" title="Clinical Limitation">
        Reference interval was not printed on document.
      </Alert>
    );
    expect(screen.getByText('Clinical Limitation')).toBeInTheDocument();
    expect(
      screen.getByText(/reference interval was not printed/i)
    ).toBeInTheDocument();
  });

  it('renders EmptyState with action button', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No Reports"
        description="Upload your first report."
        actionText="Upload Report"
        onAction={handleAction}
      />
    );
    expect(screen.getByText('No Reports')).toBeInTheDocument();
    const actionBtn = screen.getByRole('button', { name: /upload report/i });
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders Input with error message', () => {
    render(
      <Input
        label="Fasting Blood Glucose"
        error="Value must be a positive number"
      />
    );
    expect(screen.getByText('Fasting Blood Glucose')).toBeInTheDocument();
    expect(screen.getByText('Value must be a positive number')).toBeInTheDocument();
  });
});
