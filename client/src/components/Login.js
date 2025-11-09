import React, { useState } from 'react';
import { apiRequest } from '../utils/api';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister
      ? { fullName, phone, email, password, pin }
      : { email, password };

    try {
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
        skipAuth: true,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      if (isRegister) {
        setIsRegister(false);
        setError('');
        alert('Registration successful! Please login.');
      } else {
        if (data.twoFARequired) {
          const code = prompt('Enter 2FA code (check console for mock code):');
          const verify = await apiRequest('/api/auth/2fa/verify', {
            method: 'POST',
            body: JSON.stringify({ email, code }),
            skipAuth: true,
          });
          const verifyData = await verify.json();
          if (!verify.ok) {
            setError(verifyData.error || '2FA failed');
            return;
          }
          onLogin(verifyData.token);
        } else {
          onLogin(data.token);
        }
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>{isRegister ? 'Register' : 'Login'}</h1>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {isRegister && (
            <input
              type="password"
              placeholder="PIN (4 digits)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          )}
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn btn-primary">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
        >
          {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </div>
    </div>
  );
}

export default Login;
