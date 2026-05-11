import React, { useState } from 'react';
import { Container, Row, Col, Modal, Spinner, Button } from 'react-bootstrap';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ApiGet } from '../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { useTheme } from '../../../../contexts/ThemeContext';

const TableOrder = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const tableInfo = location.state?.tableInfo || { tableNumber: `Table ${tableId}` };
  const { primaryColor } = useTheme();

  // Dummy categories
  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 1, name: 'Starters' },
    { id: 2, name: 'Main Course' },
    { id: 3, name: 'Biryani' },
    { id: 4, name: 'Beverages' },
    { id: 5, name: 'Desserts' }
  ];

  // Dummy menu items with addonsId
  const allMenuItems = [
    { id: 1, name: 'Paneer Tikka', price: 280, categoryId: 1, isVeg: true, addonsId: { id: 1 } },
    { id: 2, name: 'Chicken Tikka', price: 320, categoryId: 1, isVeg: false, addonsId: { id: 1 } },
    { id: 3, name: 'Veg Spring Roll', price: 180, categoryId: 1, isVeg: true, addonsId: { id: 2 } },
    { id: 4, name: 'Fish Fry', price: 350, categoryId: 1, isVeg: false, addonsId: { id: 1 } },
    { id: 5, name: 'Mushroom Pepper', price: 260, categoryId: 1, isVeg: true },
    { id: 6, name: 'Butter Chicken', price: 380, categoryId: 2, isVeg: false, addonsId: { id: 1 } },
    { id: 7, name: 'Paneer Butter Masala', price: 320, categoryId: 2, isVeg: true, addonsId: { id: 2 } },
    { id: 8, name: 'Dal Makhani', price: 260, categoryId: 2, isVeg: true },
    { id: 9, name: 'Mutton Rogan Josh', price: 450, categoryId: 2, isVeg: false, addonsId: { id: 1 } },
    { id: 10, name: 'Kadai Paneer', price: 300, categoryId: 2, isVeg: true, addonsId: { id: 2 } },
    { id: 11, name: 'Chicken Biryani', price: 320, categoryId: 3, isVeg: false, addonsId: { id: 1 } },
    { id: 12, name: 'Mutton Biryani', price: 420, categoryId: 3, isVeg: false, addonsId: { id: 1 } },
    { id: 13, name: 'Veg Biryani', price: 250, categoryId: 3, isVeg: true, addonsId: { id: 2 } },
    { id: 14, name: 'Egg Biryani', price: 280, categoryId: 3, isVeg: false },
    { id: 15, name: 'Fresh Lime Soda', price: 80, categoryId: 4, isVeg: true },
    { id: 16, name: 'Mango Lassi', price: 120, categoryId: 4, isVeg: true },
    { id: 17, name: 'Cold Coffee', price: 150, categoryId: 4, isVeg: true },
    { id: 18, name: 'Masala Chai', price: 50, categoryId: 4, isVeg: true },
    { id: 19, name: 'Gulab Jamun', price: 100, categoryId: 5, isVeg: true },
    { id: 20, name: 'Ice Cream', price: 120, categoryId: 5, isVeg: true },
    { id: 21, name: 'Rasmalai', price: 140, categoryId: 5, isVeg: true },
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Mobile cart panel state
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Addon states
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [selectedItemForAddon, setSelectedItemForAddon] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [itemAddons, setItemAddons] = useState([]);
  const [addonsLoading, setAddonsLoading] = useState(false);

  // Format currency
  const formatCurrency = (amount) => `$${amount?.toFixed(2) || '0.00'}`;

  // Fetch addon items from API
  const fetchAddonItems = async (addonId) => {
    if (!addonId) {
      setItemAddons([]);
      return;
    }
    setAddonsLoading(true);
    try {
      const result = await ApiGet(`/api/cashier/addons_items/addonId?addonId=${addonId}`);
      if (result.success) {
        const addons = result.success.data?.data || result.success.data || [];
        setItemAddons(Array.isArray(addons) ? addons : []);
      } else {
        setItemAddons([]);
      }
    } catch (err) {
      console.error('Failed to fetch addon items:', err);
      setItemAddons([]);
    } finally {
      setAddonsLoading(false);
    }
  };

  // Open addon modal
  const openAddonModal = async (item, e) => {
    e.stopPropagation();
    setSelectedItemForAddon(item);
    setSelectedAddons([]);
    setItemAddons([]);
    setShowAddonModal(true);

    if (item?.addonsId?.id) {
      await fetchAddonItems(item.addonsId.id);
    }
  };

  // Update addon quantity
  const updateAddonQuantity = (addonId, delta, e) => {
    e.stopPropagation();
    setSelectedAddons(selectedAddons.map(addon => {
      if (addon.id === addonId) {
        const newQty = Math.max(1, addon.quantity + delta);
        return { ...addon, quantity: newQty };
      }
      return addon;
    }));
  };

  // Add item with addons to cart
  const addItemWithAddons = () => {
    if (!selectedItemForAddon) return;

    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + ((addon.price || 0) * (addon.quantity || 1)), 0);
    const cartItemId = `${selectedItemForAddon.id}-${Date.now()}`;

    const cartItem = {
      ...selectedItemForAddon,
      cartItemId,
      addons: selectedAddons,
      addonsTotal,
      totalPrice: selectedItemForAddon.price + addonsTotal,
      quantity: 1
    };

    setCart([...cart, cartItem]);
    toast.success(`${selectedItemForAddon.name} added with addons!`, { autoClose: 1000 });
    setShowAddonModal(false);
    setSelectedItemForAddon(null);
    setSelectedAddons([]);
  };

  // Filter menu items
  const filteredItems = allMenuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Add to cart
  const addToCart = (item) => {
    const existingItem = cart.find(c => c.id === item.id);
    if (existingItem) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  // Update quantity
  const updateQuantity = (cartItemId, delta) => {
    setCart(cart.map(item => {
      const itemKey = item.cartItemId || item.id;
      if (itemKey === cartItemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // Remove from cart
  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => (item.cartItemId || item.id) !== cartItemId));
  };

  // Calculate totals (use totalPrice for items with addons)
  const subtotal = cart.reduce((sum, item) => sum + ((item.totalPrice || item.price) * item.quantity), 0);
  const tax = subtotal * 0.05; // 5% GST
  const total = subtotal + tax;

  // Total items count
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Container fluid style={{ padding: 0, height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5', position: 'relative' }}>
      {/* Styles for bottom slide-up billing */}
      <style>{`
        .desktop-billing-col {
          display: none !important;
        }
        .menu-items-col {
          width: 100% !important;
          flex: 0 0 100% !important;
          max-width: 100% !important;
          padding-bottom: 70px !important;
        }
      `}</style>

      {/* Main Content */}
      <Row style={{ flex: 1, margin: 0, overflow: 'hidden' }}>
        {/* Left Side - Menu Items */}
        <Col md={7} className="menu-items-col" style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Search Bar with Back Button and Table Name */}
          <div style={{
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            position: 'relative'
          }}>
            {/* Left - Back Button */}
            <button
              onClick={() => navigate('/cashier/dining-tables')}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#666',
                fontSize: '13px',
                padding: '8px 14px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="bi bi-arrow-left" style={{ fontSize: '14px' }}></i>
              Back
            </button>

            {/* Center - Table Name */}
            <div style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#1f2937',
              fontWeight: '700',
              fontSize: '16px',
              whiteSpace: 'nowrap'
            }}>
              {tableInfo.tableNumber}
            </div>

            {/* Right - Search Input */}
            <div style={{
              position: 'relative',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              width: '250px',
              marginLeft: 'auto'
            }}>
              <i className="bi bi-search" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#999',
                fontSize: '14px'
              }}></i>
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Categories */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            overflowX: 'auto',
            paddingBottom: '8px'
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: selectedCategory === cat.id ? primaryColor : '#fff',
                  color: selectedCategory === cat.id ? '#fff' : '#333',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px',
            alignContent: 'start'
          }}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.2s',
                  border: '2px solid transparent',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = primaryColor;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                {/* Clickable area for adding to cart */}
                <div
                  onClick={() => addToCart(item)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Veg/Non-veg indicator */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '14px',
                    height: '14px',
                    border: `2px solid ${item.isVeg ? '#22c55e' : '#ef4444'}`,
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: item.isVeg ? '#22c55e' : '#ef4444'
                    }}></div>
                  </div>

                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '8px',
                    lineHeight: '1.3',
                    paddingRight: '20px'
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: primaryColor
                  }}>
                    ${item.price}
                  </div>
                </div>

                {/* Addons Button */}
                <button
                  onClick={(e) => openAddonModal(item, e)}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '6px 10px',
                    border: `1px solid ${primaryColor}`,
                    borderRadius: '6px',
                    background: '#fff',
                    color: primaryColor,
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = primaryColor;
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = primaryColor;
                  }}
                >
                  <i className="bi bi-plus-circle" style={{ fontSize: '12px' }}></i>
                  Addons
                </button>
              </div>
            ))}
          </div>
        </Col>

        {/* Right Side - Billing */}
        <Col md={5} className="desktop-billing-col" style={{
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderLeft: '1px solid #e5e7eb',
          overflow: 'hidden',
          height: 'fit-content',
          maxHeight: '100%'
        }}>
          {/* Cart Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            paddingBottom: '8px',
            borderBottom: '2px solid #f3f4f6',
            flexShrink: 0
          }}>
            <h5 style={{ margin: 0, fontWeight: '700', color: '#1f2937', fontSize: '14px' }}>
              <i className="bi bi-receipt me-2" style={{ color: primaryColor }}></i>
              Order Details
            </h5>
            <span style={{
              background: primaryColor,
              color: '#fff',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              {cart.length} Items
            </span>
          </div>

          {/* Cart Items */}
          <div style={{ overflowY: 'auto', marginBottom: '8px', maxHeight: 'calc(100vh - 300px)' }}>
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '20px 15px',
                color: '#9ca3af'
              }}>
                <i className="bi bi-cart3" style={{ fontSize: '32px', marginBottom: '8px', display: 'block' }}></i>
                <p style={{ margin: 0, fontSize: '12px' }}>No items added yet</p>
              </div>
            ) : (
              cart.map(item => {
                const itemKey = item.cartItemId || item.id;
                const itemPrice = item.totalPrice || item.price;
                return (
                <div
                  key={itemKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 14px',
                    marginBottom: '8px',
                    background: '#f9fafb',
                    borderRadius: '10px',
                    gap: '12px'
                  }}
                >
                  {/* Item Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{
                        width: '12px',
                        height: '12px',
                        border: `2px solid ${item.isVeg ? '#22c55e' : '#ef4444'}`,
                        borderRadius: '2px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: item.isVeg ? '#22c55e' : '#ef4444'
                        }}></span>
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    </div>
                    {/* Show addons if any */}
                    {item.addons && item.addons.length > 0 && (
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                        + {item.addons.map(a => `${a.name}${a.quantity > 1 ? ` x${a.quantity}` : ''}`).join(', ')}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      ${itemPrice} x {item.quantity}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0
                  }}>
                    <button
                      onClick={() => updateQuantity(itemKey, -1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: 'none',
                        background: '#e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#6b7280'
                      }}
                    >
                      -
                    </button>
                    <span style={{ width: '24px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(itemKey, 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: 'none',
                        background: primaryColor,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#fff'
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Item Total */}
                  <div style={{
                    fontWeight: '700',
                    fontSize: '14px',
                    color: '#1f2937',
                    minWidth: '55px',
                    textAlign: 'right',
                    flexShrink: 0
                  }}>
                    ${itemPrice * item.quantity}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(itemKey)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      padding: '4px',
                      fontSize: '16px',
                      flexShrink: 0
                    }}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              );})
            )}
          </div>

          {/* Billing Summary */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '10px',
            padding: '10px 12px',
            marginBottom: '10px',
            flexShrink: 0
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              <span>GST (5%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px dashed #e5e7eb',
              fontSize: '14px',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              <span>Total</span>
              <span style={{ color: primaryColor }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons - 4 in one row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            flexShrink: 0
          }}>
            <button
              style={{
                padding: '10px 6px',
                border: 'none',
                borderRadius: '8px',
                background: '#fef3c7',
                color: '#92400e',
                fontWeight: '600',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <i className="bi bi-file-earmark-text" style={{ fontSize: '12px' }}></i>
              KOT
            </button>
            <button
              style={{
                padding: '10px 6px',
                border: 'none',
                borderRadius: '8px',
                background: '#dbeafe',
                color: '#1e40af',
                fontWeight: '600',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <i className="bi bi-printer" style={{ fontSize: '12px' }}></i>
              Print
            </button>
            <button
              style={{
                padding: '10px 6px',
                border: 'none',
                borderRadius: '8px',
                background: '#dcfce7',
                color: '#166534',
                fontWeight: '600',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <i className="bi bi-save" style={{ fontSize: '12px' }}></i>
              Save
            </button>
            <button
              disabled={cart.length === 0}
              style={{
                padding: '10px 6px',
                border: 'none',
                borderRadius: '8px',
                background: cart.length === 0 ? '#e5e7eb' : primaryColor,
                color: cart.length === 0 ? '#9ca3af' : '#fff',
                fontWeight: '600',
                fontSize: '11px',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <i className="bi bi-credit-card" style={{ fontSize: '12px' }}></i>
              Pay
            </button>
          </div>
        </Col>
      </Row>

      {/* Cart Bar - Fixed at Bottom */}
      <style>{`
        .table-order-bottom-bar {
          position: fixed;
          bottom: 15px;
          left: 270px;
          right: 15px;
          z-index: 1000;
          background: ${primaryColor};
          color: #fff;
          padding: 12px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          box-shadow: 0 -4px 15px rgba(0,0,0,0.1);
          border-radius: 12px;
        }
        @media (max-width: 768px) {
          .table-order-bottom-bar {
            left: 10px;
            right: 10px;
            bottom: 10px;
            padding: 10px 15px;
            border-radius: 10px;
          }
        }
      `}</style>
      <div
        className="table-order-bottom-bar"
        onClick={() => setShowMobileCart(true)}
      >
        {/* Left - Items Count */}
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontWeight: '700',
          fontSize: '14px'
        }}>
          {totalItems} Items
        </div>

        {/* Center - Total */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontWeight: '700',
          fontSize: '18px'
        }}>
          ${total.toFixed(2)}
        </div>

        {/* Right - View Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px' }}>View Cart</span>
          <i className="bi bi-chevron-up" style={{ fontSize: '18px' }}></i>
        </div>
      </div>

      {/* Mobile Cart Overlay */}
      {showMobileCart && (
        <div
          className="mobile-cart-overlay"
          onClick={() => setShowMobileCart(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1001
          }}
        />
      )}

      {/* Mobile Cart Panel - Slides Up */}
      <style>{`
        .table-order-cart-panel {
          position: fixed;
          top: 70px;
          bottom: 10px;
          left: 270px;
          right: 10px;
          z-index: 1050;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (max-width: 992px) {
          .table-order-cart-panel {
            left: 10px;
            top: 60px;
          }
        }
        @media (max-width: 768px) {
          .table-order-cart-panel {
            left: 5px;
            right: 5px;
            top: 55px;
            bottom: 5px;
          }
        }
      `}</style>
      <div
        className="table-order-cart-panel"
        style={{
          transform: showMobileCart ? 'translateY(0)' : 'translateY(calc(100% + 100px))',
          pointerEvents: showMobileCart ? 'auto' : 'none'
        }}
      >
        <div
          style={{
            height: '100%',
            overflow: 'hidden',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Panel Header */}
          <div
            onClick={() => setShowMobileCart(false)}
            style={{
              padding: '12px 15px',
              background: primaryColor,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              borderRadius: '12px 12px 0 0',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', flexWrap: 'wrap' }}>
              <i className="bi bi-cart3" style={{ fontSize: '16px' }}></i>
              <span style={{ fontWeight: '600', fontSize: '14px' }}>Current Order</span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                {totalItems} Items
              </span>
            </div>
            <i className="bi bi-chevron-down" style={{ color: '#fff', fontSize: '16px' }}></i>
          </div>

          {/* Panel Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>
              <i className="bi bi-cart3" style={{ fontSize: '40px', marginBottom: '12px', display: 'block' }}></i>
              <p style={{ margin: 0, fontSize: '14px' }}>No items added yet</p>
            </div>
          ) : (
            cart.map(item => {
              const itemKey = item.cartItemId || item.id;
              const itemPrice = item.totalPrice || item.price;
              return (
                <div
                  key={itemKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    marginBottom: '8px',
                    background: '#f9fafb',
                    borderRadius: '10px',
                    gap: '10px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{
                        width: '12px',
                        height: '12px',
                        border: `2px solid ${item.isVeg ? '#22c55e' : '#ef4444'}`,
                        borderRadius: '2px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: item.isVeg ? '#22c55e' : '#ef4444'
                        }}></span>
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    </div>
                    {item.addons && item.addons.length > 0 && (
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                        + {item.addons.map(a => `${a.name}${a.quantity > 1 ? ` x${a.quantity}` : ''}`).join(', ')}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      ${itemPrice} x {item.quantity}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => updateQuantity(itemKey, -1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: 'none',
                        background: '#e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#6b7280'
                      }}
                    >-</button>
                    <span style={{ width: '24px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(itemKey, 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: 'none',
                        background: primaryColor,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#fff'
                      }}
                    >+</button>
                  </div>

                  <div style={{
                    fontWeight: '700',
                    fontSize: '14px',
                    color: '#1f2937',
                    minWidth: '55px',
                    textAlign: 'right'
                  }}>
                    ${itemPrice * item.quantity}
                  </div>

                  <button
                    onClick={() => removeFromCart(itemKey)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      padding: '4px',
                      fontSize: '16px'
                    }}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              );
            })
          )}
        </div>

          {/* Panel Billing Summary */}
          <div style={{ padding: '15px 20px', borderTop: '2px solid #eee', background: '#f8f9fa', borderRadius: '0 0 12px 12px', flexShrink: 0 }}>
          <div style={{
            background: '#f9fafb',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
              fontSize: '13px',
              color: '#6b7280'
            }}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontSize: '13px',
              color: '#6b7280'
            }}>
              <span>GST (5%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px dashed #e5e7eb',
              fontSize: '16px',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              <span>Total</span>
              <span style={{ color: primaryColor }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Panel Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px'
          }}>
            <button
              style={{
                padding: '12px 6px',
                border: 'none',
                borderRadius: '8px',
                background: '#fef3c7',
                color: '#92400e',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <i className="bi bi-file-earmark-text" style={{ fontSize: '14px' }}></i>
              KOT
            </button>
            <button
              style={{
                padding: '12px 6px',
                border: 'none',
                borderRadius: '8px',
                background: '#dbeafe',
                color: '#1e40af',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <i className="bi bi-printer" style={{ fontSize: '14px' }}></i>
              Print
            </button>
            <button
              style={{
                padding: '12px 6px',
                border: 'none',
                borderRadius: '8px',
                background: '#dcfce7',
                color: '#166534',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <i className="bi bi-save" style={{ fontSize: '14px' }}></i>
              Save
            </button>
            <button
              disabled={cart.length === 0}
              style={{
                padding: '12px 6px',
                border: 'none',
                borderRadius: '8px',
                background: cart.length === 0 ? '#e5e7eb' : primaryColor,
                color: cart.length === 0 ? '#9ca3af' : '#fff',
                fontWeight: '600',
                fontSize: '12px',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <i className="bi bi-credit-card" style={{ fontSize: '14px' }}></i>
              Pay
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Addon Modal */}
      <Modal show={showAddonModal} onHide={() => setShowAddonModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #eee' }}>
          <Modal.Title style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
            <i className="bi bi-plus-circle me-2" style={{ color: primaryColor }}></i>
            Select Addons
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px' }}>
          {/* Item Header */}
          {selectedItemForAddon && (
            <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)', borderRadius: '10px', padding: '15px', marginBottom: '20px', border: '1px solid #eee' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: `2px solid ${selectedItemForAddon.isVeg ? '#28a745' : '#dc3545'}`,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fff'
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: selectedItemForAddon.isVeg ? '#28a745' : '#dc3545'
                  }}></div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#333' }}>{selectedItemForAddon.name}</div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: primaryColor }}>{formatCurrency(selectedItemForAddon.price)}</div>
            </div>
          )}

          <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="bi bi-grid-3x3-gap" style={{ color: primaryColor }}></i>
            Available Addons
          </div>

          {addonsLoading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
              <Spinner animation="border" size="sm" style={{ color: primaryColor }} />
              <p style={{ margin: '10px 0 0', fontSize: '13px' }}>Loading addons...</p>
            </div>
          ) : !selectedItemForAddon?.addonsId ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#999', background: '#f8f9fa', borderRadius: '10px' }}>
              <i className="bi bi-x-circle" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px', color: '#ddd' }}></i>
              <p style={{ margin: 0, fontWeight: '500' }}>No addons for this item</p>
            </div>
          ) : itemAddons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#999', background: '#f8f9fa', borderRadius: '10px' }}>
              <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px', color: '#ddd' }}></i>
              <p style={{ margin: 0, fontWeight: '500' }}>No addons available</p>
            </div>
          ) : (
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {itemAddons.map(addon => {
                const selectedAddon = selectedAddons.find(a => a.id === addon.id);
                const isSelected = !!selectedAddon;
                const quantity = selectedAddon?.quantity || 0;
                return (
                  <div
                    key={addon.id}
                    style={{
                      padding: '6px 10px',
                      marginBottom: '5px',
                      borderRadius: '6px',
                      border: isSelected ? `2px solid ${primaryColor}` : '1px solid #e0e0e0',
                      background: isSelected ? '#fff8f8' : '#fafafa',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 2px 6px rgba(215,68,64,0.1)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ flex: 1, fontWeight: '600', color: '#333', fontSize: '13px' }}>
                      {addon.name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (quantity <= 1) {
                            setSelectedAddons(prev => prev.filter(a => a.id !== addon.id));
                          } else {
                            updateAddonQuantity(addon.id, -1, e);
                          }
                        }}
                        disabled={quantity === 0}
                        style={{
                          width: '24px',
                          height: '24px',
                          border: '1px solid #ddd',
                          background: quantity === 0 ? '#f0f0f0' : '#fff',
                          borderRadius: '4px',
                          cursor: quantity === 0 ? 'not-allowed' : 'pointer',
                          fontWeight: '700',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: quantity === 0 ? '#ccc' : '#333'
                        }}
                      >−</button>
                      <span style={{
                        fontWeight: '700',
                        minWidth: '20px',
                        textAlign: 'center',
                        fontSize: '13px',
                        color: quantity > 0 ? primaryColor : '#999'
                      }}>
                        {quantity}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSelected) {
                            setSelectedAddons(prev => [...prev, { ...addon, quantity: 1 }]);
                          } else {
                            updateAddonQuantity(addon.id, 1, e);
                          }
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          border: `1px solid ${primaryColor}`,
                          background: primaryColor,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff'
                        }}
                      >+</button>
                    </div>

                    <div style={{
                      fontWeight: '700',
                      color: primaryColor,
                      fontSize: '13px',
                      background: '#fff',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      minWidth: '60px',
                      textAlign: 'right'
                    }}>
                      {formatCurrency(addon.price)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total with addons */}
          {selectedAddons.length > 0 && selectedItemForAddon && (
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '12px', marginTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px', color: '#666' }}>
                <span>Item Price:</span>
                <span>{formatCurrency(selectedItemForAddon.price)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px', color: '#666' }}>
                <span>Addons ({selectedAddons.reduce((sum, a) => sum + (a.quantity || 1), 0)}):</span>
                <span>+{formatCurrency(selectedAddons.reduce((sum, a) => sum + (a.price * (a.quantity || 1)), 0))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed #ddd', fontWeight: '600' }}>
                <span>Total:</span>
                <span style={{ color: primaryColor }}>{formatCurrency(selectedItemForAddon.price + selectedAddons.reduce((sum, a) => sum + (a.price * (a.quantity || 1)), 0))}</span>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #eee', padding: '15px 20px' }}>
          <Button variant="light" onClick={() => setShowAddonModal(false)} style={{ borderRadius: '8px', fontWeight: '500' }}>
            Cancel
          </Button>
          <Button
            onClick={addItemWithAddons}
            style={{ background: primaryColor, border: 'none', borderRadius: '8px', fontWeight: '500', padding: '8px 20px' }}
          >
            <i className="bi bi-cart-plus me-2"></i>
            Add to Cart
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TableOrder;
