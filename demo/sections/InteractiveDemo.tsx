import {
  AudioPlayer,
  defaultTimeDisplayFormats,
  ImageViewer,
  PdfViewer,
  VideoPlayer,
} from 'drop-player';
import { DemoCard } from '../components/DemoCard';
import { MEDIA } from '../data/media';

const VIDEO_CODE = `import { VideoPlayer, defaultTimeDisplayFormats } from 'drop-player';
import 'drop-player/styles.css';

<VideoPlayer
  sources={[
    { url: 'playlist.m3u8', originalUrl: 'source.mp4', label: 'Video 1' },
    { url: 'playlist.m3u8', originalUrl: 'source.mp4', label: 'Video 2' },
  ]}
  poster="preview.jpg"
  ui={{
    timeDisplayFormats: [
      ...defaultTimeDisplayFormats,
      'timecode',
      'frames',
      'feet-frames',
    ],
  }}
/>`;

const AUDIO_CODE = `import { AudioPlayer, defaultTimeDisplayFormats } from 'drop-player';
import 'drop-player/styles.css';

<AudioPlayer
  sources="sample.mp3"
  ui={{
    timeDisplayFormats: [...defaultTimeDisplayFormats, 'bars-beats'],
    bpm: 92,
    timeSignature: '4/4',
  }}
/>`;

const IMAGE_CODE = `import { ImageViewer } from 'drop-player';
import 'drop-player/styles.css';

// Array of sources — source selector shown
<ImageViewer
  sources={[
    { url: 'image-01.jpg', label: 'Photo 1' },
    { url: 'image-02.jpg', label: 'Photo 2' },
    { url: 'image-03.jpg', label: 'Photo 3' },
    { url: 'image-04.jpg', label: 'Photo 4' },
    { url: 'image-05.jpg', label: 'Photo 5' },
    { url: 'image-06.jpg', label: 'Photo 6' },
  ]}
  ui={{ features: { capture: true } }}
/>`;

const PDF_CODE = `import { PdfViewer } from 'drop-player';
import 'drop-player/styles.css';

<PdfViewer sources="sample.pdf" />`;

export function InteractiveDemo() {
  return (
    <div className="space-y-10">
      <h2
        id="interactive-demo"
        className="text-2xl font-bold text-zinc-100 mb-6 pb-2 border-b border-zinc-800 scroll-mt-6"
      >
        Interactive Demo
      </h2>
      <DemoCard
        title="Video Player"
        description="HLS adaptive streaming with progressive MP4 fallback"
        code={VIDEO_CODE}
      >
        <VideoPlayer
          sources={MEDIA.video}
          poster={MEDIA.videoPoster}
          ui={{
            timeDisplayFormats: [
              ...defaultTimeDisplayFormats,
              'timecode',
              'frames',
              'feet-frames',
            ],
          }}
        />
      </DemoCard>

      <DemoCard
        title="Audio Player"
        description="With waveform display (when waveform-data is installed)"
        code={AUDIO_CODE}
      >
        <AudioPlayer
          sources={MEDIA.audio}
          ui={{
            timeDisplayFormats: [...defaultTimeDisplayFormats, 'bars-beats'],
            bpm: 92,
            timeSignature: '4/4',
          }}
        />
      </DemoCard>

      <DemoCard
        title="Image Viewer"
        description="Zoom, pan, and source selector with multiple images"
        code={IMAGE_CODE}
      >
        <ImageViewer
          sources={MEDIA.images}
          ui={{ features: { capture: true } }}
        />
      </DemoCard>

      <DemoCard
        title="PDF Viewer"
        description="Browser-native rendering with zoom controls"
        code={PDF_CODE}
      >
        <PdfViewer sources={MEDIA.pdf} />
      </DemoCard>
    </div>
  );
}
