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

  const handleMouseEnter = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleFocus = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Position the tooltip within container bounds after render
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
  }, [isVisible, containerRef]);

  // Handle Escape key to close tooltip
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Tooltip wrapper for mouse events
    <div
      className="drop-player-tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
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
