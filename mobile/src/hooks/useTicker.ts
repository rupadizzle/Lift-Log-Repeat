import { useEffect } from 'react';
import { useStore } from '../store/store';

/** 1s heartbeat driving elapsed time + the absolute-deadline rest countdown —
 * ported from the prototype's componentDidMount `setInterval(..., 1000)`. */
export function useTicker() {
  useEffect(() => {
    const id = setInterval(() => useStore.getState().tick(), 1000);
    return () => clearInterval(id);
  }, []);
}
