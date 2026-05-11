import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Spinner, Badge, Alert, Row, Col } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const DeliveryZones = () => {
  const { primaryColor } = useTheme();
  const [searchParams] = useSearchParams();

  // Get branchId and branchName from URL params (for backward compatibility)
  const urlBranchId = searchParams.get('branchId');
  const urlBranchName = searchParams.get('branchName') ? decodeURIComponent(searchParams.get('branchName')) : '';

  const [deliveryZones, setDeliveryZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Restaurant and Branch state
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(urlBranchId || '');

  // Compute actual branchId (from selection or URL param for backward compat)
  const branchId = selectedBranchId || urlBranchId;
  const branchName = urlBranchName || (branches.find(b => String(b.id) === String(branchId))?.name || '');

  useEffect(() => {
    fetchRestaurants();
    fetchBranches();
    if (urlBranchId) fetchDeliveryZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch zones when branchId changes
  useEffect(() => {
    if (branchId && selectedBranchId) {
      fetchDeliveryZones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  // Filter branches by selected restaurant
  useEffect(() => {
    if (selectedRestaurantId) {
      const filtered = branches.filter(branch =>
        branch.parentId?.id === parseInt(selectedRestaurantId)
      );
      setFilteredBranches(filtered);
    } else {
      setFilteredBranches(branches);
    }
  }, [selectedRestaurantId, branches]);

  const fetchDeliveryZones = async () => {
    setLoading(true);
    try {
      const result = await ApiGet('/api/admin/delivery_zones/filter', {
        branchId: branchId,
        pageNumber: 0,
        pageSize: 1000
      });

      if (result.success) {
        const data = result.success.data.data;
        const zones = (data.records || []).map(zone => ({
          ...zone,
          _modified: false,
          _isNew: false
        }));
        setDeliveryZones(zones);
        setHasChanges(false);
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to fetch delivery zones');
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    setRestaurantsLoading(true);
    try {
      const result = await ApiGet('/api/admin/users/filter', {
        role: 'restaurant',
        pageNumber: 0,
        pageSize: 1000
      });
      if (result.success) {
        setRestaurants(result.success.data.data.records || []);
      }
    } catch (err) {
      // Silently fail
    } finally {
      setRestaurantsLoading(false);
    }
  };

  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const result = await ApiGet('/api/admin/users/filter', {
        role: 'branch',
        pageNumber: 0,
        pageSize: 1000
      });
      if (result.success) {
        const records = result.success.data.data.records || [];
        setBranches(records);
        setFilteredBranches(records);
      }
    } catch (err) {
      // Silently fail
    } finally {
      setBranchesLoading(false);
    }
  };

  const handleZoneChange = (index, field, value) => {
    setDeliveryZones(prev => {
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

  const addNewZone = () => {
    const newZone = {
      zoneName: '',
      description: '',
      radiusKmFrom: 0,
      radiusKmTo: 5,
      deliveryCharge: 0,
      isActive: true,
      _modified: true,
      _isNew: true
    };
    setDeliveryZones(prev => [...prev, newZone]);
    setHasChanges(true);
  };

  const removeZone = (index) => {
    const zone = deliveryZones[index];
    if (zone._isNew) {
      // Just remove from list if it's a new unsaved zone
      setDeliveryZones(prev => prev.filter((_, i) => i !== index));
    } else {
      // Mark as inactive for existing zones
      handleZoneChange(index, 'isActive', false);
    }
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    // Validate zones
    const errors = [];
    deliveryZones.forEach((zone, index) => {
      const radiusFrom = parseFloat(zone.radiusKmFrom) || 0;
      const radiusTo = parseFloat(zone.radiusKmTo) || 0;
      const deliveryCharge = parseFloat(zone.deliveryCharge) || 0;

      if (!zone.zoneName?.trim()) {
        errors.push(`Zone ${index + 1}: Zone name is required`);
      }
      if (radiusFrom < 0) {
        errors.push(`Zone ${index + 1}: Radius From must be 0 or greater`);
      }
      if (radiusTo < 0) {
        errors.push(`Zone ${index + 1}: Radius To must be 0 or greater`);
      }
      if (radiusFrom > radiusTo) {
        errors.push(`Zone ${index + 1}: Radius From cannot be greater than Radius To`);
      }
      if (deliveryCharge < 0) {
        errors.push(`Zone ${index + 1}: Delivery charge must be 0 or greater`);
      }
    });

    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    const modifiedZones = deliveryZones.filter(zone => zone._modified);

    if (modifiedZones.length === 0) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);
    try {
      const payload = modifiedZones.map(zone => ({
        ...(zone.id && { id: zone.id }),
        branchId: { id: parseInt(branchId) },
        zoneName: zone.zoneName?.trim(),
        description: zone.description?.trim() || '',
        radiusKmFrom: parseFloat(zone.radiusKmFrom) || 0,
        radiusKmTo: parseFloat(zone.radiusKmTo) || 0,
        deliveryCharge: parseFloat(zone.deliveryCharge) || 0,
        isActive: zone.isActive
      }));

      const result = await ApiPost('/api/admin/delivery_zones/bulkUpdate', payload);

      if (result.success) {
        toast.success(`${modifiedZones.length} zone(s) saved successfully`);
        fetchDeliveryZones();
      } else {
        toast.error(result.fail || 'Failed to save zones');
      }
    } catch (err) {
      toast.error('Failed to save delivery zones');
    } finally {
      setSaving(false);
    }
  };

  const blockWheelChange = (e) => {
    e.preventDefault();
    e.currentTarget.blur();
  };

  return (
    <Container fluid className="py-2">
      {/* Header with Restaurant + Branch Selection */}
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: '12px' }}>
          <i className="fas fa-map-marker-alt me-2"></i>
          Delivery Zones
        </h2>
        <Row className="mb-3 align-items-center">
          <Col md={3}>
            <Select
              options={restaurants.map(r => ({ value: r.id, label: r.name }))}
              value={selectedRestaurantId ? {
                value: Number(selectedRestaurantId),
                label: restaurants.find(r => r.id === Number(selectedRestaurantId))?.name || ''
              } : null}
              onChange={(selected) => {
                setSelectedRestaurantId(selected ? selected.value : '');
                setSelectedBranchId('');
                setDeliveryZones([]);
                setHasChanges(false);
              }}
              isClearable
              isSearchable
              isLoading={restaurantsLoading}
              placeholder="Select Restaurant"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                control: (base) => ({ ...base, height: '42px', minHeight: '42px' }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }}
            />
          </Col>
          <Col md={3}>
            <Select
              options={filteredBranches.map(b => ({ value: b.id, label: b.name }))}
              value={branchId ? {
                value: Number(branchId),
                label: filteredBranches.find(b => b.id === Number(branchId))?.name || branchName || ''
              } : null}
              onChange={(selected) => {
                setSelectedBranchId(selected ? selected.value : '');
                setDeliveryZones([]);
                setHasChanges(false);
              }}
              isClearable
              isSearchable
              isLoading={branchesLoading}
              isDisabled={!selectedRestaurantId}
              placeholder={selectedRestaurantId ? "Select Branch" : "Select Restaurant first"}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={{
                control: (base) => ({ ...base, height: '42px', minHeight: '42px' }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }}
            />
          </Col>
          <Col md={6} className="d-flex justify-content-end gap-2">
            <Button
              variant="outline-success"
              onClick={addNewZone}
              disabled={saving || !branchId}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Add Zone
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
          </Col>
        </Row>
        <small className="text-muted">Manage delivery zones and charges for this branch.</small>
      </div>

      {/* No Branch Warning */}
      {!branchId && (
        <Alert variant="warning" className="mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          <strong>No branch selected.</strong> Please select a Restaurant and Branch above to manage delivery zones.
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

      {/* Table */}
      <div className="table-responsive">
        <Table striped bordered hover className="modern-table" style={{ fontSize: '0.9rem' }}>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th style={{ width: '150px' }}>Zone Name <span className="text-danger">*</span></th>
              <th style={{ width: '180px' }}>Description</th>
              <th style={{ width: '100px' }}>Radius From (KM)</th>
              <th style={{ width: '100px' }}>Radius To (KM)</th>
              <th style={{ width: '120px' }}>Delivery Charge</th>
              <th style={{ width: '80px' }}>Active</th>
              <th style={{ width: '80px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={5} columns={8} />
            ) : !branchId ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  <i className="fas fa-info-circle me-2"></i>
                  Select a branch to view delivery zones
                </td>
              </tr>
            ) : deliveryZones.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No delivery zones found. Click "Add Zone" to create one.
                </td>
              </tr>
            ) : (
              deliveryZones.map((zone, index) => (
                <tr
                  key={zone.id || `new-${index}`}
                  style={{
                    backgroundColor: zone._modified ? '#fff3cd' : 'inherit',
                    opacity: zone.isActive === false ? 0.6 : 1
                  }}
                >
                  <td>
                    <strong>{index + 1}</strong>
                    {zone._isNew && <Badge bg="success" className="ms-1" style={{ fontSize: '0.65rem' }}>New</Badge>}
                  </td>
                  <td>
                    <Form.Control
                      type="text"
                      size="sm"
                      value={zone.zoneName || ''}
                      onChange={(e) => handleZoneChange(index, 'zoneName', e.target.value)}
                      placeholder="Zone name"
                      disabled={!zone.isActive}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="text"
                      size="sm"
                      value={zone.description || ''}
                      onChange={(e) => handleZoneChange(index, 'description', e.target.value)}
                      placeholder="Description"
                      disabled={!zone.isActive}
                    />
                  </td>
                  <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        step="0.1"
                        value={zone.radiusKmFrom ?? 0}
                        onWheel={blockWheelChange}
                        onChange={(e) => handleZoneChange(index, 'radiusKmFrom', e.target.value)}
                        min="0"
                        disabled={!zone.isActive}
                      />
                  </td>
                  <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        step="0.1"
                        value={zone.radiusKmTo ?? 0}
                        onWheel={blockWheelChange}
                        onChange={(e) => handleZoneChange(index, 'radiusKmTo', e.target.value)}
                        min="0"
                        disabled={!zone.isActive}
                      />
                  </td>
                  <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        step="0.01"
                        value={zone.deliveryCharge ?? 0}
                        onWheel={blockWheelChange}
                        onChange={(e) => handleZoneChange(index, 'deliveryCharge', e.target.value)}
                        min="0"
                        disabled={!zone.isActive}
                      />
                  </td>
                  <td className="text-center">
                    <Form.Check
                      type="switch"
                      checked={zone.isActive ?? true}
                      onChange={(e) => handleZoneChange(index, 'isActive', e.target.checked)}
                    />
                  </td>
                  <td className="text-center">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeZone(index)}
                      title={zone._isNew ? "Remove" : "Deactivate"}
                    >
                      <i className={`bi bi-${zone._isNew ? 'x-lg' : 'trash'}`}></i>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Footer Info */}
      <div className="mt-3">
        <small className="text-muted">
          Total zones: {deliveryZones.length} | Active: {deliveryZones.filter(z => z.isActive).length} | Modified: {deliveryZones.filter(z => z._modified).length}
        </small>
      </div>
    </Container>
  );
};

export default DeliveryZones;
