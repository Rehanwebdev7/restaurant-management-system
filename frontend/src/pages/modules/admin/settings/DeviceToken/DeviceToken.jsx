import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Row, Col, Pagination, Badge, Button } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { ApiGet } from '../../../../../ApiServices/ApiServices';
import { useTheme } from '../../../../../contexts/ThemeContext';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import '../../../../../styles/tables.css';

const DeviceToken = () => {
  const { primaryColor } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDeviceTokenData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage]);

  const fetchDeviceTokenData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        pageNumber: currentPage - 1,
        pageSize: rowsPerPage
      };

      const result = await ApiGet('/api/admin/device_token/getAll', params);

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
      setError('Failed to fetch device tokens');
      toast.error('Failed to fetch device tokens');
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = apiData;

  const exportToExcel = () => {
    const exportData = apiData.map(token => ({
      ID: token.id,
      Platform: token.platform || '',
      Token: token.token || '',
      'User ID': token.userstId?.id || '',
      'User Name': token.userstId?.name || '',
      'User Email': token.userstId?.email || '',
      'User Mobile': token.userstId?.mobile || '',
      'Branch Name': token.userstId?.branchId?.name || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Device Tokens');
    XLSX.writeFile(workbook, `device_tokens_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getPlatformBadge = (platform) => {
    switch (platform) {
      case 'ANDROID':
        return <Badge bg="success">ANDROID</Badge>;
      case 'IOS':
        return <Badge bg="secondary">IOS</Badge>;
      case 'WEB':
        return <Badge bg="primary">WEB</Badge>;
      default:
        return <Badge bg="info">{platform}</Badge>;
    }
  };

  return (
    <Container fluid className="py-2">
      <div className="mb-3">
        <h4 style={{ color: primaryColor, fontWeight: '700', marginBottom: 0 }}>
          <i className="bi bi-phone-vibrate me-2"></i>
          Device Tokens
        </h4>
      </div>

      {/* Actions */}
      <Row className="mb-4 align-items-center">
        <Col md={12} className="d-flex justify-content-end gap-2">
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
              <th>ID</th>
              <th>Platform</th>
              <th>Token</th>
              <th>User ID</th>
              <th>User Name</th>
              <th>User Email</th>
              <th>User Mobile</th>
              <th>Branch Name</th>
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
                  No device tokens found
                </td>
              </tr>
            ) : (
              paginatedData.map((token) => (
                <tr key={token.id}>
                  <td><strong>{token.id}</strong></td>
                  <td>{getPlatformBadge(token.platform)}</td>
                  <td>
                    <details>
                      <summary style={{ cursor: 'pointer', color: '#0d6efd' }}>View Token</summary>
                      <div style={{ fontSize: '12px', wordBreak: 'break-all', marginTop: '5px' }}>
                        {token.token}
                      </div>
                    </details>
                  </td>
                  <td>{token.userstId?.id || 'N/A'}</td>
                  <td>{token.userstId?.name || 'N/A'}</td>
                  <td>{token.userstId?.email || 'N/A'}</td>
                  <td>{token.userstId?.mobile || 'N/A'}</td>
                  <td>{token.userstId?.branchId?.name || 'N/A'}</td>
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

export default DeviceToken;
