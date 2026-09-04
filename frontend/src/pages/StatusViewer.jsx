import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';

const TEXT_DURATION_MS = 5000;
const FALLBACK_VIDEO_DURATION_MS = 8000;

export default function StatusViewer() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [owner, setOwner] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const barRefs = useRef([]);

  useEffect(() => {
    let cancelled = false;
    api.get(`/api/status/${userId}/`)
      .then((data) => {
        if (cancelled) return;
        if (!data.statuses.length) {
          navigate('/');
          return;
        }
        setOwner(data.owner);
        setStatuses(data.statuses);
        setLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setTimeout(() => navigate('/'), 1500);
      });
    return () => { cancelled = true; };
  }, [userId, navigate]);

  const markViewed = useCallback((statusId) => {
    api.post(`/api/status/${statusId}/viewed/`).catch(() => {});
  }, []);

  const advance = useCallback((delta) => {
    setCurrent((prev) => {
      const next = prev + delta;
      if (next < 0 || next >= statuses.length) {
        navigate('/');
        return prev;
      }
      return next;
    });
  }, [statuses.length, navigate]);

  useEffect(() => {
    if (!loaded || !statuses[current]) return;

    clearTimeout(timerRef.current);
    markViewed(statuses[current].id);

    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      bar.style.transition = 'none';
      bar.style.width = i < current ? '100%' : '0%';
    });

    const isVideo = statuses[current].media_kind === 'video';
    if (!isVideo) {
      requestAnimationFrame(() => {
        const bar = barRefs.current[current];
        if (bar) {
          bar.style.transition = `width ${TEXT_DURATION_MS}ms linear`;
          bar.style.width = '100%';
        }
      });
      timerRef.current = setTimeout(() => advance(1), TEXT_DURATION_MS);
    }

    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, loaded]);

  const handleVideoLoaded = () => {
    const video = videoRef.current;
    if (!video) return;
    const durationMs = video.duration && isFinite(video.duration) ? video.duration * 1000 : FALLBACK_VIDEO_DURATION_MS;
    const bar = barRefs.current[current];
    if (bar) {
      requestAnimationFrame(() => {
        bar.style.transition = `width ${durationMs}ms linear`;
        bar.style.width = '100%';
      });
    }
    video.play().catch(() => {});
  };

  if (!loaded) {
    return <div className="story-viewer"><p style={{ color: 'white', margin: 'auto' }}>{error || 'Loading…'}</p></div>;
  }

  const slide = statuses[current];

  return (
    <div className="story-viewer">
      <div className="story-progress-row">
        {statuses.map((s, i) => (
          <div className="story-progress-bar" key={s.id}>
            <div className="story-progress-fill" ref={(el) => (barRefs.current[i] = el)}></div>
          </div>
        ))}
      </div>

      <div className="story-header">
        <div className="avatar">
          {owner.avatar_url ? <img src={owner.avatar_url} alt="" /> : owner.display_name.charAt(0).toUpperCase()}
        </div>
        <div className="story-header-info">
          <span className="name">{owner.display_name}</span>
          <span className="status">{new Date(slide.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <button className="icon-btn" style={{ marginLeft: 'auto' }} title="Close" onClick={() => navigate('/')}>✕</button>
      </div>

      <div className="story-stage">
        <div className="story-slide" style={{ display: 'flex' }}>
          {slide.media_kind === 'image' && <img src={slide.media_url} alt="" />}
          {slide.media_kind === 'video' && (
            <video ref={videoRef} src={slide.media_url} playsInline onLoadedMetadata={handleVideoLoaded} onEnded={() => advance(1)} />
          )}
          {!slide.media_kind && (
            <div className="story-text-card" style={{ background: slide.background_color }}>{slide.text}</div>
          )}
          {slide.text && slide.media_kind && <div className="story-caption">{slide.text}</div>}
        </div>
      </div>

      <div className="story-tap-zone story-tap-prev" onClick={() => advance(-1)}></div>
      <div className="story-tap-zone story-tap-next" onClick={() => advance(1)}></div>
    </div>
  );
}
