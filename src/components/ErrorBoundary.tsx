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

  // Sanitize stack trace - remove file paths, keep function names
  private sanitizeStackTrace(stack: string | undefined): string | null {
    if (!stack) return null;
    
    return stack
      .split('\n')
      .slice(0, 5) // Only keep first 5 lines
      .map(line => {
        // Remove absolute file paths, keep only function names
        return line.replace(/https?:\/\/[^\s]+/g, '[file]')
                   .replace(/file:\/\/[^\s]+/g, '[file]')
                   .replace(/webpack-internal:[^\s]+/g, '[bundle]');
      })
      .join('\n');
  }

  // Sanitize component stack - limit depth
  private sanitizeComponentStack(componentStack: string | undefined): string | null {
    if (!componentStack) return null;
    
    return componentStack
      .split('\n')
      .slice(0, 3) // Only keep top 3 components
      .join('\n');
  }

  // Sanitize browser info - remove detailed version info
  private sanitizeBrowserInfo(userAgent: string): string {
    // Keep browser type and OS, remove detailed version numbers
    const browser = /Firefox|Chrome|Safari|Edge|Opera/.exec(userAgent)?.[0] || 'Unknown';
    const os = /Windows|Mac|Linux|Android|iOS/.exec(userAgent)?.[0] || 'Unknown';
    return `${browser} on ${os}`;
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Auto-reload bei Module-Import-Fehlern (passiert nach Code-Updates)
    if (error.message.includes('Importing a module script failed') ||
        error.message.includes('Failed to fetch dynamically imported module') ||
        error.message.includes('Loading chunk') ||
        error.message.includes('Loading module')) {
      
      const hasAutoReloaded = sessionStorage.getItem('auto-reload-on-chunk-error');
      
      if (!hasAutoReloaded) {
        // Nur einmal automatisch neu laden
        sessionStorage.setItem('auto-reload-on-chunk-error', 'true');
        window.location.reload();
        return;
      }
      
      // Wenn bereits neu geladen wurde, Flag zurücksetzen
      sessionStorage.removeItem('auto-reload-on-chunk-error');
    }

    // Log error to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const errorData = {
        error_message: error.message,
        error_stack: this.sanitizeStackTrace(error.stack),
        component_stack: this.sanitizeComponentStack(errorInfo.componentStack),
        user_id: user?.id || null,
        url: window.location.href,
        browser_info: this.sanitizeBrowserInfo(navigator.userAgent),
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
