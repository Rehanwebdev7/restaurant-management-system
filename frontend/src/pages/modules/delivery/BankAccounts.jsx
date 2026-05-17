import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Modal, Form, Badge } from 'react-bootstrap';
import { ApiGet, ApiPost } from '../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getContrastColor } from '../../../services/themeService';

const BankAccounts = () => {
  const { isDarkMode } = useDarkMode();
  const { primaryColor: themePrimaryColor } = useTheme();
  const primaryColor = themePrimaryColor || '#667eea';
  const primaryContrast = getContrastColor(primaryColor);

  const bg = isDarkMode ? '#0f172a' : '#ffffff';
  const cBg = isDarkMode ? '#1e293b' : '#f8fafc';
  const cBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const tp = isDarkMode ? '#e2e8f0' : '#1e293b';

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', accountNumber: '', ifscCode: '', upi: '' });

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await ApiGet('/api/delivery/bank_details/bankDetail', {});
      if (response.success) {
        setAccounts(response.success.data?.data || []);
      } else {
        toast.error('Failed to load bank accounts');
      }
    } catch {
      toast.error('Error loading bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Enter account holder name'); return; }
    if (!form.accountNumber.trim()) { toast.error('Enter account number'); return; }
    if (!form.ifscCode.trim()) { toast.error('Enter IFSC code'); return; }
    setSaving(true);
    try {
      const response = await ApiPost('/api/delivery/bank_details/add', form);
      if (response.success) {
        toast.success('Bank account added successfully!');
        setShowModal(false);
        setForm({ name: '', accountNumber: '', ifscCode: '', upi: '' });
        fetchAccounts();
      } else {
        toast.error(response.fail || 'Failed to add account');
      }
    } catch {
      toast.error('Error saving bank account');
    } finally {
      setSaving(false);
    }
  };

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
        <div>
          <h2 className="mb-1 fw-bold" style={{ color: tp }}><i className="bi bi-bank me-2"></i>Bank Accounts</h2>
          <p className="text-muted small">Manage your bank accounts for withdrawals</p>
        </div>
        <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }} onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle me-1"></i>Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-5" style={{ backgroundColor: cBg }}>
          <Card.Body>
            <i className="bi bi-bank fs-1 text-muted d-block mb-3"></i>
            <h5 style={{ color: tp }}>No Bank Accounts</h5>
            <p className="text-muted">Add a bank account to receive withdrawal payments</p>
            <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }} onClick={() => setShowModal(true)}>
              <i className="bi bi-plus-circle me-1"></i>Add Your First Account
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {accounts.map((acc, i) => (
            <Col md={6} lg={4} key={acc.id || i}>
              <Card className="border-0 shadow-sm" style={{ backgroundColor: cBg, borderLeft: `4px solid ${primaryColor}` }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 className="fw-bold mb-1" style={{ color: tp }}>{acc.name}</h6>
                      <Badge bg={acc.status === 'approved' ? 'success' : acc.status === 'rejected' ? 'danger' : 'warning'}>
                        {acc.status || 'Pending'}
                      </Badge>
                    </div>
                    <i className="bi bi-bank fs-4" style={{ color: primaryColor }}></i>
                  </div>
                  <div className="small" style={{ color: tp }}>
                    {acc.accountNumber && <div className="mb-1"><span className="text-muted">Account: </span>{acc.accountNumber}</div>}
                    {acc.ifscCode && <div className="mb-1"><span className="text-muted">IFSC: </span>{acc.ifscCode}</div>}
                    {acc.upi && <div><span className="text-muted">UPI: </span>{acc.upi}</div>}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: tp, borderColor: cBorder }}>
          <Modal.Title style={{ color: tp }}><i className="bi bi-bank me-2"></i>Add Bank Account</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff' }}>
          <div className="mb-3 p-3 rounded" style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.85rem' }}>
            <i className="bi bi-info-circle me-1"></i>Account will be reviewed by branch before activation.
          </div>
          {[
            { key: 'name', label: 'Account Holder Name *', placeholder: 'Full name as in bank' },
            { key: 'accountNumber', label: 'Account Number *', placeholder: 'Enter account number' },
            { key: 'ifscCode', label: 'IFSC Code *', placeholder: 'e.g. SBIN0001234' },
            { key: 'upi', label: 'UPI ID (Optional)', placeholder: 'e.g. 9876543210@upi' }
          ].map(({ key, label, placeholder }) => (
            <Form.Group key={key} className="mb-3">
              <Form.Label style={{ color: tp }}>{label}</Form.Label>
              <Form.Control
                type="text"
                placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                style={{ backgroundColor: isDarkMode ? '#0f172a' : '#fff', color: tp, borderColor: cBorder }}
              />
            </Form.Group>
          ))}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: cBorder }}>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }} onClick={handleSave} disabled={saving}>
            {saving ? <Spinner animation="border" size="sm" className="me-1" /> : <i className="bi bi-check-circle me-1"></i>}
            Save Account
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BankAccounts;
