import { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  className?: string;
  controls?: boolean;
  loop?: boolean;
}

const VideoPlayer = ({ src, className, controls = true, loop = true }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Attempt autoplay with muted (Safari requirement)
    const timer = setTimeout(() => {
      video.play().catch(() => {
        // Autoplay blocked - user can tap native play button
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [src]);

  return (
    <video
      ref={videoRef}
      className={className}
      controls={controls}
      muted
      loop={loop}
      preload="auto"
      playsInline
    >
      <source src={src} type="video/mp4" />
      Dein Browser unterstützt keine Videos.
    </video>
  );
};

export default VideoPlayer;
