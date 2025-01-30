import { Transition, TransitionChild } from '@headlessui/react';
import React from 'react';
import { Link, useLocation } from 'react-router';

import logo from '~/assets/logo.svg';

import { NavProps } from './Nav';

type MobileNavProps = NavProps & {};

export function MobileNav({ open = false, toggleNav }: MobileNavProps) {
  const location = useLocation();

  return (
    <Transition as="div" className="lg:hidden" show={open}>
      <div className="fixed inset-0 flex z-40">
        {/* overlay */}
        <TransitionChild
          as="div"
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="fixed inset-0"
          aria-hidden="true"
        >
          <div
            onClick={toggleNav}
            className="absolute inset-0 bg-gray-600 opacity-75"
          />
        </TransitionChild>
        {/* mobile nav */}
        <TransitionChild
          as="div"
          enter="transition ease-in-out duration-300 transform"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-in-out duration-300 transform"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
          className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white"
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              onClick={toggleNav}
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Close sidebar</span>
              {/* Heroicon name: x */}
              <svg
                className="h-6 w-6 text-white"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex-shrink-0 flex items-center px-4">
            <img className="h-8 w-auto" src={logo} alt="Megawave" />
            <h2 className="text-xl pl-2 ">
              <b className="font-extrabold">Megawave</b>
            </h2>
          </div>
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2">
              <div className="space-y-1">
                {/* Current: "bg-gray-100 text-gray-900", Default: "text-gray-600 hover:text-gray-900 hover:bg-gray-50" */}
                <Link
                  to="/"
                  className={`${
                    location.pathname === '/'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } group flex items-center px-2 py-2 text-base leading-5 font-medium rounded-md`}
                  aria-current={location.pathname === '/' ? 'page' : undefined}
                >
                  {/* Current: "text-gray-500", Default: "text-gray-400 group-hover:text-gray-500" */}
                  {/* Heroicon name: home */}
                  <svg
                    className="text-gray-500 mr-3 h-6 w-6"
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
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Home
                </Link>
                <Link
                  to="/playlists"
                  className={`${
                    location.pathname === '/playlists'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } group flex items-center px-2 py-2 text-base leading-5 font-medium rounded-md`}
                >
                  {/* Heroicon name: view-list */}
                  <svg
                    className="text-gray-400 group-hover:text-gray-500 mr-3 h-6 w-6"
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
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  Playlists
                </Link>
                <Link
                  to="/recent"
                  className={`${
                    location.pathname === '/recent'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } group flex items-center px-2 py-2 text-base leading-5 font-medium rounded-md`}
                >
                  {/* Heroicon name: clock */}
                  <svg
                    className="text-gray-400 group-hover:text-gray-500 mr-3 h-6 w-6"
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Recent
                </Link>
              </div>
            </nav>
          </div>
        </TransitionChild>
        <div className="flex-shrink-0 w-14" aria-hidden="true">
          {/* Dummy element to force sidebar to shrink to fit close icon */}
        </div>
      </div>
    </Transition>
  );
}
