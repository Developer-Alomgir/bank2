import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

function Dashboard({ token }) {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    apiRequest('/api/accounts')
      .then((res) => res.json())
      .then((data) => {
        setAccounts(data.accounts || []);
        if (data.accounts && data.accounts.length > 0) {
          return apiRequest(`/api/accounts/${data.accounts[0].id}/transactions`);
        }
      })
      .then((res) => res && res.json())
      .then((data) => {
        if (data) setTransactions(data.transactions || []);
      })
      .catch((err) => console.error(err));
  }, [token]);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div>
      <div className="card">
        <h2>Dashboard</h2>
        <div className="balance">৳{totalBalance.toFixed(2)}</div>
        <p style={{ textAlign: 'center', color: '#666' }}>Total Balance</p>
      </div>

      <div className="card">
        <h3>My Accounts</h3>
        {accounts.map((acc) => (
          <div key={acc.id} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>{acc.type} - {acc.number}</div>
            <div style={{ color: '#28a745' }}>৳{acc.balance.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Recent Transactions</h3>
        {transactions.length === 0 && <p>No transactions yet</p>}
        {transactions.slice(0, 5).map((tx) => (
          <div key={tx.id} className="transaction-item">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{tx.type}</span>
              <span style={{ color: tx.amount < 0 ? '#dc3545' : '#28a745', fontWeight: 600 }}>
                {tx.amount < 0 ? '-' : '+'}৳{Math.abs(tx.amount).toFixed(2)}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>{new Date(tx.date).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
