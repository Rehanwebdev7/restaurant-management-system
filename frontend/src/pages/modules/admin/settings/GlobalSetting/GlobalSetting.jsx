import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPost } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import '../../../../../styles/tables.css';

const GlobalSetting = () => {
  const { primaryColor } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    beneficiary: '',
    cronOnOff: 'OFF',
    dmt: '',
    lockSystem: 'NO',
    maintainanceMode: 'OFF',
    networkPayment: '',
    payout: '',
    payoutApi: '',
    systemIp: '',
    apiLogs: 'OFF',
    apiLimit: '',
    transferToCron: '',
    verification: '',
    latestVersion: '',
    forceUpdate: 'NO',
    redirectedUrl: '',
    minAmount: '',
    downloadIncentiveAmount: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchGlobalSettingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage]);

  const fetchGlobalSettingData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      const result = await ApiGet('/api/admin/global_setting/getAll', params);

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
      setError('Failed to fetch global settings');
      toast.error('Failed to fetch global settings');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const exportToExcel = () => {
    const exportData = apiData.map(setting => ({
      ID: setting.id,
      'Beneficiary': setting.beneficiary || 'N/A',
      'Cron On/Off': setting.cronOnOff || 'N/A',
      'DMT': setting.dmt || 'N/A',
      'Lock System': setting.lockSystem || 'N/A',
      'Maintenance Mode': setting.maintainanceMode || 'N/A',
      'Network Payment': setting.networkPayment || 'N/A',
      'Payout': setting.payout || 'N/A',
      'Payout API': setting.payoutApi || 'N/A',
      'System IP': setting.systemIp || 'N/A',
      'API Logs': setting.apiLogs || 'N/A',
      'API Limit': setting.apiLimit || 'N/A',
      'Transfer To Cron': setting.transferToCron || 'N/A',
      'Verification': setting.verification || 'N/A',
      'Latest Version': setting.latestVersion || 'N/A',
      'Force Update': setting.forceUpdate || 'N/A',
      'Redirected URL': setting.redirectedUrl || 'N/A',
      'Min Amount': setting.minAmount || 'N/A',
      'Download Incentive': setting.downloadIncentiveAmount || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Global Settings');
    XLSX.writeFile(workbook, `global_settings_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const resetForm = () => {
    setFormData({
      beneficiary: '',
      cronOnOff: 'OFF',
      dmt: '',
      lockSystem: 'NO',
      maintainanceMode: 'OFF',
      networkPayment: '',
      payout: '',
      payoutApi: '',
      systemIp: '',
      apiLogs: 'OFF',
      apiLimit: '',
      transferToCron: '',
      verification: '',
      latestVersion: '',
      forceUpdate: 'NO',
      redirectedUrl: '',
      minAmount: '',
      downloadIncentiveAmount: ''
    });
    setFormErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setSelectedSetting(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEdit = (setting) => {
    setSelectedSetting(setting);
    setFormData({
      beneficiary: setting.beneficiary || '',
      cronOnOff: setting.cronOnOff || 'OFF',
      dmt: setting.dmt || '',
      lockSystem: setting.lockSystem || 'NO',
      maintainanceMode: setting.maintainanceMode || 'OFF',
      networkPayment: setting.networkPayment || '',
      payout: setting.payout || '',
      payoutApi: setting.payoutApi || '',
      systemIp: setting.systemIp || '',
      apiLogs: setting.apiLogs || 'OFF',
      apiLimit: setting.apiLimit || '',
      transferToCron: setting.transferToCron || '',
      verification: setting.verification || '',
      latestVersion: setting.latestVersion || '',
      forceUpdate: setting.forceUpdate || 'NO',
      redirectedUrl: setting.redirectedUrl || '',
      minAmount: setting.minAmount || '',
      downloadIncentiveAmount: setting.downloadIncentiveAmount || ''
    });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
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

    setFormLoading(true);

    try {
      const payload = { ...formData };

      if (modalMode === 'edit') {
        payload.id = selectedSetting.id;
      }

      const endpoint = modalMode === 'add'
        ? '/api/admin/global_setting/add'
        : '/api/admin/global_setting/update';

      const result = await ApiPost(endpoint, payload);

      if (result.success) {
        toast.success(modalMode === 'add' ? 'Global Setting added successfully' : 'Global Setting updated successfully');
        setShowModal(false);
        fetchGlobalSettingData();
      } else {
        toast.error(result.fail);
      }
    } catch (err) {
      toast.error('Failed to save global setting');
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (value) => {
    if (!value) return <Badge bg="secondary">N/A</Badge>;
    const upper = value.toString().toUpperCase();
    if (upper === 'ON' || upper === 'YES' || upper === 'ACTIVE') {
      return <Badge bg="success">{value}</Badge>;
    } else if (upper === 'OFF' || upper === 'NO' || upper === 'INACTIVE') {
      return <Badge bg="danger">{value}</Badge>;
    }
    return <Badge bg="info">{value}</Badge>;
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h4 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-sliders me-2"></i>
          Global Settings
        </h4>
      </div>

      {/* Actions */}
      <Row className="mb-4 align-items-center">
        <Col md={12} className="d-flex justify-content-end gap-2">
          <Button style={{ backgroundColor: primaryColor, borderColor: primaryColor, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleAdd}>
            <i className="bi bi-plus-lg me-2"></i>
            Add Setting
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
              <th>Maintenance Mode</th>
              <th>Lock System</th>
              <th>Cron On/Off</th>
              <th>API Logs</th>
              <th>Force Update</th>
              <th>Latest Version</th>
              <th>Min Amount</th>
              <th>API Limit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <div className="mt-2">Loading global settings...</div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="10" className="text-center py-4 text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-4 text-muted">
                  <i className="bi bi-inbox me-2"></i>
                  No global settings found
                </td>
              </tr>
            ) : (
              paginatedData.map((setting) => (
                <tr key={setting.id}>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(setting)}
                        disabled={loading}
                        title="Edit"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                    </div>
                  </td>
                  <td><strong>{setting.id}</strong></td>
                  <td>{getStatusBadge(setting.maintainanceMode)}</td>
                  <td>{getStatusBadge(setting.lockSystem)}</td>
                  <td>{getStatusBadge(setting.cronOnOff)}</td>
                  <td>{getStatusBadge(setting.apiLogs)}</td>
                  <td>{getStatusBadge(setting.forceUpdate)}</td>
                  <td>{setting.latestVersion || 'N/A'}</td>
                  <td>{setting.minAmount || 'N/A'}</td>
                  <td>{setting.apiLimit || 'N/A'}</td>
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

      {/* Global Setting Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`bi bi-${modalMode === 'add' ? 'plus-lg' : 'pencil'} me-2`}></i>
            {modalMode === 'add' ? 'Add Global Setting' : 'Edit Global Setting'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Maintenance Mode</Form.Label>
                  <Form.Select
                    name="maintainanceMode"
                    value={formData.maintainanceMode}
                    onChange={handleFormChange}
                  >
                    <option value="OFF">OFF</option>
                    <option value="ON">ON</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Lock System</Form.Label>
                  <Form.Select
                    name="lockSystem"
                    value={formData.lockSystem}
                    onChange={handleFormChange}
                  >
                    <option value="NO">NO</option>
                    <option value="YES">YES</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Cron On/Off</Form.Label>
                  <Form.Select
                    name="cronOnOff"
                    value={formData.cronOnOff}
                    onChange={handleFormChange}
                  >
                    <option value="OFF">OFF</option>
                    <option value="ON">ON</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>API Logs</Form.Label>
                  <Form.Select
                    name="apiLogs"
                    value={formData.apiLogs}
                    onChange={handleFormChange}
                  >
                    <option value="OFF">OFF</option>
                    <option value="ON">ON</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Force Update</Form.Label>
                  <Form.Select
                    name="forceUpdate"
                    value={formData.forceUpdate}
                    onChange={handleFormChange}
                  >
                    <option value="NO">NO</option>
                    <option value="YES">YES</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Latest Version</Form.Label>
                  <Form.Control
                    type="text"
                    name="latestVersion"
                    value={formData.latestVersion}
                    onChange={handleFormChange}
                    placeholder="e.g., 1.0.0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Min Amount</Form.Label>
                  <Form.Control
                    type="text"
                    name="minAmount"
                    value={formData.minAmount}
                    onChange={handleFormChange}
                    placeholder="Enter minimum amount"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>API Limit</Form.Label>
                  <Form.Control
                    type="text"
                    name="apiLimit"
                    value={formData.apiLimit}
                    onChange={handleFormChange}
                    placeholder="Enter API limit"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Download Incentive Amount</Form.Label>
                  <Form.Control
                    type="text"
                    name="downloadIncentiveAmount"
                    value={formData.downloadIncentiveAmount}
                    onChange={handleFormChange}
                    placeholder="Enter incentive amount"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Beneficiary</Form.Label>
                  <Form.Control
                    type="text"
                    name="beneficiary"
                    value={formData.beneficiary}
                    onChange={handleFormChange}
                    placeholder="Enter beneficiary"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>DMT</Form.Label>
                  <Form.Control
                    type="text"
                    name="dmt"
                    value={formData.dmt}
                    onChange={handleFormChange}
                    placeholder="Enter DMT"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Network Payment</Form.Label>
                  <Form.Control
                    type="text"
                    name="networkPayment"
                    value={formData.networkPayment}
                    onChange={handleFormChange}
                    placeholder="Enter network payment"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Payout</Form.Label>
                  <Form.Control
                    type="text"
                    name="payout"
                    value={formData.payout}
                    onChange={handleFormChange}
                    placeholder="Enter payout"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Payout API</Form.Label>
                  <Form.Control
                    type="text"
                    name="payoutApi"
                    value={formData.payoutApi}
                    onChange={handleFormChange}
                    placeholder="Enter payout API"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>System IP</Form.Label>
                  <Form.Control
                    type="text"
                    name="systemIp"
                    value={formData.systemIp}
                    onChange={handleFormChange}
                    placeholder="Enter system IP"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Transfer To Cron</Form.Label>
                  <Form.Control
                    type="text"
                    name="transferToCron"
                    value={formData.transferToCron}
                    onChange={handleFormChange}
                    placeholder="Enter transfer to cron"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Verification</Form.Label>
                  <Form.Control
                    type="text"
                    name="verification"
                    value={formData.verification}
                    onChange={handleFormChange}
                    placeholder="Enter verification"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Redirected URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="redirectedUrl"
                    value={formData.redirectedUrl}
                    onChange={handleFormChange}
                    placeholder="Enter redirected URL"
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
                  {modalMode === 'add' ? 'Add Setting' : 'Update Setting'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default GlobalSetting;
