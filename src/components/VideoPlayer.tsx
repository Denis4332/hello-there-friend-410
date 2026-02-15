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
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset state when src changes
    setShowPlayButton(false);
    setIsPlaying(false);

    const handleCanPlay = async () => {
      try {
        await video.play();
        setIsPlaying(true);
        setShowPlayButton(false);
      } catch {
        // Autoplay blocked - show our play button
        setShowPlayButton(true);
      }
    };

    const handlePlaying = () => {
      setIsPlaying(true);
      setShowPlayButton(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    video.addEventListener('canplay', handleCanPlay, { once: true });
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);

    // If video is already ready (cached)
    if (video.readyState >= 3) {
      handleCanPlay();
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
    };
  }, [src]);

  const handlePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
      setShowPlayButton(false);
      setIsPlaying(true);
    } catch (e) {
      console.error('Video play failed:', e);
    }
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className={className}
        // Only show native controls once video is playing (prevents double play button)
        controls={controls && isPlaying}
        muted
        loop={loop}
        preload="auto"
        playsInline
        onError={(e) => {
          console.warn('Video error:', (e.target as HTMLVideoElement)?.error?.message);
        }}
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/quicktime" />
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
