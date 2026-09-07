import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function RequestsPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    const storedUserJson = localStorage.getItem('user');
    if (!storedUserJson) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(storedUserJson);
    setCurrentUser(user);

    fetchConnections();
  }, [navigate]);

  const fetchConnections = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/connections/mine');
      setConnections(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load connection requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (connectionId) => {
    setActionLoading((prev) => ({ ...prev, [connectionId]: 'accepting' }));
    try {
      await api.patch(`/api/connections/${connectionId}/accept`);
      // Update local state
      setConnections((prev) =>
        prev.map((c) => (c._id === connectionId ? { ...c, status: 'accepted' } : c))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept connection');
    } finally {
      setActionLoading((prev) => ({ ...prev, [connectionId]: null }));
    }
  };

  const handleReject = async (connectionId) => {
    setActionLoading((prev) => ({ ...prev, [connectionId]: 'rejecting' }));
    try {
      await api.patch(`/api/connections/${connectionId}/reject`);
      // Remove or mark rejected
      setConnections((prev) => prev.filter((c) => c._id !== connectionId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject connection');
    } finally {
      setActionLoading((prev) => ({ ...prev, [connectionId]: null }));
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return <div className="page-spinner">Loading connection requests...</div>;
  }

  // Incoming pending requests: current user is the toUser
  const pendingRequests = connections.filter(
    (c) =>
      c.status === 'pending' &&
      (c.toUser?._id === currentUser?.id || c.toUser === currentUser?.id)
  );

  // Accepted connections
  const acceptedConnections = connections.filter((c) => c.status === 'accepted');

  return (
    <div className="container" style={{ maxWidth: '800px', paddingBottom: '3rem' }}>
      <header className="profile-header">
        <div className="logo-section">
          <Link to="/feed" className="nav-logo">OrbitPro</Link>
        </div>
        <nav className="nav-actions">
          <Link to="/feed" className="nav-link">Feed</Link>
          <Link to="/requests" className="nav-link active">Requests</Link>
          {currentUser && (
            <Link to={`/profile/${currentUser.id}`} className="nav-link">My Profile</Link>
          )}
          <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
        </nav>
      </header>

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Incoming Requests</h1>
        {error && <div className="alert-error">{error}</div>}

        {pendingRequests.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            No pending connection requests right now.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingRequests.map((req) => {
              const sender = req.fromUser || {};
              const reqId = req._id;
              const isActioning = actionLoading[reqId];

              return (
                <div
                  key={reqId}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'var(--primary-glow)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }}
                    >
                      {sender.name ? sender.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <Link
                        to={`/profile/${sender._id}`}
                        style={{ fontWeight: '600', fontSize: '1.05rem', display: 'block' }}
                      >
                        {sender.name || 'Unknown User'}
                      </Link>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {sender.bio || 'No bio provided'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => handleAccept(reqId)}
                      className="btn btn-primary btn-sm"
                      disabled={isActioning}
                    >
                      {isActioning === 'accepting' ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleReject(reqId)}
                      className="btn btn-secondary btn-sm"
                      disabled={isActioning}
                    >
                      {isActioning === 'rejecting' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          My Connections ({acceptedConnections.length})
        </h2>
        {acceptedConnections.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
            You have not connected with anyone yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {acceptedConnections.map((conn) => {
              // The other user is either fromUser or toUser
              const otherUser =
                conn.fromUser?._id === currentUser?.id ? conn.toUser : conn.fromUser;

              if (!otherUser) return null;

              return (
                <div key={conn._id} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '45px',
                      height: '45px',
                      borderRadius: '50%',
                      background: 'var(--primary-glow)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      margin: '0 auto 0.75rem',
                    }}
                  >
                    {otherUser.name ? otherUser.name[0].toUpperCase() : 'U'}
                  </div>
                  <Link
                    to={`/profile/${otherUser._id}`}
                    style={{ fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}
                  >
                    {otherUser.name}
                  </Link>
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {otherUser.bio || 'OrbitPro member'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
