import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import InstallPrompt from './components/InstallPrompt';

import Register from './pages/Register';
import Login from './pages/Login';
import SetProfile from './pages/SetProfile';
import Inbox from './pages/Inbox';
import ChatRoom from './pages/ChatRoom';
import Settings from './pages/Settings';
import Contacts from './pages/Contacts';
import MyStatus from './pages/MyStatus';
import StatusViewer from './pages/StatusViewer';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InstallPrompt />
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/set-profile" element={<SetProfile />} />

          <Route path="/" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
          <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
          <Route path="/status/mine" element={<ProtectedRoute><MyStatus /></ProtectedRoute>} />
          <Route path="/status/:userId" element={<ProtectedRoute><StatusViewer /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
