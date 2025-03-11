import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/PullToRefreshWrapper.css';

interface PullToRefreshWrapperProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PullToRefreshWrapper: React.FC<PullToRefreshWrapperProps> = ({
  onRefresh,
  children
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const pullThreshold = 70;
  
  // Verifica se è un dispositivo iOS
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  
  // Se è iOS, non implementiamo il pull-to-refresh personalizzato
  if (isIOS) {
    return <>{children}</>;
  }

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Verifica se siamo all'inizio della pagina
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY;
      currentYRef.current = startYRef.current;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling) return;

    currentYRef.current = e.touches[0].clientY;
    const distance = currentYRef.current - startYRef.current;

    // Applica resistenza al pull
    const resistance = 0.4;
    const newPullDistance = Math.max(0, distance * resistance);

    if (newPullDistance >= 0) {
      e.preventDefault();
      setPullDistance(newPullDistance);
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(pullThreshold);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div 
      ref={containerRef} 
      className="ptr-wrapper-container"
    >
      <div 
        className="ptr-wrapper-indicator"
        style={{
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance / pullThreshold
        }}
      >
        {isRefreshing ? (
          <div className="ptr-wrapper-loading">
            <div className="ptr-wrapper-spinner"></div>
            <span>Aggiornamento...</span>
          </div>
        ) : (
          <div className="ptr-wrapper-arrow">
            ↓
          </div>
        )}
      </div>
      <div 
        className="ptr-wrapper-content"
        style={{
          transform: `translateY(${pullDistance}px)`
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefreshWrapper; 