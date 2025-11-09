import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Transfer from './components/Transfer';
import BKash from './components/BKash';
import Notifications from './components/Notifications';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [screen, setScreen] = useState('dashboard');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const logout = () => {
    setToken('');
    setScreen('dashboard');
  };

  if (!token) {
    return <Login onLogin={setToken} />;
  }

  return (
    <div className="App">
      <div className="content container">
        {screen === 'dashboard' && <Dashboard token={token} />}
        {screen === 'accounts' && <Accounts token={token} />}
        {screen === 'transfer' && <Transfer token={token} />}
        {screen === 'bkash' && <BKash token={token} />}
        {screen === 'notifications' && <Notifications token={token} />}
      </div>

      <div className="nav">
        <div className={`nav-item ${screen === 'dashboard' ? 'active' : ''}`} onClick={() => setScreen('dashboard')}>
          Home
        </div>
        <div className={`nav-item ${screen === 'accounts' ? 'active' : ''}`} onClick={() => setScreen('accounts')}>
          Accounts
        </div>
        <div className={`nav-item ${screen === 'transfer' ? 'active' : ''}`} onClick={() => setScreen('transfer')}>
          Transfer
        </div>
        <div className={`nav-item ${screen === 'bkash' ? 'active' : ''}`} onClick={() => setScreen('bkash')}>
          bKash
        </div>
        <div className={`nav-item ${screen === 'notifications' ? 'active' : ''}`} onClick={() => setScreen('notifications')}>
          Alerts
        </div>
        <div className="nav-item" onClick={logout}>
          Logout
        </div>
      </div>
    </div>
  );
}

export default App;
