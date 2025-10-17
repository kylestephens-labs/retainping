import { useState } from "react";

interface ArcadeEmbedProps {
  url?: string;
  title?: string;
  className?: string;
}

export default function ArcadeEmbed({ 
  url, 
  title = "RetainPing Demo", 
  className = "" 
}: ArcadeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!url) {
    return null;
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* 16:9 Aspect Ratio Container */}
      <div className="relative w-full pb-[56.25%] bg-gray-100 rounded-lg overflow-hidden">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Loading demo...</p>
            </div>
          </div>
        )}
        <iframe
          src={url}
          title={title}
          className="absolute top-0 left-0 w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onLoad={() => setIsLoaded(true)}
          style={{ display: isLoaded ? 'block' : 'none' }}
        />
      </div>
    </div>
  );
}
