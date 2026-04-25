import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Item } from '../api/types';
import { useAuth } from '../context/AuthContext';
import './SellPage.css';

export function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | string[]>('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<Item>(`/items/${id}`).then(item => {
      if (item.sellerId !== user?.id) {
        navigate('/');
        return;
      }
      setItem(item);
      setName(item.name);
      setDescription(item.description);
      setPrice(item.price);
      setPreview(item.imageUrl);
    }).catch(() => navigate('/'));
  }, [id, user, navigate]);

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      if (image) fd.append('image', image);
      fd.append('name', name);
      fd.append('description', description);
      fd.append('price', price);
      const updated = await api.patchForm<Item>(`/items/${id}`, fd);
      navigate(`/items/${updated.id}`);
    } catch (err: any) {
      const msg = err.data?.message;
      setError(Array.isArray(msg) ? msg : msg ?? 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <main className="sell-page">
      <div className="sell-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Link to={`/items/${id}`} style={{ color: '#555', textDecoration: 'none', fontSize: 14 }}>← Back</Link>
          <h1 className="sell-title" style={{ margin: 0 }}>Edit listing</h1>
        </div>

        <form onSubmit={handleSubmit} className="sell-form">
          {error && (
            <div className="form-error">
              {Array.isArray(error) ? error.map((m, i) => <div key={i}>{m}</div>) : error}
            </div>
          )}

          <div
            className={`photo-drop ${preview ? 'photo-drop--filled' : ''}`}
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="photo-preview" />
            ) : (
              <div className="photo-placeholder">
                <span className="photo-icon">📷</span>
                <span>Change photo</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImage}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={255}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Price (DZD)</label>
            <div className="price-input-wrap">
              <input
                type="number"
                className="form-input"
                value={price}
                onChange={e => setPrice(e.target.value)}
                min="1"
                step="0.01"
                required
              />
              <span className="price-suffix">DZD</span>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </main>
  );
}
