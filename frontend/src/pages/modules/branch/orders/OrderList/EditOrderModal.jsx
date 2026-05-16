import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Spinner, Badge } from 'react-bootstrap';
import Select from 'react-select';
import { ApiPut, ApiGet } from '../../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';

const EditOrderModal = ({ show, onClose, order: initialOrder }) => {
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [resolvedOrder, setResolvedOrder] = useState(initialOrder);
  const [menuItems, setMenuItems] = useState([]);
  const [addons, setAddons] = useState([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);
  const [addonsLoading, setAddonsLoading] = useState(false);

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

  // Order type options
  const orderTypeOptions = [
    { value: 'DINE_IN', label: 'Dine In' },
    { value: 'ONLINE', label: 'Online' },
    { value: 'TAKEAWAY', label: 'Takeaway' },
    { value: 'DELIVERY', label: 'Delivery' }
  ];

  // Load data when modal opens
  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      if (!show || !initialOrder?.id) {
        setResolvedOrder(initialOrder);
        return;
      }

      setOrderLoading(true);
      try {
        const response = await ApiGet(`/api/branch/orders/${initialOrder.id}`);
        if (!cancelled && response.success) {
          setResolvedOrder(response.success.data?.data || initialOrder);
        } else if (!cancelled) {
          setResolvedOrder(initialOrder);
        }
      } catch (error) {
        if (!cancelled) {
          setResolvedOrder(initialOrder);
        }
      } finally {
        if (!cancelled) {
          setOrderLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [show, initialOrder]);

  useEffect(() => {
    if (show && resolvedOrder) {
      loadFormData(resolvedOrder);
      fetchMenuItems();
      fetchAddons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, resolvedOrder]);

  const loadFormData = (orderData) => {
    if (!orderData) return;

    const items = orderData.orderItems?.map(item => ({
      menu_item_id: item.menuItemId || '',
      menuItemName: item.menuItemName,
      quantity: item.quantity || 1,
      price: item.price || 0,
      special_instructions: item.specialInstructions || '',
      addonItems: item.addonItems?.map(addon => ({
        addonItemId: addon.id || addon.addonItemId,
        name: addon.name,
        quantity: addon.quantity || '1',
        price: addon.price || 0
      })) || []
    })) || [];

    setFormData({
      id: orderData.id,
      customerId: orderData.customerId ? { id: orderData.customerId.id } : null,
      customerName: orderData.customerName || '',
      customerEmail: orderData.customerEmail || '',
      customerPhone: orderData.customerPhone || '',
      orderType: orderData.orderType || 'DINE_IN',
      items: items
    });
  };

  const fetchMenuItems = async () => {
    setMenuItemsLoading(true);
    try {
      const response = await ApiGet('/api/branch/menu_items/filter', {
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
      const response = await ApiGet('/api/branch/addons_items/all');
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleOrderTypeChange = (selected) => {
    setFormData(prev => ({
      ...prev,
      orderType: selected?.value || 'DINE_IN'
    }));
  };

  // Item management
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          menu_item_id: '',
          menuItemName: '',
          quantity: 1,
          price: 0,
          special_instructions: '',
          addonItems: []
        }
      ]
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
          addonItems: [
            ...item.addonItems,
            { addonItemId: '', name: '', quantity: '1', price: 0 }
          ]
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

  // Calculate totals
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

  // Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer name is required';
    }

    if (!formData.customerPhone.trim()) {
      errors.customerPhone = 'Customer phone is required';
    } else {
      const phoneDigits = formData.customerPhone.replace(/[\s+-]/g, '').replace(/^91/, '');
      if (!/^\d{10}$/.test(phoneDigits)) {
        errors.customerPhone = 'Invalid phone number';
      }
    }

    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      errors.customerEmail = 'Invalid email format';
    }

    if (formData.items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      formData.items.forEach((item, index) => {
        if (!item.menu_item_id) {
          errors[`item_${index}`] = 'Please select a menu item';
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
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
        cutomerEmail: formData.customerEmail, // Note: API uses typo "cutomer"
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

      if (formData.customerId) {
        payload.customerId = formData.customerId; // Note: API uses typo "cutomer"
      }

      const response = await ApiPut('/api/branch/orders/orderUpdate', payload);

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
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
        <Modal.Title>
          <i className="bi bi-pencil-square me-2"></i>
          Edit Order: {resolvedOrder?.orderNumber || initialOrder?.orderNumber}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {orderLoading ? (
            <div className="d-flex align-items-center justify-content-center py-5">
              <div className="text-center">
                <div className="spinner-border text-primary mb-2" role="status" />
                <div>Loading order details...</div>
              </div>
            </div>
          ) : (
          <>
          {/* Customer Information */}
          <div className="border rounded p-3 mb-3">
            <h6 className="text-primary mb-3">
              <i className="bi bi-person me-2"></i>Customer Information
            </h6>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Customer Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.customerName}
                    placeholder="Enter customer name"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.customerName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Customer Phone <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.customerPhone}
                    placeholder="Enter phone number"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.customerPhone}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Customer Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    isInvalid={!!formErrors.customerEmail}
                    placeholder="Enter email (optional)"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.customerEmail}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Order Type <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={orderTypeOptions}
                    value={orderTypeOptions.find(opt => opt.value === formData.orderType)}
                    onChange={handleOrderTypeChange}
                    placeholder="Select order type"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          {/* Order Items */}
          <div className="border rounded p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="text-primary mb-0">
                <i className="bi bi-cart3 me-2"></i>Order Items
              </h6>
              <Button variant="outline-primary" size="sm" onClick={addItem}>
                <i className="bi bi-plus me-1"></i> Add Item
              </Button>
            </div>

            {formErrors.items && (
              <div className="alert alert-danger py-2">{formErrors.items}</div>
            )}

            {formData.items.length === 0 ? (
              <div className="text-center text-muted py-4">
                <i className="bi bi-cart-x fs-1 d-block mb-2"></i>
                No items added. Click "Add Item" to add order items.
              </div>
            ) : (
              formData.items.map((item, itemIndex) => (
                <div key={itemIndex} className="border rounded p-3 mb-3 bg-light">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Badge bg="secondary">Item #{itemIndex + 1}</Badge>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeItem(itemIndex)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </div>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Menu Item <span className="text-danger">*</span></Form.Label>
                        <Select
                          options={menuItems}
                          value={menuItems.find(m => m.value === item.menu_item_id) || null}
                          onChange={(selected) => updateItem(itemIndex, 'menu_item_id', selected?.value)}
                          isLoading={menuItemsLoading}
                          placeholder="Select menu item"
                          isClearable
                        />
                        {formErrors[`item_${itemIndex}`] && (
                          <div className="text-danger small mt-1">{formErrors[`item_${itemIndex}`]}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group className="mb-2">
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(itemIndex, 'quantity', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group className="mb-2">
                        <Form.Label>Price</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(itemIndex, 'price', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label>Special Instructions</Form.Label>
                        <Form.Control
                          type="text"
                          value={item.special_instructions}
                          onChange={(e) => updateItem(itemIndex, 'special_instructions', e.target.value)}
                          placeholder="e.g., Less spicy"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Addons for this item */}
                  <div className="mt-2">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-muted">Addons</span>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => addAddonToItem(itemIndex)}
                      >
                        <i className="bi bi-plus me-1"></i> Add Addon
                      </Button>
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
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Control
                            type="number"
                            min="1"
                            value={addon.quantity}
                            onChange={(e) => updateAddon(itemIndex, addonIndex, 'quantity', e.target.value)}
                            placeholder="Qty"
                          />
                        </Col>
                        <Col md={3}>
                          <Form.Control
                            type="number"
                            step="0.01"
                            value={addon.price}
                            onChange={(e) => updateAddon(itemIndex, addonIndex, 'price', e.target.value)}
                            placeholder="Price"
                            readOnly
                          />
                        </Col>
                        <Col md={1}>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeAddonFromItem(itemIndex, addonIndex)}
                          >
                            <i className="bi bi-x"></i>
                          </Button>
                        </Col>
                      </Row>
                    ))}
                  </div>

                  <div className="text-end mt-2">
                    <strong>Item Total: {formatCurrency(calculateItemTotal(item))}</strong>
                  </div>
                </div>
              ))
            )}

            {formData.items.length > 0 && (
              <div className="text-end border-top pt-3 mt-3">
                <h5>
                  Grand Total: <span className="text-primary">{formatCurrency(calculateGrandTotal())}</span>
                </h5>
              </div>
            )}
          </div>
          </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => onClose(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading || orderLoading}>
            {loading ? (
              <>
                <Spinner size="sm" className="me-1" />
                Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-1"></i>
                Update Order
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditOrderModal;
