import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Spinner, Badge } from 'react-bootstrap';
import Select from 'react-select';
import { ApiPut, ApiGet } from '../../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';

const EditOrderModal = ({ show, onClose, order }) => {
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [addons, setAddons] = useState([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    customerId: null,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    orderType: 'DINE_IN',
    items: []
  });

  const [formErrors, setFormErrors] = useState({});

  const orderTypeOptions = [
    { value: 'DINE_IN', label: 'Dine In' },
    { value: 'ONLINE', label: 'Online' },
    { value: 'TAKEAWAY', label: 'Takeaway' },
    { value: 'DELIVERY', label: 'Delivery' }
  ];

  // Load data when modal opens - fetch menu items FIRST, then load form data
  useEffect(() => {
    if (show && order) {
      setDataReady(false);
      Promise.all([fetchMenuItems(), fetchAddons()]).then(() => {
        setDataReady(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, order]);

  // Once menu items are fetched and dataReady, load form data
  useEffect(() => {
    if (dataReady && order) {
      loadFormData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataReady]);

  const loadFormData = () => {
    if (!order) return;

    const items = order.orderItems?.map(item => {
      // menuItemId can be an object {id, name, ...} or a plain ID
      const menuItemIdValue = typeof item.menuItemId === 'object' && item.menuItemId !== null
        ? item.menuItemId.id
        : item.menuItemId;

      return {
        menu_item_id: menuItemIdValue || '',
        menuItemName: item.menuItemName || (typeof item.menuItemId === 'object' ? item.menuItemId?.name : ''),
        quantity: item.quantity || 1,
        price: item.price || 0,
        special_instructions: item.specialInstructions || '',
        addonItems: item.addonItems?.map(addon => ({
          addonItemId: addon.id || addon.addonItemId,
          name: addon.name || '',
          quantity: addon.quantity || '1',
          price: addon.price || 0
        })) || []
      };
    }) || [];

    setFormData({
      id: order.id,
      customerId: order.customerId ? (typeof order.customerId === 'object' ? { id: order.customerId.id } : { id: order.customerId }) : null,
      customerName: order.customerName || '',
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone || '',
      orderType: order.orderType || 'DINE_IN',
      items: items
    });
  };

  const fetchMenuItems = async () => {
    setMenuItemsLoading(true);
    try {
      const response = await ApiGet('/api/restaurant/menu_items/filter', {
        pageSize: 500,
        pageNumber: 0
      });
      if (response.success) {
        const items = response.success.data?.data?.records || [];
        setMenuItems(items.map(item => ({
          value: item.id,
          label: item.name,
          price: item.price
        })));
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setMenuItemsLoading(false);
    }
  };

  const fetchAddons = async () => {
    setAddonsLoading(true);
    try {
      const response = await ApiGet('/api/restaurant/addons_items/all');
      if (response.success) {
        const items = response.success.data?.data || [];
        setAddons(items.map(item => ({
          value: item.id,
          label: item.name,
          price: item.price
        })));
      }
    } catch (error) {
      console.error('Error fetching addons:', error);
    } finally {
      setAddonsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleOrderTypeChange = (selected) => {
    setFormData(prev => ({ ...prev, orderType: selected?.value || 'DINE_IN' }));
  };

  // Item management
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        menu_item_id: '',
        menuItemName: '',
        quantity: 1,
        price: 0,
        special_instructions: '',
        addonItems: []
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        if (field === 'menu_item_id' && value) {
          const selectedItem = menuItems.find(m => m.value === value);
          return {
            ...item,
            menu_item_id: value,
            menuItemName: selectedItem?.label || '',
            price: selectedItem?.price || item.price
          };
        }
        return { ...item, [field]: value };
      })
    }));
  };

  // Addon management
  const addAddonToItem = (itemIndex) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== itemIndex) return item;
        return {
          ...item,
          addonItems: [...item.addonItems, { addonItemId: '', name: '', quantity: '1', price: 0 }]
        };
      })
    }));
  };

  const removeAddonFromItem = (itemIndex, addonIndex) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== itemIndex) return item;
        return {
          ...item,
          addonItems: item.addonItems.filter((_, j) => j !== addonIndex)
        };
      })
    }));
  };

  const updateAddon = (itemIndex, addonIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== itemIndex) return item;
        return {
          ...item,
          addonItems: item.addonItems.map((addon, j) => {
            if (j !== addonIndex) return addon;
            if (field === 'addonItemId' && value) {
              const selectedAddon = addons.find(a => a.value === value);
              return {
                ...addon,
                addonItemId: value,
                name: selectedAddon?.label || '',
                price: selectedAddon?.price || addon.price
              };
            }
            return { ...addon, [field]: value };
          })
        };
      })
    }));
  };

  const calculateItemTotal = (item) => {
    const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
    const addonsTotal = item.addonItems.reduce((sum, addon) => {
      return sum + ((parseFloat(addon.price) || 0) * (parseInt(addon.quantity) || 1));
    }, 0);
    return itemTotal + addonsTotal;
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.customerName.trim()) errors.customerName = 'Customer name is required';
    if (!formData.customerPhone.trim()) {
      errors.customerPhone = 'Customer phone is required';
    } else {
      const phoneDigits = formData.customerPhone.replace(/[\s+-]/g, '').replace(/^91/, '');
      if (!/^\d{10}$/.test(phoneDigits)) errors.customerPhone = 'Invalid phone number';
    }
    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      errors.customerEmail = 'Invalid email format';
    }
    if (formData.items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      formData.items.forEach((item, index) => {
        if (!item.menu_item_id) errors[`item_${index}`] = 'Please select a menu item';
      });
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: formData.id,
        customerName: formData.customerName,
        cutomerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        orderType: formData.orderType,
        items: formData.items.map(item => ({
          menu_item_id: String(item.menu_item_id),
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
          special_instructions: item.special_instructions,
          addonItems: item.addonItems.map(addon => ({
            addonItemId: addon.addonItemId,
            quantity: String(addon.quantity)
          }))
        }))
      };
      if (formData.customerId) payload.customerId = formData.customerId;

      const response = await ApiPut('/api/restaurant/orders/update', payload);
      if (response.success) {
        toast.success('Order updated successfully');
        onClose(true);
      } else {
        toast.error(response.fail || 'Failed to update order');
      }
    } catch (error) {
      toast.error('Error updating order');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  // Custom select styles
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '10px',
      borderColor: state.isFocused ? '#667eea' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(102,126,234,0.15)' : 'none',
      '&:hover': { borderColor: '#667eea' },
      minHeight: '38px'
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '10px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden'
    }),
    option: (base, state) => ({
      ...base,
      background: state.isSelected ? '#667eea' : state.isFocused ? '#f8fafc' : '#fff',
      color: state.isSelected ? '#fff' : '#334155',
      fontSize: '0.85rem'
    })
  };

  return (
    <Modal
      show={show}
      onHide={() => onClose(false)}
      size="xl"
      backdrop="static"
      keyboard={false}
      centered
      dialogClassName="modal-95w"
      style={{ '--bs-modal-width': '95%' }}
    >
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>
          <i className="bi bi-pencil-square me-2"></i>
          Edit Order: {order?.orderNumber}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px' }}>
          {/* Loading overlay while fetching menu data */}
          {!dataReady && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#94a3b8'
            }}>
              <Spinner animation="border" style={{ width: '2rem', height: '2rem', color: '#667eea' }} />
              <div style={{ marginTop: '12px', fontSize: '0.9rem' }}>Loading order data...</div>
            </div>
          )}

          {dataReady && (
            <>
              {/* Customer Information */}
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '16px',
                background: '#fafbfc'
              }}>
                <h6 style={{ color: '#667eea', fontWeight: 700, fontSize: '0.9rem', marginBottom: '16px' }}>
                  <i className="bi bi-person-circle me-2"></i>Customer Information
                </h6>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label style={labelStyle}>
                        Customer Name <span style={{ color: '#ef4444' }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        isInvalid={!!formErrors.customerName}
                        placeholder="Enter customer name"
                        style={inputStyle}
                      />
                      <Form.Control.Feedback type="invalid">{formErrors.customerName}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label style={labelStyle}>
                        Phone <span style={{ color: '#ef4444' }}>*</span>
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleInputChange}
                        isInvalid={!!formErrors.customerPhone}
                        placeholder="Enter phone number"
                        style={inputStyle}
                      />
                      <Form.Control.Feedback type="invalid">{formErrors.customerPhone}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label style={labelStyle}>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="customerEmail"
                        value={formData.customerEmail}
                        onChange={handleInputChange}
                        isInvalid={!!formErrors.customerEmail}
                        placeholder="Enter email (optional)"
                        style={inputStyle}
                      />
                      <Form.Control.Feedback type="invalid">{formErrors.customerEmail}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label style={labelStyle}>
                        Order Type <span style={{ color: '#ef4444' }}>*</span>
                      </Form.Label>
                      <Select
                        options={orderTypeOptions}
                        value={orderTypeOptions.find(opt => opt.value === formData.orderType)}
                        onChange={handleOrderTypeChange}
                        placeholder="Select order type"
                        styles={selectStyles}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Order Items */}
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '20px',
                background: '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h6 style={{ color: '#667eea', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>
                    <i className="bi bi-cart3 me-2"></i>Order Items
                    {formData.items.length > 0 && (
                      <span style={{
                        marginLeft: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#667eea',
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}>
                        {formData.items.length}
                      </span>
                    )}
                  </h6>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={addItem}
                    style={{ borderRadius: '10px', fontWeight: 600, fontSize: '0.82rem' }}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Add Item
                  </Button>
                </div>

                {formErrors.items && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '0.82rem',
                    marginBottom: '12px',
                    border: '1px solid #fecaca'
                  }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>{formErrors.items}
                  </div>
                )}

                {formData.items.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#94a3b8',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '2px dashed #e2e8f0'
                  }}>
                    <i className="bi bi-cart-x" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px', color: '#cbd5e1' }}></i>
                    <div style={{ fontWeight: 600 }}>No items in this order</div>
                    <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Click "Add Item" to start adding items</div>
                  </div>
                ) : (
                  formData.items.map((item, itemIndex) => (
                    <div key={itemIndex} style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '12px',
                      background: '#fafbfc',
                      transition: 'border-color 0.15s ease'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <Badge
                          bg="none"
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            padding: '4px 12px',
                            borderRadius: '8px',
                            fontSize: '0.72rem',
                            fontWeight: 600
                          }}
                        >
                          Item #{itemIndex + 1}
                          {item.menuItemName && ` - ${item.menuItemName}`}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => removeItem(itemIndex)}
                          style={{
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            background: '#fef2f2',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>

                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>
                              Menu Item <span style={{ color: '#ef4444' }}>*</span>
                            </Form.Label>
                            <Select
                              options={menuItems}
                              value={menuItems.find(m => m.value === item.menu_item_id) || null}
                              onChange={(selected) => updateItem(itemIndex, 'menu_item_id', selected?.value)}
                              isLoading={menuItemsLoading}
                              placeholder="Select menu item"
                              isClearable
                              styles={selectStyles}
                            />
                            {formErrors[`item_${itemIndex}`] && (
                              <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>
                                {formErrors[`item_${itemIndex}`]}
                              </div>
                            )}
                          </Form.Group>
                        </Col>
                        <Col md={2}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>Quantity</Form.Label>
                            <Form.Control
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(itemIndex, 'quantity', e.target.value)}
                              style={inputStyle}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>Price</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateItem(itemIndex, 'price', e.target.value)}
                              style={inputStyle}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-2">
                            <Form.Label style={labelStyle}>Special Instructions</Form.Label>
                            <Form.Control
                              type="text"
                              value={item.special_instructions}
                              onChange={(e) => updateItem(itemIndex, 'special_instructions', e.target.value)}
                              placeholder="e.g., Less spicy"
                              style={inputStyle}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Addons */}
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                            <i className="bi bi-puzzle me-1"></i>Addons
                          </span>
                          <button
                            type="button"
                            onClick={() => addAddonToItem(itemIndex)}
                            style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              background: '#f8fafc',
                              color: '#475569',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              padding: '3px 10px',
                              fontWeight: 500
                            }}
                          >
                            <i className="bi bi-plus me-1"></i>Add Addon
                          </button>
                        </div>

                        {item.addonItems.map((addon, addonIndex) => (
                          <Row key={addonIndex} className="mb-2 align-items-end">
                            <Col md={5}>
                              <Select
                                options={addons}
                                value={addons.find(a => a.value === addon.addonItemId) || null}
                                onChange={(selected) => updateAddon(itemIndex, addonIndex, 'addonItemId', selected?.value)}
                                isLoading={addonsLoading}
                                placeholder="Select addon"
                                isClearable
                                menuPortalTarget={document.body}
                                styles={{
                                  ...selectStyles,
                                  menuPortal: base => ({ ...base, zIndex: 9999 })
                                }}
                              />
                            </Col>
                            <Col md={3}>
                              <Form.Control
                                type="number"
                                min="1"
                                value={addon.quantity}
                                onChange={(e) => updateAddon(itemIndex, addonIndex, 'quantity', e.target.value)}
                                placeholder="Qty"
                                style={inputStyle}
                              />
                            </Col>
                            <Col md={3}>
                              <Form.Control
                                type="number"
                                step="0.01"
                                value={addon.price}
                                placeholder="Price"
                                readOnly
                                style={{ ...inputStyle, background: '#f1f5f9' }}
                              />
                            </Col>
                            <Col md={1}>
                              <button
                                type="button"
                                onClick={() => removeAddonFromItem(itemIndex, addonIndex)}
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid #fecaca',
                                  borderRadius: '8px',
                                  background: '#fff',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem'
                                }}
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </Col>
                          </Row>
                        ))}
                      </div>

                      {/* Item Total */}
                      <div style={{
                        textAlign: 'right',
                        marginTop: '12px',
                        paddingTop: '10px',
                        borderTop: '1px dashed #e2e8f0'
                      }}>
                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Item Total: </span>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                          {formatCurrency(calculateItemTotal(item))}
                        </strong>
                      </div>
                    </div>
                  ))
                )}

                {formData.items.length > 0 && (
                  <div style={{
                    textAlign: 'right',
                    padding: '16px 0 0',
                    borderTop: '2px solid #e2e8f0',
                    marginTop: '8px'
                  }}>
                    <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>Grand Total: </span>
                    <span style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {formatCurrency(calculateGrandTotal())}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer style={{ padding: '12px 20px' }}>
          <Button
            variant="secondary"
            onClick={() => onClose(false)}
            disabled={loading}
            style={{ borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem' }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !dataReady}
            style={{
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              padding: '8px 20px'
            }}
          >
            {loading ? (
              <><Spinner size="sm" className="me-1" style={{ width: '14px', height: '14px' }} /> Updating...</>
            ) : (
              <><i className="bi bi-check-lg me-1"></i> Update Order</>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

const labelStyle = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#475569',
  marginBottom: '4px'
};

const inputStyle = {
  borderRadius: '10px',
  fontSize: '0.85rem',
  borderColor: '#e2e8f0'
};

export default EditOrderModal;
