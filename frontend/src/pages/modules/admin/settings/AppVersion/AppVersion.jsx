import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const AppVersion = () => {
  const { primaryColor } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    platform: 'ANDROID',
    versionName: '',
    latestVersion: '',
    minimumVersion: '',
    isForceUpdate: 'YES',
    playstoreUrl: '',
    appStoreUrl: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchAppVersionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage]);

  const fetchAppVersionData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      const result = await ApiGet('/api/admin/app_version/getAll', params);

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
      setError('Failed to fetch app versions');
      toast.error('Failed to fetch app versions');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const exportToExcel = () => {
    const exportData = apiData.map(version => ({
      ID: version.id,
      Platform: version.platform || '',
      'Version Name': version.versionName || '',
      'Latest Version': version.latestVersion || '',
      'Minimum Version': version.minimumVersion || '',
      'Force Update': version.isForceUpdate || '',
      'Play Store URL': version.playstoreUrl || '',
      'App Store URL': version.appStoreUrl || '',
      'Created At': version.createdAt ? new Date(version.createdAt).toLocaleString() : 'N/A',
      'Updated At': version.updatedAt ? new Date(version.updatedAt).toLocaleString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'App Versions');
    XLSX.writeFile(workbook, `app_versions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      platform: 'ANDROID',
      versionName: '',
      latestVersion: '',
      minimumVersion: '',
      isForceUpdate: 'YES',
      playstoreUrl: '',
      appStoreUrl: ''
    });
    setFormErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setSelectedVersion(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (version) => {
    setSelectedVersion(version);
    setFormData({
      platform: version.platform || 'ANDROID',
      versionName: version.versionName || '',
      latestVersion: version.latestVersion || '',
      minimumVersion: version.minimumVersion || '',
      isForceUpdate: version.isForceUpdate || 'YES',
      playstoreUrl: version.playstoreUrl || '',
      appStoreUrl: version.appStoreUrl || ''
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.platform) {
      errors.platform = 'Platform is required';
    }

    if (!formData.versionName.trim()) {
      errors.versionName = 'Version Name is required';
    }

    if (!formData.latestVersion.trim()) {
      errors.latestVersion = 'Latest Version is required';
    }

    if (!formData.minimumVersion.trim()) {
      errors.minimumVersion = 'Minimum Version is required';
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
        platform: formData.platform,
        versionName: formData.versionName.trim(),
        latestVersion: formData.latestVersion.trim(),
        minimumVersion: formData.minimumVersion.trim(),
        isForceUpdate: formData.isForceUpdate,
        playstoreUrl: formData.playstoreUrl.trim(),
        appStoreUrl: formData.appStoreUrl.trim()
      };

      if (modalMode === 'edit') {
        payload.id = selectedVersion.id;
      }

      const endpoint = modalMode === 'add'
        ? '/api/admin/app_version/add'
        : '/api/admin/app_version/update';

      const result = await ApiPost(endpoint, payload);

      if (result.success) {
        toast.success(modalMode === 'add' ? 'App Version added successfully' : 'App Version updated successfully');
        setShowModal(false);
        fetchAppVersionData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save app version');
    } finally {
      setFormLoading(false);
    }
  };

  const getPlatformBadge = (platform) => {
    switch (platform) {
      case 'ANDROID':
        return <Badge bg="success">ANDROID</Badge>;
      case 'WEB':
        return <Badge bg="primary">WEB</Badge>;
      case 'IOS':
        return <Badge bg="secondary">IOS</Badge>;
      default:
        return <Badge bg="info">{platform}</Badge>;
    }
  };

  const getForceUpdateBadge = (isForceUpdate) => {
    if (isForceUpdate === 'YES') {
      return <Badge bg="danger">YES</Badge>;
    } else {
      return <Badge bg="secondary">NO</Badge>;
    }
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h4 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-phone me-2"></i>
          App Version
        </h4>
      </div>

      {/* Actions */}
      <Row className="mb-4 align-items-center">
        <Col md={12} className="d-flex justify-content-end gap-2">
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add App Version
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
              <th>Platform</th>
              <th>Version Name</th>
              <th>Latest Version</th>
              <th>Minimum Version</th>
              <th>Force Update</th>
              <th>Play Store URL</th>
              <th>App Store URL</th>
              <th>Created At</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={11} />
            ) : error ? (
              <tr>
                <td colSpan="11" className="text-center py-4 text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No app versions found
                </td>
              </tr>
            ) : (
              paginatedData.map((version) => (
                <tr key={version.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(version)}
                        disabled={loading}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{version.id}</strong></td>
                  <td>{getPlatformBadge(version.platform)}</td>
                  <td>{version.versionName || 'N/A'}</td>
                  <td>{version.latestVersion || 'N/A'}</td>
                  <td>{version.minimumVersion || 'N/A'}</td>
                  <td>{getForceUpdateBadge(version.isForceUpdate)}</td>
                  <td>
                    {version.playstoreUrl ? (
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#0d6efd' }}>View URL</summary>
                        <div style={{ fontSize: '12px', wordBreak: 'break-all', marginTop: '5px' }}>
                          {version.playstoreUrl}
                        </div>
                      </details>
                    ) : 'N/A'}
                  </td>
                  <td>
                    {version.appStoreUrl ? (
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#0d6efd' }}>View URL</summary>
                        <div style={{ fontSize: '12px', wordBreak: 'break-all', marginTop: '5px' }}>
                          {version.appStoreUrl}
                        </div>
                      </details>
                    ) : 'N/A'}
                  </td>
                  <td>{version.createdAt ? new Date(version.createdAt).toLocaleString() : 'N/A'}</td>
                  <td>{version.updatedAt ? new Date(version.updatedAt).toLocaleString() : 'N/A'}</td>
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

      {/* App Version Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`bi bi-${modalMode === 'add' ? 'plus-lg' : 'pencil'} me-2`}></i>
            {modalMode === 'add' ? 'Add App Version' : 'Edit App Version'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Platform <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="platform"
                    value={formData.platform}
                    onChange={handleFormChange}
                    isInvalid={!!formErrors.platform}
                  >
                    <option value="ANDROID">ANDROID</option>
                    <option value="WEB">WEB</option>
                    <option value="IOS">IOS</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.platform}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Version Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="versionName"
                    value={formData.versionName}
                    onChange={handleFormChange}
                    placeholder="e.g., 1.0.0"
                    isInvalid={!!formErrors.versionName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.versionName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Latest Version <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="latestVersion"
                    value={formData.latestVersion}
                    onChange={handleFormChange}
                    placeholder="e.g., 1.2.5"
                    isInvalid={!!formErrors.latestVersion}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.latestVersion}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Version <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="minimumVersion"
                    value={formData.minimumVersion}
                    onChange={handleFormChange}
                    placeholder="e.g., 1.0.0"
                    isInvalid={!!formErrors.minimumVersion}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.minimumVersion}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Force Update</Form.Label>
                  <Form.Select
                    name="isForceUpdate"
                    value={formData.isForceUpdate}
                    onChange={handleFormChange}
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Play Store URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="playstoreUrl"
                    value={formData.playstoreUrl}
                    onChange={handleFormChange}
                    placeholder="https://play.google.com/store/apps/..."
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>App Store URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="appStoreUrl"
                    value={formData.appStoreUrl}
                    onChange={handleFormChange}
                    placeholder="https://apps.apple.com/..."
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
                  {modalMode === 'add' ? 'Add App Version' : 'Update App Version'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AppVersion;
