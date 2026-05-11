import React from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const DiningTables = () => {
  const navigate = useNavigate();

  // Handle table click - navigate to order page
  const handleTableClick = (table) => {
    navigate(`/cashier/table-order/${table.id}`, {
      state: { tableInfo: table }
    });
  };
  // Dummy sections data
  const sections = [
    { id: 1, name: 'A/C' },
    { id: 2, name: 'Non A/C' },
    { id: 3, name: 'Bar' }
  ];

  // Dummy tables data
  const tables = [
    // A/C Section Tables
    { id: 1, tableNumber: 'Table 1', sectionId: 1, status: 1 },
    { id: 2, tableNumber: 'Table 2', sectionId: 1, status: 2 },
    { id: 3, tableNumber: 'Table 3', sectionId: 1, status: 1 },
    { id: 4, tableNumber: 'Table 4', sectionId: 1, status: 1 },
    { id: 5, tableNumber: 'Table 5', sectionId: 1, status: 2 },
    { id: 6, tableNumber: 'Table 6', sectionId: 1, status: 1 },
    { id: 7, tableNumber: 'Table 7', sectionId: 1, status: 1 },
    { id: 8, tableNumber: 'Table 8', sectionId: 1, status: 5 },
    { id: 9, tableNumber: 'Table 9', sectionId: 1, status: 5 },
    { id: 10, tableNumber: 'Table 10', sectionId: 1, status: 1 },
    { id: 11, tableNumber: 'Table 11', sectionId: 1, status: 1 },
    { id: 12, tableNumber: 'Table 12', sectionId: 1, status: 2 },
    { id: 13, tableNumber: 'Table 13', sectionId: 1, status: 1 },
    { id: 14, tableNumber: 'Table 14', sectionId: 1, status: 3 },
    { id: 15, tableNumber: 'Table 15', sectionId: 1, status: 1 },
    { id: 16, tableNumber: 'Table 16', sectionId: 1, status: 1 },
    { id: 17, tableNumber: 'Table 17', sectionId: 1, status: 1 },
    { id: 18, tableNumber: 'Table 18', sectionId: 1, status: 1 },
    { id: 19, tableNumber: 'Table 19', sectionId: 1, status: 5 },
    { id: 20, tableNumber: 'Table 20', sectionId: 1, status: 1 },
    { id: 21, tableNumber: 'Table 21', sectionId: 1, status: 1 },
    { id: 22, tableNumber: 'Table 22', sectionId: 1, status: 1 },
    { id: 23, tableNumber: 'Table 23', sectionId: 1, status: 1 },
    { id: 24, tableNumber: 'Table 24', sectionId: 1, status: 1 },
    { id: 25, tableNumber: 'Table 25', sectionId: 1, status: 1 },
    { id: 26, tableNumber: 'Table 26', sectionId: 1, status: 5 },
    { id: 27, tableNumber: 'Table 27', sectionId: 1, status: 2 },
    { id: 28, tableNumber: 'Table 28', sectionId: 1, status: 5 },
    // Non A/C Section Tables
    { id: 29, tableNumber: 'Table 1', sectionId: 2, status: 1 },
    { id: 30, tableNumber: 'Table 2', sectionId: 2, status: 2 },
    { id: 31, tableNumber: 'Table 3', sectionId: 2, status: 1 },
    { id: 32, tableNumber: 'Table 4', sectionId: 2, status: 1 },
    { id: 33, tableNumber: 'Table 5', sectionId: 2, status: 5 },
    { id: 34, tableNumber: 'Table 6', sectionId: 2, status: 5 },
    { id: 35, tableNumber: 'Table 7', sectionId: 2, status: 1 },
    { id: 36, tableNumber: 'Table 8', sectionId: 2, status: 5 },
    { id: 37, tableNumber: 'Table 9', sectionId: 2, status: 1 },
    // Bar Section Tables
    { id: 38, tableNumber: 'Table 1', sectionId: 3, status: 1 },
    { id: 39, tableNumber: 'Table 2', sectionId: 3, status: 2 },
    { id: 40, tableNumber: 'Table 3', sectionId: 3, status: 3 },
    { id: 41, tableNumber: 'Table 4', sectionId: 3, status: 1 },
    { id: 42, tableNumber: 'Table 5', sectionId: 3, status: 4 },
  ];

  // Status mapping based on reference design
  // 1 = Available (Blank), 2 = Running, 3 = Printed, 4 = Paid, 5 = Running KOT
  const statusConfig = {
    1: { text: 'Available Table', color: '#6b7280', bgColor: '#ffffff', borderColor: '#e5e7eb' },
    2: { text: 'Running Table', color: '#3b82f6', bgColor: '#dbeafe', borderColor: '#93c5fd' },
    3: { text: 'Printed Table', color: '#22c55e', bgColor: '#dcfce7', borderColor: '#86efac' },
    4: { text: 'Paid Table', color: '#f97316', bgColor: '#ffedd5', borderColor: '#fdba74' },
    5: { text: 'Running KOT', color: '#eab308', bgColor: '#fef9c3', borderColor: '#fde047' }
  };

  const getStatusConfig = (status) => statusConfig[status] || statusConfig[1];

  // Group tables by section
  const getTablesBySection = () => {
    const grouped = {};

    // Create groups for each section
    sections.forEach(section => {
      grouped[section.id] = {
        name: section.type || section.name || 'Unknown Section',
        tables: []
      };
    });

    // Add "Uncategorized" for tables without section
    grouped['uncategorized'] = {
      name: 'Other Tables',
      tables: []
    };

    // Distribute tables to their sections
    tables.forEach(table => {
      const sectionId = table.sectionId?.id || table.sectionId;
      if (sectionId && grouped[sectionId]) {
        grouped[sectionId].tables.push(table);
      } else {
        grouped['uncategorized'].tables.push(table);
      }
    });

    // Filter out empty sections
    return Object.entries(grouped).filter(([_, section]) => section.tables.length > 0);
  };

  const groupedTables = getTablesBySection();

  return (
    <Container fluid className="py-3" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h4 style={{
          color: '#1f2937',
          fontWeight: '700',
          margin: 0,
          fontSize: '20px'
        }}>
          Table View
        </h4>

        {/* Status Legend */}
        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {Object.entries(statusConfig).map(([key, config]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#4b5563'
              }}
            >
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: config.bgColor,
                border: `2px solid ${config.borderColor}`
              }}></div>
              <span>{config.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tables Content */}
      {tables.length > 0 ? (
        <div>
          {groupedTables.map(([sectionId, section]) => (
            <div key={sectionId} style={{ marginBottom: '32px' }}>
              {/* Section Header */}
              <h5 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#374151',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '2px solid #e5e7eb'
              }}>
                {section.name}
              </h5>

              {/* Tables Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '12px',
                maxWidth: '100%'
              }}>
                {section.tables.map((table) => {
                  const config = getStatusConfig(table.status);
                  const hasOrder = table.status === 2 || table.status === 5;
                  const isPrinted = table.status === 3;
                  const isPaid = table.status === 4;

                  return (
                    <div
                      key={table.id}
                      onClick={() => handleTableClick(table)}
                      style={{
                        background: config.bgColor,
                        borderRadius: '8px',
                        padding: '12px 8px',
                        textAlign: 'center',
                        border: `2px solid ${config.borderColor}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minHeight: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Table Name */}
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '8px'
                      }}>
                        {table.tableNumber || `Table ${table.id}`}
                      </div>

                      {/* Action Icons */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: 'auto'
                      }}>
                        {(hasOrder || isPrinted || isPaid) && (
                          <i
                            className="bi bi-printer-fill"
                            style={{
                              fontSize: '14px',
                              color: '#6b7280',
                              cursor: 'pointer'
                            }}
                            title="Print KOT"
                          ></i>
                        )}
                        {(hasOrder || isPrinted || isPaid) && (
                          <i
                            className="bi bi-eye-fill"
                            style={{
                              fontSize: '14px',
                              color: '#6b7280',
                              cursor: 'pointer'
                            }}
                            title="View Order"
                          ></i>
                        )}
                        {isPaid && (
                          <i
                            className="bi bi-receipt"
                            style={{
                              fontSize: '14px',
                              color: '#6b7280',
                              cursor: 'pointer'
                            }}
                            title="View Bill"
                          ></i>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: '#999'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <i className="bi bi-grid-3x3" style={{ fontSize: '32px', color: '#ccc' }}></i>
          </div>
          <p style={{ fontSize: '16px', fontWeight: '500', color: '#666', margin: 0 }}>
            No dining tables found
          </p>
          <p style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
            Tables will appear here once added
          </p>
        </div>
      )}

      {/* Total Count */}
      {tables.length > 0 && (
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          padding: '12px',
          background: '#fff',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#666',
          border: '1px solid #e5e7eb'
        }}>
          Total <strong>{tables.length}</strong> tables across <strong>{groupedTables.length}</strong> sections
        </div>
      )}
    </Container>
  );
};

export default DiningTables;
