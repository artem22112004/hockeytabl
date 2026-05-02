'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useState, useMemo } from 'react';

interface StatsTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  globalFilterKey?: keyof T;
  globalFilterPlaceholder?: string;
  filterControls?: React.ReactNode;
}

function SortIcon({ dir }: { dir: 'asc' | 'desc' | false }) {
  if (!dir) return <span className="ml-1 text-[10px] text-muted opacity-40">⇅</span>;
  return (
    <span className="ml-1 text-[10px] text-accent">
      {dir === 'asc' ? '↑' : '↓'}
    </span>
  );
}

export default function StatsTable<T extends object>({
  data,
  columns,
  globalFilterKey,
  globalFilterPlaceholder = 'Search…',
  filterControls,
}: StatsTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {globalFilterKey !== undefined && (
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={globalFilterPlaceholder}
            className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        )}
        {filterControls}
      </div>

      {/* Table wrapper — horizontal scroll on mobile */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-surface">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`whitespace-nowrap border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted ${
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none hover:text-white'
                        : ''
                    }`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <SortIcon dir={header.column.getIsSorted()} />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-muted"
                >
                  No results
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-border transition-colors hover:bg-hover ${
                    i % 2 === 0 ? 'bg-base' : 'bg-surface/40'
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-3 py-2 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        {table.getFilteredRowModel().rows.length} /{' '}
        {table.getCoreRowModel().rows.length} rows
      </p>
    </div>
  );
}
