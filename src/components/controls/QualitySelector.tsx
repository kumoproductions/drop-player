import { Check, Settings2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { HlsLevelInfo, QualityLevel, TranslationKey } from '../../types';
import { Tooltip } from './Tooltip';

interface QualitySelectorProps {
  hlsLevels: HlsLevelInfo[];
  currentHlsLevel: number;
  qualityLevel?: QualityLevel;
  hasOriginal: boolean;
  isPlayingOriginal: boolean;
  onQualityChange: (level: number | 'auto' | 'original') => void;
  t: (key: TranslationKey) => string;
}

export function QualitySelector({
  hlsLevels,
  currentHlsLevel,
  qualityLevel,
  hasOriginal,
  isPlayingOriginal,
  onQualityChange,
  t,
}: QualitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getButtonColor = (): string => {
    if (isPlayingOriginal) {
      return 'text-blue-400';
    }
    const actualHeight =
      currentHlsLevel >= 0 && hlsLevels[currentHlsLevel]
        ? hlsLevels[currentHlsLevel].height
        : null;
    if (actualHeight !== null) {
      return actualHeight >= 720 ? 'text-green-400' : 'text-yellow-400';
    }
    return 'text-green-400';
  };

  const getTooltip = (): string => {
    if (isPlayingOriginal) {
      return `${t('quality')} (${t('original')})`;
    }
    const actualHeight =
      currentHlsLevel >= 0 && hlsLevels[currentHlsLevel]
        ? hlsLevels[currentHlsLevel].height
        : null;
    if (qualityLevel?.mode === 'auto') {
      return actualHeight
        ? `${t('quality')} (${t('auto')} - ${actualHeight}p)`
        : `${t('quality')} (${t('auto')})`;
    }
    if (actualHeight) {
      return `${t('quality')} (${actualHeight}p)`;
    }
    return t('quality');
  };

  const handleSelect = useCallback(
    (mode: 'original' | 'hls-auto' | number) => {
      setIsOpen(false);
      if (mode === 'original') {
        onQualityChange('original');
      } else if (mode === 'hls-auto') {
        onQualityChange('auto');
      } else {
        onQualityChange(mode);
      }
    },
    [onQualityChange]
  );

  const options: Array<{
    key: string;
    label: string;
    mode: 'original' | 'hls-auto' | number;
  }> = [];

  if (hasOriginal) {
    options.push({
      key: 'original',
      label: t('original'),
      mode: 'original',
    });
  }

  if (hlsLevels.length > 0) {
    const sortedLevels = [...hlsLevels]
      .map((level, index) => ({ level, index }))
      .sort((a, b) => {
        const heightA = a.level.height ?? 0;
        const heightB = b.level.height ?? 0;
        return heightB - heightA;
      });

    for (const { level, index } of sortedLevels) {
      options.push({
        key: `hls-${index}`,
        label: `${level.height}p`,
        mode: index,
      });
    }

    options.push({
      key: 'hls-auto',
      label: t('auto'),
      mode: 'hls-auto',
    });
  }

  const getCurrentKey = (): string => {
    if (isPlayingOriginal) return 'original';
    if (qualityLevel?.mode === 'auto') return 'hls-auto';
    if (qualityLevel?.levelIndex !== undefined)
      return `hls-${qualityLevel.levelIndex}`;
    return 'hls-auto';
  };

  const currentKey = getCurrentKey();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (options.length === 0) return null;

  const tooltipContent = getTooltip();

  return (
    <div className="relative">
      <Tooltip content={isOpen ? '' : tooltipContent}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`drop-player-button flex items-center justify-center w-10 h-10 rounded-md hover:bg-white/10 transition-colors ${getButtonColor()}`}
          aria-label={t('quality')}
        >
          <Settings2 size={24} />
        </button>
      </Tooltip>

      {isOpen && (
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Backdrop for closing dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsOpen(false);
            }}
          />

          <div className="drop-player-dropdown absolute bottom-full right-0 mb-2 z-50">
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                className="drop-player-dropdown-item w-full text-left"
                data-selected={option.key === currentKey}
                onClick={() => handleSelect(option.mode)}
              >
                <span>{option.label}</span>
                {option.key === currentKey && (
                  <Check size={16} className="text-green-400" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
