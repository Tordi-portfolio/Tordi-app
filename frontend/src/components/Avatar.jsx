export default function Avatar({ user, size, showOnlineDot }) {
  const style = size ? { width: size, height: size } : undefined;
  const initial = (user?.display_name || '?').charAt(0).toUpperCase();
  return (
    <div className="avatar" style={style}>
      {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : initial}
      {showOnlineDot && user?.is_online && <span className="online-dot"></span>}
    </div>
  );
}
