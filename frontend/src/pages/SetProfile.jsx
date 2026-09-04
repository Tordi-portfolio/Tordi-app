import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function SetProfile() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [about, setAbout] = useState('Hey there! I am using Tordi.');
  const [avatarFile, setAvatarFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('full_name', fullName);
      formData.append('about', about);
      if (avatarFile) formData.append('avatar', avatarFile);

      const updated = await api.patchForm('/api/accounts/me/', formData);
      updateUser(updated);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="brand-logo">T</div>
        <h1 className="brand">Set up your profile</h1>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="full_name">Name</label>
          <input
            id="full_name"
            type="text"
            className="form-input"
            placeholder="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <label htmlFor="about">About</label>
          <input
            id="about"
            type="text"
            className="form-input"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
          />

          <label htmlFor="avatar">Photo (optional)</label>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            className="form-input"
            onChange={(e) => setAvatarFile(e.target.files[0] || null)}
          />

          {error && <p className="field-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Continue to Tordi'}
          </button>
        </form>
      </div>
    </div>
  );
}
