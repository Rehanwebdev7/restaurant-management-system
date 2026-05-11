import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPut } from '../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../components/common/TableSkeletonLoader';
import '../../../../styles/tables.css';

const WithdrawalRequests = () => {
  const { primaryColor } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');

  // Approve Modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

  // Reject Modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState('');

  // Mark as Paid Modal state
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [paidUtr, setPaidUtr] = useState('');
  const [paidLoading, setPaidLoading] = useState(false);

  useEffect(() => {
    fetchWithdrawalRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, statusFilter]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchWithdrawalRequests();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchWithdrawalRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const result = await ApiGet('/api/restaurant/withdrawals/getAll', params);

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
      setError('Failed to fetch withdrawal requests');
      toast.error('Failed to fetch withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const exportData = apiData.map(request => ({
      'Customer Name': request.customerId?.name || '',
      'Mobile': request.customerId?.mobile || '',
      'Amount': request.amount ?? 0,
      'Bank Name': request.bankId?.bankName || '',
      'Account No': request.bankId?.accountNumber || '',
      'IFSC': request.bankId?.ifscCode || '',
      'Status': request.status || '',
      'UTR': request.utr || '',
      'Date': request.date ? new Date(request.date).toLocaleString() : 'N/A',
      'Approved Date': request.approvedDate ? new Date(request.approvedDate).toLocaleString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Withdrawal Requests');
    XLSX.writeFile(workbook, `withdrawal_requests_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Approve handlers
  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleApproveSubmit = async () => {
    setApproveLoading(true);

    try {
      const result = await ApiPut(`/api/restaurant/withdrawals/approve/${selectedRequest.id}`, {});

      if (result.success) {
        toast.success('Withdrawal request approved successfully');
        setShowApproveModal(false);
        fetchWithdrawalRequests();
      } else {
        toast.error(result.fail || 'Failed to approve request');
      }
    } catch (err) {
      toast.error('Failed to approve request');
    } finally {
      setApproveLoading(false);
    }
  };

  // Reject handlers
  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectReason('');
    setRejectError('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    setRejectLoading(true);

    try {
      const payload = {};
      if (rejectReason.trim()) {
        payload.remarks = rejectReason.trim();
      }

      const result = await ApiPut(`/api/restaurant/withdrawals/reject/${selectedRequest.id}`, payload);

      if (result.success) {
        toast.success('Withdrawal request rejected');
        setShowRejectModal(false);
        fetchWithdrawalRequests();
      } else {
        toast.error(result.fail || 'Failed to reject request');
      }
    } catch (err) {
      toast.error('Failed to reject request');
    } finally {
      setRejectLoading(false);
    }
  };

  // Mark as Paid handlers
  const handlePaidClick = (request) => {
    setSelectedRequest(request);
    setPaidUtr('');
    setShowPaidModal(true);
  };

  const handlePaidSubmit = async () => {
    setPaidLoading(true);

    try {
      const payload = {};
      if (paidUtr.trim()) {
        payload.utr = paidUtr.trim();
      }

      const result = await ApiPut(`/api/restaurant/withdrawals/mark-paid/${selectedRequest.id}`, payload);

      if (result.success) {
        toast.success('Withdrawal marked as paid successfully');
        setShowPaidModal(false);
        fetchWithdrawalRequests();
      } else {
        toast.error(result.fail || 'Failed to mark as paid');
      }
    } catch (err) {
      toast.error('Failed to mark as paid');
    } finally {
      setPaidLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge bg="warning" text="dark">Pending</Badge>;
      case 'approved':
        return <Badge bg="info">Approved</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejected</Badge>;
      case 'paid':
        return <Badge bg="success">Paid</Badge>;
      default:
        return <Badge bg="secondary">{status || 'N/A'}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    return `$${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Filter data by search query (client-side)
  const filteredData = apiData.filter(request => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (request.customerId?.name || '').toLowerCase().includes(query) ||
      (request.customerId?.mobile || '').toLowerCase().includes(query) ||
      (request.bankId?.bankName || '').toLowerCase().includes(query) ||
      (request.bankId?.accountNumber || '').toLowerCase().includes(query) ||
      (request.utr || '').toLowerCase().includes(query)
    );
  });

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-cash-stack me-2"></i>
          Withdrawal Requests
        </h2>
        <small className="text-muted">Manage customer wallet withdrawal requests</small>
      </div>

      {/* Filters */}
      <Row className="mb-4 align-items-center">
        <Col md={4}>
          <InputGroup style={{ height: '42px' }}>
            <InputGroup.Text style={{ height: '42px' }}>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Search by name, mobile, bank..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ height: '42px' }}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ height: '42px' }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="paid">Paid</option>
          </Form.Select>
        </Col>
        <Col md={5} className="d-flex justify-content-end gap-2">
          <Button variant="outline-secondary" onClick={clearFilters} style={{ height: '42px' }} title="Clear Filters">
            <i className="bi bi-x-lg me-1"></i>
            Clear
          </Button>
          <Button variant="success" onClick={exportToExcel} style={{ height: '42px' }} title="Export Excel">
            <i className="bi bi-file-earmark-excel me-1"></i>
            Export
          </Button>
        </Col>
      </Row>

      {/* Stats */}
      <Row className="mb-3">
        <Col>
          <div className="d-flex gap-3 flex-wrap">
            <div className="px-3 py-2 rounded" style={{ background: '#fff3cd', border: '1px solid #ffc107' }}>
              <small className="text-dark fw-bold">Pending: {apiData.filter(r => r.status === 'pending').length}</small>
            </div>
            <div className="px-3 py-2 rounded" style={{ background: '#cff4fc', border: '1px solid #0dcaf0' }}>
              <small className="text-dark fw-bold">Approved: {apiData.filter(r => r.status === 'approved').length}</small>
            </div>
            <div className="px-3 py-2 rounded" style={{ background: '#d1e7dd', border: '1px solid #198754' }}>
              <small className="text-dark fw-bold">Paid: {apiData.filter(r => r.status === 'paid').length}</small>
            </div>
            <div className="px-3 py-2 rounded" style={{ background: '#f8d7da', border: '1px solid #dc3545' }}>
              <small className="text-dark fw-bold">Rejected: {apiData.filter(r => r.status === 'rejected').length}</small>
            </div>
          </div>
        </Col>
      </Row>

      {/* Table */}
      <div className="table-responsive">
        <Table striped bordered hover className="modern-table">
          <thead>
            <tr>
              <th style={{ width: '140px' }}>Actions</th>
              <th>Customer</th>
              <th>Mobile</th>
              <th>Amount</th>
              <th>Bank Details</th>
              <th>Status</th>
              <th>UTR</th>
              <th>Request Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={5} cols={8} />
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  <i className="bi bi-inbox fs-1 text-muted"></i>
                  <p className="text-muted mt-2 mb-0">No withdrawal requests found</p>
                </td>
              </tr>
            ) : (
              filteredData.map((request, index) => (
                <tr key={request.id || index}>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApproveClick(request)}
                            title="Approve"
                          >
                            <i className="bi bi-check-lg"></i>
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRejectClick(request)}
                            title="Reject"
                          >
                            <i className="bi bi-x-lg"></i>
                          </Button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePaidClick(request)}
                          title="Mark as Paid"
                        >
                          <i className="bi bi-currency-dollar"></i> Paid
                        </Button>
                      )}
                      {(request.status === 'paid' || request.status === 'rejected') && (
                        <span className="text-muted small">-</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{request.customerId?.name || 'N/A'}</strong>
                    </div>
                  </td>
                  <td>{request.customerId?.mobile || 'N/A'}</td>
                  <td>
                    <strong style={{ color: primaryColor }}>{formatAmount(request.amount)}</strong>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px' }}>
                      <div><strong>{request.bankId?.bankName || 'N/A'}</strong></div>
                      <div>A/C: {request.bankId?.accountNumber || 'N/A'}</div>
                      <div>IFSC: {request.bankId?.ifscCode || 'N/A'}</div>
                    </div>
                  </td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td>{request.utr || '-'}</td>
                  <td>
                    <div style={{ fontSize: '12px' }}>
                      {formatDate(request.date || request.createdAt)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            <Form.Select
              size="sm"
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              style={{ width: '80px', display: 'inline-block' }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </Form.Select>
            <span className="ms-2 text-muted small">per page | Total: {totalRecords} records</span>
          </div>
          <Pagination className="mb-0">
            <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
            <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
              if (pageNum > totalPages) return null;
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
            <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
            <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
          </Pagination>
        </div>
      )}

      {/* Approve Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
        <Modal.Header closeButton style={{ background: '#d1e7dd', borderBottom: '1px solid #a3cfbb' }}>
          <Modal.Title>
            <i className="bi bi-check-circle me-2 text-success"></i>
            Approve Withdrawal
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to approve this withdrawal request?</p>
          {selectedRequest && (
            <div className="p-3 bg-light rounded">
              <div><strong>Customer:</strong> {selectedRequest.customerId?.name}</div>
              <div><strong>Amount:</strong> {formatAmount(selectedRequest.amount)}</div>
              <div><strong>Bank:</strong> {selectedRequest.bankId?.bankName}</div>
              <div><strong>Account:</strong> {selectedRequest.bankId?.accountNumber}</div>
            </div>
          )}
          <div className="mt-3 text-muted small">
            <i className="bi bi-info-circle me-1"></i>
            After approval, you can mark it as "Paid" once the amount is transferred.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleApproveSubmit} disabled={approveLoading}>
            {approveLoading ? <Spinner size="sm" animation="border" /> : 'Approve'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton style={{ background: '#f8d7da', borderBottom: '1px solid #f5c2c7' }}>
          <Modal.Title>
            <i className="bi bi-x-circle me-2 text-danger"></i>
            Reject Withdrawal
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to reject this withdrawal request?</p>
          {selectedRequest && (
            <div className="p-3 bg-light rounded mb-3">
              <div><strong>Customer:</strong> {selectedRequest.customerId?.name}</div>
              <div><strong>Amount:</strong> {formatAmount(selectedRequest.amount)}</div>
            </div>
          )}
          <Form.Group>
            <Form.Label>Rejection Reason (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              isInvalid={!!rejectError}
            />
            <Form.Control.Feedback type="invalid">{rejectError}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRejectSubmit} disabled={rejectLoading}>
            {rejectLoading ? <Spinner size="sm" animation="border" /> : 'Reject'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Mark as Paid Modal */}
      <Modal show={showPaidModal} onHide={() => setShowPaidModal(false)} centered>
        <Modal.Header closeButton style={{ background: '#cff4fc', borderBottom: '1px solid #b6effb' }}>
          <Modal.Title>
            <i className="bi bi-currency-dollar me-2 text-primary"></i>
            Mark as Paid
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Confirm that the withdrawal amount has been transferred to the customer's bank account.</p>
          {selectedRequest && (
            <div className="p-3 bg-light rounded mb-3">
              <div><strong>Customer:</strong> {selectedRequest.customerId?.name}</div>
              <div><strong>Amount:</strong> {formatAmount(selectedRequest.amount)}</div>
              <div><strong>Bank:</strong> {selectedRequest.bankId?.bankName}</div>
              <div><strong>Account:</strong> {selectedRequest.bankId?.accountNumber}</div>
              <div><strong>IFSC:</strong> {selectedRequest.bankId?.ifscCode}</div>
            </div>
          )}
          <Form.Group>
            <Form.Label>Transaction Reference / UTR (Optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter bank transaction reference..."
              value={paidUtr}
              onChange={(e) => setPaidUtr(e.target.value)}
            />
            <Form.Text className="text-muted">
              Enter the UTR number or transaction reference for record keeping.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaidModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handlePaidSubmit} disabled={paidLoading}>
            {paidLoading ? <Spinner size="sm" animation="border" /> : 'Confirm Payment'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default WithdrawalRequests;
