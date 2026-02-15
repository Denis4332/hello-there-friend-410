import { useRef, useState, useEffect } from 'react';
import { Play } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  className?: string;
  controls?: boolean;
  loop?: boolean;
}

const VideoPlayer = ({ src, className, controls = true, loop = true }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPlayButton, setShowPlayButton] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const attemptAutoplay = async () => {
      try {
        await video.play();
        setShowPlayButton(false);
      } catch {
        setShowPlayButton(true);
      }
    };

    attemptAutoplay();
  }, [src]);

  const handlePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
      setShowPlayButton(false);
    } catch (e) {
      console.error('Video play failed:', e);
    }
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className={className}
        controls={controls}
        muted
        autoPlay
        loop={loop}
        preload="metadata"
        playsInline
        onClick={handlePlay}
        onError={(e) => console.warn('Video load error:', e)}
      >
        <source src={src} type="video/mp4" />
        Dein Browser unterstützt keine Videos.
      </video>
      {showPlayButton && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30"
          aria-label="Video abspielen"
        >
          <Play className="h-16 w-16 text-white" />
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
