import React, { useState, useMemo, useEffect } from 'react';
import { Table, Form, InputGroup, Button, Row, Col, Pagination } from 'react-bootstrap';
import TableSkeletonLoader from '../../../../../components/common/TableSkeletonLoader';
import * as XLSX from 'xlsx';
import UserFormModal from '../../../../../components/modals/UserFormModal';
import OrderFormModal from '../../../../../components/modals/OrderFormModal';
import { ApiGet } from '../../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import '../../../../../styles/tables.css';

const OfflineOrders = () => {
  const dummyorders = [
  {
    orderTrackingNo: "OFF-20241110-001",
    name: "Rakesh Sharma",
    mobile: "9876543210",
    areaCode: "DEL-110001",
    date: "2024-11-10",
    total: "$1,550",
    deliveryStatus: "Pending",
    paymentMethod: "Cash",
  },
  {
    orderTrackingNo: "OFF-20241111-012",
    name: "Neha Patel",
    mobile: "9988776655",
    areaCode: "MUM-400051",
    date: "2024-11-11",
    total: "$2,299",
    deliveryStatus: "Delivered",
    paymentMethod: "Card Swipe",
  },
  {
    orderTrackingNo: "OFF-20241112-019",
    name: "Sanjay Verma",
    mobile: "9123456789",
    areaCode: "BLR-560001",
    date: "2024-11-12",
    total: "$899",
    deliveryStatus: "Cancelled",
    paymentMethod: "Cash",
  },
  {
    orderTrackingNo: "OFF-20241113-025",
    name: "Pooja Singh",
    mobile: "9000012345",
    areaCode: "HYD-500032",
    date: "2024-11-13",
    total: "$1,799",
    deliveryStatus: "Delivered",
    paymentMethod: "Card Swipe",
  },
  {
    orderTrackingNo: "OFF-20241114-033",
    name: "Vikram Chauhan",
    mobile: "9898989898",
    areaCode: "KOL-700020",
    date: "2024-11-14",
    total: "$3,050",
    deliveryStatus: "Pending",
    paymentMethod: "Cash",
  },
];

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState({
    id: '',
    legalName: '',
    brandName: '',
    ownerName: '',
    mobile: '',
    email: '',
    status: '',
    balance: '',
    pincode: ''
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

  const userType = 'offline_orders';
  const userRole = 'Offline Orders';
  const data = dummyorders;
  const allowAdd = false;
  const allowEdit = true;
  const allowExport = true;

  // Fetch data from API
  useEffect(() => {
    fetchUserData();
  }, [dateRange, searchQuery, currentPage, rowsPerPage]);

  const fetchUserData = async () => {
    setApiData(dummyorders);
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
      { key: 'orderTrackingNo', label: 'Order Tracking No.' },
      { key: 'couponCode', label: 'Coupon Code' },
      { key: 'name', label: 'Name' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'areaCode', label: 'Area Code' },
      {
        key: 'date',
        label: 'Date',
        render: (row) => row.date ? new Date(row.date).toLocaleDateString() : '-'
      },
      { key: 'total', label: 'Total' },
      { key: 'deliveryStatus', label: 'Delivery Status' },
      { key: 'paymentMethod', label: 'Payment Method' }
    ];

    return allowEdit ? [{ key: 'actions', label: 'Actions' }, ...baseColumns] : baseColumns;
  }, [allowEdit]);

  // Field configurations for order forms
  const orderFields = [
    {
      name: 'orderTrackingNo',
      label: 'Order Tracking No.',
      type: 'text',
      required: true,
      placeholder: 'ORD-YYYYMMDD-XXX',
      colSize: 6
    },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      placeholder: 'Enter customer name',
      colSize: 6
    },
    {
      name: 'mobile',
      label: 'Mobile',
      type: 'tel',
      required: true,
      placeholder: '9876543210',
      helpText: 'Enter 10-digit mobile number',
      colSize: 6,
      validation: (value) => {
        const phoneDigits = value?.replace(/[\s+]/g, '').replace(/^91/, '');
        if (!/^\d{10}$/.test(phoneDigits)) {
          return 'Mobile number must be 10 digits';
        }
        return null;
      }
    },
    {
      name: 'areaCode',
      label: 'Area Code',
      type: 'text',
      required: true,
      placeholder: 'DEL-110092',
      colSize: 6
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      required: true,
      defaultValue: new Date().toISOString().split('T')[0],
      max: new Date().toISOString().split('T')[0],
      colSize: 6
    },
    {
      name: 'total',
      label: 'Total',
      type: 'text',
      required: true,
      placeholder: '$1,299',
      colSize: 6
    },
    {
      name: 'deliveryStatus',
      label: 'Delivery Status',
      type: 'select',
      required: true,
      options: [
        { value: 'New Order', label: 'New Order' },
        { value: 'Preparing', label: 'Preparing' },
        { value: 'On The Way', label: 'On The Way' },
        { value: 'Delivered', label: 'Delivered' },
        { value: 'Cancelled', label: 'Cancelled' },
        { value: 'Pending', label: 'Pending' }
      ],
      colSize: 6
    },
    {
      name: 'paymentMethod',
      label: 'Payment Method',
      type: 'select',
      required: true,
      options: [
        { value: 'UPI', label: 'UPI' },
        { value: 'Credit Card', label: 'Credit Card' },
        { value: 'Debit Card', label: 'Debit Card' },
        { value: 'Cash on Delivery', label: 'Cash on Delivery' },
        { value: 'Net Banking', label: 'Net Banking' },
        { value: 'Cash', label: 'Cash' },
        { value: 'Card Swipe', label: 'Card Swipe' }
      ],
      colSize: 6
    }
  ];

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
    <div className="offline-orders-page">
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
                <TableSkeletonLoader rows={rowsPerPage} columns={columns.length} />
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
          <OrderFormModal
            show={showModal}
            handleClose={handleCloseModal}
            mode={modalMode}
            orderData={selectedUser}
            onSave={handleSaveUser}
            title={userRole}
            fields={orderFields}
          />
        )}
      </div>
    </div>
  );
};

export default OfflineOrders;
