import React, { PropsWithChildren } from 'react';

export function PageContainer({ children }: PropsWithChildren<{}>) {
  return (
    <div
      className="bg-white h-screen flex overflow-hidden"
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
      {children}
    </div>
  );
}
