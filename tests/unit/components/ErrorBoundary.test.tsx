import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from '../../../components/ErrorBoundary';
import { logError } from '../../../utils/errorTracking';

// Mock error tracking
vi.mock('../../../utils/errorTracking', () => ({
  logError: vi.fn(),
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Component with Framer Motion (mock it to avoid issues)
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console errors in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error fallback when error is thrown', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Une erreur s'est produite/i)).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should log error when caught', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.objectContaining({
        componentStack: expect.any(String),
        boundary: 'ErrorBoundary',
      }),
      undefined
    );
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });

  it('should reset error state when reset is called', async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error fallback should be displayed
    expect(screen.getByText(/Une erreur s'est produite/i)).toBeInTheDocument();

    // Find and click reset button
    const resetButton = screen.getByRole('button', { name: /réessayer/i });
    resetButton.click();

    // After reset, should try to render children again
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show content without error
    expect(screen.queryByText(/Une erreur s'est produite/i)).not.toBeInTheDocument();
  });

  it('should call onReset callback when provided', () => {
    const onReset = vi.fn();

    render(
      <ErrorBoundary onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const resetButton = screen.getByRole('button', { name: /réessayer/i });
    resetButton.click();

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

describe('withErrorBoundary HOC', () => {
  it('should wrap component with ErrorBoundary', () => {
    const TestComponent = () => <div>Test component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Test component')).toBeInTheDocument();
  });

  it('should catch errors in wrapped component', () => {
    const WrappedThrowError = withErrorBoundary(ThrowError);

    render(<WrappedThrowError shouldThrow={true} />);

    expect(screen.getByText(/Une erreur s'est produite/i)).toBeInTheDocument();
  });

  it('should pass custom fallback to HOC', () => {
    const customFallback = <div>HOC custom fallback</div>;
    const WrappedThrowError = withErrorBoundary(ThrowError, customFallback);

    render(<WrappedThrowError shouldThrow={true} />);

    expect(screen.getByText('HOC custom fallback')).toBeInTheDocument();
  });
});
