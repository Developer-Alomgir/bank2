import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

function Accounts({ token }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    apiRequest('/api/accounts')
      .then((res) => res.json())
      .then((data) => setAccounts(data.accounts || []))
      .catch((err) => console.error(err));
  }, [token]);

  const viewTransactions = (accountId) => {
    setSelectedAccount(accountId);
    apiRequest(`/api/accounts/${accountId}/transactions`)
      .then((res) => res.json())
      .then((data) => setTransactions(data.transactions || []))
      .catch((err) => console.error(err));
  };

  return (
    <div>
      <div className="card">
        <h2>My Accounts</h2>
        {accounts.map((acc) => (
          <div key={acc.id} style={{ marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{acc.type}</div>
            <div style={{ color: '#666', fontSize: 14 }}>Account: {acc.number}</div>
            <div style={{ color: '#28a745', fontSize: 20, marginTop: 8 }}>৳{acc.balance.toFixed(2)}</div>
            <button className="btn btn-primary" onClick={() => viewTransactions(acc.id)}>
              View Transactions
            </button>
          </div>
        ))}
      </div>

      {selectedAccount && (
        <div className="card">
          <h3>Transaction History</h3>
          {transactions.length === 0 && <p>No transactions</p>}
          {transactions.map((tx) => (
            <div key={tx.id} className="transaction-item">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{tx.type}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{new Date(tx.date).toLocaleString()}</div>
                </div>
                <div style={{ color: tx.amount < 0 ? '#dc3545' : '#28a745', fontWeight: 600, fontSize: 18 }}>
                  {tx.amount < 0 ? '-' : '+'}৳{Math.abs(tx.amount).toFixed(2)}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Status: {tx.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Accounts;
