import React, { useState, useMemo } from 'react';
import { Container, Table, Form, InputGroup, Button, Row, Col, Pagination, Card } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import '../../../../../styles/tables.css';

const DepositReports = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dueFilter, setDueFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // Sample reports data
  const [reports] = useState([
    {
      id: 1,
      date: '2024-01-15',
      customerName: 'Rajesh Kumar',
      mobileNumber: '9876543210',
      paymentMode: 'Cash',
      amount: 5000,
      isDue: false
    },
    {
      id: 2,
      date: '2024-02-15',
      customerName: 'Rajesh Kumar',
      mobileNumber: '9876543210',
      paymentMode: 'Online',
      amount: 5000,
      isDue: false
    },
    {
      id: 3,
      date: '2024-01-20',
      customerName: 'Priya Sharma',
      mobileNumber: '9123456789',
      paymentMode: 'UPI',
      amount: 10000,
      isDue: false
    },
    {
      id: 4,
      date: '2024-02-20',
      customerName: 'Priya Sharma',
      mobileNumber: '9123456789',
      paymentMode: 'Cheque',
      amount: 10000,
      isDue: false
    },
    {
      id: 5,
      date: '2024-03-15',
      customerName: 'Rajesh Kumar',
      mobileNumber: '9876543210',
      paymentMode: 'Cash',
      amount: 5000,
      isDue: false
    },
    {
      id: 6,
      date: '2024-06-15',
      customerName: 'Rajesh Kumar',
      mobileNumber: '9876543210',
      paymentMode: 'Pending',
      amount: 5000,
      isDue: true
    },
    {
      id: 7,
      date: '2024-03-20',
      customerName: 'Priya Sharma',
      mobileNumber: '9123456789',
      paymentMode: 'Cash',
      amount: 10000,
      isDue: false
    },
    {
      id: 8,
      date: '2024-06-20',
      customerName: 'Priya Sharma',
      mobileNumber: '9123456789',
      paymentMode: 'Pending',
      amount: 10000,
      isDue: true
    },
    {
      id: 9,
      date: '2023-12-10',
      customerName: 'Amit Patel',
      mobileNumber: '9988776655',
      paymentMode: 'Online',
      amount: 3000,
      isDue: false
    },
    {
      id: 10,
      date: '2024-01-10',
      customerName: 'Amit Patel',
      mobileNumber: '9988776655',
      paymentMode: 'UPI',
      amount: 3000,
      isDue: false
    }
  ]);

  // Filter data
  const filteredData = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch =
        report.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.mobileNumber.includes(searchQuery) ||
        report.paymentMode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.collectedBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDue =
        dueFilter === 'all' ||
        (dueFilter === 'due' && report.isDue) ||
        (dueFilter === 'paid' && !report.isDue);

      const reportDate = new Date(report.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const matchesDateRange =
        (!start || reportDate >= start) &&
        (!end || reportDate <= end);

      return matchesSearch && matchesDue && matchesDateRange;
    });
  }, [reports, searchQuery, dueFilter, startDate, endDate]);

  // Calculate totals
  const totalAmount = filteredData.reduce((sum, report) => sum + report.amount, 0);
  const paidReports = filteredData.filter(r => !r.isDue);
  const dueReports = filteredData.filter(r => r.isDue);
  const paidAmount = paidReports.reduce((sum, report) => sum + report.amount, 0);
  const dueAmount = dueReports.reduce((sum, report) => sum + report.amount, 0);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = filteredData.map(report => ({
      'Date': new Date(report.date).toLocaleDateString('en-IN'),
      'Customer Name': report.customerName,
      'Mobile Number': report.mobileNumber,
      'Payment Mode': report.paymentMode,
      'Collected By': report.collectedBy,
      'Amount ($)': report.amount,
      'Status': report.isDue ? 'Due' : 'Paid'
    }));

    dataToExport.push({
      'Date': '',
      'Customer Name': '',
      'Mobile Number': '',
      'Payment Mode': '',
      'Collected By': 'TOTAL',
      'Amount ($)': totalAmount,
      'Status': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Deposit Reports');

    const columnWidths = [
      { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 10 }
    ];
    worksheet['!cols'] = columnWidths;

    const fileName = `Deposit_Reports_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const renderPagination = () => {
    const items = [];
    for (let page = 1; page <= totalPages; page++) {
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
    return items;
  };

  return (
    <Container fluid>
      <div className="user-table-container">
        {/* Header */}
        <Row className="mb-3 g-2 align-items-center">
          <Col lg={3} md={4} sm={12}>
            <h4 className="mb-0" style={{ color: '#1e293b', fontWeight: '700', fontSize: '1.5rem' }}>
              Deposit Reports
            </h4>
          </Col>
          <Col lg={9} md={8} sm={12} className="d-flex justify-content-end gap-2 flex-wrap">
            <Form.Select
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value)}
              style={{ maxWidth: '150px' }}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="due">Due</option>
            </Form.Select>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ maxWidth: '150px' }}
              placeholder="Start Date"
            />
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ maxWidth: '150px' }}
              placeholder="End Date"
            />
            <InputGroup style={{ maxWidth: '250px' }}>
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            {/* <Button
              size="sm"
              onClick={handleExportExcel}
              disabled={filteredData.length === 0}
              className="btn-outline-primary-custom"
              style={{ padding: '0.4rem 1rem 0.5rem 1rem', fontSize: '0.875rem' }}
            >
              <i className="bi bi-file-earmark-excel me-1"></i> Export Excel
            </Button> */}
          </Col>
        </Row>

        {/* Table */}
        <div className="table-responsive" style={{ background: '#f0f2f5', borderRadius: '12px', padding: '0' }}>
          <Table bordered hover className="modern-table" style={{ background: '#f0f2f5' }}>
            <thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <tr>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Customer Mobile</th>
                <th>Payment Info</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((report) => (
                  <tr key={report.id} style={{ background: '#f0f2f5' }}>
                    <td>{new Date(report.date).toLocaleDateString('en-IN')}</td>
                    <td>
                        <strong>{report.customerName}</strong>
                    </td>
                    <td>
                        <strong>{report.mobileNumber}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{report.paymentMode}</strong>
                      </div>
                    </td>
                    <td>
                      <strong>${report.amount.toLocaleString('en-IN')}</strong>
                    </td>
                    <td>
                      <span className={`badge bg-${report.isDue ? 'warning' : 'success'}`}>
                        {report.isDue ? 'Due' : 'Paid'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                    <span className="text-muted">No reports found</span>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        <Row className="align-items-center mt-4 pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
          <Col lg={6} md={6} sm={12} className="mb-2 mb-md-0">
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
              Showing <strong style={{ color: '#667eea' }}>{filteredData.length > 0 ? startIndex + 1 : 0}</strong> to{' '}
              <strong style={{ color: '#667eea' }}>{Math.min(startIndex + rowsPerPage, filteredData.length)}</strong> of{' '}
              <strong style={{ color: '#667eea' }}>{filteredData.length}</strong> entries
            </span>
          </Col>
          <Col lg={6} md={6} sm={12} className="d-flex justify-content-end">
            <Pagination className="mb-0">{renderPagination()}</Pagination>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default DepositReports;
