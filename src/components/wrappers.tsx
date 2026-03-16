import { forwardRef } from 'react';
import type { PlayerProps, PlayerRef } from '../types';
import { Player } from './Player';

/**
 * Video player. Semantic alias for `Player` — source type is still inferred from URL.
 */
export const VideoPlayer = forwardRef<PlayerRef, PlayerProps>(
  function VideoPlayer(props, ref) {
    return <Player ref={ref} {...props} />;
  }
);

/**
 * Audio player. Semantic alias for `Player` — source type is still inferred from URL.
 */
export const AudioPlayer = forwardRef<PlayerRef, PlayerProps>(
  function AudioPlayer(props, ref) {
    return <Player ref={ref} {...props} />;
  }
);

/**
 * Image viewer. Semantic alias for `Player` — source type is still inferred from URL.
 */
export const ImageViewer = forwardRef<PlayerRef, PlayerProps>(
  function ImageViewer(props, ref) {
    return <Player ref={ref} {...props} />;
  }
);

/**
 * PDF viewer. Semantic alias for `Player` — source type is still inferred from URL.
 */
export const PdfViewer = forwardRef<PlayerRef, PlayerProps>(
  function PdfViewer(props, ref) {
    return <Player ref={ref} {...props} />;
  }
);
