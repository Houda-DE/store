import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Item } from '../api/types';
import './SellPage.css';

export function SellPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | string[]>('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!image) return setError('Please add a photo');
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', image);
      fd.append('name', name);
      fd.append('description', description);
      fd.append('price', price);
      const item = await api.postForm<Item>('/items', fd);
      navigate(`/items/${item.id}`);
    } catch (err: any) {
      const msg = err.data?.message;
      setError(Array.isArray(msg) ? msg : msg ?? 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="sell-page">
      <div className="sell-card">
        <h1 className="sell-title">New listing</h1>

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
                <span>Add photo</span>
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
              placeholder="e.g. Vintage leather jacket"
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
              placeholder="Describe the condition, size, brand…"
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
                placeholder="0"
                min="1"
                step="0.01"
                required
              />
              <span className="price-suffix">DZD</span>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Publishing…' : 'Publish listing'}
          </button>
        </form>
      </div>
    </main>
  );
}
