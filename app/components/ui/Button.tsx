import { ReactNode } from 'react';
import classNames from 'classnames';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  isLoading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  isLoading = false,
  fullWidth = false,
  onClick,
  className,
  type = 'button',
}: ButtonProps) => {
  const variants = {
    primary:
      'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl disabled:shadow-none',
    secondary:
      'bg-gray-700 text-gray-100 hover:bg-gray-600 border border-gray-600 hover:border-gray-500',
    danger:
      'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl disabled:shadow-none',
    ghost:
      'text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md font-medium',
    md: 'px-4 py-2.5 text-base rounded-lg font-medium',
    lg: 'px-6 py-3 text-lg rounded-lg font-semibold',
    xl: 'px-8 py-4 text-xl rounded-xl font-semibold',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={classNames(
        'inline-flex items-center justify-center gap-2 transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {isLoading && (
        <svg
          className="w-5 h-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;