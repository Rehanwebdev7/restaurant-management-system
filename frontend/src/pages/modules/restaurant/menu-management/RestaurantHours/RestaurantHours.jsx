import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Spinner, Badge, Alert } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ApiGet, ApiPut } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import '../../../../../styles/tables.css';

// Custom 12-hour Time Picker Component
const TimePicker12Hour = ({ value, onChange, disabled }) => {
  // Convert 24-hour format (HH:MM) to 12-hour format
  const convertTo12Hour = (time24) => {
    if (!time24) return { hour: '12', minute: '00', period: 'AM' };
    const [hours, minutes] = time24.split(':');
    let hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return {
      hour: String(hour).padStart(2, '0'),
      minute: minutes || '00',
      period
    };
  };

  // Convert 12-hour format to 24-hour format (HH:MM)
  const convertTo24Hour = (hour, minute, period) => {
    let h = parseInt(hour, 10);
    if (period === 'AM') {
      h = h === 12 ? 0 : h;
    } else {
      h = h === 12 ? 12 : h + 12;
    }
    return `${String(h).padStart(2, '0')}:${minute}`;
  };

  const { hour, minute, period } = convertTo12Hour(value);

  const handleChange = (field, newValue) => {
    let newHour = hour;
    let newMinute = minute;
    let newPeriod = period;

    if (field === 'hour') newHour = newValue;
    if (field === 'minute') newMinute = newValue;
    if (field === 'period') newPeriod = newValue;

    const time24 = convertTo24Hour(newHour, newMinute, newPeriod);
    onChange(time24);
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
      <Form.Select
        size="sm"
        value={hour}
        onChange={(e) => handleChange('hour', e.target.value)}
        disabled={disabled}
        style={{ width: '60px', padding: '4px 6px', fontSize: '13px', minWidth: '50px' }}
      >
        {hours.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </Form.Select>
      <span style={{ fontWeight: '600' }}>:</span>
      <Form.Select
        size="sm"
        value={minute}
        onChange={(e) => handleChange('minute', e.target.value)}
        disabled={disabled}
        style={{ width: '60px', padding: '4px 6px', fontSize: '13px', minWidth: '50px' }}
      >
        {minutes.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </Form.Select>
      <Form.Select
        size="sm"
        value={period}
        onChange={(e) => handleChange('period', e.target.value)}
        disabled={disabled}
        style={{ width: '62px', padding: '4px 6px', fontSize: '13px', minWidth: '55px', fontWeight: '500' }}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </Form.Select>
    </div>
  );
};

const RestaurantHours = ({ branchIdProp, restaurantIdProp, branchNameProp, embedded = false }) => {
  const { primaryColor } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Use props if provided (embedded mode), otherwise fall back to URL params
  const branchId = branchIdProp || searchParams.get('branchId');
  const branchName = branchNameProp || (searchParams.get('branchName') ? decodeURIComponent(searchParams.get('branchName')) : '');
  const restaurantId = restaurantIdProp || searchParams.get('restaurantId');

  const [weeklyHours, setWeeklyHours] = useState([]);
  const [specialDays, setSpecialDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // Determine active branch from URL params or selected branch
  const activeBranchId = branchId || selectedBranch?.id;
  const activeBranchName = branchName || selectedBranch?.name;

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
    fetchBranches();
  }, []);

  useEffect(() => {
    if (activeBranchId) {
      setHasChanges(false);
      fetchRestaurantHours();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId]);

  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const result = await ApiGet('/api/restaurant/users/filter', {
        role: 'branch',
        pageNumber: 0,
        pageSize: 1000
      });
      if (result.success) {
        const data = result.success.data.data;
        setBranches(data.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchRestaurantHours = async () => {
    setLoading(true);
    try {
      const result = await ApiGet('/api/restaurant/restaurant_hours/branchId', {
        id: activeBranchId
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
          branchId: { id: parseInt(activeBranchId) },
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
          branchId: { id: parseInt(activeBranchId) },
          specialDate: hour.specialDate,
          occasionName: hour.occasionName?.trim() || '',
          openingTime: hour.openingTime || '00:00',
          closingTime: hour.closingTime || '00:00',
          isClosed: hour.isClosed
        });
      });

      const result = await ApiPut('/api/restaurant/restaurant_hours/bulkAdd', payload);

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
    navigate('/restaurant/user-management/branches');
  };

  const Wrapper = embedded ? React.Fragment : Container;
  const wrapperProps = embedded ? {} : { fluid: true, className: 'py-2' };

  return (
    <Wrapper {...wrapperProps}>
      {/* Header with Branch Info — hidden in embedded mode */}
      {!embedded && (
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
            {activeBranchId && (
              <Alert variant="info" className="py-2 px-3 mb-0 mt-2 d-inline-block">
                <i className="bi bi-building me-2"></i>
                <strong>Branch:</strong> {activeBranchName || `ID: ${activeBranchId}`}
              </Alert>
            )}
            {!branchId && !embedded && (
              <div className="mt-3">
                <Form.Group style={{ maxWidth: '300px' }}>
                  <Form.Label className="mb-2">Select Branch</Form.Label>
                  <Form.Select
                    value={selectedBranch?.id || ''}
                    onChange={(e) => {
                      const selected = branches.find(b => b.id === parseInt(e.target.value));
                      setSelectedBranch(selected);
                    }}
                    disabled={branchesLoading}
                  >
                    <option value="">-- Choose a Branch --</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            )}
            <div className="mt-2">
              <small className="text-muted">Manage opening and closing hours for this branch.</small>
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-success"
              onClick={addWeeklyHour}
              disabled={saving || !activeBranchId}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Add Day
            </Button>
            <Button
              variant="outline-info"
              onClick={addSpecialDay}
              disabled={saving || !activeBranchId}
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
      )}

      {/* Embedded mode action bar */}
      {embedded && (
        <div className="mb-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <small className="text-muted">Manage opening and closing hours for this branch.</small>
            {hasChanges && (
              <Badge bg="warning" className="py-1 px-2">
                <i className="bi bi-exclamation-triangle me-1"></i>Unsaved
              </Badge>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button size="sm" variant="outline-success" onClick={addWeeklyHour} disabled={saving || !activeBranchId}>
              <i className="bi bi-plus-lg me-1"></i>Add Day
            </Button>
            <Button size="sm" variant="outline-info" onClick={addSpecialDay} disabled={saving || !activeBranchId}>
              <i className="bi bi-calendar-plus me-1"></i>Add Special Date
            </Button>
            <Button size="sm" style={{ backgroundColor: primaryColor, borderColor: primaryColor, color: '#fff' }} onClick={handleSaveAll} disabled={saving || !hasChanges}>
              {saving ? <><Spinner animation="border" size="sm" style={{ width: '0.8rem', height: '0.8rem' }} className="me-1" />Saving...</> : <><i className="bi bi-check-all me-1"></i>Save</>}
            </Button>
          </div>
        </div>
      )}

      {/* No Branch Warning — hidden in embedded mode */}
      {!embedded && !activeBranchId && (
        <Alert variant="info" className="mb-4">
          <i className="bi bi-info-circle me-2"></i>
          Select a branch from the dropdown above to manage restaurant hours.
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
      ) : activeBranchId && (
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
                    <th style={{ width: '200px', textAlign: 'center' }}>Opening Time</th>
                    <th style={{ width: '200px', textAlign: 'center' }}>Closing Time</th>
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
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <TimePicker12Hour
                            value={hour.openingTime || ''}
                            onChange={(value) => handleWeeklyChange(index, 'openingTime', value)}
                            disabled={hour.isClosed}
                          />
                        </td>
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <TimePicker12Hour
                            value={hour.closingTime || ''}
                            onChange={(value) => handleWeeklyChange(index, 'closingTime', value)}
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
                    <th style={{ width: '200px', textAlign: 'center' }}>Opening Time</th>
                    <th style={{ width: '200px', textAlign: 'center' }}>Closing Time</th>
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
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <TimePicker12Hour
                            value={hour.openingTime || ''}
                            onChange={(value) => handleSpecialChange(index, 'openingTime', value)}
                            disabled={hour.isClosed}
                          />
                        </td>
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <TimePicker12Hour
                            value={hour.closingTime || ''}
                            onChange={(value) => handleSpecialChange(index, 'closingTime', value)}
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
    </Wrapper>
  );
};

export default RestaurantHours;
