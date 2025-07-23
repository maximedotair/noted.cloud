'use client';

import { useState, useEffect, useCallback } from 'react';

interface MobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
}

interface SwipeGesture {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
}

export function useMobile(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'landscape',
  });

  const updateDetection = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    const orientation = height > width ? 'portrait' : 'landscape';

    setDetection({
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice,
      screenWidth: width,
      screenHeight: height,
      orientation,
    });
  }, []);

  useEffect(() => {
    updateDetection();

    window.addEventListener('resize', updateDetection);
    window.addEventListener('orientationchange', updateDetection);

    return () => {
      window.removeEventListener('resize', updateDetection);
      window.removeEventListener('orientationchange', updateDetection);
    };
  }, [updateDetection]);

  return detection;
}

export function useSwipeGesture(
  onSwipe?: (gesture: SwipeGesture) => void,
  threshold: number = 50
) {
  const [isTracking, setIsTracking] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setStartPoint({ x: touch.clientX, y: touch.clientY });
    setIsTracking(true);
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isTracking) return;

    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;

    const deltaX = endX - startPoint.x;
    const deltaY = endY - startPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < threshold) {
      setIsTracking(false);
      return;
    }

    let direction: SwipeGesture['direction'] = null;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const gesture: SwipeGesture = {
      startX: startPoint.x,
      startY: startPoint.y,
      endX,
      endY,
      deltaX,
      deltaY,
      direction,
      distance,
    };

    onSwipe?.(gesture);
    setIsTracking(false);
  }, [isTracking, startPoint, threshold, onSwipe]);

  const attachSwipeListeners = useCallback((element: HTMLElement) => {
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return {
    isTracking,
    attachSwipeListeners,
  };
}

export function useLongPress(
  onLongPress: () => void,
  delay: number = 500
) {
  const [isPressed, setIsPressed] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsPressed(true);
    const id = setTimeout(() => {
      onLongPress();
      setIsPressed(false);
    }, delay);
    setTimeoutId(id);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsPressed(false);
  }, [timeoutId]);

  const handlers = {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchCancel: cancel,
  };

  return {
    isPressed,
    handlers,
  };
}

export function useTextSelection() {
  const [selection, setSelection] = useState<{
    text: string;
    range: Range | null;
    rect: DOMRect | null;
  }>({
    text: '',
    range: null,
    rect: null,
  });

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setSelection({ text: '', range: null, rect: null });
      return;
    }

    const range = sel.getRangeAt(0);
    const text = range.toString().trim();

    if (!text) {
      setSelection({ text: '', range: null, rect: null });
      return;
    }

    const rect = range.getBoundingClientRect();

    setSelection({
      text,
      range,
      rect,
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  const clearSelection = useCallback(() => {
    const sel = window.getSelection();
    sel?.removeAllRanges();
    setSelection({ text: '', range: null, rect: null });
  }, []);

  return {
    selection,
    clearSelection,
  };
}

export function useVirtualKeyboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      // Détecter si le clavier virtuel est ouvert
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.clientHeight;

      const keyboardHeight = documentHeight - windowHeight;
      const isKeyboardVisible = keyboardHeight > 150; // Seuil arbitraire

      setIsVisible(isKeyboardVisible);
      setHeight(isKeyboardVisible ? keyboardHeight : 0);
    };

    // Écouter les changements de taille de viewport
    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize);
      return () => visualViewport.removeEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return {
    isVisible,
    height,
  };
}

export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);

      setSafeArea({
        top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
}
