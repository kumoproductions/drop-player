import {
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useState,
} from 'react';

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
  containerRef,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipId = useId();

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsVisible(true);

    // Calculate position to keep tooltip within container bounds
    const target = e.currentTarget;
    const targetRect = target.getBoundingClientRect();
    const container = containerRef?.current;

    if (container) {
      const containerRect = container.getBoundingClientRect();

      // Calculate horizontal position (used for future position clamping)
      const _targetCenterX = targetRect.left + targetRect.width / 2;
      void _targetCenterX; // Reserved for future use

      setTooltipStyle({
        left: '50%',
        transform: 'translateX(-50%)',
        // Clamp to container bounds (with some padding)
        maxWidth: containerRect.width - 16,
      });
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleFocus = () => {
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

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
          id={tooltipId}
          role="tooltip"
          className={`drop-player-tooltip ${
            position === 'top'
              ? 'drop-player-tooltip--top'
              : 'drop-player-tooltip--bottom'
          }`}
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            ...tooltipStyle,
          }}
          tabIndex={-1}
        >
          {content}
        </div>
      )}
    </div>
  );
}
