import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Table, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ApiGet } from '../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getContrastColor } from '../../../services/themeService';

const Wallet = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const { primaryColor: themePrimaryColor } = useTheme();
  const primaryColor = themePrimaryColor || '#667eea';
  const primaryContrast = getContrastColor(primaryColor);

  const bg = isDarkMode ? '#0f172a' : '#ffffff';
  const cBg = isDarkMode ? '#1e293b' : '#f8fafc';
  const cBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const tp = isDarkMode ? '#e2e8f0' : '#1e293b';

  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [outstanding, setOutstanding] = useState([]);
  const [activeTab, setActiveTab] = useState('wallet');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, txRes, outRes] = await Promise.all([
        ApiGet('/api/delivery/users/out_wallet', {}),
        ApiGet('/api/delivery/wallet_transactions/filter', { pageNumber: 1, pageSize: 50 }),
        ApiGet('/api/deliver/outstanding/filter', { pageNumber: 1, pageSize: 50 })
      ]);

      const bal = balRes.success?.data?.data || {};
      setWalletBalance(bal.walletBalance || 0);
      setOutstandingBalance(bal.outstandingBalance || 0);

      const txData = txRes.success?.data?.data;
      setTransactions(txData?.records || txData?.content || []);

      const outData = outRes.success?.data?.data;
      setOutstanding(outData?.records || outData?.content || []);
    } catch {
      toast.error('Error loading wallet data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (loading) {
    return (
      <Container fluid className="py-5" style={{ backgroundColor: bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-4" style={{ backgroundColor: bg, minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold" style={{ color: tp }}><i className="bi bi-wallet2 me-2"></i>Wallet & Earnings</h2>
        <Button variant="outline-secondary" size="sm" onClick={fetchData}><i className="bi bi-arrow-clockwise me-1"></i>Refresh</Button>
      </div>

      {/* Balance Cards */}
      <Row className="g-3 mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm text-center py-3" style={{ backgroundColor: '#eff6ff' }}>
            <Card.Body>
              <i className="bi bi-wallet2 fs-2 mb-2" style={{ color: '#3b82f6' }}></i>
              <div className="text-muted small mb-1">Wallet Balance</div>
              <div className="fw-bold" style={{ fontSize: '2rem', color: '#1d4ed8' }}>₹{Number(walletBalance).toFixed(2)}</div>
              <Button
                size="sm" className="mt-3"
                style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }}
                onClick={() => navigate('/delivery/withdraw')}
              >
                <i className="bi bi-arrow-up-circle me-1"></i>Withdraw
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm text-center py-3" style={{ backgroundColor: outstandingBalance > 0 ? '#fef2f2' : '#f0fdf4' }}>
            <Card.Body>
              <i className="bi bi-exclamation-circle fs-2 mb-2" style={{ color: outstandingBalance > 0 ? '#ef4444' : '#22c55e' }}></i>
              <div className="text-muted small mb-1">Outstanding (Cash Collected)</div>
              <div className="fw-bold" style={{ fontSize: '2rem', color: outstandingBalance > 0 ? '#dc2626' : '#15803d' }}>₹{Number(outstandingBalance).toFixed(2)}</div>
              {outstandingBalance > 0 && <div className="text-muted small mt-2">Submit to branch to clear</div>}
              {outstandingBalance === 0 && <div className="text-success small mt-2">All clear!</div>}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-3">
        {[{ key: 'wallet', label: 'Wallet Transactions', icon: 'bi-wallet2' }, { key: 'outstanding', label: 'Outstanding Ledger', icon: 'bi-list-check' }].map(tab => (
          <Button
            key={tab.key}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            style={activeTab === tab.key
              ? { backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }
              : { backgroundColor: 'transparent', borderColor: cBorder, color: tp }
            }
          >
            <i className={`bi ${tab.icon} me-1`}></i>{tab.label}
          </Button>
        ))}
      </div>

      {/* Wallet Transactions Table */}
      {activeTab === 'wallet' && (
        <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg }}>
          <Card.Body style={{ padding: 0 }}>
            {transactions.length === 0 ? (
              <Alert variant="info" className="m-3">No wallet transactions yet.</Alert>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table className="mb-0" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff' }}>
                  <thead>
                    <tr style={{ backgroundColor: primaryColor }}>
                      {['#', 'Type', 'Opening Bal', 'Amount', 'Closing Bal', 'Message', 'Date'].map(h => (
                        <th key={h} style={{ color: primaryContrast, border: 'none', padding: '10px 14px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr key={tx.id || i} style={{ borderBottom: `1px solid ${cBorder}` }}>
                        <td style={{ padding: '10px 14px', color: tp }}>{i + 1}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <Badge bg={tx.mode === 0 ? 'success' : 'danger'}>{tx.mode === 0 ? 'Credit' : 'Debit'}</Badge>
                        </td>
                        <td style={{ padding: '10px 14px', color: tp }}>₹{Number(tx.opBal || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px 14px', color: tx.mode === 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                          {tx.mode === 0 ? '+' : '-'}₹{Number(tx.amount || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 14px', color: tp }}>₹{Number(tx.closingBal || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px 14px', color: tp }}>{tx.message || '—'}</td>
                        <td style={{ padding: '10px 14px', color: tp, whiteSpace: 'nowrap' }}>{formatDate(tx.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Outstanding Table */}
      {activeTab === 'outstanding' && (
        <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg }}>
          <Card.Body style={{ padding: 0 }}>
            {outstanding.length === 0 ? (
              <Alert variant="info" className="m-3">No outstanding entries yet.</Alert>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table className="mb-0" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff' }}>
                  <thead>
                    <tr style={{ backgroundColor: primaryColor }}>
                      {['#', 'Type', 'Service', 'Opening', 'Amount', 'Closing', 'Order', 'Remark', 'Date'].map(h => (
                        <th key={h} style={{ color: primaryContrast, border: 'none', padding: '10px 14px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {outstanding.map((entry, i) => (
                      <tr key={entry.id || i} style={{ borderBottom: `1px solid ${cBorder}` }}>
                        <td style={{ padding: '10px 14px', color: tp }}>{i + 1}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <Badge bg={entry.mode === 0 ? 'warning' : 'success'}>{entry.mode === 0 ? 'Owed' : 'Cleared'}</Badge>
                        </td>
                        <td style={{ padding: '10px 14px', color: tp }}>{entry.service || '—'}</td>
                        <td style={{ padding: '10px 14px', color: tp }}>₹{Number(entry.openingBal || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px 14px', color: entry.mode === 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                          {entry.mode === 0 ? '+' : '-'}₹{Number(entry.amount || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '10px 14px', color: tp }}>₹{Number(entry.closingBal || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px 14px', color: tp }}>{entry.orderId || '—'}</td>
                        <td style={{ padding: '10px 14px', color: tp }}>{entry.remark || '—'}</td>
                        <td style={{ padding: '10px 14px', color: tp, whiteSpace: 'nowrap' }}>{formatDate(entry.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Wallet;
