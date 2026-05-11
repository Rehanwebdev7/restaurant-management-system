import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Row, Col, Spinner, Badge, InputGroup, Alert, Pagination } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { ApiGet, ApiPut } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import '../../../../../styles/tables.css';

const MenuItemsBulkUpdate = () => {
  const { primaryColor } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get branchId and branchName from URL params
  const urlBranchId = searchParams.get('branchId');
  const urlBranchName = searchParams.get('branchName') ? decodeURIComponent(searchParams.get('branchName')) : '';

  const [menuItems, setMenuItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(urlBranchId || '');
  const branchId = selectedBranchId || urlBranchId;
  const branchName = urlBranchName || (branches.find(b => String(b.id) === String(branchId))?.name || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Dietary type options - Veg (true) / Non-Veg (false)
  const dietaryTypeOptions = [
    { value: 'true', label: 'Veg' },
    { value: 'false', label: 'Non-Veg' }
  ];

  // Spice level options
  const spiceLevelOptions = [
    { value: 'MILD', label: 'Mild' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HOT', label: 'Hot' },
    { value: 'EXTRA_HOT', label: 'Extra Hot' }
  ];

  useEffect(() => {
    fetchRestaurants();
    fetchBranches();
  }, []);

  // Filter branches based on selected restaurant
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

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  // Fetch menu items when page, rowsPerPage, branchId, or categoryFilter changes
  useEffect(() => {
    fetchMenuItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, branchId, categoryFilter]);

  // Debounced search - reset to page 1 on search change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchMenuItems();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchRestaurants = async () => {
    setRestaurantsLoading(true);
    try {
      const result = await ApiGet('/api/admin/users/filter', {
        role: 'restaurant',
        pageNumber: 0,
        pageSize: 1000
      });
      if (result.success) {
        const data = result.success.data.data;
        setRestaurants(data.records || []);
      }
    } catch (err) {
      toast.error('Failed to fetch restaurants');
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
        const data = result.success.data.data;
        setBranches(data.records || []);
      }
    } catch (err) {
      toast.error('Failed to fetch branches');
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const params = {
        pageNumber: 0,
        pageSize: 1000
      };

      // Filter categories by branchId if provided
      if (branchId) {
        params.branchId = branchId;
      }

      const result = await ApiGet('/api/admin/menu_category/filter', params);

      if (result.success) {
        const data = result.success.data.data;
        setCategories(data.records || []);
      }
    } catch (err) {
      toast.error('Failed to fetch categories');
    }
  };

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      // Add branchId filter if provided
      if (branchId) {
        params.branchId = branchId;
      }

      if (categoryFilter) {
        params.categoryId = categoryFilter;
      }

      if (searchQuery.trim()) {
        params.searchValue = searchQuery.trim();
      }

      const result = await ApiGet('/api/admin/menu_items/filter', params);

      if (result.success) {
        const data = result.success.data.data;
        const items = (data.records || []).map(item => ({
          ...item,
          dietaryType: item.dietaryType === 'VEG' || item.dietaryType === 'VEGAN' || item.dietaryType === true,
          _modified: false
        }));
        // Sort by priority
        items.sort((a, b) => (a.priority || 0) - (b.priority || 0));
        setMenuItems(items);
        setOriginalItems(JSON.parse(JSON.stringify(items)));
        setTotalRecords(data.totalRecords || 0);
        setTotalPages(data.totalPages || 0);
        setHasChanges(false);
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (itemId, field, value) => {
    setMenuItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, [field]: value, _modified: true } : item
    ));
    setHasChanges(true);
  };

  // Drag and drop handlers for priority reordering
  const handleDragStart = (e, itemId) => {
    setDraggedIndex(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropItemId) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropItemId) return;

    setMenuItems(prev => {
      const updated = [...prev];
      const dragIdx = updated.findIndex(i => i.id === draggedIndex);
      const dropIdx = updated.findIndex(i => i.id === dropItemId);
      if (dragIdx === -1 || dropIdx === -1) return prev;
      const [draggedItem] = updated.splice(dragIdx, 1);
      updated.splice(dropIdx, 0, draggedItem);

      return updated.map((item, idx) => ({
        ...item,
        priority: idx + 1,
        _modified: true
      }));
    });
    setHasChanges(true);
    setDraggedIndex(null);
  };

  const moveItem = (itemId, direction) => {
    setMenuItems(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(i => i.id === itemId);
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (idx === -1 || newIdx < 0 || newIdx >= updated.length) return prev;
      [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];

      return updated.map((item, i) => ({
        ...item,
        priority: i + 1,
        _modified: true
      }));
    });
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    const modifiedItems = menuItems.filter(item => item._modified);

    if (modifiedItems.length === 0) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);
    try {
      const payload = modifiedItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price) || 0,
        mrp: parseFloat(item.mrp) || 0,
        costPrice: parseFloat(item.costPrice) || 0,
        dietaryType: item.dietaryType,
        isActive: item.isActive,
        isAvailable: item.isAvailable,
        availableOnline: item.availableOnline,
        preparationMinutes: parseInt(item.preparationMinutes) || 0,
        deliveryMinutes: parseInt(item.deliveryMinutes) || 0,
        isRecommended: item.isRecommended,
        spiceLevel: item.spiceLevel,
        priority: parseInt(item.priority) || 0
      }));

      const result = await ApiPut('/api/admin/menu_items/updateMultiple', payload);

      if (result.success) {
        toast.success(`${modifiedItems.length} item(s) updated successfully`);
        // Refresh data to get latest from server
        fetchMenuItems();
      } else {
        toast.error(result.fail || 'Failed to update items');
      }
    } catch (err) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMenuItems(JSON.parse(JSON.stringify(originalItems)));
    setHasChanges(false);
    toast.info('Changes discarded');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const renderPagination = () => {
    const items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    items.push(<Pagination.First key="first" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />);
    items.push(<Pagination.Prev key="prev" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} />);
    for (let page = startPage; page <= endPage; page++) {
      items.push(<Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>{page}</Pagination.Item>);
    }
    items.push(<Pagination.Next key="next" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || totalPages === 0} />);
    items.push(<Pagination.Last key="last" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} />);
    return items;
  };

  return (
    <Container fluid className="py-2">
      {/* Header with Branch Info */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
              <i className="fas fa-edit me-2"></i>
              Bulk Update Menu Items
            </h2>
          </div>
          {branchId && (
            <Alert variant="info" className="py-2 px-3 mb-0 mt-2 d-inline-block">
              <i className="bi bi-building me-2"></i>
              <strong>Branch:</strong> {branchName || `ID: ${branchId}`}
            </Alert>
          )}
          <div className="mt-2">
            <small className="text-muted">Drag rows to reorder priority. Edit fields inline and save all changes at once.</small>
          </div>
        </div>
        <div className="d-flex gap-2">
          {hasChanges && (
            <Button variant="outline-secondary" onClick={handleReset} disabled={saving}>
              <i className="bi bi-arrow-counterclockwise me-2"></i>
              Reset
            </Button>
          )}
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

      {/* Filters */}
      <Row className="mb-4 align-items-center">
        <Col md={2}>
          <Select
            options={restaurants.map((r) => ({
              value: r.id,
              label: r.name
            }))}
            value={selectedRestaurantId ? {
              value: Number(selectedRestaurantId),
              label: restaurants.find(r => String(r.id) === String(selectedRestaurantId))?.name || ''
            } : null}
            onChange={(selected) => {
              setSelectedRestaurantId(selected ? String(selected.value) : '');
              setSelectedBranchId('');
              setCategoryFilter('');
            }}
            isClearable
            isSearchable
            isLoading={restaurantsLoading}
            placeholder="Select Restaurant"
            noOptionsMessage={() => "No restaurants found"}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          />
        </Col>
        <Col md={2}>
          <Select
            options={filteredBranches.map((b) => ({
              value: b.id,
              label: b.name
            }))}
            value={branchId ? {
              value: Number(branchId),
              label: branches.find(b => String(b.id) === String(branchId))?.name || branchName || ''
            } : null}
            onChange={(selected) => {
              setSelectedBranchId(selected ? String(selected.value) : '');
              setCategoryFilter('');
            }}
            isClearable
            isSearchable
            isLoading={branchesLoading}
            isDisabled={!selectedRestaurantId}
            placeholder={selectedRestaurantId ? "Select Branch" : "Select Restaurant first"}
            noOptionsMessage={() => "No branches found"}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
          />
        </Col>
        <Col md={3}>
          <InputGroup style={{ height: '42px' }}>
            <InputGroup.Text style={{ height: '42px' }}>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: '42px' }}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <Select
            options={categories.map((cat) => ({
              value: cat.id,
              label: cat.name
            }))}
            value={categoryFilter ? {
              value: categoryFilter,
              label: categories.find(c => c.id === parseInt(categoryFilter))?.name || ''
            } : null}
            onChange={(selected) => setCategoryFilter(selected ? selected.value : '')}
            isClearable
            isSearchable
            placeholder="Filter by Category"
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{
              control: (base) => ({
                ...base,
                height: '42px',
                minHeight: '42px'
              }),
              menuPortal: (base) => ({
                ...base,
                zIndex: 9999
              })
            }}
          />
        </Col>
        <Col md={4} className="text-end">
          {hasChanges && (
            <Badge bg="warning" className="py-2 px-3">
              <i className="bi bi-exclamation-triangle me-1"></i>
              Unsaved changes
            </Badge>
          )}
        </Col>
      </Row>

      {/* Table */}
      <div className="table-responsive" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <Table striped bordered hover className="modern-table" style={{ fontSize: '0.85rem' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff' }}>
            <tr>
              <th style={{ width: '60px' }}>Order</th>
              <th style={{ width: '60px' }}>Priority</th>
              <th style={{ width: '60px' }}>Recommended</th>
              <th style={{ width: '200px' }}>Name</th>
              <th style={{ width: '100px' }}>Price</th>
              <th style={{ width: '100px' }}>MRP</th>
              <th style={{ width: '100px' }}>Dietary</th>
              <th style={{ width: '100px' }}>Spice</th>
              <th style={{ width: '80px' }}>Prep (min)</th>
              <th style={{ width: '60px' }}>Active</th>
              <th style={{ width: '60px' }}>Available</th>
              <th style={{ width: '60px' }}>Online</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="12" className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <div className="mt-2">Loading menu items...</div>
                </td>
              </tr>
            ) : menuItems.length === 0 ? (
              <tr>
                <td colSpan="12" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  {branchId ? 'No menu items found for this branch' : 'No menu items found'}
                </td>
              </tr>
            ) : (
              menuItems.map((item, index) => (
                <tr
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, item.id)}
                  style={{
                    cursor: 'grab',
                    backgroundColor: item._modified ? '#fff3cd' : 'inherit'
                  }}
                >
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => moveItem(item.id, 'up')}
                        disabled={index === 0}
                        style={{ padding: '2px 6px' }}
                      >
                        <i className="bi bi-arrow-up"></i>
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => moveItem(item.id, 'down')}
                        disabled={index === menuItems.length - 1}
                        style={{ padding: '2px 6px' }}
                      >
                        <i className="bi bi-arrow-down"></i>
                      </Button>
                    </div>
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      size="sm"
                      value={item.priority || 0}
                      onChange={(e) => handleItemChange(item.id, 'priority', e.target.value)}
                      style={{ width: '50px' }}
                      onWheel={(e) => e.target.blur()}
                    />
                  </td>
                  <td className="text-center">
                    <Form.Check
                      type="switch"
                      checked={item.isRecommended ?? false}
                      onChange={(e) => handleItemChange(item.id, 'isRecommended', e.target.checked)}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="text"
                      size="sm"
                      value={item.name || ''}
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      style={{ minWidth: '150px' }}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      size="sm"
                      step="0.01"
                      value={item.price || ''}
                      onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                      style={{ width: '80px' }}
                      onWheel={(e) => e.target.blur()}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      size="sm"
                      step="0.01"
                      value={item.mrp || ''}
                      onChange={(e) => handleItemChange(item.id, 'mrp', e.target.value)}
                      style={{ width: '80px' }}
                      onWheel={(e) => e.target.blur()}
                    />
                  </td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={String(item.dietaryType ?? true)}
                      onChange={(e) => handleItemChange(item.id, 'dietaryType', e.target.value === 'true')}
                      style={{ width: '90px' }}
                    >
                      {dietaryTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Form.Select>
                  </td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={item.spiceLevel || 'MEDIUM'}
                      onChange={(e) => handleItemChange(item.id, 'spiceLevel', e.target.value)}
                      style={{ width: '90px' }}
                    >
                      {spiceLevelOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Form.Select>
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      size="sm"
                      value={item.preparationMinutes || 0}
                      onChange={(e) => handleItemChange(item.id, 'preparationMinutes', e.target.value)}
                      style={{ width: '60px' }}
                      onWheel={(e) => e.target.blur()}
                    />
                  </td>
                  <td className="text-center">
                    <Form.Check
                      type="switch"
                      checked={item.isActive ?? true}
                      onChange={(e) => handleItemChange(item.id, 'isActive', e.target.checked)}
                    />
                  </td>
                  <td className="text-center">
                    <Form.Check
                      type="switch"
                      checked={item.isAvailable ?? true}
                      onChange={(e) => handleItemChange(item.id, 'isAvailable', e.target.checked)}
                    />
                  </td>
                  <td className="text-center">
                    <Form.Check
                      type="switch"
                      checked={item.availableOnline ?? true}
                      onChange={(e) => handleItemChange(item.id, 'availableOnline', e.target.checked)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Footer with Pagination */}
      <div className="mt-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <Form.Select
            size="sm"
            style={{ width: 'auto' }}
            value={rowsPerPage}
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
          >
            {[5, 10, 25, 50, 100].map(n => (
              <option key={n} value={n}>{n} per page</option>
            ))}
          </Form.Select>
          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
            Showing <strong>{totalRecords > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</strong> to{' '}
            <strong>{Math.min(currentPage * rowsPerPage, totalRecords)}</strong> of{' '}
            <strong>{totalRecords}</strong> entries
            {menuItems.filter(i => i._modified).length > 0 && (
              <> | Modified: <strong>{menuItems.filter(i => i._modified).length}</strong></>
            )}
          </span>
        </div>
        {totalPages > 1 && (
          <Pagination className="mb-0">{renderPagination()}</Pagination>
        )}
      </div>
    </Container>
  );
};

export default MenuItemsBulkUpdate;
