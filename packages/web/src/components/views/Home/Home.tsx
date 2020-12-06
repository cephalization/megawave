import React, { useEffect, useState } from 'react';
import PageContainer from '~/components/templates/PageContainer/PageContainer';

export function Home() {
  const [data, setData] = useState('');

  useEffect(() => {
    async function fetchDebug() {
      const res = await fetch('http://localhost:5000/');
      const json = await res.json();

      if (json) setData(JSON.stringify(json, null, 2));
    }

    fetchDebug();
  }, [setData]);

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <h2 className="inline text-3xl font-bold tracking-tight text-gray-900 sm:block sm:text-4xl">
          Want music?
        </h2>
        <p className="inline text-3xl font-bold tracking-tight text-indigo-600 sm:block sm:text-4xl">
          Stream with <b className="font-extrabold">Megawave</b>.
        </p>
      </div>

      <div className="bg-white sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Debug Server Response
          </h3>
          <div className="mt-5">
            <pre className="rounded-md bg-gray-200 px-6 py-6 sm:flex sm:items-start sm:justify-between text-gray-700">
              {data || 'Fetching...'}
            </pre>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
