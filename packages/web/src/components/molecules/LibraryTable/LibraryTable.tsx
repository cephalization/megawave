import React from 'react';
import {
  LibraryTableRow,
  LibraryTableHeaderRow,
} from './components/LibraryTableRow';

export function LibraryTable() {
  return (
    <div className="block">
      <div className="align-middle inline-block min-w-full border-b border-gray-200">
        <table className="min-w-full">
          <thead>
            <LibraryTableHeaderRow />
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            <LibraryTableRow />
          </tbody>
        </table>
      </div>
    </div>
  );
}
