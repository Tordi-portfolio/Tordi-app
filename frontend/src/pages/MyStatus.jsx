import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function MyStatus() {
  const [statuses, setStatuses] = useState([]);
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const load = async () => {
    const data = await api.get('/api/status/mine/');
    setStatuses(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setMediaFile(file || null);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim() && !mediaFile) return;
    setPosting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('text', text.trim());
      if (mediaFile) formData.append('media', mediaFile);
      await api.postForm('/api/status/create/', formData);
      setText('');
      setMediaFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (statusId) => {
    if (!window.confirm('Delete this status?')) return;
    await api.post(`/api/status/${statusId}/delete/`);
    setStatuses((prev) => prev.filter((s) => s.id !== statusId));
  };

  return (
    <div className="settings-wrapper">
      <div className="settings-card">
        <div className="settings-top">
          <Link to="/" className="icon-btn" title="Back">←</Link>
          <h1 className="settings-title">My Status</h1>
        </div>

        <form onSubmit={handlePost}>
          <textarea
            className="form-input"
            placeholder="What's on your mind?"
            rows={3}
            style={{ resize: 'none' }}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <button type="button" className="composer-icon-btn" title="Add photo or video" onClick={() => fileInputRef.current?.click()}>📎</button>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <button type="submit" className="btn-primary" style={{ marginTop: 0, flex: 1 }} disabled={posting}>
              {posting ? 'Posting…' : 'Post status'}
            </button>
          </div>
          {error && <p className="field-error">{error}</p>}
          {previewUrl && (
            <div style={{ marginTop: 10 }}>
              {mediaFile?.type.startsWith('video') ? (
                <video src={previewUrl} controls style={{ maxWidth: '100%', borderRadius: 12 }} />
              ) : (
                <img src={previewUrl} alt="" style={{ maxWidth: '100%', borderRadius: 12 }} />
              )}
            </div>
          )}
        </form>

        <hr className="divider" />

        <p className="section-label" style={{ padding: '0 0 10px' }}>Active now — visible to your contacts for 24 hours</p>

        {statuses.length === 0 && (
          <p className="empty-state">No active status updates. Post one above — it disappears after 24 hours, and only your contacts can see it.</p>
        )}

        {statuses.map((s) => (
          <div key={s.id} className="status-manage-row">
            <div className="status-manage-media">
              {s.media_kind === 'image' && <img src={s.media_url} alt="" />}
              {s.media_kind === 'video' && <video src={s.media_url} />}
              {!s.media_kind && (
                <div className="status-text-thumb" style={{ background: s.background_color }}>
                  {s.text.slice(0, 24)}
                </div>
              )}
            </div>
            <div className="status-manage-info">
              <span>{new Date(s.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="preview">{s.viewer_count} view{s.viewer_count === 1 ? '' : 's'}</span>
            </div>
            <button className="icon-btn delete-status-btn" title="Delete" onClick={() => handleDelete(s.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
