import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

function Transfer({ token }) {
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [mode, setMode] = useState('internal'); // internal | bank
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Add beneficiary
  const [showAddBenef, setShowAddBenef] = useState(false);
  const [benefName, setBenefName] = useState('');
  const [benefAccount, setBenefAccount] = useState('');

  useEffect(() => {
    apiRequest('/api/accounts')
      .then((res) => res.json())
      .then((data) => setAccounts(data.accounts || []))
      .catch((err) => console.error(err));

    apiRequest('/api/transfers/beneficiaries')
      .then((res) => res.json())
      .then((data) => setBeneficiaries(data.beneficiaries || []))
      .catch((err) => console.error(err));
  }, [token]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const endpoint = mode === 'internal' ? '/api/transfers/internal' : '/api/transfers/bank';
    const body =
      mode === 'internal'
        ? { fromAccountId, toAccountId, amount: parseFloat(amount) }
        : { fromAccountId, toAccountNumber, amount: parseFloat(amount) };

    try {
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Transfer failed');
      } else {
        setMessage(data.message || 'Transfer successful');
        setAmount('');
        setToAccountId('');
        setToAccountNumber('');
        // Refresh accounts
        apiRequest('/api/accounts')
          .then((r) => r.json())
          .then((d) => setAccounts(d.accounts || []));
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const handleAddBeneficiary = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/api/transfers/beneficiaries', {
        method: 'POST',
        body: JSON.stringify({ name: benefName, accountNumber: benefAccount }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setBenefName('');
        setBenefAccount('');
        setShowAddBenef(false);
        // Refresh beneficiaries
        apiRequest('/api/transfers/beneficiaries')
          .then((r) => r.json())
          .then((d) => setBeneficiaries(d.beneficiaries || []));
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Transfer Funds</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            className={`btn ${mode === 'internal' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('internal')}
          >
            Internal
          </button>
          <button
            className={`btn ${mode === 'bank' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('bank')}
          >
            Bank Transfer
          </button>
        </div>

        <form onSubmit={handleTransfer}>
          <label>From Account</label>
          <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} required>
            <option value="">Select Account</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.type} - {acc.number} (৳{acc.balance.toFixed(2)})
              </option>
            ))}
          </select>

          {mode === 'internal' && (
            <>
              <label>To Account</label>
              <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required>
                <option value="">Select Account</option>
                {accounts
                  .filter((a) => a.id !== fromAccountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.type} - {acc.number}
                    </option>
                  ))}
              </select>
            </>
          )}

          {mode === 'bank' && (
            <>
              <label>To Account Number</label>
              <input
                type="text"
                placeholder="Enter account number"
                value={toAccountNumber}
                onChange={(e) => setToAccountNumber(e.target.value)}
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
            Transfer
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Beneficiaries</h3>
        {beneficiaries.length === 0 && <p>No beneficiaries added</p>}
        {beneficiaries.map((b) => (
          <div key={b.id} style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>{b.name}</div>
            <div style={{ fontSize: 14, color: '#666' }}>{b.accountNumber}</div>
          </div>
        ))}
        <button className="btn btn-primary" onClick={() => setShowAddBenef(!showAddBenef)}>
          {showAddBenef ? 'Cancel' : 'Add Beneficiary'}
        </button>

        {showAddBenef && (
          <form onSubmit={handleAddBeneficiary} style={{ marginTop: 12 }}>
            <input
              type="text"
              placeholder="Beneficiary Name"
              value={benefName}
              onChange={(e) => setBenefName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Account Number"
              value={benefAccount}
              onChange={(e) => setBenefAccount(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-success">
              Add
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Transfer;
