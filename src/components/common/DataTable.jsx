import { useEffect, useMemo, useState } from "react";

import EmptyState from "./EmptyState.jsx";

export default function DataTable({
  columns,
  rows,
  title,
  searchPlaceholder = "Search records",
  pageSizeOptions = [5, 10, 20, 50],
  rowKey = (row) => row.id,
}) {
  const [searchValue, setSearchValue] = useState("");
  const [pageSize, setPageSize] = useState(pageSizeOptions[1] || 10);
  const [pageIndex, setPageIndex] = useState(0);

  const filteredRows = useMemo(() => {
    if (!searchValue.trim()) {
      return rows;
    }

    const normalizedSearch = searchValue.trim().toLowerCase();

    return rows.filter((row) =>
      columns.some((column) => {
        const value = column.searchAccessor
          ? column.searchAccessor(row)
          : row[column.key];

        return String(value ?? "").toLowerCase().includes(normalizedSearch);
      }),
    );
  }, [columns, rows, searchValue]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  const paginatedRows = useMemo(() => {
    const start = safePageIndex * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePageIndex, pageSize]);

  return (
    <div>
      <div className="filter-toolbar">
        <input
          className="filter-input"
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={searchValue}
        />

        <select
          className="filter-select"
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPageIndex(0);
          }}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              Show {option}
            </option>
          ))}
        </select>

        <span className="invoice-meta">
          {title ? `${title} - ` : ""}
          {filteredRows.length} record{filteredRows.length === 1 ? "" : "s"}
        </span>
      </div>

      {paginatedRows.length ? (
        <div className="table-wrap">
          <table className="premium-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((column) => (
                    <td key={`${rowKey(row)}-${column.key}`}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No records found." />
      )}

      <div className="filter-toolbar" style={{ justifyContent: "flex-end", marginTop: 10 }}>
        <button
          className="icon-btn"
          disabled={safePageIndex === 0}
          onClick={() => setPageIndex((previous) => Math.max(previous - 1, 0))}
          type="button"
        >
          Prev
        </button>
        <span className="invoice-meta">
          Page {safePageIndex + 1} / {pageCount}
        </span>
        <button
          className="icon-btn"
          disabled={safePageIndex >= pageCount - 1}
          onClick={() => setPageIndex((previous) => Math.min(previous + 1, pageCount - 1))}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
