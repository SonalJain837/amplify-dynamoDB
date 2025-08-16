import { useEffect, useRef } from 'react';

/**
 * Hook for monitoring component performance and detecting potential issues
 */
export function usePerformanceMonitor(componentName: string, dependencies: any[] = []) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      if (timeSinceLastRender < 16 && renderCount.current > 1) {
        console.warn(`${componentName}: Potential excessive re-renders detected. Render #${renderCount.current} in ${timeSinceLastRender.toFixed(2)}ms`);
      }
      
      if (renderCount.current > 50) {
        console.warn(`${componentName}: High render count detected (${renderCount.current}). Consider optimization.`);
      }
    }
    
    lastRenderTime.current = currentTime;
  }, dependencies);

  return { renderCount: renderCount.current };
}

/**
 * Hook for measuring async operation performance
 */
export function useAsyncPerformance() {
  const startTime = useRef<number>();
  
  const start = (operationName: string) => {
    startTime.current = performance.now();
    if (process.env.NODE_ENV === 'development') {
      console.time(operationName);
    }
  };
  
  const end = (operationName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(operationName);
      if (startTime.current) {
        const duration = performance.now() - startTime.current;
        if (duration > 100) {
          console.warn(`${operationName}: Slow operation detected (${duration.toFixed(2)}ms)`);
        }
      }
    }
  };
  
  return { start, end };
}