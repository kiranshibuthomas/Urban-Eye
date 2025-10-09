import React, { useState, useEffect, useRef, memo } from 'react';
import { lazyLoadImage } from '../utils/performanceUtils';

/**
 * Optimized Image Component with lazy loading and progressive enhancement
 */
const OptimizedImage = memo(({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const imgElement = imgRef.current;
    if (!imgElement) return;

    // Set up lazy loading with Intersection Observer
    observerRef.current = lazyLoadImage(imgElement, () => {
      // Load the actual image when it enters the viewport
      const img = new Image();
      
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoaded(true);
        if (onLoad) onLoad();
      };
      
      img.onerror = () => {
        setError(true);
        if (onError) onError();
      };
      
      img.src = src;
    });

    return () => {
      if (observerRef.current) {
        observerRef.current();
      }
    };
  }, [src, onLoad, onError]);

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'} transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-50'
      }`}
      loading="lazy"
      decoding="async"
      {...props}
      style={{
        ...props.style,
        willChange: isLoaded ? 'auto' : 'opacity'
      }}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;

