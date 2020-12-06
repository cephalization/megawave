import React, { PropsWithChildren } from 'react';

function PageContainer({ children }: PropsWithChildren<{}>) {
  return <div className="bg-white">{children}</div>;
}

export default PageContainer;
