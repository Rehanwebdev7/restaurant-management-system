import React, { useState, useMemo, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import UserFormModal from '../../../../../components/modals/UserFormModal';
import { ApiGet } from '../../../../../ApiServices/ApiServices';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import { toast } from 'react-toastify';
import '../../../../../styles/tables.css';

const SupportManagement = () => {
  const supportData = [
    { id: 'SUP001', legalName: 'Customer Support India Pvt Ltd', brandName: 'dms Support Team', ownerName: 'Vikram Singh', mobile: '+91 9123456789', email: 'vikram.support@rms.local', balance: '$50,000', balanceCaping: '$1,00,000', pincode: '400001', status: 'Active', registerAt: '2024-01-10T09:00:00Z' },
    { id: 'SUP002', legalName: 'Tech Support Solutions', brandName: 'dms Tech Support', ownerName: 'Anita Desai', mobile: '+91 9123456790', email: 'anita.support@rms.local', balance: '$75,000', balanceCaping: '$1,50,000', pincode: '110002', status: 'Active', registerAt: '2024-02-15T10:30:00Z' },
    { id: 'SUP003', legalName: 'Help Desk Services', brandName: 'dms Help Desk', ownerName: 'Rohan Mehta', mobile: '+91 9123456791', email: 'rohan.support@rms.local', balance: '$30,000', balanceCaping: '$75,000', pincode: '560002', status: 'Inactive', registerAt: '2024-03-20T11:45:00Z' },
    { id: 'SUP004', legalName: 'Customer Care Associates', brandName: 'dms Customer Care', ownerName: 'Deepika Rao', mobile: '+91 9123456792', email: 'deepika.support@rms.local', balance: '$60,000', balanceCaping: '$1,20,000', pincode: '700002', status: 'Active', registerAt: '2024-01-25T13:15:00Z' }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);

  const userType = 'support';
  const userRole = 'Support Management';
  const data = supportData;
  const allowAdd = true;
  const allowEdit = true;
  const allowExport = true;

  useEffect(() => {
    fetchUserData();
  }, [dateRange, searchQuery, currentPage, rowsPerPage]);

  const fetchUserData = async () => {
    setApiData(supportData);
    // setLoading(true);
    // try {
    //   const response = await ApiGet('/api/restaurant/users/filter', dateRange.start, dateRange.end, userType, searchQuery, currentPage - 1, rowsPerPage);
    //   if (response.success) {
    //     setApiData(response.success.data?.records || []);
    //     setTotalRecords(response.success.data?.totalRecords || 0);
    //   } else {
    //     toast.error(response.fail || 'Failed to fetch data');
    //     setApiData([]);
    //   }
    // } catch (error) {
    //   toast.error('Error fetching user data');
    //   setApiData([]);
    // } finally {
    //   setLoading(false);
    // }
  };

  const columns = useMemo(() => {
    const baseColumns = [
      { key: 'id', label: 'ID' },
      { key: 'legalName', label: 'Legal Name' },
      { key: 'brandName', label: 'Brand Name' },
      { key: 'ownerName', label: 'Owner Name' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'email', label: 'Email' },
      { key: 'balance', label: 'Balance' },
      { key: 'balanceCaping', label: 'Balance Caping' },
      { key: 'pincode', label: 'Pincode' },
      { key: 'status', label: 'Status' },
      { key: 'registerAt', label: 'Register At', render: (row) => row.registerAt ? new Date(row.registerAt).toLocaleString() : '-' }
    ];
    return allowEdit ? [{ key: 'actions', label: 'Actions' }, ...baseColumns] : baseColumns;
  }, [allowEdit]);

  const dataSource = useMemo(() => data && data.length > 0 ? data : apiData, [data, apiData]);
  const filteredData = useMemo(() => {
    let filtered = [...dataSource];
    Object.keys(columnFilters).forEach(key => {
      if (columnFilters[key]) {
        filtered = filtered.filter(row => String(row[key]).toLowerCase().includes(columnFilters[key].toLowerCase()));
      }
    });
    return filtered;
  }, [dataSource, columnFilters]);

  const isUsingPropData = data && data.length > 0;
  const actualTotalRecords = isUsingPropData ? filteredData.length : totalRecords;
  const totalPages = Math.ceil(actualTotalRecords / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, actualTotalRecords);
  const currentData = isUsingPropData ? filteredData.slice(startIndex, startIndex + rowsPerPage) : filteredData;

  const renderCellValue = (row, column) => {
    if (typeof column.render === 'function') return column.render(row, row[column.key], column);
    return row[column.key];
  };

  const handleDateRangeChange = (type, value) => {
    setDateRange(prev => ({ ...prev, [type]: value }));
    setCurrentPage(1);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, userRole);
    XLSX.writeFile(workbook, `${userRole}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleAddUser = () => {
    if (!allowAdd) return;
    setModalMode('add');
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    if (!allowEdit) return;
    setModalMode('edit');
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleSaveUser = (userData) => {
    fetchUserData();
    handleCloseModal();
  };

  const renderPagination = () => {
    const items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);

    items.push(<Pagination.Prev key="prev" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} />);
    for (let page = startPage; page <= endPage; page++) {
      items.push(<Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>{page}</Pagination.Item>);
    }
    items.push(<Pagination.Next key="next" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} />);
    return items;
  };

  return (
    <Container fluid>
      <div className="user-table-container">
        <Row className="mb-3 g-2 align-items-center">
          <Col lg={3} md={4} sm={12}>
            <h4 className="mb-0" style={{ color: '#1e293b', fontWeight: '700', fontSize: '1.5rem' }}>{userRole}</h4>
          </Col>
          <Col lg={9} md={8} sm={12} className="d-flex justify-content-end gap-2">
            <Form.Control type="date" value={dateRange.start} onChange={(e) => handleDateRangeChange('start', e.target.value)} style={{ maxWidth: '150px' }} />
            <Form.Control type="date" value={dateRange.end} onChange={(e) => handleDateRangeChange('end', e.target.value)} style={{ maxWidth: '150px' }} />
            <InputGroup style={{ maxWidth: '250px' }}>
              <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
              <Form.Control type="text" placeholder="Search..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
            </InputGroup>
            {allowAdd && <Button size="sm" onClick={handleAddUser} className="btn-outline-primary-custom" style={{ padding: '0.4rem 1rem 0.5rem 1rem', fontSize: '0.875rem', height: 'auto' }}><i className="bi bi-plus me-1"></i> Add</Button>}
            {/* {allowExport && <Button size="sm" variant="success" onClick={handleExportExcel} style={{ padding: '0.4rem 1rem 0.5rem 1rem', fontSize: '0.875rem', height: 'auto' }}><i className="bi bi-file-earmark-excel me-1"></i> Excel</Button>} */}
          </Col>
        </Row>

        <div className="table-responsive" style={{ background: '#f0f2f5', borderRadius: '12px', padding: '0' }}>
          <Table bordered hover className="modern-table" style={{ background: '#f0f2f5' }}>
            <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader rows={rowsPerPage} columns={columns.length} />
              ) : currentData.length > 0 ? (
                currentData.map((row, index) => (
                  <tr key={index} style={{ background: '#f0f2f5' }}>
                    {columns.map((column) => (
                      <td key={column.key}>
                        {column.key === 'actions' ? (
                          <div className="d-flex gap-1 justify-content-center align-items-center">
                            <Button size="sm" title="Edit" onClick={() => handleEditUser(row)} className="btn-outline-primary-custom"><i className="bi bi-pencil"></i></Button>
                          </div>
                        ) : renderCellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={columns.length} className="text-center py-4"><i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i><span className="text-muted">No data found</span></td></tr>
              )}
            </tbody>
          </Table>
        </div>

        <Row className="align-items-center mt-4 pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
          <Col lg={6} md={6} sm={12} className="mb-2 mb-md-0">
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
              Showing <strong style={{ color: '#667eea' }}>{actualTotalRecords > 0 ? startIndex + 1 : 0}</strong> to <strong style={{ color: '#667eea' }}>{endIndex}</strong> of <strong style={{ color: '#667eea' }}>{actualTotalRecords}</strong> entries
            </span>
          </Col>
          <Col lg={6} md={6} sm={12} className="d-flex justify-content-end">
            <Pagination className="mb-0">{renderPagination()}</Pagination>
          </Col>
        </Row>

        {(allowAdd || allowEdit) && (
          <UserFormModal show={showModal} handleClose={handleCloseModal} mode={modalMode} userData={selectedUser} onSave={handleSaveUser} userRole={userRole} showLimitField={true} />
        )}
      </div>
    </Container>
  );
};

export default SupportManagement;
