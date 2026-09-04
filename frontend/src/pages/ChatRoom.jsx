import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

const POLL_INTERVAL_MS = 2500;

const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😜', '🤔', '😎',
  '😢', '😭', '😡', '😴', '🤗', '🙌', '👏', '👍', '👎', '🙏',
  '💪', '🔥', '✨', '🎉', '❤️', '💔', '💯', '😱', '😇', '🤩',
  '🥳', '😅', '😆', '🙃', '🤨', '😐', '😬', '🤯', '🥺', '😤',
  '👋', '🤝', '✌️', '🤞', '👌', '🤙', '💃', '🕺', '🍕', '☕',
  '🎂', '🎁', '⚽', '🏆', '🚗', '✈️', '🌍', '☀️', '🌙', '⭐',
];

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatRoom() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [peerTyping, setPeerTyping] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  const lastIdRef = useRef(0);
  const pollTimerRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const messageListRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    const el = messageListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const loadRoom = useCallback(async () => {
    const data = await api.get(`/api/chat/conversations/${conversationId}/`);
    setOther(data.conversation.other);
    setMessages(data.messages);
    lastIdRef.current = data.messages.length ? data.messages[data.messages.length - 1].id : 0;
    setTimeout(scrollToBottom, 0);
  }, [conversationId]);

  useEffect(() => {
    setMessages([]);
    setOther(null);
    lastIdRef.current = 0;
    loadRoom();
  }, [loadRoom]);

  useEffect(() => {
    async function poll() {
      try {
        const data = await api.get(`/api/chat/conversations/${conversationId}/poll/?after=${lastIdRef.current}`);
        if (data.messages.length) {
          setMessages((prev) => [...prev, ...data.messages]);
          lastIdRef.current = data.messages[data.messages.length - 1].id;
          setTimeout(scrollToBottom, 0);
        }
        setPeerTyping(data.peer_typing);
        if (data.peer) setOther(data.peer);
      } catch {
        // transient network hiccup — next poll will retry
      }
    }

    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(pollTimerRef.current);
  }, [conversationId]);

  const sendText = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    setEmojiOpen(false);
    try {
      const message = await api.post(`/api/chat/conversations/${conversationId}/send/`, { text: trimmed });
      setMessages((prev) => [...prev, message]);
      lastIdRef.current = message.id;
      setTimeout(scrollToBottom, 0);
    } catch (err) {
      setUploadError(err.message);
      setTimeout(() => setUploadError(''), 3000);
    }
  };

  const handleTyping = (value) => {
    setText(value);
    const now = Date.now();
    if (now - lastTypingSentRef.current > 1500) {
      lastTypingSentRef.current = now;
      api.post(`/api/chat/conversations/${conversationId}/typing/`).catch(() => {});
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('attachment', file);
    formData.append('caption', text.trim());

    try {
      const message = await api.postForm(`/api/chat/conversations/${conversationId}/upload/`, formData);
      setMessages((prev) => [...prev, message]);
      lastIdRef.current = message.id;
      setText('');
      setTimeout(scrollToBottom, 0);
    } catch (err) {
      setUploadError(err.message);
      setTimeout(() => setUploadError(''), 3000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const insertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
  };

  return (
    <div className="app-shell has-room">
      <main className="chat-main">
        <header className="chat-header">
          <button type="button" className="back-btn" onClick={() => navigate('/')} title="Back to chats">←</button>
          <Avatar user={other} showOnlineDot />
          <div className="chat-header-info">
            <span className="name">{other?.display_name || 'Loading…'}</span>
            <span className="status">
              {other?.is_online ? 'online' : other?.last_seen ? `last seen ${new Date(other.last_seen).toLocaleString()}` : ''}
            </span>
          </div>
          <Link to="/settings" className="icon-btn settings-link-header" title="Settings">⚙</Link>
        </header>

        <div className="message-list" ref={messageListRef}>
          {messages.length === 0 && <p className="empty-state">No messages yet. Say hello 👋</p>}
          {messages.map((message) => {
            const mine = message.sender_id === user.id;
            const mediaOnly = message.attachment_url && !message.text;
            return (
              <div key={message.id} className={`bubble-row ${mine ? 'mine' : 'theirs'}`}>
                <div className={`bubble ${mediaOnly ? 'media-only' : ''}`}>
                  {message.attachment_url && (
                    <div className="bubble-media">
                      {message.attachment_kind === 'image' && <img src={message.attachment_url} alt="" />}
                      {message.attachment_kind === 'video' && <video src={message.attachment_url} controls />}
                      {message.attachment_kind === 'file' && (
                        <a href={message.attachment_url} target="_blank" rel="noreferrer">Download attachment</a>
                      )}
                    </div>
                  )}
                  {message.text && <span className="bubble-text">{message.text}</span>}
                  <span className="bubble-time">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="typing-indicator">
          {uploadError || (peerTyping ? `${other?.display_name || 'They'} is typing...` : '')}
        </div>

        <form className="composer" onSubmit={sendText} autoComplete="off">
          <button type="button" className="composer-icon-btn" title="Emoji" onClick={() => setEmojiOpen((v) => !v)}>
            🙂
          </button>
          <button
            type="button"
            className="composer-icon-btn"
            title="Attach photo or video"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Type a message"
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
          />
          <button type="submit" className="btn-send" title="Send">➤</button>

          {emojiOpen && (
            <div className="emoji-panel open">
              {EMOJIS.map((emoji) => (
                <button type="button" key={emoji} onClick={() => insertEmoji(emoji)}>{emoji}</button>
              ))}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
