import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Avatar from '../components/Avatar';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await api.get('/api/accounts/contacts/');
    setContacts(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const removeContact = async (contactId) => {
    if (!window.confirm('Remove this contact? They will no longer see your status.')) return;
    await api.post(`/api/accounts/contacts/remove/${contactId}/`);
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  return (
    <div className="settings-wrapper">
      <div className="settings-card">
        <div className="settings-top">
          <Link to="/settings" className="icon-btn" title="Back">←</Link>
          <h1 className="settings-title">My Contacts</h1>
        </div>
        <p className="subtitle" style={{ textAlign: 'left', marginBottom: 20 }}>
          People you've added can see your Tordi Status. Add contacts by searching for their phone number from your chat list.
        </p>

        {!loading && contacts.length === 0 && (
          <p className="empty-state">No contacts yet. Search for someone by phone number in your chat list and tap "+ Add".</p>
        )}

        {contacts.map((c) => (
          <div key={c.id} className="status-manage-row">
            <Avatar user={c.contact} />
            <div className="status-manage-info">
              <span>{c.contact.display_name}</span>
              <span className="preview">{c.contact.phone_number || 'No phone linked'}</span>
            </div>
            <button className="icon-btn" title="Remove" onClick={() => removeContact(c.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
