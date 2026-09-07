import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  // Form edit states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [connectionStatus, setConnectionStatus] = useState('none');
  const [isSender, setIsSender] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Check auth and fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const storedUserJson = localStorage.getItem('user');
        if (!storedUserJson) {
          navigate('/login');
          return;
        }
        const currentUser = JSON.parse(storedUserJson);
        const own = currentUser.id === id;
        setIsOwnProfile(own);

        const res = await api.get(`/api/users/${id}`);
        setUser(res.data);
        setName(res.data.name || '');
        setBio(res.data.bio || '');
        setSkillsStr(res.data.skills ? res.data.skills.join(', ') : '');

        if (!own) {
          try {
            const statusRes = await api.get(`/api/connections/status/${id}`);
            setConnectionStatus(statusRes.data.status);
            setIsSender(statusRes.data.isSender);
          } catch (statusErr) {
            console.error('Failed to load connection status', statusErr);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, navigate]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await api.post(`/api/connections/request/${id}`);
      setConnectionStatus('pending');
      setIsSender(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send connection request');
    } finally {
      setConnecting(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const skillsArray = skillsStr
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const res = await api.put(`/api/users/${id}`, {
        name,
        bio,
        skills: skillsArray
      });

      setUser(res.data);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      // Update local storage user name if it changed
      const storedUserJson = localStorage.getItem('user');
      if (storedUserJson) {
        const storedUser = JSON.parse(storedUserJson);
        storedUser.name = res.data.name;
        localStorage.setItem('user', JSON.stringify(storedUser));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return <div className="page-spinner">Loading profile...</div>;
  }

  if (error && !user) {
    return (
      <div className="container" style={{ marginTop: '2rem', textAlign: 'center' }}>
        <div className="card alert-error">{error}</div>
        <Link to="/login" className="btn btn-secondary" style={{ marginTop: '1rem' }}>Back to Login</Link>
      </div>
    );
  }

  return (
    <div className="profile-container container">
      <header className="profile-header">
        <div className="logo-section">
          <Link to="/feed" className="nav-logo">OrbitPro</Link>
        </div>
        <nav className="nav-actions">
          <Link to="/feed" className="nav-link">Feed</Link>
          <Link to="/requests" className="nav-link">Requests</Link>
          <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
        </nav>
      </header>

      <div className="profile-layout">
        <main className="profile-main-card card">
          {success && <div className="alert-success">{success}</div>}
          {error && <div className="alert-error">{error}</div>}

          <div className="profile-avatar-large">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>

          {!editing ? (
            <div className="profile-details-view">
              <h1 className="profile-name">{user.name}</h1>
              <p className="profile-role-badge">{user.role}</p>
              <p className="profile-email">{user.email}</p>
              
              <div className="profile-section">
                <h3>Bio</h3>
                <p className="profile-bio-text">{user.bio || 'No bio written yet.'}</p>
              </div>

              <div className="profile-section">
                <h3>Skills</h3>
                <div className="skills-tags">
                  {user.skills && user.skills.length > 0 ? (
                    user.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))
                  ) : (
                    <span className="no-skills">No skills added yet.</span>
                  )}
                </div>
              </div>

              {isOwnProfile ? (
                <button onClick={() => setEditing(true)} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                  Edit Profile
                </button>
              ) : (
                <div style={{ marginTop: '1.5rem' }}>
                  {connectionStatus === 'accepted' ? (
                    <span className="btn btn-secondary" style={{ cursor: 'default', color: 'var(--success-color)' }}>
                      ✓ Connected
                    </span>
                  ) : connectionStatus === 'pending' ? (
                    <button className="btn btn-secondary" disabled>
                      {isSender ? 'Pending Request' : 'Request Received'}
                    </button>
                  ) : (
                    <button
                      onClick={handleConnect}
                      className="btn btn-primary"
                      disabled={connecting}
                    >
                      {connecting ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="profile-edit-form">
              <h2>Edit Profile</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Skills (comma separated)</label>
                <input
                  type="text"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="React, Express, Machine Learning..."
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary" disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </main>

        <aside className="profile-sidebar">
          {/* Side panels (Recommendations or other lists) will go here */}
        </aside>
      </div>
    </div>
  );
}
