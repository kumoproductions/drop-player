import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export const TooltipContainerContext =
  createContext<RefObject<HTMLElement | null> | null>(null);

// Global active tooltip management — ensures only one tooltip is visible at a time
let globalDismiss: (() => void) | null = null;

function registerTooltip(dismiss: () => void): void {
  if (globalDismiss && globalDismiss !== dismiss) {
    globalDismiss();
  }
  globalDismiss = dismiss;
}

function unregisterTooltip(dismiss: () => void): void {
  if (globalDismiss === dismiss) {
    globalDismiss = null;
  }
}

const AUTO_DISMISS_MS = 2500;

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
  containerRef?: RefObject<HTMLElement | null>;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  containerRef: containerRefProp,
}: TooltipProps) {
  const containerRefFromContext = useContext(TooltipContainerContext);
  const containerRef = containerRefProp ?? containerRefFromContext;
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isTouchRef = useRef(false);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    isTouchRef.current = false;
    if (autoDismissTimer.current !== undefined) {
      clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = undefined;
    }
  }, []);

  const show = useCallback(() => {
    registerTooltip(dismiss);
    setIsVisible(true);
  }, [dismiss]);

  // Start/reset auto-dismiss timer for touch interactions
  const startAutoDismiss = useCallback(() => {
    if (autoDismissTimer.current !== undefined) {
      clearTimeout(autoDismissTimer.current);
    }
    autoDismissTimer.current = setTimeout(() => {
      dismiss();
    }, AUTO_DISMISS_MS);
  }, [dismiss]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unregisterTooltip(dismiss);
      if (autoDismissTimer.current !== undefined) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, [dismiss]);

  const handleMouseEnter = useCallback(() => {
    // Ignore synthetic mouse events fired after touch
    if (isTouchRef.current) return;
    show();
  }, [show]);

  const handleMouseLeave = useCallback(() => {
    if (isTouchRef.current) return;
    dismiss();
  }, [dismiss]);

  const handleFocus = useCallback(() => {
    show();
  }, [show]);

  const handleBlur = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const handleTouchStart = useCallback(() => {
    isTouchRef.current = true;
    show();
    startAutoDismiss();
  }, [show, startAutoDismiss]);

  // Position the tooltip within container bounds after render
  // biome-ignore lint/correctness/useExhaustiveDependencies: content changes require repositioning
  useLayoutEffect(() => {
    const tooltip = tooltipRef.current;
    const container = containerRef?.current;
    if (!isVisible || !tooltip) return;

    const wrapper = tooltip.parentElement;
    if (!wrapper) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const tooltipWidth = tooltip.offsetWidth;
    const padding = 4;

    // Default: centered on wrapper
    let left = (wrapperRect.width - tooltipWidth) / 2;

    if (container) {
      const containerRect = container.getBoundingClientRect();

      // Tooltip edges in container-local coordinates
      const tooltipLeftInContainer =
        wrapperRect.left - containerRect.left + left;
      const tooltipRightInContainer = tooltipLeftInContainer + tooltipWidth;

      if (tooltipLeftInContainer < padding) {
        left = padding - (wrapperRect.left - containerRect.left);
      } else if (tooltipRightInContainer > containerRect.width - padding) {
        left =
          containerRect.width -
          padding -
          tooltipWidth -
          (wrapperRect.left - containerRect.left);
      }
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.transform = 'none';
  }, [isVisible, content, containerRef]);

  // Handle Escape key to close tooltip
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, dismiss]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Tooltip wrapper for mouse events
    <div
      className="drop-player-tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      aria-describedby={isVisible && content ? tooltipId : undefined}
    >
      {children}
      {isVisible && content && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={`drop-player-tooltip ${
            position === 'top'
              ? 'drop-player-tooltip--top'
              : 'drop-player-tooltip--bottom'
          }`}
          tabIndex={-1}
        >
          {content}
        </div>
      )}
    </div>
  );
}
