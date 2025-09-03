import clsx from 'clsx';
import { createContext, PropsWithChildren, useContext } from 'react';

import { useAvailableDimensions } from '~/hooks/useAvailableDimensions';

export type FullHeightContainerContext = {
  idToMeasure?: string;
  height?: number;
  refToMeasure?: ReturnType<typeof useAvailableDimensions>['refToMeasure'];
};

export const FullHeightContainerContext =
  createContext<FullHeightContainerContext | null>({});

export const FullHeightContainer = ({
  children,
  idToMeasure = 'library-container',
  className,
}: PropsWithChildren<{ idToMeasure?: string; className?: string }>) => {
  const { refToMeasure, height } = useAvailableDimensions(idToMeasure);
  return (
    <div
      className={clsx(className)}
      tabIndex={0}
      ref={refToMeasure}
      style={{ height }}
    >
      <FullHeightContainerContext.Provider
        value={{ idToMeasure, height, refToMeasure }}
      >
        {children}
      </FullHeightContainerContext.Provider>
    </div>
  );
};

export const useFullHeightContainerContext = () => {
  const context = useContext(FullHeightContainerContext);
  if (!context) {
    throw new Error(
      'useFullHeightContainerContext must be used within a FullHeightContainer',
    );
  }
  return context;
};
