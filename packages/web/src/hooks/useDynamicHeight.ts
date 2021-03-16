import throttle from 'lodash.throttle';
import { useCallback, useEffect, useState } from 'react';

function getAvailableHeight(
  parentId: string,
  referenceToSelf: HTMLElement | null,
): number {
  if (referenceToSelf != null) {
    const parent = document.getElementById(parentId);
    const parentHeight = parent?.clientHeight ?? 0;
    const siblings = Array.from(parent?.children ?? []);

    let myHeight = parentHeight;
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling != referenceToSelf && sibling instanceof HTMLElement) {
        myHeight -= sibling.offsetHeight;
      }
    }

    return myHeight;
  }

  return 0;
}

export function useDynamicHeight(parentId: string) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [height, setHeight] = useState(0);

  const refToMeasure = useCallback(
    (node) => {
      setRef(node);
    },
    [setRef],
  );

  useEffect(() => {
    function resizeOnChange() {
      const newHeight = getAvailableHeight(parentId, ref);
      if (ref?.style?.height != null) {
        setHeight(newHeight);
      }
    }
    const tResizeOnChange = throttle(resizeOnChange, 50);

    if (ref !== null) {
      resizeOnChange();

      window.addEventListener('resize', tResizeOnChange);
    }

    return () => {
      window.removeEventListener('resize', tResizeOnChange);
    };
  }, [setHeight, ref, parentId]);

  return { refToMeasure, height };
}
