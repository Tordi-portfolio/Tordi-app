import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [notice, setNotice] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      const formData = new FormData();
      formData.append('full_name', fullName);
      formData.append('about', about);
      if (avatarFile) formData.append('avatar', avatarFile);
      const updated = await api.patchForm('/api/accounts/me/', formData);
      updateUser(updated);
      setNotice('Profile updated.');
    } catch (err) {
      setNotice(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveEmail = async (e) => {
    e.preventDefault();
    setSavingEmail(true);
    setEmailError('');
    setEmailSaved(false);
    try {
      const updated = await api.patch('/api/accounts/me/email/', { email });
      updateUser(updated);
      setEmailSaved(true);
    } catch (err) {
      setEmailError(err.data?.email?.[0] || err.message);
    } finally {
      setSavingEmail(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="settings-wrapper">
      <div className="settings-card">
        <div className="settings-top">
          <Link to="/" className="icon-btn" title="Back to chats">←</Link>
          <h1 className="settings-title">Settings</h1>
        </div>

        <div className="settings-avatar-row">
          <Avatar user={user} size={72} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.display_name}</div>
            <div className="phone-display">{user?.phone_number}</div>
          </div>
        </div>

        <form onSubmit={saveProfile} noValidate>
          <label htmlFor="full_name">Name</label>
          <input id="full_name" type="text" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <label htmlFor="about">About</label>
          <input id="about" type="text" className="form-input" value={about} onChange={(e) => setAbout(e.target.value)} />

          <div className="avatar-upload" style={{ marginTop: 14 }}>
            <label htmlFor="avatar">Change photo</label>
            <input id="avatar" type="file" accept="image/*" className="form-input" onChange={(e) => setAvatarFile(e.target.files[0] || null)} />
          </div>

          {notice && <p className="field-error" style={{ color: notice === 'Profile updated.' ? 'var(--accent)' : undefined }}>{notice}</p>}
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </form>

        <hr className="divider" />

        <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Email</h2>
        <p className="subtitle" style={{ textAlign: 'left', marginBottom: 14 }}>
          Optional. Link an email to your account — not required, and not used for login.
        </p>
        <form onSubmit={saveEmail} noValidate>
          <input
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={email || ''}
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailError && <p className="field-error">{emailError}</p>}
          {emailSaved && !emailError && <p className="field-error" style={{ color: 'var(--accent)' }}>Email linked.</p>}
          <button type="submit" className="btn-secondary" style={{ marginTop: 12 }} disabled={savingEmail}>
            {savingEmail ? 'Saving…' : 'Save email'}
          </button>
        </form>

        <hr className="divider" />

        <Link to="/contacts" className="btn-secondary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
          My Contacts
        </Link>

        <div style={{ height: 12 }}></div>

        <button type="button" className="btn-danger" onClick={handleLogout}>Log out</button>
      </div>
    </div>
  );
}
