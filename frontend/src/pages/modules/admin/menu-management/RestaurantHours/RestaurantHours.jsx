import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Spinner, Badge, Alert } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ApiGet, ApiPut } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import '../../../../../styles/tables.css';

const RestaurantHours = () => {
  const { primaryColor } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get branchId, branchName and restaurantId from URL params
  const branchId = searchParams.get('branchId');
  const branchName = searchParams.get('branchName') ? decodeURIComponent(searchParams.get('branchName')) : '';
  const restaurantId = searchParams.get('restaurantId');

  const [weeklyHours, setWeeklyHours] = useState([]);
  const [specialDays, setSpecialDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const daysOfWeek = [
    { value: 'sunday', label: 'Sunday' },
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' }
  ];

  useEffect(() => {
    if (branchId) {
      fetchRestaurantHours();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const fetchRestaurantHours = async () => {
    setLoading(true);
    try {
      const result = await ApiGet('/api/admin/restaurant_hours/branchId', {
        id: branchId
      });

      if (result.success) {
        const data = result.success.data.data || [];

        // Separate weekly hours and special days
        const weekly = data
          .filter(hour => hour.dayOfWeek)
          .map(hour => ({
            ...hour,
            openingTime: hour.openingTime ? hour.openingTime.substring(0, 5) : '',
            closingTime: hour.closingTime ? hour.closingTime.substring(0, 5) : '',
            _modified: false,
            _isNew: false
          }));

        const special = data
          .filter(hour => hour.specialDate)
          .map(hour => ({
            ...hour,
            occasionName: hour.occasionName || '',
            openingTime: hour.openingTime ? hour.openingTime.substring(0, 5) : '',
            closingTime: hour.closingTime ? hour.closingTime.substring(0, 5) : '',
            _modified: false,
            _isNew: false
          }));

        setWeeklyHours(weekly);
        setSpecialDays(special);
        setHasChanges(false);
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to fetch restaurant hours');
    } finally {
      setLoading(false);
    }
  };

  const formatDayLabel = (day) => {
    const found = daysOfWeek.find(d => d.value === day);
    return found ? found.label : day;
  };

  // Handle weekly hour field change
  const handleWeeklyChange = (index, field, value) => {
    setWeeklyHours(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
        _modified: true
      };
      return updated;
    });
    setHasChanges(true);
  };

  // Handle special day field change
  const handleSpecialChange = (index, field, value) => {
    setSpecialDays(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
        _modified: true
      };
      return updated;
    });
    setHasChanges(true);
  };

  // Add new weekly hour
  const addWeeklyHour = () => {
    const newHour = {
      dayOfWeek: 'monday',
      openingTime: '09:00',
      closingTime: '22:00',
      isClosed: false,
      _modified: true,
      _isNew: true
    };
    setWeeklyHours(prev => [...prev, newHour]);
    setHasChanges(true);
  };

  // Add new special day
  const addSpecialDay = () => {
    const newDay = {
      specialDate: new Date().toISOString().split('T')[0],
      occasionName: '',
      openingTime: '09:00',
      closingTime: '22:00',
      isClosed: false,
      _modified: true,
      _isNew: true
    };
    setSpecialDays(prev => [...prev, newDay]);
    setHasChanges(true);
  };

  // Save all changes
  const handleSaveAll = async () => {
    const modifiedWeekly = weeklyHours.filter(h => h._modified);
    const modifiedSpecial = specialDays.filter(h => h._modified);

    if (modifiedWeekly.length === 0 && modifiedSpecial.length === 0) {
      toast.info('No changes to save');
      return;
    }

    // Validate
    const errors = [];
    weeklyHours.forEach((hour, index) => {
      if (!hour.isClosed && (!hour.openingTime || !hour.closingTime)) {
        errors.push(`Weekly ${formatDayLabel(hour.dayOfWeek)}: Opening and closing time required`);
      }
    });
    specialDays.forEach((hour, index) => {
      if (!hour.isClosed && (!hour.openingTime || !hour.closingTime)) {
        errors.push(`Special ${hour.specialDate}: Opening and closing time required`);
      }
    });

    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    setSaving(true);
    try {
      const payload = [];

      // Add modified weekly hours
      modifiedWeekly.forEach(hour => {
        payload.push({
          ...(hour.id && { id: hour.id }),
          restaurantId: { id: parseInt(restaurantId) },
          branchId: { id: parseInt(branchId) },
          dayOfWeek: hour.dayOfWeek,
          openingTime: hour.openingTime || '00:00',
          closingTime: hour.closingTime || '00:00',
          isClosed: hour.isClosed
        });
      });

      // Add modified special days
      modifiedSpecial.forEach(hour => {
        payload.push({
          ...(hour.id && { id: hour.id }),
          restaurantId: { id: parseInt(restaurantId) },
          branchId: { id: parseInt(branchId) },
          specialDate: hour.specialDate,
          occasionName: hour.occasionName?.trim() || '',
          openingTime: hour.openingTime || '00:00',
          closingTime: hour.closingTime || '00:00',
          isClosed: hour.isClosed
        });
      });

      const result = await ApiPut('/api/admin/restaurant_hours/bulkAdd', payload);

      if (result.success) {
        toast.success('All changes saved successfully');
        fetchRestaurantHours();
      } else {
        toast.error(result.fail || 'Failed to save changes');
      }
    } catch (err) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    navigate('/superadmin/user-management/branches');
  };

  return (
    <Container fluid className="py-2">
      {/* Header with Branch Info */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleGoBack}
              title="Back to Branches"
            >
              <i className="bi bi-arrow-left"></i>
            </Button>
            <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
              <i className="fas fa-clock me-2"></i>
              Restaurant Hours
            </h2>
          </div>
          {branchId && (
            <Alert variant="info" className="py-2 px-3 mb-0 mt-2 d-inline-block">
              <i className="bi bi-building me-2"></i>
              <strong>Branch:</strong> {branchName || `ID: ${branchId}`}
            </Alert>
          )}
          <div className="mt-2">
            <small className="text-muted">Manage opening and closing hours for this branch.</small>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-success"
            onClick={addWeeklyHour}
            disabled={saving || !branchId}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Add Day
          </Button>
          <Button
            variant="outline-info"
            onClick={addSpecialDay}
            disabled={saving || !branchId}
          >
            <i className="bi bi-calendar-plus me-2"></i>
            Add Special Date
          </Button>
          <Button
            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
            onClick={handleSaveAll}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" style={{ width: '1rem', height: '1rem' }} className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-all me-2"></i>
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* No Branch Warning */}
      {!branchId && (
        <Alert variant="warning" className="mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          <strong>No branch selected.</strong> Please select a branch from the
          <Button variant="link" className="p-0 ms-1" onClick={handleGoBack}>
            Branches page
          </Button> to manage restaurant hours.
        </Alert>
      )}

      {/* Status Badge */}
      {hasChanges && (
        <div className="mb-3">
          <Badge bg="warning" className="py-2 px-3">
            <i className="bi bi-exclamation-triangle me-1"></i>
            Unsaved changes
          </Badge>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <div className="mt-2">Loading restaurant hours...</div>
        </div>
      ) : branchId && (
        <>
          {/* Weekly Operating Hours Section */}
          <div className="mb-4">
            <h5 className="mb-3" style={{ color: primaryColor, fontWeight: '600' }}>
              <i className="fas fa-calendar-week me-2"></i>
              Weekly Operating Hours
            </h5>
            <div className="table-responsive">
              <Table striped bordered hover className="modern-table" style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th style={{ width: '180px' }}>Day of Week <span className="text-danger">*</span></th>
                    <th style={{ width: '150px' }}>Opening Time</th>
                    <th style={{ width: '150px' }}>Closing Time</th>
                    <th style={{ width: '100px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyHours.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        <i className="fas fa-inbox me-2"></i>
                        No weekly hours found. Click "Add Day" to create one.
                      </td>
                    </tr>
                  ) : (
                    weeklyHours.map((hour, index) => (
                      <tr
                        key={hour.id || `new-${index}`}
                        style={{
                          backgroundColor: hour._modified ? '#fff3cd' : 'inherit',
                          opacity: hour.isClosed ? 0.6 : 1
                        }}
                      >
                        <td>
                          <strong>{index + 1}</strong>
                          {hour._isNew && <Badge bg="success" className="ms-1" style={{ fontSize: '0.65rem' }}>New</Badge>}
                        </td>
                        <td>
                          <Form.Select
                            size="sm"
                            value={hour.dayOfWeek || ''}
                            onChange={(e) => handleWeeklyChange(index, 'dayOfWeek', e.target.value)}
                            disabled={hour.isClosed}
                          >
                            {daysOfWeek.map(day => (
                              <option key={day.value} value={day.value}>{day.label}</option>
                            ))}
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control
                            type="time"
                            size="sm"
                            value={hour.openingTime || ''}
                            onChange={(e) => handleWeeklyChange(index, 'openingTime', e.target.value)}
                            disabled={hour.isClosed}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="time"
                            size="sm"
                            value={hour.closingTime || ''}
                            onChange={(e) => handleWeeklyChange(index, 'closingTime', e.target.value)}
                            disabled={hour.isClosed}
                          />
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <Form.Check
                              type="switch"
                              checked={!hour.isClosed}
                              onChange={(e) => handleWeeklyChange(index, 'isClosed', !e.target.checked)}
                            />
                            {hour.isClosed ? (
                              <Badge bg="danger">Closed</Badge>
                            ) : (
                              <Badge bg="success">Open</Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </div>

          {/* Special Days & Holidays Section */}
          <div className="mb-4">
            <h5 className="mb-1" style={{ color: primaryColor, fontWeight: '600' }}>
              <i className="fas fa-calendar-alt me-2"></i>
              Special Days & Holidays
            </h5>
            <small className="text-muted d-block mb-3">
              Override normal operating hours for specific dates (holidays, special events, etc.)
            </small>
            <div className="table-responsive">
              <Table striped bordered hover className="modern-table" style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th style={{ width: '180px' }}>Occasion / Holiday</th>
                    <th style={{ width: '180px' }}>Date <span className="text-danger">*</span></th>
                    <th style={{ width: '150px' }}>Opening Time</th>
                    <th style={{ width: '150px' }}>Closing Time</th>
                    <th style={{ width: '100px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {specialDays.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        <i className="fas fa-inbox me-2"></i>
                        No special days found. Click "Add Special Date" to create one.
                      </td>
                    </tr>
                  ) : (
                    specialDays.map((hour, index) => (
                      <tr
                        key={hour.id || `new-${index}`}
                        style={{
                          backgroundColor: hour._modified ? '#fff3cd' : 'inherit',
                          opacity: hour.isClosed ? 0.6 : 1
                        }}
                      >
                        <td>
                          <strong>{index + 1}</strong>
                          {hour._isNew && <Badge bg="success" className="ms-1" style={{ fontSize: '0.65rem' }}>New</Badge>}
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            size="sm"
                            placeholder="Eid / Holiday / Event"
                            value={hour.occasionName || ''}
                            onChange={(e) => handleSpecialChange(index, 'occasionName', e.target.value)}
                            disabled={hour.isClosed}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="date"
                            size="sm"
                            value={hour.specialDate || ''}
                            onChange={(e) => handleSpecialChange(index, 'specialDate', e.target.value)}
                            disabled={hour.isClosed}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="time"
                            size="sm"
                            value={hour.openingTime || ''}
                            onChange={(e) => handleSpecialChange(index, 'openingTime', e.target.value)}
                            disabled={hour.isClosed}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="time"
                            size="sm"
                            value={hour.closingTime || ''}
                            onChange={(e) => handleSpecialChange(index, 'closingTime', e.target.value)}
                            disabled={hour.isClosed}
                          />
                        </td>
                        <td className="text-center">
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <Form.Check
                              type="switch"
                              checked={!hour.isClosed}
                              onChange={(e) => handleSpecialChange(index, 'isClosed', !e.target.checked)}
                            />
                            {hour.isClosed ? (
                              <Badge bg="danger">Closed</Badge>
                            ) : (
                              <Badge bg="success">Open</Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-3">
            <small className="text-muted">
              Weekly: {weeklyHours.length} | Special Days: {specialDays.length} | Modified: {weeklyHours.filter(h => h._modified).length + specialDays.filter(h => h._modified).length}
            </small>
          </div>
        </>
      )}
    </Container>
  );
};

export default RestaurantHours;
