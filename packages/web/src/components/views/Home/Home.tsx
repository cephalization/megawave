import React, { useCallback, useState } from 'react';

import { Controls } from '~/components/molecules/Controls/Controls';
import { Library } from '~/components/molecules/Library';
import { Nav } from '~/components/molecules/Nav';
import { TrackSearch } from '~/components/molecules/TrackSearch';
import { PageContainer } from '~/components/templates/PageContainer';
import { PlayerProvider } from '~/context/PlayerContext';

export function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const toggleNavOpen = useCallback(() => setNavOpen((o) => !o), [setNavOpen]);

  return (
    <PlayerProvider>
      <PageContainer>
        <Nav open={navOpen} toggleNav={toggleNavOpen} />

        {/* Main column */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Search header */}
          <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
            {/* Sidebar toggle, controls the 'sidebarOpen' sidebar state. */}
            <button
              onClick={toggleNavOpen}
              className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 lg:hidden z-50"
            >
              <span className="sr-only">Open sidebar</span>
              {/* Heroicon name: menu-alt-1 */}
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </button>
            <div className="flex-1 flex justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex-1 flex">
                <form className="w-full flex md:ml-0" action="#" method="GET">
                  <label htmlFor="search_field" className="sr-only">
                    Search library
                  </label>
                  <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                    <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                      {/* Heroicon name: search */}
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <TrackSearch />
                  </div>
                </form>
              </div>
              <div className="flex items-center">
                {/* Profile dropdown */}
                <div className="ml-3 relative">
                  <div>
                    <button
                      className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      id="user-menu"
                      aria-haspopup="true"
                    >
                      <span className="sr-only">Open user menu</span>
                      <span className="inline-block h-8 w-8 rounded-full overflow-hidden bg-gray-100">
                        <svg
                          className="h-full w-full text-gray-300"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </span>
                    </button>
                  </div>
                  {/*
                    Profile dropdown panel, show/hide based on dropdown state.

                    Entering: "transition ease-out duration-100"
                      From: "transform opacity-0 scale-95"
                      To: "transform opacity-100 scale-100"
                    Leaving: "transition ease-in duration-75"
                      From: "transform opacity-100 scale-100"
                      To: "transform opacity-0 scale-95"
                  */}
                  {/* <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-200"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                >
                  <div className="py-1" role="none">
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      role="menuitem"
                    >
                      View profile
                    </a>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      role="menuitem"
                    >
                      Settings
                    </a>
                  </div>

                  <div className="py-1" role="none">
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      role="menuitem"
                    >
                      Logout
                    </a>
                  </div>
                </div> */}
                </div>
              </div>
            </div>
          </div>
          <main
            className="flex-1 flex-col flex-nowrap relative z-0 overflow-hidden focus:outline-none"
            tabIndex={0}
            id="library-container"
          >
            {/* Page title & actions */}
            <div className="border-b border-gray-200 pl-5 px-4 py-4 sm:flex sm:flex-grow-0 sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-medium leading-6 text-gray-900 sm:truncate">
                  Library
                </h1>
              </div>
            </div>
            <div className="flex-1 flex-grow-0 pl-5 px-4 py-4 sm:px-6 lg:px-8 items-center justify-end w-full hidden sm:flex">
              <h2 className="text-sm leading-6 text-gray-500 font-semibold">
                Tracks: <span className="text-gray-600 font-bold">3000</span>
              </h2>
            </div>
            {/* Library table */}
            <Library />
            <Controls />
          </main>
        </div>
      </PageContainer>
    </PlayerProvider>
  );
}
