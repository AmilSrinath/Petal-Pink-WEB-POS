import React from 'react';
export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}
export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No records found'
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-teal-700">
          <tr>
            {columns.map((col, idx) =>
            <th
              key={idx}
              scope="col"
              className={`px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-white ${col.className || ''}`}>

                {col.header}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.length === 0 ?
          <tr>
              <td
              colSpan={columns.length}
              className="px-6 py-8 text-center text-sm text-gray-500">

                {emptyMessage}
              </td>
            </tr> :

          data.map((row, rowIdx) =>
          <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, colIdx) =>
            <td
              key={colIdx}
              className={`whitespace-nowrap px-2 py-4 text-sm text-gray-900 ${col.className || ''}`}>

                    {typeof col.accessor === 'function' ?
              col.accessor(row) :
              row[col.accessor] as React.ReactNode}
                  </td>
            )}
              </tr>
          )
          }
        </tbody>
      </table>
    </div>);

}