import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../contexts/ThemeContext';
import { server_api } from '../../../../utils/constants';
import TableSkeletonLoader from '../../../../components/common/TableSkeletonLoader';
import '../../../../styles/tables.css';

const TopupHistory = () => {
  const { primaryColor } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchTopupHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, statusFilter, dateRange]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchTopupHistory();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchTopupHistory = async () => {
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

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (startDate) {
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        params.fromDate = `${year}-${month}-${day}`;
      }

      if (endDate) {
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        params.toDate = `${year}-${month}-${day}`;
      }

      const result = await ApiGet('/api/branch/wallet_topup_request/history', params);

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
      setError('Failed to fetch topup history');
      toast.error('Failed to fetch topup history');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (update) => {
    setDateRange(update);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateRange([null, null]);
    setCurrentPage(1);
  };

  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleExportExcel = async () => {
    if (!startDate || !endDate) {
      toast.warning('Please select both From Date and To Date to export Excel');
      return;
    }

    setExportLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const fromDate = formatDateLocal(startDate);
      const toDate = formatDateLocal(endDate);

      const response = await fetch(
        `${server_api()}/api/branch/wallet_topup_request/xl_export?fromDate=${fromDate}&toDate=${toDate}`,
        {
          method: 'GET',
          headers: {
            'access_token': token
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TopupHistory_${fromDate}_to_${toDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Excel exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export Excel');
    } finally {
      setExportLoading(false);
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
          <i className="bi bi-clock-history me-2"></i>
          TopUp History
        </h2>
      </div>

      {/* Filters */}
      <Row className="mb-4 align-items-center g-2">
        <Col md={3}>
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
        <Col md="auto" style={{ position: 'relative', zIndex: 1000 }}>
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
            popperProps={{ strategy: 'fixed' }}
          />
        </Col>
        <Col md="auto">
          <Form.Select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            style={{ height: '42px' }}
          >
            <option value="">All Status</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Form.Select>
        </Col>
        <Col className="d-flex justify-content-end gap-2">
          <Button variant="outline-secondary" onClick={clearFilters} style={{ height: '42px' }} title="Clear Filters">
            <i className="bi bi-x-lg me-1"></i>
            Clear
          </Button>
          <Button
            variant="success"
            onClick={handleExportExcel}
            disabled={exportLoading || !startDate || !endDate}
            style={{ height: '42px' }}
            title={!startDate || !endDate ? 'Select date range to export' : 'Export to Excel'}
          >
            {exportLoading ? (
              <Spinner size="sm" animation="border" />
            ) : (
              <>
                <i className="bi bi-file-earmark-excel me-1"></i>
                Excel
              </>
            )}
          </Button>
        </Col>
      </Row>

      {/* Table */}
      <div className="table-responsive">
        <Table striped bordered hover className="modern-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Mobile</th>
              <th>Amount</th>
              <th>Bank Name</th>
              <th>UTR</th>
              <th>Status</th>
              <th>Approved By</th>
              <th>Approved Date</th>
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
                  No topup history found
                </td>
              </tr>
            ) : (
              paginatedData.map((request, index) => (
                <tr key={request.id || index}>
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
                  <td>{request.approvedById?.name || 'N/A'}</td>
                  <td>{formatDate(request.approvedDate)}</td>
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
    </Container>
  );
};

export default TopupHistory;
