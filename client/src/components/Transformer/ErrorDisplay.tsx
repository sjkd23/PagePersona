/**
 * Enhanced Error Display Component
 *
 * This component displays user-friendly error messages with contextual information,
 * action buttons, and helpful guidance. It handles different error types with
 * appropriate styling and provides clear next steps for users.
 */

import { ErrorCode } from '@pagepersonai/shared';
import './styles/ErrorDisplay.css';

/**
 * Props for the ErrorDisplay component
 */
interface ErrorDisplayProps {
  error: string;
  errorCode?: ErrorCode;
  title?: string;
  helpText?: string;
  actionText?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
  // Usage limit specific props
  currentUsage?: number;
  usageLimit?: number;
  membership?: string;
  upgradeUrl?: string;
  // Rate limit specific props
  retryAfter?: number;
  className?: string;
}

/**
 * Enhanced Error Display Component
 *
 * Displays contextual error messages with appropriate styling and actions
 * based on error type. Provides upgrade prompts for usage limits and
 * retry guidance for rate limits.
 */
export default function ErrorDisplay({
  error,
  errorCode,
  title,
  helpText,
  actionText,
  onAction,
  onDismiss,
  compact = false,
  currentUsage,
  usageLimit,
  membership,
  upgradeUrl,
  retryAfter,
  className = '',
}: ErrorDisplayProps) {
  // Get appropriate icon based on error type
  const getErrorIcon = () => {
    switch (errorCode) {
      case ErrorCode.USAGE_LIMIT_EXCEEDED:
        return '📊';
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        return '⏱️';
      case ErrorCode.AUTH_REQUIRED:
      case ErrorCode.AUTH_INVALID:
      case ErrorCode.AUTH_EXPIRED:
        return '🔐';
      case ErrorCode.INVALID_URL:
      case ErrorCode.INVALID_TEXT:
        return '⚠️';
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.SERVICE_UNAVAILABLE:
        return '🌐';
      case ErrorCode.SCRAPING_FAILED:
        return '🚫';
      default:
        return '❌';
    }
  };

  // Get appropriate style class based on error type
  const getErrorStyle = () => {
    switch (errorCode) {
      case ErrorCode.USAGE_LIMIT_EXCEEDED:
        return 'error-upgrade';
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        return 'error-warning';
      case ErrorCode.INVALID_URL:
      case ErrorCode.INVALID_TEXT:
      case ErrorCode.INVALID_PERSONA:
        return 'error-validation';
      case ErrorCode.AUTH_REQUIRED:
      case ErrorCode.AUTH_INVALID:
      case ErrorCode.AUTH_EXPIRED:
        return 'error-auth';
      default:
        return 'error-general';
    }
  };

  // Handle action button clicks
  const handleAction = () => {
    if (errorCode === ErrorCode.USAGE_LIMIT_EXCEEDED && upgradeUrl) {
      window.open(upgradeUrl, '_blank');
    } else if (onAction) {
      onAction();
    }
  };

  // Format retry time
  const formatRetryTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  if (compact) {
    return (
      <div className={`error-display-compact ${getErrorStyle()} ${className}`}>
        <div className="error-icon-compact">{getErrorIcon()}</div>
        <div className="error-content-compact">
          <p className="error-message-compact">{error}</p>
          {helpText && <p className="error-help-compact">{helpText}</p>}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="error-dismiss-compact"
            title="Dismiss error"
            aria-label="Dismiss error"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`error-display ${getErrorStyle()} ${className}`}>
      <div className="error-header">
        <div className="error-icon">{getErrorIcon()}</div>
        <div className="error-title-section">
          {title && <h3 className="error-title">{title}</h3>}
          <p className="error-message">{error}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="error-dismiss"
            title="Dismiss error"
            aria-label="Dismiss error"
          >
            ×
          </button>
        )}
      </div>

      {/* Usage limit specific information */}
      {errorCode === ErrorCode.USAGE_LIMIT_EXCEEDED &&
        currentUsage !== undefined &&
        usageLimit !== undefined && (
          <div className="error-details">
            <div className="usage-meter">
              <div className="usage-bar">
                <div
                  className="usage-progress"
                  style={{ width: `${Math.min((currentUsage / usageLimit) * 100, 100)}%` }}
                />
              </div>
              <p className="usage-text">
                {currentUsage.toLocaleString()} / {usageLimit.toLocaleString()} transformations used
                this month
              </p>
            </div>
            {membership && (
              <p className="membership-info">
                Current plan: <span className="membership-badge">{membership}</span>
              </p>
            )}
          </div>
        )}

      {/* Rate limit specific information */}
      {errorCode === ErrorCode.RATE_LIMIT_EXCEEDED && retryAfter && (
        <div className="error-details">
          <p className="retry-info">
            Please wait {formatRetryTime(retryAfter)} before trying again.
          </p>
        </div>
      )}

      {/* Help text */}
      {helpText && (
        <div className="error-help">
          <p>{helpText}</p>
        </div>
      )}

      {/* Action button */}
      {(actionText || errorCode === ErrorCode.USAGE_LIMIT_EXCEEDED) && (
        <div className="error-actions">
          <button
            onClick={handleAction}
            className={`error-action-button ${errorCode === ErrorCode.USAGE_LIMIT_EXCEEDED ? 'action-upgrade' : 'action-primary'}`}
          >
            {actionText ||
              (errorCode === ErrorCode.USAGE_LIMIT_EXCEEDED ? 'Upgrade Plan' : 'Try Again')}
          </button>
        </div>
      )}
    </div>
  );
}
