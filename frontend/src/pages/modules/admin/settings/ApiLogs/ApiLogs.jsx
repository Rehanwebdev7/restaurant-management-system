import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Row, Col, Pagination, Button } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const ApiLogs = () => {
  const { primaryColor } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');

  useEffect(() => {
    fetchApiLogsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, searchQuery, serviceTypeFilter]);

  const fetchApiLogsData = async () => {
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

      if (serviceTypeFilter) {
        params.serviceType = serviceTypeFilter;
      }

      console.log('Fetching API logs with params:', params);
      const result = await ApiGet('/api/admin/api_logs/getAll', params);
      console.log('API logs response:', result);

      if (result.success) {
        const data = result.success.data.data;
        setApiData(data.records || []);
        setTotalRecords(data.totalRecords || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        setError(result.fail || 'Failed to fetch API logs');
        toast.error(result.fail || 'Failed to fetch API logs');
      }
    } catch (err) {
      console.error('Error fetching API logs:', err);
      setError('Failed to fetch API logs. Check console for details.');
      toast.error('Failed to fetch API logs');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const exportToExcel = () => {
    const exportData = apiData.map(log => ({
      ID: log.id,
      'Service Type': log.serviceType || '',
      'Txn ID': log.txnId || '',
      'Date': log.date || '',
      'Time': log.time || '',
      'Operator No': log.operatorNo || '',
      'API Ref ID': log.apiRefId || '',
      'Latency': log.latency || '',
      'Request': log.request || '',
      'Response': log.response || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'API Logs');
    XLSX.writeFile(workbook, `api_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h4 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-journal-code me-2"></i>
          API Logs
        </h4>
      </div>

      {/* Filters */}
      <Row className="mb-4 align-items-center">
        <Col md={4}>
          <Form.Control
            placeholder="Search by Txn ID, API Ref ID, Operator No..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{ height: '42px' }}
          />
        </Col>
        <Col md={4}>
          <Form.Select
            value={serviceTypeFilter}
            onChange={(e) => {
              setServiceTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{ height: '42px' }}
          >
            <option value="">All Service Types</option>
            <option value="RECHARGE">Recharge</option>
            <option value="BILL_PAYMENT">Bill Payment</option>
            <option value="TRANSFER">Transfer</option>
            <option value="OTHER">Other</option>
          </Form.Select>
        </Col>
        <Col md={4} className="d-flex justify-content-end gap-2">
          <Button
            variant="outline-primary"
            onClick={fetchApiLogsData}
            style={{ height: '42px' }}
            title="Refresh"
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </Button>
        </Col>
      </Row>

      {/* Table */}
      <div className="table-responsive">
        <Table striped bordered hover className="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Service Type</th>
              <th>Txn ID</th>
              <th>Date</th>
              <th>Time</th>
              <th>Operator No</th>
              <th>API Ref ID</th>
              <th>Latency</th>
              <th>Request</th>
              <th>Response</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonLoader rows={rowsPerPage} columns={10} />
            ) : error ? (
              <tr>
                <td colSpan="10" className="text-center py-4 text-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-4 text-muted">
                  <i className="fas fa-inbox me-2"></i>
                  No API logs found
                </td>
              </tr>
            ) : (
              paginatedData.map((log) => (
                <tr key={log.id}>
                  <td><strong>{log.id}</strong></td>
                  <td>{log.serviceType || 'N/A'}</td>
                  <td>{log.txnId || 'N/A'}</td>
                  <td>{log.date || 'N/A'}</td>
                  <td>{log.time || 'N/A'}</td>
                  <td>{log.operatorNo || 'N/A'}</td>
                  <td>{log.apiRefId || 'N/A'}</td>
                  <td>{log.latency || 'N/A'}</td>
                  <td>
                    {log.request ? (
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#0d6efd' }}>View Request</summary>
                        <div style={{ fontSize: '12px', wordBreak: 'break-all', marginTop: '5px', maxHeight: '150px', overflow: 'auto' }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{log.request}</pre>
                        </div>
                      </details>
                    ) : 'N/A'}
                  </td>
                  <td>
                    {log.response ? (
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#0d6efd' }}>View Response</summary>
                        <div style={{ fontSize: '12px', wordBreak: 'break-all', marginTop: '5px', maxHeight: '150px', overflow: 'auto' }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{log.response}</pre>
                        </div>
                      </details>
                    ) : 'N/A'}
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

export default ApiLogs;
