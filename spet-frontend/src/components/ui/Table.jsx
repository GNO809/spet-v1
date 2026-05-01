// ============================================================
// SPET — Table Component
// ============================================================

import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function DataTable({
  columns,          // [{ key, label, render?, sortable?, width? }]
  data,
  loading = false,
  searchable = true,
  searchFields = [],
  searchPlaceholder = 'Rechercher...',
  toolbar,          // extra JSX (buttons etc.)
  emptyMessage = 'Aucune donnée à afficher',
  pageSize = 10,
  rowKey = 'id',
}) {
  const [query,   setQuery]   = useState('');
  const [page,    setPage]    = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  // Filter
  const filtered = query
    ? data.filter(row =>
        (searchFields.length ? searchFields : columns.map(c => c.key)).some(f =>
          String(row[f] ?? '').toLowerCase().includes(query.toLowerCase())
        )
      )
    : data;

  // Sort
  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const va = a[sortKey] ?? '';
        const vb = b[sortKey] ?? '';
        const cmp = String(va).localeCompare(String(vb), 'fr');
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : filtered;

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated  = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleSearch = (e) => {
    setQuery(e.target.value);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="table-container">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      {/* Toolbar */}
      <div className="table-toolbar">
        {searchable && (
          <div className="table-search">
            <Search size={15} color="#94a3b8" />
            <input
              value={query}
              onChange={handleSearch}
              placeholder={searchPlaceholder}
            />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          {toolbar}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {paginated.length === 0 ? (
          <div className="empty-state">
            <Search size={40} />
            <h3>{emptyMessage}</h3>
            {query && <p>Essayez avec d'autres termes de recherche.</p>}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    style={{ width: col.width, cursor: col.sortable ? 'pointer' : 'default' }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        <span style={{ fontSize: '10px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, idx) => (
                <tr key={row[rowKey] ?? idx}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer / Pagination */}
      <div className="table-footer">
        <span>
          {sorted.length === 0 ? '0 résultat' :
           `${Math.min((page-1)*pageSize+1, sorted.length)}–${Math.min(page*pageSize, sorted.length)} sur ${sorted.length}`}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPage(p => Math.max(1, p-1))}
            disabled={page <= 1}
            style={{ padding: '4px 8px', opacity: page <= 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = totalPages <= 5 ? i+1 : Math.max(1, Math.min(page-2, totalPages-4)) + i;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: p === page ? '#1a56db' : '#e2e8f0',
                  background:  p === page ? '#1a56db' : 'transparent',
                  color:       p === page ? 'white' : '#64748b',
                  fontSize: '12px',
                  cursor: 'pointer',
                  minWidth: '30px',
                }}
              >
                {p}
              </button>
            );
          })}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPage(p => Math.min(totalPages, p+1))}
            disabled={page >= totalPages}
            style={{ padding: '4px 8px', opacity: page >= totalPages ? 0.4 : 1 }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
