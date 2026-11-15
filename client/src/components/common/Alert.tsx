import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'destructive';
  title?: string;
  icon?: boolean;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  icon = true,
  children,
  ...props
}) => {
  const variants = {
    info: 'bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800',
    destructive: 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800',
  };

  const icons = {
    info: <Info className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />,
    success: <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />,
    destructive: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={twMerge(
        clsx('relative w-full rounded-lg border p-4 flex gap-3 text-sm leading-relaxed', variants[variant], className)
      )}
      {...props}
    >
      {icon && <div className="mt-0.5">{icons[variant]}</div>}
      <div className="flex-1">
        {title && <h5 className="mb-1 font-semibold leading-none tracking-tight">{title}</h5>}
        <div className="text-sm opacity-95">{children}</div>
      </div>
    </div>
  );
};
