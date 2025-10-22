import { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log error to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const errorData = {
        error_message: error.message,
        error_stack: error.stack || null,
        component_stack: errorInfo.componentStack || null,
        user_id: user?.id || null,
        url: window.location.href,
        browser_info: navigator.userAgent,
      };

      const { error: logError } = await supabase.functions.invoke('log-error', {
        body: errorData,
      });

      if (logError) {
        console.error('Failed to log error to Supabase:', logError);
      } else {
        console.log('Error logged to Supabase successfully');
      }
    } catch (logException) {
      console.error('Exception while logging error:', logException);
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
