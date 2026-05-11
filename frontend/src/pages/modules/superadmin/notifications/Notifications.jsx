import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Modal, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Select from 'react-select';
import superadminService from '../../../../services/superadminService';

const primaryColor = '#3B82F6';

const Notifications = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);
  const [restaurantOptions, setRestaurantOptions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  // Load restaurants for dropdown
  useEffect(() => {
    const loadRestaurants = async () => {
      // In mock, we can hardcode this or fetch from an endpoint
      const mockRestaurants = [
        { value: 101, label: 'RMS Central' },
        { value: 102, label: 'RMS Express' },
        { value: 103, label: 'Spice Garden' },
        { value: 104, label: 'Pizza Hub' }
      ];
      setRestaurantOptions(mockRestaurants);
    };
    loadRestaurants();
  }, []);

  // Load history
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const result = await superadminService.notifications.getHistory({ page: 0, size: 20 });
      if (result.success) {
        const raw = result.success.data.data;
        setHistory(Array.isArray(raw) ? raw : (raw?.records || []));
      }
    } catch (error) {
      toast.error('Error loading history');
    }
    setHistoryLoading(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in title and message');
      return;
    }

    if (target === 'specific' && selectedRestaurants.length === 0) {
      toast.error('Please select at least one restaurant');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title,
        message,
        target,
        restaurantIds: target === 'specific' ? selectedRestaurants.map(r => r.value) : null,
        scheduledAt: scheduleEnabled && scheduledAt ? scheduledAt : null
      };

      const result = await superadminService.notifications.send(payload);

      if (result.success) {
        const isScheduled = scheduleEnabled && scheduledAt;
        toast.success(isScheduled ? 'Notification scheduled successfully!' : 'Notification sent successfully!');
        setTitle('');
        setMessage('');
        setTarget('all');
        setSelectedRestaurants([]);
        setScheduleEnabled(false);
        setScheduledAt('');
        fetchHistory();
      } else {
        toast.error(result.fail || 'Failed to send notification');
      }
    } catch (error) {
      toast.error('Error sending notification');
    }
    setLoading(false);
  };

  const getTargetLabel = (target) => {
    return target === 'all' ? 'All Restaurants' : 'Specific Restaurants';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'scheduled': return 'info';
      case 'pending':   return 'warning';
      case 'failed':    return 'danger';
      default:          return 'secondary';
    }
  };

  const getStatusLabel = (item) => {
    if (item.status === 'scheduled') return `⏰ Scheduled: ${new Date(item.scheduledAt).toLocaleString()}`;
    if (item.status === 'delivered') return '✓ Delivered';
    return item.status;
  };

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4" style={{ color: primaryColor, fontWeight: '700' }}>
        <i className="bi bi-bell me-2"></i>Notifications & Broadcast
      </h2>

      <Row className="g-4">
        {/* Compose Section */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body>
              <h5 className="mb-4" style={{ color: primaryColor, fontWeight: '600' }}>
                <i className="bi bi-pencil-square me-2"></i>Send Notification
              </h5>

              <Form onSubmit={handleSend}>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    placeholder="Notification title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Notification message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Send To</Form.Label>
                  <Form.Select
                    value={target}
                    onChange={(e) => {
                      setTarget(e.target.value);
                      setSelectedRestaurants([]);
                    }}
                  >
                    <option value="all">All Restaurants</option>
                    <option value="specific">Specific Restaurants</option>
                  </Form.Select>
                </Form.Group>

                {target === 'specific' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Select Restaurants</Form.Label>
                    <Select
                      isMulti
                      options={restaurantOptions}
                      value={selectedRestaurants}
                      onChange={setSelectedRestaurants}
                      placeholder="Choose restaurants..."
                      styles={{
                        control: (base) => ({ ...base, borderColor: '#e5e7eb' }),
                        option: (base) => ({ ...base, ':hover': { backgroundColor: `${primaryColor}15` } })
                      }}
                    />
                  </Form.Group>
                )}

                {/* Schedule toggle */}
                <Form.Group className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Form.Check
                      type="switch"
                      id="schedule-toggle"
                      checked={scheduleEnabled}
                      onChange={(e) => { setScheduleEnabled(e.target.checked); if (!e.target.checked) setScheduledAt(''); }}
                    />
                    <Form.Label htmlFor="schedule-toggle" className="mb-0" style={{ cursor: 'pointer', fontWeight: 500 }}>
                      <i className="bi bi-calendar-event me-1"></i>Schedule for later
                    </Form.Label>
                  </div>
                  {scheduleEnabled && (
                    <Form.Control
                      type="datetime-local"
                      value={scheduledAt}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                  )}
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      {scheduleEnabled ? 'Scheduling...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <i className={`bi ${scheduleEnabled ? 'bi-calendar-check' : 'bi-send'} me-2`}></i>
                      {scheduleEnabled ? 'Schedule Notification' : 'Send Now'}
                    </>
                  )}
                </Button>
              </Form>

              <div className="mt-4 p-3 rounded" style={{ background: '#f0f9ff', borderLeft: `4px solid ${primaryColor}` }}>
                <small className="text-muted">
                  <i className="bi bi-info-circle me-2"></i>
                  Push notifications will be sent via FCM to restaurant apps.
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* History Section */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body>
              <h5 className="mb-4" style={{ color: primaryColor, fontWeight: '600' }}>
                <i className="bi bi-clock-history me-2"></i>Broadcast History
              </h5>

              {historyLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                </div>
              ) : history.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {history.map((item, i) => (
                    <div key={i} className="mb-3 p-3 rounded" style={{ background: '#f8fafc', borderLeft: `4px solid ${primaryColor}` }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <strong>{item.title}</strong>
                        <Badge bg={getStatusColor(item.status)}>
                          {getStatusLabel(item)}
                        </Badge>
                      </div>
                      <small className="text-muted d-block mb-2">{item.message}</small>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          Target: {getTargetLabel(item.target)}
                        </small>
                        <small className="text-muted">
                          {item.sentAt ? `${new Date(item.sentAt).toLocaleDateString()} ${new Date(item.sentAt).toLocaleTimeString()}` : '—'}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                  No notifications sent yet
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Full History Table */}
      <Card className="border-0 shadow-sm mt-4" style={{ borderRadius: '16px' }}>
        <Card.Body>
          <h5 className="mb-3" style={{ color: primaryColor, fontWeight: '600' }}>
            <i className="bi bi-list me-2"></i>All Notifications
          </h5>

          {historyLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" size="sm" />
            </div>
          ) : history.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <Table hover responsive className="mb-0">
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th>Title</th>
                    <th>Message</th>
                    <th>Target</th>
                    <th>Sent At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, i) => (
                    <tr key={i}>
                      <td><strong>{item.title}</strong></td>
                      <td><small>{item.message.substring(0, 50)}...</small></td>
                      <td><Badge bg="light" text="dark">{getTargetLabel(item.target)}</Badge></td>
                      <td><small>{new Date(item.sentAt).toLocaleString()}</small></td>
                      <td>
                        <Badge bg={getStatusColor(item.status)}>
                          {getStatusLabel(item)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              No notifications yet
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Notifications;
