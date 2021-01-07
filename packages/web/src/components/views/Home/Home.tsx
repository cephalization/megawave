import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '~/components/templates/PageContainer';

type audioFile = {
  name: string;
  id: string;
  link: string;
};

type debugResponse = {
  text: string;
  audio: audioFile[];
};

export function Home() {
  const [data, setData] = useState<debugResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchDebug() {
      const res = await fetch('http://localhost:5000/debug');
      const json = await res.json();

      if (json) {
        setData({
          text: JSON.stringify(json, null, 2),
          audio: json.data.audio.filter((a) => a.meta?.tags),
          ...json.data,
        });
      }
    }

    fetchDebug();
  }, [setData]);

  console.log(data?.audio);

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 flex justify-between">
        <div>
          <h2 className="inline text-4xl font-bold tracking-tight text-gray-900 sm:block sm:text-4xl">
            Want music?
          </h2>
          <p className="inline text-4xl font-bold tracking-tight text-indigo-600 sm:block sm:text-4xl">
            Stream with <b className="font-extrabold">Megawave</b>.
          </p>
        </div>
        <div className="justify-end self-end">
          <Link
            to="/login"
            className="whitespace-nowrap hover:bg-gray-50 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex items-center justify-center text-base font-medium text-indigo-700 bg-indigo-100"
          >
            Sign in
          </Link>
        </div>
      </div>

      <div className="bg-white sm:rounded-lg max-w-6xl mx-auto mt-48">
        <div className="px-4 py-6 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-500">
            Debug Server Response
          </h3>
          {!data?.text && (
            <div className="mt-5">
              <pre className="rounded-md bg-gray-50 px-6 py-6 sm:flex sm:items-start sm:justify-between text-gray-700">
                'Fetching...'
              </pre>
            </div>
          )}
        </div>
        <div className="bg-white sm:rounded-lg max-w-6xl mx-auto mt-8">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Search Music
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <div className="relative flex items-stretch flex-grow focus-within:z-10">
                <input
                  type="text"
                  name="songs"
                  id="songs"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md pl-11 sm:text-sm border-gray-300"
                  placeholder="Harder, Better, Faster, Stronger"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="px-4 py-6 sm:p-6">
            <ul>
              {data?.audio &&
                data.audio
                  .filter((a) =>
                    a.name
                      .toLocaleLowerCase()
                      .includes(searchTerm.toLocaleLowerCase()),
                  )
                  .map((a) => (
                    <li className="p-2" key={a.link}>
                      <a className="text-md" href={a.link}>
                        {a.name}
                        {a?.artist ? ` - ${a.artist}` : null}
                      </a>
                    </li>
                  ))}
            </ul>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
