import React, { useState, useMemo, useEffect } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import UserFormModal from '../../../../../components/modals/UserFormModal';
import OrderFormModal from '../../../../../components/modals/OrderFormModal';
import { ApiGet } from '../../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import '../../../../../styles/tables.css';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';

const Products = () => {
  const productsData = [
    { id: 'PRD001', title: '24K Gold Coin 10gm', images: 'gold-coin-10g.jpg', todaysDeal: 'Yes', publish: 'Published', feature: 'Featured' },
    { id: 'PRD002', title: '22K Gold Chain', images: 'gold-chain.jpg', todaysDeal: 'No', publish: 'Published', feature: 'Not Featured' },
    { id: 'PRD003', title: 'Gold Bar 50gm', images: 'gold-bar-50g.jpg', todaysDeal: 'Yes', publish: 'Published', feature: 'Featured' },
    { id: 'PRD004', title: 'Gold Biscuit 100gm', images: 'gold-biscuit.jpg', todaysDeal: 'No', publish: 'Draft', feature: 'Not Featured' },
    { id: 'PRD005', title: 'Silver Coin 50gm', images: 'silver-coin.jpg', todaysDeal: 'Yes', publish: 'Published', feature: 'Featured' }
  ];

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState({
    id: '',
    title: '',
    images: '',
    todaysDeal: '',
    publish: '',
    feature: ''
  });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  // API data state
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);

  const userType = 'products';
  const userRole = 'Products Management';
  const data = productsData;
  const allowAdd = true;
  const allowEdit = true;
  const allowExport = true;

  // Fetch data from API
  useEffect(() => {
    fetchUserData();
  }, [dateRange, searchQuery, currentPage, rowsPerPage]);

  const fetchUserData = async () => {
        setApiData(productsData);

    // setLoading(true);
    // try {
    //   const response = await ApiGet(
    //     '/api/admin/users/filter',
    //     dateRange.start,
    //     dateRange.end,
    //     userType,
    //     searchQuery,
    //     currentPage - 1,
    //     rowsPerPage
    //   );

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

  // Column definitions
  const columns = useMemo(() => {
    const baseColumns = [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Title' },
      { key: 'images', label: 'Images' },
      { key: 'todaysDeal', label: "Today's Deal" },
      { key: 'publish', label: 'Publish' },
      { key: 'feature', label: 'Feature' }
    ];

    return allowEdit ? [{ key: 'actions', label: 'Actions' }, ...baseColumns] : baseColumns;
  }, [allowEdit]);

  // Use prop data if available, otherwise use API data
  const dataSource = useMemo(() => {
    return data && data.length > 0 ? data : apiData;
  }, [data, apiData]);

  // Filter data based on column filters
  const filteredData = useMemo(() => {
    let filtered = [...dataSource];

    Object.keys(columnFilters).forEach(key => {
      if (columnFilters[key]) {
        filtered = filtered.filter(row =>
          String(row[key]).toLowerCase().includes(columnFilters[key].toLowerCase())
        );
      }
    });

    return filtered;
  }, [dataSource, columnFilters]);

  // Pagination
  const isUsingPropData = data && data.length > 0;
  const actualTotalRecords = isUsingPropData ? filteredData.length : totalRecords;
  const totalPages = Math.ceil(actualTotalRecords / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, actualTotalRecords);

  const currentData = isUsingPropData
    ? filteredData.slice(startIndex, startIndex + rowsPerPage)
    : filteredData;

  const renderCellValue = (row, column) => {
    if (typeof column.render === 'function') {
      return column.render(row, row[column.key], column);
    }
    return row[column.key];
  };

  // Handle date range change
  const handleDateRangeChange = (type, value) => {
    setDateRange(prev => ({ ...prev, [type]: value }));
    setCurrentPage(1);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, userRole);
    XLSX.writeFile(workbook, `${userRole}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Handle Add User
  const handleAddUser = () => {
    if (!allowAdd) return;
    setModalMode('add');
    setSelectedUser(null);
    setShowModal(true);
  };

  // Handle Edit User
  const handleEditUser = (user) => {
    if (!allowEdit) return;
    setModalMode('edit');
    setSelectedUser(user);
    setShowModal(true);
  };

  // Handle Modal Close
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  // Handle Save User
  const handleSaveUser = (userData) => {
    fetchUserData();
    handleCloseModal();
  };

  // Pagination component
  const renderPagination = () => {
    const items = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      />
    );

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next
        key="next"
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      />
    );

    return items;
  };

  return (
    <Container fluid>
      <div className="user-table-container">
        {/* Header with Title, Date Range, Search, Add User, and Export */}
        <Row className="mb-3 g-2 align-items-center">
          <Col lg={3} md={4} sm={12}>
            <h4 className="mb-0" style={{ color: '#1e293b', fontWeight: '700', fontSize: '1.5rem' }}>
              {userRole}
            </h4>
          </Col>
          <Col lg={9} md={8} sm={12} className="d-flex justify-content-end gap-2">
            <Form.Control
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              style={{ maxWidth: '150px' }}
            />
            <Form.Control
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              style={{ maxWidth: '150px' }}
            />
            <InputGroup style={{ maxWidth: '250px' }}>
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </InputGroup>
            {allowAdd && (
              <Button
                size="sm"
                onClick={handleAddUser}
                className="btn-outline-primary-custom"
                style={{
                  padding: '0.4rem 1rem 0.5rem 1rem',
                  fontSize: '0.875rem',
                  height: 'auto'
                }}
              >
                <i className="bi bi-plus me-1"></i> Add
              </Button>
            )}
            {/* {allowExport && (
              <Button
                size="sm"
                variant="success"
                onClick={handleExportExcel}
                style={{
                  padding: '0.4rem 1rem 0.5rem 1rem',
                  fontSize: '0.875rem',
                  height: 'auto'
                }}
              >
                <i className="bi bi-file-earmark-excel me-1"></i> Excel
              </Button>
            )} */}
          </Col>
        </Row>

        {/* Table */}
        <div className="table-responsive" style={{ background: '#f0f2f5', borderRadius: '12px', padding: '0' }}>
          <Table bordered hover className="modern-table" style={{ background: '#f0f2f5' }}>
            <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonLoader rows={rowsPerPage} columns={7} />
              ) : currentData.length > 0 ? (
                currentData.map((row, index) => (
                  <tr key={index} style={{ background: '#f0f2f5' }}>
                    {columns.map((column) => (
                      <td key={column.key}>
                        {column.key === 'actions' ? (
                          <div className="d-flex gap-1 justify-content-center align-items-center">
                            <Button
                              size="sm"
                              title="Edit"
                              onClick={() => handleEditUser(row)}
                              className="btn-outline-primary-custom"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                          </div>
                        ) : (
                          renderCellValue(row, column)
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-4">
                    <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                    <span className="text-muted">No data found</span>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <Row className="align-items-center mt-4 pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
          <Col lg={6} md={6} sm={12} className="mb-2 mb-md-0">
            <span style={{
              fontSize: '0.9rem',
              color: '#64748b',
              fontWeight: '500'
            }}>
              Showing <strong style={{ color: '#667eea' }}>{actualTotalRecords > 0 ? startIndex + 1 : 0}</strong> to <strong style={{ color: '#667eea' }}>{endIndex}</strong> of <strong style={{ color: '#667eea' }}>{actualTotalRecords}</strong> entries
            </span>
          </Col>
          <Col lg={6} md={6} sm={12} className="d-flex justify-content-end">
            <Pagination className="mb-0">{renderPagination()}</Pagination>
          </Col>
        </Row>

        {/* Add/Edit Modal */}
        {(allowAdd || allowEdit) && (
          <UserFormModal
            show={showModal}
            handleClose={handleCloseModal}
            mode={modalMode}
            userData={selectedUser}
            onSave={handleSaveUser}
            userRole={userRole}
            showLimitField={false}
          />
        )}
      </div>
    </Container>
  );
};

export default Products;
