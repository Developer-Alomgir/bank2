import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

function Notifications({ token }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    apiRequest('/api/notifications')
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch((err) => console.error(err));
  }, [token]);

  const markAsRead = (id) => {
    apiRequest(`/api/notifications/${id}/read`, {
      method: 'POST',
    })
      .then((res) => res.json())
      .then(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      })
      .catch((err) => console.error(err));
  };

  return (
    <div>
      <div className="card">
        <h2>Notifications</h2>
        {notifications.length === 0 && <p>No notifications</p>}
        {notifications.map((n) => (
          <div
            key={n.id}
            className="transaction-item"
            style={{ backgroundColor: n.read ? 'transparent' : '#f0f8ff' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: n.read ? 'normal' : 'bold' }}>{n.type}</div>
                <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{n.message}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {new Date(n.date).toLocaleString()}
                </div>
              </div>
              {!n.read && (
                <button
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={() => markAsRead(n.id)}
                >
                  Mark Read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;
