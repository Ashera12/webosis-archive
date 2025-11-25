import React from 'react';

interface MediaRendererProps {
  src: string;
  alt?: string;
  className?: string;
  controlsForVideo?: boolean; // default true
  autoPlay?: boolean; // for video previews
  loop?: boolean; // for video previews
  muted?: boolean; // for video previews
}

const VIDEO_EXT_REGEX = /\.(mp4|webm|ogg)(\?.*)?$/i;

export default function MediaRenderer({
  src,
  alt = '',
  className = '',
  controlsForVideo = true,
  autoPlay,
  loop,
  muted,
}: MediaRendererProps) {
  if (!src) return null;
  const isVideo = VIDEO_EXT_REGEX.test(src);

  if (isVideo) {
    return (
      <video
        src={src}
        className={className}
        playsInline
        webkit-playsinline="true"
        controls={controlsForVideo}
        controlsList="nodownload"
        preload="metadata"
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    );
  }

  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
