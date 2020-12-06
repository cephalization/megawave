import React, { PropsWithChildren } from 'react';

export function PageContainer({ children }: PropsWithChildren<{}>) {
  return <div className="bg-white">{children}</div>;
}
