const BASE = 'https://assets.drop.mov/samples';

export const MEDIA = {
  video: [
    {
      url: `${BASE}/video/01/playlist.m3u8`,
      originalUrl: `${BASE}/video/01/source.mp4`,
      label: 'Video 1',
    },
    {
      url: `${BASE}/video/02/playlist.m3u8`,
      originalUrl: `${BASE}/video/02/source.mp4`,
      label: 'Video 2',
    },
  ],
  videoPoster: `${BASE}/video/01/preview.jpg`,
  audio: `${BASE}/audio/01/sample.mp3`,
  images: [
    { url: `${BASE}/image/01/sample.jpg`, label: 'Photo 1' },
    { url: `${BASE}/image/02/sample.jpg`, label: 'Photo 2' },
    { url: `${BASE}/image/03/sample.jpg`, label: 'Photo 3' },
    { url: `${BASE}/image/04/sample.jpg`, label: 'Photo 4' },
    { url: `${BASE}/image/05/sample.jpg`, label: 'Photo 5' },
    { url: `${BASE}/image/06/sample.jpg`, label: 'Photo 6' },
  ],
  pdf: `${BASE}/pdf/01/sample.pdf`,
};
