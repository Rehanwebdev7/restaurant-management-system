import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Form, Table, Badge } from 'react-bootstrap';
import { ApiGet, ApiPost } from '../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getContrastColor } from '../../../services/themeService';

const WithdrawalRequest = () => {
  const { isDarkMode } = useDarkMode();
  const { primaryColor: themePrimaryColor } = useTheme();
  const primaryColor = themePrimaryColor || '#667eea';
  const primaryContrast = getContrastColor(primaryColor);

  const bg = isDarkMode ? '#0f172a' : '#ffffff';
  const cBg = isDarkMode ? '#1e293b' : '#f8fafc';
  const cBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const tp = isDarkMode ? '#e2e8f0' : '#1e293b';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ amount: '', bankId: '', remark: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, bankRes, reqRes] = await Promise.all([
        ApiGet('/api/delivery/users/out_wallet', {}),
        ApiGet('/api/delivery/bank_details/bankDetail', {}),
        ApiGet('/api/deliver/wallet_topup_request/filter', { pageNumber: 1, pageSize: 50 })
      ]);

      setWalletBalance(balRes.success?.data?.data?.walletBalance || 0);
      setBankAccounts(bankRes.success?.data?.data || []);
      const reqData = reqRes.success?.data?.data;
      setRequests(reqData?.records || reqData?.content || []);
    } catch {
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast.error('Enter valid amount'); return; }
    if (amount > walletBalance) { toast.error(`Amount exceeds wallet balance (₹${Number(walletBalance).toFixed(2)})`); return; }
    setSubmitting(true);
    try {
      const payload = {
        amount,
        requestType: 'WITHDRAWAL',
        remark: form.remark || 'Withdrawal request',
        mode: 0
      };
      if (form.bankId) payload.bankId = { id: Number(form.bankId) };

      const response = await ApiPost('/api/deliver/wallet_topup_request/add', payload);
      if (response.success) {
        toast.success('Withdrawal request submitted!');
        setForm({ amount: '', bankId: '', remark: '' });
        fetchData();
      } else {
        toast.error(response.fail || 'Failed to submit request');
      }
    } catch {
      toast.error('Error submitting withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'approved') return <Badge bg="success">Approved</Badge>;
    if (status === 'rejected') return <Badge bg="danger">Rejected</Badge>;
    return <Badge bg="warning" text="dark">Pending</Badge>;
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
      <div className="mb-4">
        <h2 className="mb-1 fw-bold" style={{ color: tp }}><i className="bi bi-arrow-up-circle me-2"></i>Withdrawal Request</h2>
        <p className="text-muted small">Request withdrawal from your wallet balance</p>
      </div>

      <Row className="g-4">
        <Col lg={5}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg }}>
            <Card.Header className="border-0 py-3" style={{ backgroundColor: cBg }}>
              <h5 className="mb-0 fw-bold" style={{ color: tp }}>New Request</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-4 p-3 rounded text-center" style={{ backgroundColor: '#eff6ff' }}>
                <small className="text-muted d-block">Available Wallet Balance</small>
                <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1d4ed8' }}>₹{Number(walletBalance).toFixed(2)}</span>
              </div>

              <Form.Group className="mb-3">
                <Form.Label style={{ color: tp }}>Amount *</Form.Label>
                <div className="input-group">
                  <span className="input-group-text" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#e9ecef', color: tp, borderColor: cBorder }}>₹</span>
                  <Form.Control
                    type="number"
                    placeholder="Enter amount"
                    value={form.amount}
                    onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    max={walletBalance}
                    style={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', color: tp, borderColor: cBorder }}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ color: tp }}>Bank Account</Form.Label>
                <Form.Select
                  value={form.bankId}
                  onChange={e => setForm(p => ({ ...p, bankId: e.target.value }))}
                  style={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', color: tp, borderColor: cBorder }}
                >
                  <option value="">Select bank account (optional)</option>
                  {bankAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} — {acc.accountNumber}</option>
                  ))}
                </Form.Select>
                {bankAccounts.length === 0 && (
                  <small className="text-muted">No bank accounts. <a href="/delivery/bank-accounts">Add one</a></small>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label style={{ color: tp }}>Remark (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Reason for withdrawal"
                  value={form.remark}
                  onChange={e => setForm(p => ({ ...p, remark: e.target.value }))}
                  style={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', color: tp, borderColor: cBorder }}
                />
              </Form.Group>

              <Button
                className="w-100"
                style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }}
                onClick={handleSubmit}
                disabled={submitting || !form.amount}
              >
                {submitting ? <Spinner animation="border" size="sm" className="me-1" /> : <i className="bi bi-send me-1"></i>}
                Submit Withdrawal Request
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg }}>
            <Card.Header className="border-0 py-3" style={{ backgroundColor: cBg }}>
              <h5 className="mb-0 fw-bold" style={{ color: tp }}>Request History</h5>
            </Card.Header>
            <Card.Body style={{ padding: 0 }}>
              {requests.length === 0 ? (
                <Alert variant="info" className="m-3">No withdrawal requests yet.</Alert>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table className="mb-0" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff' }}>
                    <thead>
                      <tr style={{ backgroundColor: primaryColor }}>
                        {['Amount', 'Status', 'Remark', 'Date'].map(h => (
                          <th key={h} style={{ color: primaryContrast, border: 'none', padding: '10px 14px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req, i) => (
                        <tr key={req.id || i} style={{ borderBottom: `1px solid ${cBorder}` }}>
                          <td style={{ padding: '10px 14px', color: tp, fontWeight: 'bold' }}>₹{Number(req.amount || 0).toFixed(2)}</td>
                          <td style={{ padding: '10px 14px' }}>{getStatusBadge(req.status)}</td>
                          <td style={{ padding: '10px 14px', color: tp }}>{req.remark || '—'}</td>
                          <td style={{ padding: '10px 14px', color: tp, whiteSpace: 'nowrap' }}>{formatDate(req.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default WithdrawalRequest;
