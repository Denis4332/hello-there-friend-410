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
  // Start with play button visible - hide only once actually playing
  const [showPlayButton, setShowPlayButton] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setShowPlayButton(true);

    const handlePlaying = () => {
      setShowPlayButton(false);
    };

    const handlePause = () => {
      // Don't show overlay on pause - user can use native controls
    };

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);

    // Attempt autoplay after a short delay (iOS needs this)
    const timer = setTimeout(async () => {
      try {
        video.muted = true;
        await video.play();
        setShowPlayButton(false);
      } catch {
        // Autoplay blocked - play button stays visible
        setShowPlayButton(true);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
    };
  }, [src]);

  const handlePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.muted = true;
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
        loop={loop}
        preload="auto"
        playsInline
        onError={(e) => {
          const video = e.target as HTMLVideoElement;
          console.warn('Video error:', video?.error?.message, 'src:', src);
        }}
      >
        <source src={src} type="video/mp4" />
        Dein Browser unterstützt keine Videos.
      </video>
      {showPlayButton && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 z-10"
          aria-label="Video abspielen"
        >
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/50">
            <Play className="h-10 w-10 text-white ml-1" fill="white" />
          </div>
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
