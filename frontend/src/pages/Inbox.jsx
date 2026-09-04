import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

export default function Inbox() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [statusFeed, setStatusFeed] = useState({ contacts: [], my_status_count: 0 });
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadInbox = async () => {
    const [convos, feed] = await Promise.all([
      api.get('/api/chat/conversations/'),
      api.get('/api/status/feed/'),
    ]);
    setConversations(convos);
    setStatusFeed(feed);
  };

  useEffect(() => {
    loadInbox();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const results = await api.get(`/api/accounts/search/?q=${encodeURIComponent(q)}`);
        setSearchResults(results);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const startChat = async (personId) => {
    const conversation = await api.post(`/api/chat/conversations/start/${personId}/`);
    navigate(`/chat/${conversation.id}`);
  };

  const addContact = async (personId) => {
    await api.post(`/api/accounts/contacts/add/${personId}/`);
    setSearchResults((prev) =>
      prev.map((p) => (p.id === personId ? { ...p, is_contact: true } : p))
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <header className="sidebar-header">
          <div className="me">
            <Avatar user={user} />
            <span>{user?.display_name}</span>
          </div>
          <Link to="/settings" className="icon-btn" title="Settings">⚙</Link>
        </header>

        <div className="status-strip">
          <Link to="/status/mine" className="status-item">
            <div className={`status-ring ${statusFeed.my_status_count ? 'has-status' : ''}`}>
              <Avatar user={user} />
              {!statusFeed.my_status_count && <span className="status-plus">+</span>}
            </div>
            <span className="status-label">My status</span>
          </Link>
          {statusFeed.contacts.map((contact) => (
            <Link key={contact.id} to={`/status/${contact.id}`} className="status-item">
              <div className={`status-ring ${contact.has_unseen_status ? 'unseen' : 'seen'}`}>
                <Avatar user={contact} />
              </div>
              <span className="status-label">{contact.display_name}</span>
            </Link>
          ))}
        </div>

        <div className="search-bar">
          <input
            type="text"
            className="form-input"
            placeholder="Search name or phone number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {query.trim() && (
          <div className="results-block">
            <p className="section-label">People</p>
            {searching && <p className="empty-state">Searching…</p>}
            {!searching && searchResults.length === 0 && (
              <p className="empty-state">No one found by that name or number.</p>
            )}
            {searchResults.map((person) => (
              <div key={person.id} className="chat-row contact-search-row">
                <button type="button" className="chat-row-link" onClick={() => startChat(person.id)}>
                  <Avatar user={person} />
                  <div className="chat-row-info">
                    <span className="name">{person.display_name}</span>
                    <span className="preview">{person.about}</span>
                  </div>
                </button>
                {person.is_contact ? (
                  <span className="added-badge">✓ Added</span>
                ) : (
                  <button type="button" className="add-contact-btn" onClick={() => addContact(person.id)}>
                    + Add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="results-block">
          <p className="section-label">Chats</p>
          {conversations.map((conversation) => (
            <Link key={conversation.id} to={`/chat/${conversation.id}`} className="chat-row">
              <Avatar user={conversation.other} showOnlineDot />
              <div className="chat-row-info">
                <span className="name">{conversation.other?.display_name || 'Unknown'}</span>
                <span className="preview">
                  {conversation.last_message ? conversation.last_message.text || '📎 Attachment' : 'Say hello 👋'}
                </span>
              </div>
            </Link>
          ))}
          {conversations.length === 0 && !query.trim() && (
            <p className="empty-state">No chats yet — search a phone number above to start one.</p>
          )}
        </div>
      </aside>

      <main className="main-empty">
        <div className="empty-illustration">
          <div className="brand-logo big">T</div>
          <h2>Tordi Web</h2>
          <p>Select a chat or search for someone to start messaging.</p>
        </div>
      </main>
    </div>
  );
}
