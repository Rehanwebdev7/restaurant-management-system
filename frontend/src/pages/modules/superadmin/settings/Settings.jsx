import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner, Tab, Tabs, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import superadminService from '../../../../services/superadminService';
import { getCurrentTheme, getContrastColor } from '../../../../services/themeService';

const theme = getCurrentTheme();
const primaryColor = theme.primary || '#6366f1';
const primaryContrast = getContrastColor(primaryColor);

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Profile
  const [profile, setProfile] = useState({ name: '', email: '', mobile: '' });

  // Password
  const [passwordStep, setPasswordStep] = useState(1);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '', otp: '' });
  const [maskedMobile, setMaskedMobile] = useState('');
  const [serverOtp, setServerOtp] = useState('');

  // Webhook
  const [webhook, setWebhook] = useState({ webhook_url: '', webhook_enabled: false, webhook_secret: '' });
  const [webhookTestResult, setWebhookTestResult] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchWebhook();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const result = await superadminService.settings.get();
    if (result.success) {
      const d = result.success.data.data;
      setProfile({ name: d.name || '', email: d.email || '', mobile: d.mobile || '' });
    }
    setLoading(false);
  };

  const fetchWebhook = async () => {
    const result = await superadminService.settings.getWebhookSettings();
    if (result.success) {
      const d = result.success.data.data;
      setWebhook({ webhook_url: d.webhook_url || '', webhook_enabled: d.webhook_enabled || false, webhook_secret: d.webhook_secret || '' });
    }
  };

  const handleUpdateProfile = async () => {
    setSubmitting(true);
    const result = await superadminService.settings.updateProfile(profile);
    if (result.success) toast.success('Profile updated');
    else toast.error(result.fail);
    setSubmitting(false);
  };

  const handleSendOtp = async () => {
    if (!passwordForm.current_password) { toast.error('Enter current password'); return; }
    setSubmitting(true);
    const result = await superadminService.settings.sendPasswordChangeOtp(passwordForm.current_password);
    if (result.success) {
      const d = result.success.data.data;
      setMaskedMobile(d.masked_mobile || '');
      // OTP is now sent via SMS only — no longer displayed in UI
      setPasswordStep(2);
      toast.success('OTP sent to ' + (d.masked_mobile || 'your mobile'));
    } else toast.error(result.fail);
    setSubmitting(false);
  };

  const handleUpdatePassword = async () => {
    if (!passwordForm.new_password || passwordForm.new_password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (passwordForm.new_password !== passwordForm.confirm_password) { toast.error('Passwords do not match'); return; }
    setSubmitting(true);
    const result = await superadminService.settings.updatePassword(passwordForm);
    if (result.success) {
      toast.success('Password updated');
      setPasswordStep(1);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '', otp: '' });
    } else toast.error(result.fail);
    setSubmitting(false);
  };

  const handleSaveWebhook = async () => {
    setSubmitting(true);
    const result = await superadminService.settings.saveWebhookSettings({
      webhook_url: webhook.webhook_url,
      webhook_enabled: String(webhook.webhook_enabled),
      webhook_secret: webhook.webhook_secret
    });
    if (result.success) toast.success('Webhook settings saved');
    else toast.error(result.fail);
    setSubmitting(false);
  };

  const handleTestWebhook = async () => {
    setSubmitting(true);
    setWebhookTestResult(null);
    const result = await superadminService.settings.testWebhook();
    if (result.success) {
      setWebhookTestResult(result.success.data.data);
      toast.info('Webhook test completed');
    } else toast.error(result.fail);
    setSubmitting(false);
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4" style={{ color: primaryColor, fontWeight: '700' }}>
        <i className="bi bi-gear me-2"></i>Settings
      </h2>

      <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
            {/* Profile Tab */}
            <Tab eventKey="profile" title={<><i className="bi bi-person me-1"></i>Profile</>}>
              <Row className="g-3" style={{ maxWidth: '600px' }}>
                <Col md={12}>
                  <Form.Group><Form.Label>Name</Form.Label>
                    <Form.Control value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group><Form.Label>Email</Form.Label>
                    <Form.Control type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group><Form.Label>Mobile</Form.Label>
                    <Form.Control value={profile.mobile} onChange={e => setProfile(p => ({ ...p, mobile: e.target.value }))} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }} onClick={handleUpdateProfile} disabled={submitting}>
                    {submitting ? <Spinner size="sm" /> : 'Save Profile'}
                  </Button>
                </Col>
              </Row>
            </Tab>

            {/* Password Tab */}
            <Tab eventKey="password" title={<><i className="bi bi-lock me-1"></i>Password</>}>
              <div style={{ maxWidth: '500px' }}>
                {passwordStep === 1 ? (
                  <>
                    <Form.Group className="mb-3"><Form.Label>Current Password</Form.Label>
                      <Form.Control type="password" value={passwordForm.current_password}
                        onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))} />
                    </Form.Group>
                    <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }} onClick={handleSendOtp} disabled={submitting}>
                      {submitting ? <Spinner size="sm" /> : 'Verify & Send OTP'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Alert variant="info">OTP sent to {maskedMobile}</Alert>
                    <Form.Group className="mb-3"><Form.Label>OTP</Form.Label>
                      <Form.Control value={passwordForm.otp} onChange={e => setPasswordForm(f => ({ ...f, otp: e.target.value }))} />
                    </Form.Group>
                    <Form.Group className="mb-3"><Form.Label>New Password (min 6 chars)</Form.Label>
                      <Form.Control type="password" value={passwordForm.new_password}
                        onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))} />
                    </Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Confirm Password</Form.Label>
                      <Form.Control type="password" value={passwordForm.confirm_password}
                        onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))} />
                    </Form.Group>
                    <div className="d-flex gap-2">
                      <Button variant="secondary" onClick={() => setPasswordStep(1)}>Back</Button>
                      <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }} onClick={handleUpdatePassword} disabled={submitting}>
                        {submitting ? <Spinner size="sm" /> : 'Update Password'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Tab>

            {/* Webhook Tab */}
            <Tab eventKey="webhook" title={<><i className="bi bi-link-45deg me-1"></i>Webhook</>}>
              <div style={{ maxWidth: '600px' }}>
                <Form.Group className="mb-3">
                  <Form.Label>Webhook URL</Form.Label>
                  <Form.Control value={webhook.webhook_url} onChange={e => setWebhook(w => ({ ...w, webhook_url: e.target.value }))} placeholder="https://..." />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check type="switch" label="Enable Webhook" checked={webhook.webhook_enabled}
                    onChange={e => setWebhook(w => ({ ...w, webhook_enabled: e.target.checked }))} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Secret Key (for HMAC-SHA256 signature)</Form.Label>
                  <Form.Control value={webhook.webhook_secret} onChange={e => setWebhook(w => ({ ...w, webhook_secret: e.target.value }))} placeholder="Optional" />
                </Form.Group>
                <div className="d-flex gap-2 mb-3">
                  <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: primaryContrast }} onClick={handleSaveWebhook} disabled={submitting}>
                    {submitting ? <Spinner size="sm" /> : 'Save'}
                  </Button>
                  <Button variant="outline-primary" onClick={handleTestWebhook} disabled={submitting || !webhook.webhook_url}>
                    {submitting ? <Spinner size="sm" /> : 'Test Webhook'}
                  </Button>
                </div>
                {webhookTestResult && (
                  <Alert variant={webhookTestResult.status_code >= 200 && webhookTestResult.status_code < 300 ? 'success' : 'warning'}>
                    <strong>Status: {webhookTestResult.status_code}</strong>
                    <pre className="mt-2 mb-0" style={{ fontSize: '12px', maxHeight: '150px', overflow: 'auto' }}>{webhookTestResult.response}</pre>
                  </Alert>
                )}
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Settings;
