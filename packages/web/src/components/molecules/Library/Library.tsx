import React, { useCallback, useEffect, useRef, useState } from 'react';
import throttle from 'lodash.throttle';
import { FixedSizeList } from 'react-window';
import { useQuery } from 'react-query';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Track } from '~/types/library';
import { getLibrary } from '~/queries/library';
import { WaveLoader } from '../WaveLoader';

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

function useDynamicHeight(parentId: string) {
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

export function Library() {
  // height of parent container - height of all children
  // this derived height value can be used to perfectly size the library items
  const { refToMeasure: libraryRef, height } = useDynamicHeight(
    'library-container',
  );

  const { isLoading, error, data } = useQuery<Track[], any>(
    'library',
    getLibrary,
  );

  if (isLoading || data === undefined) return <WaveLoader />;

  if (error) return null;

  return (
    <div
      className="pl-5 border-t border-gray-200"
      style={{ height }}
      ref={libraryRef}
    >
      <div className="h-full">
        <AutoSizer>
          {({ width, height: innerHeight }) => (
            <FixedSizeList
              height={innerHeight}
              width={width}
              itemCount={data.length}
              itemSize={40}
            >
              {({ index, style }) => (
                <a
                  style={style}
                  className="text-blue-400"
                  href={data[index].link}
                >
                  {data[index].name}
                </a>
              )}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}
