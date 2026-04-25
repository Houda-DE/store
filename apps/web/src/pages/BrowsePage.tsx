import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { Item } from '../api/types';
import { ItemCard } from '../components/ItemCard';
import './BrowsePage.css';

export function BrowsePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  const load = useCallback(async (p: number, reset = false) => {
    setLoading(true);
    try {
      const data = await api.get<Item[]>(`/items?page=${p}&limit=${LIMIT}`);
      setItems(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === LIMIT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1, true);
  }, [load]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next);
  };

  return (
    <main className="browse-page">
      <div className="browse-header">
        <h1 className="browse-title">Discover items</h1>
        <p className="browse-sub">Available in your delivery area</p>
      </div>

      {items.length === 0 && !loading ? (
        <div className="browse-empty">
          <p className="browse-empty-icon">🛍️</p>
          <p>No items available in your area yet.</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {loading && (
        <div className="browse-loading">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-img" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line--short" />
            </div>
          ))}
        </div>
      )}

      {!loading && hasMore && items.length > 0 && (
        <div className="browse-more">
          <button className="btn-load-more" onClick={loadMore}>Load more</button>
        </div>
      )}
    </main>
  );
}
