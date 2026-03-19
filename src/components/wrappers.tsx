import { forwardRef } from 'react';
import type { PlayerProps, PlayerRef } from '../types';
import { Player } from './Player';

/**
 * Video player. Skips source type inference — all sources are treated as video.
 */
export const VideoPlayer = forwardRef<PlayerRef, PlayerProps>(
  function VideoPlayer(props, ref) {
    return <Player ref={ref} {...props} _mediaMode="video" />;
  }
);

/**
 * Audio player. Skips source type inference — all sources are treated as audio.
 */
export const AudioPlayer = forwardRef<PlayerRef, PlayerProps>(
  function AudioPlayer(props, ref) {
    return <Player ref={ref} {...props} _mediaMode="audio" />;
  }
);

/**
 * Image viewer. Skips source type inference — all sources are treated as images.
 */
export const ImageViewer = forwardRef<PlayerRef, PlayerProps>(
  function ImageViewer(props, ref) {
    return <Player ref={ref} {...props} _mediaMode="image" />;
  }
);

/**
 * PDF viewer. Skips source type inference — all sources are treated as PDF.
 */
export const PdfViewer = forwardRef<PlayerRef, PlayerProps>(
  function PdfViewer(props, ref) {
    return <Player ref={ref} {...props} _mediaMode="pdf" />;
  }
);
