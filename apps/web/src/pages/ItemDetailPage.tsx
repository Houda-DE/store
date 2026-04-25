import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Item } from '../api/types';
import { useAuth } from '../context/AuthContext';
import './ItemDetailPage.css';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<Item>(`/items/${id}`)
      .then(setItem)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!confirm('Delete this item?')) return;
    setDeleting(true);
    try {
      await api.delete(`/items/${id}`);
      navigate('/');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-skeleton">
          <div className="sk-img" />
          <div className="sk-body">
            <div className="sk-line sk-line--title" />
            <div className="sk-line sk-line--price" />
            <div className="sk-line" />
            <div className="sk-line" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const isOwner = user?.id === item.sellerId;

  return (
    <main className="detail-page">
      <Link to="/" className="back-link">← Back</Link>

      <div className="detail-card">
        <div className="detail-img-wrap">
          <img src={item.imageUrl} alt={item.name} className="detail-img" />
        </div>

        <div className="detail-body">
          <h1 className="detail-name">{item.name}</h1>
          <p className="detail-price">{parseFloat(item.price).toLocaleString()} DZD</p>

          <p className="detail-desc">{item.description}</p>

          {item.sellerDeliveryCities && item.sellerDeliveryCities.length > 0 && (
            <div className="detail-cities">
              <p className="detail-cities-label">Delivers to</p>
              <div className="city-tags">
                {item.sellerDeliveryCities.map(c => (
                  <span key={c.id} className="city-tag">{c.name}</span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-meta">
            <span className="detail-date">Listed {new Date(item.createdAt).toLocaleDateString()}</span>
          </div>

          {isOwner ? (
            <div className="detail-actions">
              <Link to={`/items/${item.id}/edit`} className="btn-edit">Edit listing</Link>
              <button className="btn-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          ) : user ? (
            <div className="detail-cta">
              <p className="cta-note">Interested? Contact the seller to arrange payment and pickup.</p>
              <button
                className="btn-message-seller"
                onClick={async () => {
                  const conv = await api.post<{ id: number }>('/chat/conversations', {
                    sellerId: item.sellerId,
                    itemId: item.id,
                  });
                  navigate(`/conversations/${conv.id}`);
                }}
              >
                💬 Message seller
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
