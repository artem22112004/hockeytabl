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
import { useState } from 'react';

interface StatsTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  globalFilterKey?: keyof T;
  globalFilterPlaceholder?: string;
  filterControls?: React.ReactNode;
}

function SortIcon({ dir }: { dir: 'asc' | 'desc' | false }) {
  if (!dir) return <span className="ml-1 text-[10px] text-muted opacity-30">⇅</span>;
  return (
    <span className="ml-1 text-[10px] text-[#00D1FF]">{dir === 'asc' ? '↑' : '↓'}</span>
  );
}

const MEDAL_BORDER = [
  'border-l-[3px] border-l-yellow-400',
  'border-l-[3px] border-l-slate-400',
  'border-l-[3px] border-l-amber-600',
];

export default function StatsTable<T extends object>({
  data,
  columns,
  globalFilterKey,
  globalFilterPlaceholder = 'Search…',
  filterControls,
}: StatsTableProps<T>) {
  const [sorting, setSorting]             = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter]   = useState('');

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
      {(globalFilterKey !== undefined || filterControls) && (
        <div className="flex flex-wrap items-center gap-3">
          {globalFilterKey !== undefined && (
            <input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={globalFilterPlaceholder}
              className="rounded-lg border border-[#1e2d45] bg-[#111520] px-3 py-1.5 text-sm text-white placeholder:text-muted transition-colors focus:border-[#00D1FF]/40 focus:outline-none focus:ring-1 focus:ring-[#00D1FF]/20"
            />
          )}
          {filterControls}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#1e2d45] shadow-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-[#111520]">
                {hg.headers.map((header, hi) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={[
                      'whitespace-nowrap border-b border-[#1e2d45] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]',
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none transition-colors hover:text-white'
                        : '',
                      hi === 0
                        ? 'sticky left-0 z-[20] bg-[#111520] shadow-[2px_0_8px_rgba(0,0,0,0.6)]'
                        : '',
                    ].join(' ')}
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
                <td colSpan={columns.length} className="py-16 text-center text-[#94A3B8]">
                  No results
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`group border-b border-[#1e2d45] transition-colors duration-100 hover:bg-[#161c2e] ${
                    i % 2 === 0 ? 'bg-[#0B0E14]' : 'bg-[#111520]/40'
                  }`}
                >
                  {row.getVisibleCells().map((cell, ci) => (
                    <td
                      key={cell.id}
                      className={[
                        'whitespace-nowrap px-3 py-2.5 text-sm',
                        ci === 0
                          ? [
                              'sticky left-0 z-[10] transition-colors duration-100',
                              i % 2 === 0 ? 'bg-[#0B0E14]' : 'bg-[#0f1420]',
                              'group-hover:bg-[#161c2e]',
                              'shadow-[2px_0_8px_rgba(0,0,0,0.5)]',
                              i < 3
                                ? MEDAL_BORDER[i]
                                : 'border-l-[3px] border-l-transparent group-hover:border-l-[#00D1FF]/50',
                            ].join(' ')
                          : '',
                      ].join(' ')}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[#94A3B8]/60">
        {table.getFilteredRowModel().rows.length} / {table.getCoreRowModel().rows.length} players
      </p>
    </div>
  );
}
