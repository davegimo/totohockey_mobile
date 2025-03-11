import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/PullToRefresh.css';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  pullDownThreshold?: number;
  backgroundColor?: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  pullDownThreshold = 60,
  backgroundColor = '#fff'
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

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

    if (pullDistance >= pullDownThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(pullDownThreshold);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, pullDownThreshold, isRefreshing, onRefresh]);

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
      className="ptr-container"
      style={{ backgroundColor }}
    >
      <div 
        className="ptr-indicator"
        style={{
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance / pullDownThreshold
        }}
      >
        {isRefreshing ? (
          <div className="ptr-loading">
            Aggiornamento...
          </div>
        ) : (
          <div className="ptr-arrow">
            ↓
          </div>
        )}
      </div>
      <div 
        className="ptr-content"
        style={{
          transform: `translateY(${pullDistance}px)`
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh; 