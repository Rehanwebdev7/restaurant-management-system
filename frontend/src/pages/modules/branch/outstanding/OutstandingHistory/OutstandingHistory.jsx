import React, { useState, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Badge, Spinner } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { server_api } from '../../../../../utils/constants';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const OutstandingHistory = () => {
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
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchOutstandingHistoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, dateRange]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchOutstandingHistoryData();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchOutstandingHistoryData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage,
        // mode: modeFilter
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

      const result = await ApiGet('/api/branch/outstanding/filter', params);

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
      setError('Failed to fetch outstanding history');
      toast.error('Failed to fetch outstanding history');
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
        `${server_api()}/api/branch/outstanding/xl_export?fromDate=${fromDate}&toDate=${toDate}`,
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
      link.download = `OutstandingHistory_${fromDate}_to_${toDate}.xlsx`;
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

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h2 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-clock-history me-2"></i>
          Outstanding History
        </h2>
      </div>

      {/* Filters */}
      <Row className="mb-4 align-items-center">
        <Col md={3}>
          <InputGroup style={{ height: '42px' }}>
            <InputGroup.Text style={{ height: '42px' }}>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ height: '42px' }}
            />
          </InputGroup>
        </Col>
        <Col md={4} style={{ position: 'relative', zIndex: 1000 }}>
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
        <Col md={5} className="d-flex justify-content-end gap-2">
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
              <th>Opening Bal</th>
              <th>Amount</th>
              <th>Closing Bal</th>
              <th>Date</th>
              <th>Time</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={8} />
            ) : error ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No outstanding history found
                </td>
              </tr>
            ) : (
              paginatedData.map((history, index) => (
                <tr key={history.id || index}>
                  <td>{history.userId?.name || 'N/A'}</td>
                  <td>{history.userId?.mobile || 'N/A'}</td>
                  <td>${history.openingBal ?? 0}</td>
                  <td>
                    <Badge bg={history.mode === 1 ? 'danger' : 'success'}>
                      {history.mode === 1 ? '-' : '+'}${history.amount ?? 0}
                    </Badge>
                  </td>
                  <td>${history.closingBal ?? 0}</td>
                  <td>{history.date || 'N/A'}</td>
                  <td>{history.time || 'N/A'}</td>
                  <td>
                    {history.remark ? (
                      <details>
                        <summary style={{ cursor: 'pointer', color: primaryColor }}>
                          View Remark
                        </summary>
                        <div style={{ marginTop: '5px', fontSize: '12px' }}>
                          {history.remark}
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

export default OutstandingHistory;
