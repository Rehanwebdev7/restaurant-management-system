import React, { useState, useEffect } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ApiGet, ApiPut } from '../../../../ApiServices/ApiServices';
import { useDarkMode } from '../../../../contexts/DarkModeContext';
import { useTheme } from '../../../../contexts/ThemeContext';

const DiningTables = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const { primaryColor } = useTheme();
  const [sections, setSections] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [secRes, tblRes] = await Promise.all([
        ApiGet('/api/cashier/section/filter', { pageNumber: 0, pageSize: 1000 }),
        ApiGet('/api/cashier/dining_tables/filter', { pageNumber: 0, pageSize: 1000 })
      ]);

      if (secRes.success) {
        setSections(secRes.success.data?.data?.records || secRes.success.data?.data || []);
      }
      if (tblRes.success) {
        setTables(tblRes.success.data?.data?.records || tblRes.success.data?.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (table) => {
    navigate(`/cashier/table-order/${table.id}`, {
      state: { tableInfo: table }
    });
  };

  const releaseTable = async (e, tableId) => {
    e.stopPropagation();
    if (!window.confirm('Is this table really done? Release it?')) return;
    await ApiPut('/api/cashier/dining_tables/update', { id: tableId, status: 1 });
    fetchAll();
  };

  // Status mapping: 1=Available, 2=Running, 3=Printed, 4=Paid, 5=Running KOT
  const statusConfig = {
    1: { text: 'Available Table', color: isDarkMode ? '#94a3b8' : '#6b7280', bgColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#ffffff', borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : '#e5e7eb' },
    2: { text: 'Running Table',   color: '#3b82f6', bgColor: isDarkMode ? 'rgba(59,130,246,0.15)' : '#dbeafe',  borderColor: isDarkMode ? 'rgba(59,130,246,0.4)' : '#93c5fd' },
    3: { text: 'Printed Table',   color: '#22c55e', bgColor: isDarkMode ? 'rgba(34,197,94,0.15)' : '#dcfce7',   borderColor: isDarkMode ? 'rgba(34,197,94,0.4)' : '#86efac' },
    4: { text: 'Paid Table',      color: '#f97316', bgColor: isDarkMode ? 'rgba(249,115,22,0.15)' : '#ffedd5',  borderColor: isDarkMode ? 'rgba(249,115,22,0.4)' : '#fdba74' },
    5: { text: 'Running KOT',     color: '#eab308', bgColor: isDarkMode ? 'rgba(234,179,8,0.15)' : '#fef9c3',   borderColor: isDarkMode ? 'rgba(234,179,8,0.4)' : '#fde047' }
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
    <Container fluid className="py-3" style={{ minHeight: '100vh' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
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
          color: isDarkMode ? '#e2e8f0' : '#1f2937',
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
                color: isDarkMode ? '#94a3b8' : '#4b5563'
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
                color: isDarkMode ? '#e2e8f0' : '#374151',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: isDarkMode ? '2px solid rgba(255,255,255,0.12)' : '2px solid #e5e7eb'
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
                        color: isDarkMode ? config.color : '#1f2937',
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
          background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
          borderRadius: '8px',
          fontSize: '13px',
          color: isDarkMode ? '#94a3b8' : '#666',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e5e7eb'
        }}>
          Total <strong>{tables.length}</strong> tables across <strong>{groupedTables.length}</strong> sections
        </div>
      )}
        </>
      )}
    </Container>
  );
};

export default DiningTables;
