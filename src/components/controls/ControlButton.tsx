import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Tooltip } from './Tooltip';

export interface ControlButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Tooltip text, also used as the button's aria-label */
  label: string;
  /** Highlight the button with the active (blue) color */
  active?: boolean;
  /** Tooltip placement relative to the button */
  tooltipPosition?: 'top' | 'bottom';
  children: ReactNode;
}

/**
 * A controls-bar button with a built-in tooltip and accessible label.
 * Use inside the `controlsStart` / `controlsEnd` slots to match the
 * look and behavior of the built-in controls.
 */
export function ControlButton({
  label,
  active = false,
  tooltipPosition,
  children,
  className,
  ...buttonProps
}: ControlButtonProps) {
  const classes = [
    'drop-player-button',
    active ? 'drop-player-color-blue' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tooltip content={label} position={tooltipPosition}>
      <button
        type="button"
        {...buttonProps}
        className={classes}
        aria-label={label}
      >
        {children}
      </button>
    </Tooltip>
  );
}
