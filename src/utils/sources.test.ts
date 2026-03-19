import { describe, expect, it, vi } from 'vitest';
import { inferSourceType, normalizeSources } from './sources';

// =============================================================================
// inferSourceType
// =============================================================================

describe('inferSourceType', () => {
  describe('extension-based detection', () => {
    it.each([
      ['https://example.com/video.mp4', 'progressive'],
      ['https://example.com/video.webm', 'progressive'],
      ['https://example.com/video.mov', 'progressive'],
      ['https://example.com/video.ogv', 'progressive'],
      ['https://example.com/stream.m3u8', 'hls'],
      ['https://example.com/photo.jpg', 'image'],
      ['https://example.com/photo.jpeg', 'image'],
      ['https://example.com/photo.png', 'image'],
      ['https://example.com/photo.webp', 'image'],
      ['https://example.com/photo.avif', 'image'],
      ['https://example.com/photo.svg', 'image'],
      ['https://example.com/photo.gif', 'image'],
      ['https://example.com/doc.pdf', 'pdf'],
      ['https://example.com/song.mp3', 'audio'],
      ['https://example.com/song.wav', 'audio'],
      ['https://example.com/song.ogg', 'audio'],
      ['https://example.com/song.flac', 'audio'],
      ['https://example.com/song.m4a', 'audio'],
      ['https://example.com/song.aac', 'audio'],
      ['https://example.com/song.opus', 'audio'],
    ] as const)('%s → %s', (url, expected) => {
      expect(inferSourceType(url)).toBe(expected);
    });
  });

  describe('mimeType takes priority over extension', () => {
    it('mimeType overrides extension', () => {
      expect(
        inferSourceType('https://example.com/video.mp4', 'audio/mpeg')
      ).toBe('audio');
    });

    it('image mimeType on extensionless URL', () => {
      expect(
        inferSourceType('https://cdn.example.com/abc123', 'image/png')
      ).toBe('image');
    });

    it('HLS mimeType', () => {
      expect(
        inferSourceType('https://example.com/stream', 'application/x-mpegURL')
      ).toBe('hls');
    });

    it('unknown mimeType falls back to progressive', () => {
      expect(inferSourceType('https://example.com/media', 'video/mp4')).toBe(
        'progressive'
      );
    });
  });

  describe('extensionless URL without mimeType', () => {
    it('falls back to progressive', () => {
      expect(inferSourceType('https://cdn.example.com/abc123')).toBe(
        'progressive'
      );
    });

    it('emits console.warn', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      inferSourceType('https://cdn.example.com/abc123');
      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0]).toContain('Could not detect media type');
      spy.mockRestore();
    });

    it('does not warn when extension is recognized', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      inferSourceType('https://example.com/video.mp4');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});

// =============================================================================
// normalizeSources — without mediaModeOverride (Player path)
// =============================================================================

describe('normalizeSources (Player — no override)', () => {
  it('returns empty entries for null', () => {
    const result = normalizeSources(null);
    expect(result.mediaMode).toBe('video');
    expect(result.entries).toEqual([]);
  });

  it('accepts a string URL', () => {
    const result = normalizeSources('https://example.com/video.mp4');
    expect(result.mediaMode).toBe('video');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].sourceType).toBe('progressive');
  });

  it('accepts a MediaSource object', () => {
    const result = normalizeSources({ url: 'https://example.com/photo.png' });
    expect(result.mediaMode).toBe('image');
    expect(result.entries[0].sourceType).toBe('image');
  });

  it('infers mode from first source', () => {
    const result = normalizeSources([
      { url: 'https://example.com/song.mp3' },
      { url: 'https://example.com/song2.mp3' },
    ]);
    expect(result.mediaMode).toBe('audio');
    expect(result.entries).toHaveLength(2);
  });

  it('filters out sources with different media modes', () => {
    const result = normalizeSources([
      { url: 'https://example.com/video.mp4' },
      { url: 'https://example.com/photo.png' }, // image — filtered out
    ]);
    expect(result.mediaMode).toBe('video');
    expect(result.entries).toHaveLength(1);
  });

  it('warns for extensionless URL without mimeType', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = normalizeSources('https://cdn.example.com/abc123');
    expect(result.mediaMode).toBe('video');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('uses mimeType when extension is absent', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = normalizeSources({
      url: 'https://cdn.example.com/abc123',
      mimeType: 'image/jpeg',
    });
    expect(result.mediaMode).toBe('image');
    expect(result.entries[0].sourceType).toBe('image');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// =============================================================================
// normalizeSources — with mediaModeOverride (wrapper path)
// =============================================================================

describe('normalizeSources (wrapper — with mediaModeOverride)', () => {
  describe('VideoPlayer (_mediaMode="video")', () => {
    it('treats extensionless URL as progressive without warning', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = normalizeSources(
        'https://cdn.example.com/abc123',
        'video'
      );
      expect(result.mediaMode).toBe('video');
      expect(result.entries[0].sourceType).toBe('progressive');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('detects HLS by extension', () => {
      const result = normalizeSources(
        'https://example.com/stream.m3u8',
        'video'
      );
      expect(result.entries[0].sourceType).toBe('hls');
    });

    it('detects HLS by mimeType', () => {
      const result = normalizeSources(
        {
          url: 'https://cdn.example.com/stream',
          mimeType: 'application/x-mpegURL',
        },
        'video'
      );
      expect(result.entries[0].sourceType).toBe('hls');
    });

    it('ignores image mimeType — forces progressive', () => {
      const result = normalizeSources(
        { url: 'https://example.com/photo.jpg', mimeType: 'image/jpeg' },
        'video'
      );
      expect(result.mediaMode).toBe('video');
      expect(result.entries[0].sourceType).toBe('progressive');
    });

    it('ignores audio extension — forces progressive', () => {
      const result = normalizeSources('https://example.com/song.mp3', 'video');
      expect(result.mediaMode).toBe('video');
      expect(result.entries[0].sourceType).toBe('progressive');
    });
  });

  describe('ImageViewer (_mediaMode="image")', () => {
    it('treats extensionless URL as image', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = normalizeSources(
        'https://cdn.example.com/abc123',
        'image'
      );
      expect(result.mediaMode).toBe('image');
      expect(result.entries[0].sourceType).toBe('image');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('ignores video mimeType — forces image', () => {
      const result = normalizeSources(
        { url: 'https://example.com/video.mp4', mimeType: 'video/mp4' },
        'image'
      );
      expect(result.mediaMode).toBe('image');
      expect(result.entries[0].sourceType).toBe('image');
    });
  });

  describe('AudioPlayer (_mediaMode="audio")', () => {
    it('treats extensionless URL as audio', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = normalizeSources(
        'https://cdn.example.com/abc123',
        'audio'
      );
      expect(result.mediaMode).toBe('audio');
      expect(result.entries[0].sourceType).toBe('audio');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('ignores image extension — forces audio', () => {
      const result = normalizeSources('https://example.com/photo.png', 'audio');
      expect(result.mediaMode).toBe('audio');
      expect(result.entries[0].sourceType).toBe('audio');
    });
  });

  describe('PdfViewer (_mediaMode="pdf")', () => {
    it('treats extensionless URL as pdf', () => {
      const result = normalizeSources('https://cdn.example.com/abc123', 'pdf');
      expect(result.mediaMode).toBe('pdf');
      expect(result.entries[0].sourceType).toBe('pdf');
    });
  });

  describe('empty sources with override', () => {
    it('returns overridden mediaMode with empty entries', () => {
      const result = normalizeSources(null, 'audio');
      expect(result.mediaMode).toBe('audio');
      expect(result.entries).toEqual([]);
    });
  });

  describe('does not filter mismatched sources', () => {
    it('includes all sources regardless of extension', () => {
      const result = normalizeSources(
        [
          { url: 'https://example.com/video.mp4' },
          { url: 'https://example.com/photo.png' },
          { url: 'https://example.com/song.mp3' },
        ],
        'video'
      );
      expect(result.mediaMode).toBe('video');
      expect(result.entries).toHaveLength(3);
      expect(result.entries.every((e) => e.sourceType === 'progressive')).toBe(
        true
      );
    });
  });
});
