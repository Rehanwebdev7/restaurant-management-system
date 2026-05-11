import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import Select from 'react-select';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost, ApiPut } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const DiningTables = () => {
  const { primaryColor, logoUrl, restaurantName } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedTable, setSelectedTable] = useState(null);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrTable, setQrTable] = useState(null);
  const [qrImageData, setQrImageData] = useState('');
  const [qrDownloading, setQrDownloading] = useState(false);
  const [qrSharing, setQrSharing] = useState(false);
  const qrCardRef = useRef(null);

  // Dropdowns data
  const [restaurants, setRestaurants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // Status options
  const statusOptions = [
    { value: 1, label: 'Available' },
    { value: 2, label: 'Occupied' },
    { value: 3, label: 'Reserved' },
    { value: 4, label: 'Maintenance' }
  ];

  // Form state
  const [formData, setFormData] = useState({
    restaurantId: '',
    branchId: '',
    sectionId: '',
    tableNumber: '',
    capacity: 4,
    status: 1,
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // For edit mode - store selected names
  const [selectedRestaurantName, setSelectedRestaurantName] = useState('');
  const [selectedBranchName, setSelectedBranchName] = useState('');
  const [selectedSectionName, setSelectedSectionName] = useState('');

  useEffect(() => {
    fetchTableData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage]);

  useEffect(() => {
    fetchRestaurants();
    fetchBranches();
    fetchSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter branches based on selected restaurant
  useEffect(() => {
    if (formData.restaurantId) {
      const filtered = branches.filter(branch =>
        branch.parentId?.id === parseInt(formData.restaurantId)
      );
      setFilteredBranches(filtered);
    } else {
      setFilteredBranches(branches);
    }
  }, [formData.restaurantId, branches]);

  // Filter sections based on selected restaurant
  useEffect(() => {
    if (formData.restaurantId) {
      const filtered = sections.filter(section =>
        section.restaurantId?.id === parseInt(formData.restaurantId)
      );
      setFilteredSections(filtered);
    } else {
      setFilteredSections(sections);
    }
  }, [formData.restaurantId, sections]);

  // Debounced search effect
  useEffect(() => {
    if (searchQuery === '') return;

    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchTableData();
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
      } else {
        toast.error('Failed to fetch restaurants');
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
        setFilteredBranches(data.records || []);
      } else {
        toast.error('Failed to fetch branches');
      }
    } catch (err) {
      toast.error('Failed to fetch branches');
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchSections = async () => {
    setSectionsLoading(true);
    try {
      const result = await ApiGet('/api/admin/section/filter', {
        pageNumber: 0,
        pageSize: 1000
      });

      if (result.success) {
        const data = result.success.data.data;
        setSections(data.records || []);
        setFilteredSections(data.records || []);
      } else {
        toast.error('Failed to fetch sections');
      }
    } catch (err) {
      toast.error('Failed to fetch sections');
    } finally {
      setSectionsLoading(false);
    }
  };

  const fetchTableData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      if (searchQuery.trim()) {
        params.searchValue = searchQuery.trim();
      }

      const result = await ApiGet('/api/admin/dining_tables/filter', params);

      if (result.success) {
        const data = result.success.data.data;
        setApiData(data.records || []);
        setTotalRecords(data.totalRecords || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        setError(result.fail);
        toast.error(result.fail);
      }
    } catch (err) {
      setError('Failed to fetch dining tables');
      toast.error('Failed to fetch dining tables');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const exportData = apiData.map(table => ({
      ID: table.id,
      'Table Number': table.tableNumber || '',
      Restaurant: table.restaurantId?.name || 'N/A',
      Branch: table.branchId?.name || 'N/A',
      Section: table.sectionId?.type || 'N/A',
      Capacity: table.capacity || 0,
      Status: getStatusLabel(table.status),
      Notes: table.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dining Tables');
    XLSX.writeFile(workbook, `dining_tables_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      1: 'Available',
      2: 'Occupied',
      3: 'Reserved',
      4: 'Maintenance'
    };
    return statusMap[status] || 'Unknown';
  };

  const resetForm = () => {
    setFormData({
      restaurantId: '',
      branchId: '',
      sectionId: '',
      tableNumber: '',
      capacity: 4,
      status: 1,
      notes: ''
    });
    setFormErrors({});
    setSelectedRestaurantName('');
    setSelectedBranchName('');
    setSelectedSectionName('');
  };

  const handleAdd = () => {
    resetForm();
    setSelectedTable(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (table) => {
    setSelectedTable(table);
    const restId = table.restaurantId?.id;
    const branchId = table.branchId?.id;
    const sectionId = table.sectionId?.id;
    setFormData({
      restaurantId: restId != null ? restId : '',
      branchId: branchId != null ? branchId : '',
      sectionId: sectionId != null ? sectionId : '',
      tableNumber: table.tableNumber || '',
      capacity: table.capacity || 4,
      status: table.status || 1,
      notes: table.notes || ''
    });
    setSelectedRestaurantName(table.restaurantId?.name || '');
    setSelectedBranchName(table.branchId?.name || '');
    setSelectedSectionName(table.sectionId?.type || '');
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteClick = (table) => {
    setTableToDelete(table);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tableToDelete) return;

    setDeleteLoading(true);
    try {
      const payload = {
        id: tableToDelete.id,
        isDelete: true
      };

      const result = await ApiPut('/api/admin/dining_tables/update', payload);

      if (result.success) {
        toast.success('Dining table deleted successfully');
        setShowDeleteModal(false);
        setTableToDelete(null);
        fetchTableData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to delete dining table');
    } finally {
      setDeleteLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.restaurantId) {
      errors.restaurantId = 'Restaurant is required';
    }

    if (!formData.branchId) {
      errors.branchId = 'Branch is required';
    }

    if (!formData.sectionId) {
      errors.sectionId = 'Section is required';
    }

    if (!formData.tableNumber) {
      errors.tableNumber = 'Table number is required';
    }

    if (!formData.capacity || formData.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormLoading(true);

    try {
      const payload = {
        restaurantId: { id: parseInt(formData.restaurantId) },
        branchId: { id: parseInt(formData.branchId) },
        sectionId: { id: parseInt(formData.sectionId) },
        tableNumber: formData.tableNumber.toString(),
        capacity: parseInt(formData.capacity),
        status: parseInt(formData.status),
        notes: formData.notes.trim()
      };

      let result;

      if (modalMode === 'add') {
        result = await ApiPost('/api/admin/dining_tables/add', payload);
      } else {
        payload.id = selectedTable.id;
        result = await ApiPut('/api/admin/dining_tables/update', payload);
      }

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Dining table added successfully' : 'Dining table updated successfully');
        setShowModal(false);
        fetchTableData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save dining table');
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      1: 'success',
      2: 'danger',
      3: 'warning',
      4: 'secondary'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{getStatusLabel(status)}</Badge>;
  };

  // ── QR Code Download ──
  const handleDownloadQr = useCallback(async (table) => {
    setQrTable(table);
    setShowQrModal(true);
    setQrImageData('');

    const qrUrl = `${window.location.origin}/menu?table=${table.tableNumber}&branch=${table.branchId?.id || ''}`;
    try {
      const dataUrl = await QRCode.toDataURL(qrUrl, { width: 200, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
      setQrImageData(dataUrl);
    } catch (err) {
      console.error('QR generation failed:', err);
      toast.error('Failed to generate QR code');
    }
  }, []);

  // Helper: capture QR card as PNG data URL
  const captureQrCard = async () => {
    if (!qrCardRef.current) throw new Error('QR card not ready');
    const images = qrCardRef.current.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; setTimeout(resolve, 3000); });
    }));
    await new Promise(r => setTimeout(r, 300));
    return await toPng(qrCardRef.current, { quality: 1, backgroundColor: '#ffffff', pixelRatio: 2 });
  };

  // Auto-download when QR card is ready
  useEffect(() => {
    if (showQrModal && qrImageData && qrCardRef.current && !qrDownloading) {
      const timer = setTimeout(() => downloadQrCard(), 600);
      return () => clearTimeout(timer);
    }
  }, [showQrModal, qrImageData]);

  const downloadQrCard = async () => {
    if (!qrCardRef.current || qrDownloading) return;
    setQrDownloading(true);
    try {
      const dataUrl = await captureQrCard();
      const link = document.createElement('a');
      link.download = `Table-${qrTable?.tableNumber || 'QR'}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR card downloaded!');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download QR card');
    } finally {
      setQrDownloading(false);
    }
  };

  const shareQrCard = async () => {
    if (!qrCardRef.current || qrSharing) return;
    setQrSharing(true);
    try {
      const dataUrl = await captureQrCard();

      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `Table-${qrTable?.tableNumber || 'QR'}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Try Web Share API with file
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: `Table ${qrTable?.tableNumber} - QR Code`,
          text: `Scan this QR code to order from Table ${qrTable?.tableNumber}${restaurantName ? ` at ${restaurantName}` : ''}`,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast.success('QR shared!');
          setQrSharing(false);
          return;
        }
      }

      // Fallback: try sharing without file (just text + link)
      if (navigator.share) {
        const qrUrl = `${window.location.origin}/menu?table=${qrTable?.tableNumber}&branch=${qrTable?.branchId?.id || ''}`;
        await navigator.share({
          title: `Table ${qrTable?.tableNumber} - QR Code`,
          text: `Scan this QR code to order from Table ${qrTable?.tableNumber}${restaurantName ? ` at ${restaurantName}` : ''}`,
          url: qrUrl,
        });
        toast.success('Link shared!');
        setQrSharing(false);
        return;
      }

      // Final fallback: copy link to clipboard
      const qrUrl = `${window.location.origin}/menu?table=${qrTable?.tableNumber}&branch=${qrTable?.branchId?.id || ''}`;
      await navigator.clipboard.writeText(qrUrl);
      toast.info('Link copied to clipboard! Share it manually.');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
        toast.error('Failed to share QR card');
      }
    } finally {
      setQrSharing(false);
    }
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="fas fa-chair me-2"></i>
          Dining Tables
        </h2>
      </div>

      {/* Filters */}
      <Row className="mb-4 align-items-center">
        <Col md={4}>
          <InputGroup style={{ height: '42px' }}>
            <InputGroup.Text style={{ height: '42px' }}>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ height: '42px' }}
            />
          </InputGroup>
        </Col>
        <Col md={8} className="d-flex justify-content-end gap-2">
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Table
          </Button>
          {/* <Button variant="success" onClick={exportToExcel} style={{ height: '42px', width: '42px', padding: 0 }} title="Export Excel">
            <i className="bi bi-file-earmark-excel"></i>
          </Button> */}
        </Col>
      </Row>

      {/* Table */}
      <div className="table-responsive">
        <Table striped bordered hover className="modern-table">
          <thead>
            <tr>
              <th>Actions</th>
              <th>ID</th>
              <th>Table No.</th>
              <th>Restaurant</th>
              <th>Branch</th>
              <th>Section</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={9} />
            ) : error ? (
              <tr>
                <td colSpan="9" className="text-center py-4 text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No dining tables found
                </td>
              </tr>
            ) : (
              paginatedData.map((table) => (
                <tr key={table.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(table)}
                        disabled={loading}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(table)}
                        disabled={loading}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                      <Button
                        variant="outline-dark"
                        size="sm"
                        onClick={() => handleDownloadQr(table)}
                        disabled={loading}
                        title="Download QR"
                      >
                        <i className="bi bi-qr-code"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{table.id}</strong></td>
                  <td><strong>{table.tableNumber}</strong></td>
                  <td>{table.restaurantId?.name || 'N/A'}</td>
                  <td>{table.branchId?.name || 'N/A'}</td>
                  <td>{table.sectionId?.type || 'N/A'}</td>
                  <td>{table.capacity || 0}</td>
                  <td>{getStatusBadge(table.status)}</td>
                  <td>{table.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-4">
        <div>
          <Form.Select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{ width: 'auto' }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </Form.Select>
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Showing {totalRecords === 0 ? 0 : ((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalRecords)} of {totalRecords} entries
        </div>
        <Pagination>
          <Pagination.First
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1 || totalPages === 0}
          />
          <Pagination.Prev
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || totalPages === 0}
          />
          {totalPages > 0 && [...Array(Math.min(5, totalPages))].map((_, index) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = index + 1;
            } else if (currentPage <= 3) {
              pageNum = index + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + index;
            } else {
              pageNum = currentPage - 2 + index;
            }
            return (
              <Pagination.Item
                key={pageNum}
                active={pageNum === currentPage}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </Pagination.Item>
            );
          })}
          <Pagination.Next
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          />
          <Pagination.Last
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          />
        </Pagination>
      </div>

      {/* Dining Table Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`fas fa-${modalMode === 'add' ? 'plus' : 'edit'} me-2`}></i>
            {modalMode === 'add' ? 'Add Dining Table' : 'Edit Dining Table'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Restaurant <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={restaurants.map((restaurant) => ({
                      value: restaurant.id,
                      label: `${restaurant.name} (ID: ${restaurant.id})`
                    }))}
                    value={formData.restaurantId !== '' && formData.restaurantId != null ? {
                      value: Number(formData.restaurantId),
                      label: restaurants.find(r => r.id === Number(formData.restaurantId))?.name
                        ? `${restaurants.find(r => r.id === Number(formData.restaurantId))?.name} (ID: ${formData.restaurantId})`
                        : selectedRestaurantName
                          ? `${selectedRestaurantName} (ID: ${formData.restaurantId})`
                          : `ID: ${formData.restaurantId}`
                    } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({
                        ...prev,
                        restaurantId: selected ? selected.value : '',
                        branchId: '',
                        sectionId: ''
                      }));
                      setSelectedRestaurantName(selected ? selected.label.split(' (ID:')[0] : '');
                      setSelectedBranchName('');
                      setSelectedSectionName('');
                      if (formErrors.restaurantId) {
                        setFormErrors(prev => ({ ...prev, restaurantId: '' }));
                      }
                    }}
                    isClearable
                    isSearchable
                    isLoading={restaurantsLoading}
                    placeholder="Search & Select Restaurant"
                    noOptionsMessage={() => "No restaurants found"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: formErrors.restaurantId ? '#dc3545' : base.borderColor,
                        '&:hover': { borderColor: formErrors.restaurantId ? '#dc3545' : base.borderColor }
                      })
                    }}
                  />
                  {formErrors.restaurantId && (
                    <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                      {formErrors.restaurantId}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Branch <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={filteredBranches.map((branch) => ({
                      value: branch.id,
                      label: `${branch.name} (ID: ${branch.id})`
                    }))}
                    value={formData.branchId !== '' && formData.branchId != null ? {
                      value: Number(formData.branchId),
                      label: filteredBranches.find(b => b.id === Number(formData.branchId))?.name
                        ? `${filteredBranches.find(b => b.id === Number(formData.branchId))?.name} (ID: ${formData.branchId})`
                        : selectedBranchName
                          ? `${selectedBranchName} (ID: ${formData.branchId})`
                          : `ID: ${formData.branchId}`
                    } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({
                        ...prev,
                        branchId: selected ? selected.value : ''
                      }));
                      setSelectedBranchName(selected ? selected.label.split(' (ID:')[0] : '');
                      if (formErrors.branchId) {
                        setFormErrors(prev => ({ ...prev, branchId: '' }));
                      }
                    }}
                    isClearable
                    isSearchable
                    isLoading={branchesLoading}
                    isDisabled={!formData.restaurantId}
                    placeholder={formData.restaurantId ? "Search & Select Branch" : "Select Restaurant first"}
                    noOptionsMessage={() => "No branches found"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: formErrors.branchId ? '#dc3545' : base.borderColor,
                        '&:hover': { borderColor: formErrors.branchId ? '#dc3545' : base.borderColor }
                      })
                    }}
                  />
                  {formErrors.branchId && (
                    <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                      {formErrors.branchId}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Section <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={filteredSections.map((section) => ({
                      value: section.id,
                      label: `${section.name || section.type} (ID: ${section.id})`
                    }))}
                    value={formData.sectionId !== '' && formData.sectionId != null ? {
                      value: Number(formData.sectionId),
                      label: filteredSections.find(s => s.id === Number(formData.sectionId))?.name
                        ? `${filteredSections.find(s => s.id === Number(formData.sectionId))?.name} (ID: ${formData.sectionId})`
                        : selectedSectionName
                          ? `${selectedSectionName} (ID: ${formData.sectionId})`
                          : `ID: ${formData.sectionId}`
                    } : null}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, sectionId: selected ? selected.value : '' }));
                      setSelectedSectionName(selected ? selected.label.split(' (ID:')[0] : '');
                      if (formErrors.sectionId) {
                        setFormErrors(prev => ({ ...prev, sectionId: '' }));
                      }
                    }}
                    isClearable
                    isSearchable
                    isLoading={sectionsLoading}
                    isDisabled={!formData.restaurantId}
                    placeholder={formData.restaurantId ? "Search & Select Section" : "Select Restaurant first"}
                    noOptionsMessage={() => "No sections found"}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: formErrors.sectionId ? '#dc3545' : base.borderColor,
                        '&:hover': { borderColor: formErrors.sectionId ? '#dc3545' : base.borderColor }
                      })
                    }}
                  />
                  {formErrors.sectionId && (
                    <div className="text-danger" style={{ fontSize: '0.875em', marginTop: '0.25rem' }}>
                      {formErrors.sectionId}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Table Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="tableNumber"
                    value={formData.tableNumber}
                    onChange={handleFormChange}
                    placeholder="Enter table number"
                    isInvalid={!!formErrors.tableNumber}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.tableNumber}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacity <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleFormChange}
                    onWheel={(e) => e.target.blur()}
                    min="1"
                    isInvalid={!!formErrors.capacity}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.capacity}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Select
                    options={statusOptions}
                    value={statusOptions.find(opt => opt.value === formData.status)}
                    onChange={(selected) => {
                      setFormData(prev => ({ ...prev, status: selected ? selected.value : 1 }));
                    }}
                    isSearchable
                    placeholder="Select Status"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    placeholder="Enter notes (optional)"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <Spinner animation="border" size="sm" style={{ width: '1rem', height: '1rem' }} className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  {modalMode === 'add' ? 'Add Table' : 'Update Table'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-trash me-2 text-danger"></i>
            Delete Dining Table
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete table <strong>"{tableToDelete?.tableNumber}"</strong>?</p>
          <p className="text-muted mb-0">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <Spinner animation="border" size="sm" style={{ width: '1rem', height: '1rem' }} className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <i className="bi bi-trash me-2"></i>
                Delete
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* QR Code Download Modal */}
      <Modal show={showQrModal} onHide={() => setShowQrModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-qr-code me-2"></i>
            Download QR - Table {qrTable?.tableNumber}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column align-items-center">
          {/* Printable Card */}
          <div
            ref={qrCardRef}
            style={{
              backgroundColor: '#fff',
              borderRadius: 10,
              border: '1px solid #e0e0e0',
              padding: 20,
              maxWidth: 320,
              width: '100%',
              textAlign: 'center',
            }}
          >
            {/* Logo */}
            {logoUrl && (
              <img
                src={logoUrl}
                alt={restaurantName || 'Logo'}
                crossOrigin="anonymous"
                style={{ maxWidth: 140, maxHeight: 50, objectFit: 'contain', marginBottom: 12 }}
              />
            )}
            {!logoUrl && restaurantName && (
              <div style={{ fontSize: 20, fontWeight: 800, color: primaryColor, marginBottom: 12 }}>
                {restaurantName}
              </div>
            )}

            <div style={{ fontSize: 16, fontWeight: 700, color: '#212529', marginBottom: 4 }}>
              Table {qrTable?.tableNumber}
            </div>
            <div style={{ fontSize: 11, color: '#6c757d', marginBottom: 14 }}>
              Scan this QR code to view the menu & place your order
            </div>

            {/* QR Code */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              {qrImageData ? (
                <img src={qrImageData} alt="QR Code" style={{ width: 180, height: 180 }} />
              ) : (
                <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 8 }}>
                  <Spinner animation="border" size="sm" />
                </div>
              )}
            </div>

            {/* Table details */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
              {qrTable?.sectionId?.type && (
                <div style={{ fontSize: 10, color: '#6c757d' }}>
                  <strong>Section:</strong> {qrTable.sectionId.type}
                </div>
              )}
              {qrTable?.capacity && (
                <div style={{ fontSize: 10, color: '#6c757d' }}>
                  <strong>Capacity:</strong> {qrTable.capacity}
                </div>
              )}
            </div>

            {/* Benefits */}
            <div style={{ fontSize: 13, fontWeight: 700, color: '#000', marginBottom: 4 }}>
              How to Order
            </div>
            <div style={{ fontSize: 9, color: '#6c757d', marginBottom: 10 }}>
              Quick & easy ordering from your phone
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {[
                { icon: '📱', title: 'Scan QR', desc: 'Point your camera at the QR code' },
                { icon: '📋', title: 'Browse Menu', desc: 'Explore dishes & customize' },
                { icon: '✅', title: 'Place Order', desc: 'Confirm & pay seamlessly' },
                { icon: '🍽️', title: 'Enjoy!', desc: 'Your food arrives at the table' },
              ].map((b, i) => (
                <div key={i} style={{
                  backgroundColor: '#f9f9f9',
                  borderRadius: 8,
                  border: '1px solid #eee',
                  padding: 8,
                  width: '47%',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 18, marginBottom: 2 }}>{b.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#212529' }}>{b.title}</div>
                  <div style={{ fontSize: 8, color: '#6c757d', lineHeight: '11px' }}>{b.desc}</div>
                </div>
              ))}
            </div>

            {/* Footer branding */}
            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #eee', fontSize: 9, color: '#aaa' }}>
              Restaurant App
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex gap-2 mt-3">
            <Button
              style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
              onClick={downloadQrCard}
              disabled={qrDownloading || !qrImageData}
            >
              {qrDownloading ? (
                <>
                  <Spinner animation="border" size="sm" style={{ width: '1rem', height: '1rem' }} className="me-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <i className="bi bi-download me-2"></i>
                  Download QR
                </>
              )}
            </Button>
            <Button
              variant="info"
              onClick={shareQrCard}
              disabled={qrSharing || !qrImageData}
              style={{ color: '#fff' }}
            >
              {qrSharing ? (
                <>
                  <Spinner animation="border" size="sm" style={{ width: '1rem', height: '1rem' }} className="me-2" />
                  Sharing...
                </>
              ) : (
                <>
                  <i className="bi bi-share me-2"></i>
                  Share
                </>
              )}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default DiningTables;
