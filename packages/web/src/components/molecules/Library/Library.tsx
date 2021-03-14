import React, { useEffect, useRef, useState } from 'react';
import throttle from 'lodash.throttle';

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

function useDynamicHeight(
  parentId: string,
  refToUpdate: React.RefObject<HTMLDivElement>,
  onChange: (arg0: number) => any,
) {
  useEffect(() => {
    function resizeOnChange() {
      const newHeight = getAvailableHeight(parentId, refToUpdate.current);
      if (refToUpdate?.current?.style?.height) {
        onChange(newHeight);
      }
    }
    const tResizeOnChange = throttle(resizeOnChange, 50);

    if (refToUpdate.current !== null) {
      resizeOnChange();

      window.addEventListener('resize', tResizeOnChange);
    }

    return () => {
      window.removeEventListener('resize', tResizeOnChange);
    };
  }, [onChange, refToUpdate, parentId]);
}

export function Library() {
  const libraryRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useDynamicHeight('library-container', libraryRef, setHeight);

  return (
    <div
      className="flex flex-grow p-4 border-red-300 border-4"
      style={{ height }}
      ref={libraryRef}
    ></div>
  );
}
