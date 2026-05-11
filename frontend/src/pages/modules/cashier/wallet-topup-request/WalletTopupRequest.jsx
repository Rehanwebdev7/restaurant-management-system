import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner, Modal } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet, ApiPut } from '../../../../ApiServices/ApiServices';
import TableSkeletonLoader from '../../../../components/common/TableSkeletonLoader';
import { useTheme } from '../../../../contexts/ThemeContext';
import '../../../../styles/tables.css';

const WalletTopupRequest = () => {
  const { primaryColor } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // Approve Modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveReason, setApproveReason] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);

  // Reject Modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState('');


  useEffect(() => {
    fetchWalletTopupRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, dateRange]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchWalletTopupRequests();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchWalletTopupRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage,
        status: 'pending'
      };

      if (searchQuery.trim()) {
        params.searchValue = searchQuery.trim();
      }

      if (startDate) {
        params.fromDate = startDate.toISOString().split('T')[0];
      }

      if (endDate) {
        params.toDate = endDate.toISOString().split('T')[0];
      }

      const result = await ApiGet('/api/cashier/wallet_topup_request/filter', params);

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
      setError('Failed to fetch wallet topup requests');
      toast.error('Failed to fetch wallet topup requests');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (update) => {
    setDateRange(update);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange([null, null]);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const exportData = apiData.map(request => ({
      'User Name': request.userId?.name || '',
      'Mobile': request.userId?.mobile || '',
      'Amount': request.amount ?? 0,
      'Bank Name': request.bankName || '',
      'UTR': request.utr || '',
      'Status': request.status || '',
      'Date': request.date ? new Date(request.date).toLocaleString() : 'N/A',
      'Reason': request.reason || '',
      'Remark': request.remark || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Wallet Topup Requests');
    XLSX.writeFile(workbook, `wallet_topup_requests_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setApproveReason('');
    setShowApproveModal(true);
  };

  const handleApproveSubmit = async () => {
    setApproveLoading(true);

    try {
      const payload = {
        id: selectedRequest.id,
        status: 'approved'
      };

      if (approveReason.trim()) {
        payload.reason = approveReason.trim();
      }

      const result = await ApiPut('/api/cashier/wallet_topup_request/update', payload);

      if (result.success) {
        toast.success('Request approved successfully');
        setShowApproveModal(false);
        fetchWalletTopupRequests();
      } else {
        toast.error(result.fail || 'Failed to approve request');
      }
    } catch (err) {
      toast.error('Failed to approve request');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectReason('');
    setRejectError('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      setRejectError('Reason is required for rejection');
      return;
    }

    setRejectLoading(true);

    try {
      const payload = {
        id: selectedRequest.id,
        status: 'rejected',
        reason: rejectReason.trim()
      };

      const result = await ApiPut('/api/cashier/wallet_topup_request/update', payload);

      if (result.success) {
        toast.success('Request rejected successfully');
        setShowRejectModal(false);
        fetchWalletTopupRequests();
      } else {
        toast.error(result.fail || 'Failed to reject request');
      }
    } catch (err) {
      toast.error('Failed to reject request');
    } finally {
      setRejectLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge bg="warning" text="dark">Pending</Badge>;
      case 'approved':
        return <Badge bg="success">Approved</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejected</Badge>;
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

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-wallet-fill me-2"></i>
          TopUp Request
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
              placeholder="Search by name, UTR, bank..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ height: '42px' }}
            />
          </InputGroup>
        </Col>
        <Col md={4}>
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateRangeChange}
            isClearable={true}
            placeholderText="Select date range"
            className="form-control"
            dateFormat="dd-MM-yyyy"
            maxDate={new Date()}
          />
        </Col>
        <Col md={4} className="d-flex justify-content-end gap-2">
          <Button variant="outline-secondary" onClick={clearFilters} style={{ height: '42px' }} title="Clear Filters">
            <i className="bi bi-x-lg me-1"></i>
            Clear
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
              <th>Action</th>
              <th>User Name</th>
              <th>Mobile</th>
              <th>Amount</th>
              <th>Bank Name</th>
              <th>UTR</th>
              <th>Status</th>
              <th>Date</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={9} />
            ) : error ? (
              <tr>
                <td colSpan="9" className="text-center py-4 text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4 text-muted">
                  <i className="bi bi-inbox me-2"></i>
                  No wallet topup requests found
                </td>
              </tr>
            ) : (
              paginatedData.map((request, index) => (
                <tr key={request.id || index}>
                  <td>
                    {request.status?.toLowerCase() === 'pending' ? (
                      <div className="d-flex gap-1">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleApproveClick(request)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRejectClick(request)}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>{request.userId?.name || 'N/A'}</td>
                  <td>{request.userId?.mobile || 'N/A'}</td>
                  <td>
                    <Badge bg="info">
                      ${request.amount ?? 0}
                    </Badge>
                  </td>
                  <td>{request.bankName || 'N/A'}</td>
                  <td>{request.utr || 'N/A'}</td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td>{formatDate(request.date)}</td>
                  <td>
                    {request.reason ? (
                      <details>
                        <summary style={{ cursor: 'pointer', color: primaryColor }}>
                          View Reason
                        </summary>
                        <div style={{ marginTop: '5px', fontSize: '12px' }}>
                          {request.reason}
                        </div>
                      </details>
                    ) : (
                      'N/A'
                    )}
                  </td>
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

      {/* Approve Modal */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-check-circle me-2 text-success"></i>
            Approve Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Reason <span className="text-muted">(Optional)</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={approveReason}
              onChange={(e) => setApproveReason(e.target.value)}
              placeholder="Enter reason for approval (optional)"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleApproveSubmit}
            disabled={approveLoading}
          >
            {approveLoading ? (
              <>
                <Spinner animation="border" size="sm" style={{ width: '1rem', height: '1rem' }} className="me-2" />
                Approving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                Approve
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-x-circle me-2 text-danger"></i>
            Reject Request
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Reason <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError('');
              }}
              placeholder="Enter reason for rejection"
              isInvalid={!!rejectError}
            />
            <Form.Control.Feedback type="invalid">
              {rejectError}
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleRejectSubmit}
            disabled={rejectLoading}
          >
            {rejectLoading ? (
              <>
                <Spinner animation="border" size="sm" style={{ width: '1rem', height: '1rem' }} className="me-2" />
                Rejecting...
              </>
            ) : (
              <>
                <i className="bi bi-x-lg me-2"></i>
                Reject
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default WalletTopupRequest;
