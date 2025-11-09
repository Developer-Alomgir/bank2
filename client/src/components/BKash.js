import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

function BKash({ token }) {
  const [accounts, setAccounts] = useState([]);
  const [mobile, setMobile] = useState('');
  const [linked, setLinked] = useState(false);

  const [action, setAction] = useState('send'); // send | cashout | recharge | paybill
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [biller, setBiller] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/api/accounts')
      .then((res) => res.json())
      .then((data) => setAccounts(data.accounts || []))
      .catch((err) => console.error(err));
  }, [token]);

  const handleLink = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiRequest('/api/bkash/link', {
        method: 'POST',
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (res.ok) {
        setLinked(true);
        alert(data.message);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  const handleAction = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    let endpoint = '';
    let body = {};

    switch (action) {
      case 'send':
        endpoint = '/api/bkash/send';
        body = { fromAccountId, mobile, amount: parseFloat(amount) };
        break;
      case 'cashout':
        endpoint = '/api/bkash/cashout';
        body = { toAccountId, amount: parseFloat(amount) };
        break;
      case 'recharge':
        endpoint = '/api/bkash/recharge';
        body = { fromAccountId, mobile, amount: parseFloat(amount) };
        break;
      case 'paybill':
        endpoint = '/api/bkash/paybill';
        body = { fromAccountId, biller, amount: parseFloat(amount) };
        break;
      default:
        break;
    }

    try {
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed');
      } else {
        setMessage(data.message || 'Success');
        setAmount('');
        setBiller('');
        // Refresh accounts
        apiRequest('/api/accounts')
          .then((r) => r.json())
          .then((d) => setAccounts(d.accounts || []));
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>bKash</h2>
        {!linked ? (
          <form onSubmit={handleLink}>
            <label>Link bKash Account</label>
            <input
              type="tel"
              placeholder="017XXXXXXXX"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
            {error && <div className="error">{error}</div>}
            <button type="submit" className="btn btn-primary">
              Link bKash
            </button>
          </form>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ color: '#28a745', fontWeight: 600 }}>✓ bKash Linked:</span> {mobile}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <button
                className={`btn ${action === 'send' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAction('send')}
              >
                Send
              </button>
              <button
                className={`btn ${action === 'cashout' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAction('cashout')}
              >
                Cash Out
              </button>
              <button
                className={`btn ${action === 'recharge' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAction('recharge')}
              >
                Recharge
              </button>
              <button
                className={`btn ${action === 'paybill' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setAction('paybill')}
              >
                Pay Bill
              </button>
            </div>

            <form onSubmit={handleAction}>
              {(action === 'send' || action === 'recharge' || action === 'paybill') && (
                <>
                  <label>From Account</label>
                  <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required>
                    <option value="">Select Account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.type} - {acc.number} (৳{acc.balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </>
              )}

              {action === 'cashout' && (
                <>
                  <label>To Account</label>
                  <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required>
                    <option value="">Select Account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.type} - {acc.number}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {action === 'paybill' && (
                <>
                  <label>Biller</label>
                  <input
                    type="text"
                    placeholder="e.g. DESCO, Gas Bill"
                    value={biller}
                    onChange={(e) => setBiller(e.target.value)}
                    required
                  />
                </>
              )}

              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />

              {error && <div className="error">{error}</div>}
              {message && <div className="success">{message}</div>}

              <button type="submit" className="btn btn-success">
                {action === 'send' && 'Send Money'}
                {action === 'cashout' && 'Cash Out'}
                {action === 'recharge' && 'Recharge'}
                {action === 'paybill' && 'Pay Bill'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default BKash;
