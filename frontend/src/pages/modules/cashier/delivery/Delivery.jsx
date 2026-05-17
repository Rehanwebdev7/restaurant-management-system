import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Row, Col, Form, Spinner, Modal, Button } from 'react-bootstrap';
import { ApiGet, ApiPost } from '../../../../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useDarkMode } from '../../../../contexts/DarkModeContext';

const CART_STORAGE_KEY = 'delivery_cart';

const Delivery = () => {
  const { primaryColor } = useTheme();
  const { isDarkMode } = useDarkMode();
  const categoryEmojis = { 501: '🥗', 502: '🍗', 503: '🍔', 504: '🍛', 505: '🍱', 506: '🍮', 507: '🥤', 508: '🎁' };
  const [menuItems, setMenuItems] = useState([]);
  const [branchName, setBranchName] = useState('Branch');
  const [restaurantName, setRestaurantName] = useState('Restaurant');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');

  // Initialize cart from localStorage
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '', orderType: 'delivery', address: '' });
  const [processingOrder, setProcessingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Pagination states (0-based page numbering)
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const itemsContainerRef = useRef(null);
  const PAGE_SIZE = 40;

  // Customer search states
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerList, setCustomerList] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Addon states
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [selectedItemForAddon, setSelectedItemForAddon] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [itemAddons, setItemAddons] = useState([]);
  const [addonsLoading, setAddonsLoading] = useState(false);

  // Bottom cart state
  const [showCartModal, setShowCartModal] = useState(false);

  // Customer address states
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [deliveryDistance, setDeliveryDistance] = useState(null);

  // Add new customer states
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);

  // Add new address states
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    addressType: 'Home',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    latitude: '',
    longitude: '',
    deliveryInstructions: ''
  });

  // Order success states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrderData, setLastOrderData] = useState(null);
  const printRef = useRef(null);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    dateOfBirth: '',
    addressType: 'Home',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    latitude: '',
    longitude: '',
    deliveryInstructions: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch cashier distance on page load and save to localStorage
  useEffect(() => {
    const fetchCashierDistance = async () => {
      try {
        const result = await ApiGet('/api/cashier/delivery_zones/distanceCalculator?latitude=20.81963343439244&longitude=74.74646629975446');
        if (result.success) {
          const distance = result.success.data?.data ?? result.success.data ?? null;
          if (distance !== null) {
            localStorage.setItem('casheirDistance', distance);
          }
        }
      } catch (err) {
        console.error('Failed to fetch cashier distance:', err);
      }
    };
    fetchCashierDistance();
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);

  // Reset pagination and fetch first page when filters change
  useEffect(() => {
    setMenuItems([]);
    setCurrentPage(0);
    setHasMore(true);
    fetchMenuItems(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedSubcategory, searchTerm]);

  useEffect(() => {
    if (selectedCategory !== 'all') {
      fetchSubcategories(selectedCategory);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategory]);

  // Load more items for next page
  const loadMoreItems = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchMenuItemsForPage(nextPage);
  }, [loadingMore, hasMore, currentPage]);

  // Fetch menu items for a specific page (used by loadMoreItems)
  const fetchMenuItemsForPage = async (page) => {
    setLoadingMore(true);
    try {
      const categoryId = selectedCategory !== 'all' ? selectedCategory : '';
      const subcategoryId = selectedSubcategory !== 'all' ? selectedSubcategory : '';
      const result = await ApiGet(`/api/cashier/menu_items/filter?categoryId=${categoryId}&subcategoryId=${subcategoryId}&searchValue=${searchTerm}&pageNumber=${page}&pageSize=${PAGE_SIZE}`);

      if (result.success) {
        const data = result.success.data.data;
        const newRecords = data.records || [];
        const totalPagesFromApi = data.totalPages || 1;

        setTotalPages(totalPagesFromApi);
        // 0-based: if totalPages is 3, pages are 0,1,2, so hasMore when page < totalPages - 1
        setHasMore(page < totalPagesFromApi - 1);
        setMenuItems(prev => [...prev, ...newRecords]);
      }
    } catch (err) {
      toast.error('Failed to load more items');
    } finally {
      setLoadingMore(false);
    }
  };

  // Scroll event handler for infinite scroll
  const handleScroll = useCallback(() => {
    const container = itemsContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Trigger load more when user scrolls to bottom (with 100px threshold)
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !loadingMore && !loading) {
      loadMoreItems();
    }
  }, [hasMore, loadingMore, loading, loadMoreItems]);

  // Add scroll event listener
  useEffect(() => {
    const container = itemsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const fetchMenuItems = async (page = 0, isNewSearch = false) => {
    if (isNewSearch) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const categoryId = selectedCategory !== 'all' ? selectedCategory : '';
      const subcategoryId = selectedSubcategory !== 'all' ? selectedSubcategory : '';
      const result = await ApiGet(`/api/cashier/menu_items/filter?categoryId=${categoryId}&subcategoryId=${subcategoryId}&searchValue=${searchTerm}&pageNumber=${page}&pageSize=${PAGE_SIZE}`);

      if (result.success) {
        const data = result.success.data.data;
        const newRecords = data.records || [];
        const totalPagesFromApi = data.totalPages || 1;

        setTotalPages(totalPagesFromApi);
        // 0-based: if totalPages is 3, pages are 0,1,2, so hasMore when page < totalPages - 1
        setHasMore(page < totalPagesFromApi - 1);

        if (isNewSearch) {
          setMenuItems(newRecords);
          if (newRecords.length > 0) {
            const first = newRecords[0];
            if (first.branchId?.name) setBranchName(first.branchId.name);
            if (first.restaurantId?.name) setRestaurantName(first.restaurantId.name);
          }
        } else {
          setMenuItems(prev => [...prev, ...newRecords]);
        }
      }
    } catch (err) {
      toast.error('Failed to fetch menu items');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await ApiGet('/api/cashier/menu_category/all');
      if (result.success) {
        const cats = result.success.data?.data ?? result.success.data;
        setCategories(Array.isArray(cats) ? cats : []);
      }
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const result = await ApiGet(`/api/cashier/menu_subcategory/categoryId?categoryId=${categoryId}`);
      if (result.success) {
        const subs = result.success.data?.data ?? result.success.data;
        setSubcategories(Array.isArray(subs) ? subs : []);
      }
    } catch (err) {
      console.error('Failed to fetch subcategories');
    }
  };

  // Search customers by name
  const searchCustomers = async (searchValue) => {
    if (!searchValue.trim()) {
      setCustomerList([]);
      setShowCustomerDropdown(false);
      return;
    }
    setCustomerLoading(true);
    try {
      const result = await ApiGet('/api/cashier/customers/search', {
        searchValue: searchValue,
        pageNumber: 0,
        pageSize: 10
      });
      if (result.success) {
        const data = result.success.data?.data || result.success.data || {};
        setCustomerList(data.records || []);
        setShowCustomerDropdown(true);
      }
    } catch (err) {
      console.error('Failed to search customers');
      setCustomerList([]);
    } finally {
      setCustomerLoading(false);
    }
  };

  // Handle customer search input change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (customerSearch && !selectedCustomer) {
        searchCustomers(customerSearch);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerSearch, selectedCustomer]);

  // Calculate delivery distance from address coordinates
  const calculateDeliveryDistance = async (latitude, longitude) => {
    if (!latitude || !longitude) {
      setDeliveryDistance(null);
      return;
    }
    try {
      const result = await ApiGet(`/api/cashier/delivery_zones/distanceCalculator?latitude=${latitude}&longitude=${longitude}`);
      if (result.success) {
        const distance = result.success.data?.data ?? result.success.data ?? null;
        setDeliveryDistance(distance);
      } else {
        setDeliveryDistance(null);
      }
    } catch (err) {
      console.error('Failed to calculate delivery distance:', err);
      setDeliveryDistance(null);
    }
  };

  // Fetch customer delivery addresses
  const fetchCustomerAddresses = async (customerId) => {
    if (!customerId) {
      setCustomerAddresses([]);
      return;
    }
    setAddressesLoading(true);
    try {
      const result = await ApiGet(`/api/cashier/customer_delivery_addresses/customerId?customerId=${customerId}`);
      if (result.success) {
        const addresses = result.success.data?.data || result.success.data || [];
        const addressList = Array.isArray(addresses) ? addresses : [];
        setCustomerAddresses(addressList);
        // Auto-select first address if available
        if (addressList.length > 0) {
          setSelectedAddress(addressList[0]);
          // Calculate distance for auto-selected address
          if (addressList[0].latitude && addressList[0].longitude) {
            calculateDeliveryDistance(addressList[0].latitude, addressList[0].longitude);
          }
        }
      } else {
        setCustomerAddresses([]);
      }
    } catch (err) {
      console.error('Failed to fetch customer addresses:', err);
      setCustomerAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  };

  // Select customer from dropdown
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerInfo({
      ...customerInfo,
      name: customer.name || '',
      phone: customer.mobileNumber || '',
      email: customer.email || ''
    });
    // Show name with mobile number
    const displayText = customer.mobileNumber
      ? `${customer.name || 'N/A'} - ${customer.mobileNumber}`
      : (customer.name || '');
    setCustomerSearch(displayText);
    setShowCustomerDropdown(false);
    // Fetch addresses for this customer (will auto-select first address)
    fetchCustomerAddresses(customer.id);
  };

  // Clear selected customer
  const clearSelectedCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCustomerInfo({
      ...customerInfo,
      name: '',
      phone: '',
      email: '',
      address: ''
    });
    setCustomerList([]);
    // Clear addresses
    setCustomerAddresses([]);
    setSelectedAddress(null);
    setShowAddressDropdown(false);
    setDeliveryDistance(null);
  };

  // Add new customer with address
  const addNewCustomer = async () => {
    // Validate required fields
    if (!newCustomer.name?.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (!newCustomer.mobileNumber?.trim()) {
      toast.error('Please enter mobile number');
      return;
    }
    if (!newCustomer.addressLine1?.trim()) {
      toast.error('Please enter address');
      return;
    }

    setAddingCustomer(true);
    try {
      // Step 1: Add customer
      const customerData = {
        name: newCustomer.name,
        email: newCustomer.email || null,
        mobileNumber: newCustomer.mobileNumber,
        dateOfBirth: newCustomer.dateOfBirth || null
      };

      const customerResult = await ApiPost('/api/cashier/customers/add', customerData);

      if (customerResult.success) {
        const customerId = customerResult.success.data?.data || customerResult.success.data;

        // Step 2: Add address for this customer
        const addressData = {
          addressType: newCustomer.addressType || 'Home',
          addressLine1: newCustomer.addressLine1,
          addressLine2: newCustomer.addressLine2 || '',
          customerId: { id: parseInt(customerId) },
          latitude: newCustomer.latitude ? parseFloat(newCustomer.latitude) : 0,
          longitude: newCustomer.longitude ? parseFloat(newCustomer.longitude) : 0,
          landmark: newCustomer.landmark || '',
          deliveryInstructions: newCustomer.deliveryInstructions || '',
          isActive: true
        };

        await ApiPost('/api/cashier/customer_delivery_addresses/add', addressData);

        // Step 3: Select the new customer
        const newCust = {
          id: parseInt(customerId),
          name: newCustomer.name,
          mobileNumber: newCustomer.mobileNumber,
          email: newCustomer.email
        };

        handleSelectCustomer(newCust);

        // Reset form and close modal
        setNewCustomer({
          name: '',
          email: '',
          mobileNumber: '',
          dateOfBirth: '',
          addressType: 'Home',
          addressLine1: '',
          addressLine2: '',
          landmark: '',
          latitude: '',
          longitude: '',
          deliveryInstructions: ''
        });
        setShowAddCustomerModal(false);
        toast.success('Customer added successfully!');
      } else {
        toast.error(customerResult.fail || 'Failed to add customer');
      }
    } catch (err) {
      console.error('Failed to add customer:', err);
      toast.error('Failed to add customer');
    } finally {
      setAddingCustomer(false);
    }
  };

  // Handle adding new address for selected customer
  const handleAddAddress = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer first');
      return;
    }

    if (!newAddress.addressLine1.trim()) {
      toast.error('Please enter Address Line 1');
      return;
    }

    setAddingAddress(true);
    try {
      const addressData = {
        customerId: { id: selectedCustomer.id },
        addressType: newAddress.addressType,
        addressLine1: newAddress.addressLine1,
        addressLine2: newAddress.addressLine2 || '',
        latitude: newAddress.latitude ? parseFloat(newAddress.latitude) : 0,
        longitude: newAddress.longitude ? parseFloat(newAddress.longitude) : 0,
        landmark: newAddress.landmark || '',
        deliveryInstructions: newAddress.deliveryInstructions || '',
        isActive: true
      };

      const result = await ApiPost('/api/cashier/customer_delivery_addresses/add', addressData);

      if (result.success) {
        // Reset form and close modal
        setNewAddress({
          addressType: 'Home',
          addressLine1: '',
          addressLine2: '',
          landmark: '',
          latitude: '',
          longitude: '',
          deliveryInstructions: ''
        });
        setShowAddAddressModal(false);
        toast.success('Address added successfully!');

        // Refresh customer addresses
        fetchCustomerAddresses(selectedCustomer.id);
      } else {
        toast.error(result.fail || 'Failed to add address');
      }
    } catch (err) {
      console.error('Failed to add address:', err);
      toast.error('Failed to add address');
    } finally {
      setAddingAddress(false);
    }
  };

  // Build full address string from address object
  const buildFullAddress = (addr) => {
    if (!addr) return '';
    const parts = [
      addr.addressLine1,
      addr.addressLine2,
      addr.landmark ? `Near ${addr.landmark}` : null
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Select address from dropdown
  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setCustomerInfo({
      ...customerInfo,
      address: buildFullAddress(address)
    });
    setShowAddressDropdown(false);
    // Calculate distance for selected address
    if (address.latitude && address.longitude) {
      calculateDeliveryDistance(address.latitude, address.longitude);
    } else {
      setDeliveryDistance(null);
    }
  };

  // Fetch addon items from API for a given addonId
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

  // Open addon modal for an item
  const openAddonModal = async (item, e) => {
    e.stopPropagation();
    setSelectedItemForAddon(item);
    setSelectedAddons([]);
    setItemAddons([]);
    setShowAddonModal(true);

    // Fetch addon items if item has addonsId
    if (item?.addonsId?.id) {
      await fetchAddonItems(item.addonsId.id);
    }
  };

  // Toggle addon selection
  const toggleAddon = (addon) => {
    const exists = selectedAddons.find(a => a.id === addon.id);
    if (exists) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      // Add addon with default quantity 1
      setSelectedAddons([...selectedAddons, { ...addon, quantity: 1 }]);
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

    // Calculate addons total with quantity
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + ((addon.price || 0) * (addon.quantity || 1)), 0);
    const cartItemId = `${selectedItemForAddon.id}-${Date.now()}`; // Unique ID for items with different addons

    const cartItem = {
      ...selectedItemForAddon,
      cartItemId,
      addons: selectedAddons,
      addonsTotal,
      totalPrice: selectedItemForAddon.price + addonsTotal,
      quantity: 1
    };

    setCart([...cart, cartItem]);
    toast.success(`${selectedItemForAddon.name} with addons added!`, { autoClose: 1000 });
    setShowAddonModal(false);
    setSelectedItemForAddon(null);
    setSelectedAddons([]);
  };

  const addToCart = (item) => {
    const existingItem = cart.find(c => c.id === item.id);
    if (existingItem) {
      setCart(cart.map(c =>
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    toast.success(`${item.name} added!`, { autoClose: 1000 });
  };

  const updateQuantity = (cartItemId, delta) => {
    const newCart = cart.map(item => {
      const itemKey = item.cartItemId || item.id;
      if (itemKey === cartItemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(item => item !== null);

    setCart(newCart);
    // Close cart modal if cart becomes empty
    if (newCart.length === 0) {
      setShowCartModal(false);
    }
  };

  const removeFromCart = (cartItemId) => {
    const newCart = cart.filter(item => (item.cartItemId || item.id) !== cartItemId);
    setCart(newCart);
    // Close cart modal if cart becomes empty
    if (newCart.length === 0) {
      setShowCartModal(false);
    }
  };

  const clearCart = () => {
    setCart([]);
    // Clear cart from localStorage
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
    setCustomerInfo({ name: '', phone: '', email: '', orderType: 'delivery', address: '' });
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCustomerList([]);
    // Clear address states
    setCustomerAddresses([]);
    setSelectedAddress(null);
    setShowAddressDropdown(false);
    setDeliveryDistance(null);
  };

  const subtotal = cart.reduce((sum, item) => sum + ((item.totalPrice || item.price) * item.quantity), 0);
  const total = subtotal;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.warning('Cart is empty');
      return;
    }
    setShowCheckoutModal(true);
  };

  const processOrder = async () => {

    // Validate delivery address
    if (!selectedAddress && !customerInfo.address?.trim()) {
      toast.error('Please provide delivery address');
      return;
    }

    setProcessingOrder(true);
    try {
      // Map order type to API format
      const orderTypeMap = {
        'dine-in': 'DINE_IN',
        'takeaway': 'TAKEAWAY',
        'delivery': 'DELIVERY'
      };

      // Get distance from localStorage
      const savedDistance = localStorage.getItem('casheirDistance');
      const distanceValue = savedDistance ? parseFloat(savedDistance) : (deliveryDistance || 0);

      const orderData = {
        customerId: selectedCustomer ? { id: selectedCustomer.id } : null,
        custAddressId: selectedAddress ? { id: selectedAddress.id } : null,
        orderType: 'DELIVERY',
        paymentMethod: paymentMethod,
        distance: distanceValue,
        items: cart.map(item => ({
          menu_item_id: String(item.id),
          quantity: item.quantity,
          price: item.price,
          special_instructions: '',
          addonItems: item.addons && item.addons.length > 0
            ? item.addons.map(addon => ({
                addonItemId: addon.id,
                quantity: String(addon.quantity || 1)
              }))
            : []
        }))
      };

      const result = await ApiPost('/api/cashier/orders/adds', orderData);
      if (result.success) {
        // Save order details for print
        const orderResponse = result.success.data?.data || result.success.data;
        const addressText = selectedAddress
          ? `${selectedAddress.addressLine1 || ''}, ${selectedAddress.addressLine2 || ''} ${selectedAddress.landmark ? '(Near ' + selectedAddress.landmark + ')' : ''}`.trim()
          : customerInfo.address;

        setLastOrderData({
          orderNumber: orderResponse?.orderNumber || `ORD-${Date.now()}`,
          orderId: orderResponse?.id || orderResponse,
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice || item.price,
            addons: item.addons || []
          })),
          customer: selectedCustomer ? {
            name: selectedCustomer.name || 'N/A',
            phone: selectedCustomer.mobileNumber || 'N/A'
          } : null,
          deliveryAddress: addressText,
          paymentMethod: paymentMethod,
          subtotal: subtotal,
          total: total,
          orderType: 'DELIVERY',
          createdAt: new Date().toLocaleString('en-IN')
        });

        setShowCheckoutModal(false);
        setShowSuccessModal(true);
        toast.success('Order placed successfully!');
      } else {
        toast.error(result.fail || 'Failed to place order');
      }
    } catch (err) {
      toast.error('Failed to process order');
    } finally {
      setProcessingOrder(false);
    }
  };

  // Print order receipt
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Delivery Order Receipt</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; padding: 10px; font-size: 12px; max-width: 300px; margin: 0 auto; }
            .receipt { padding: 10px; }
            .receipt-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .receipt-header h2 { font-size: 16px; margin-bottom: 5px; }
            .receipt-header p { font-size: 11px; color: #666; }
            .order-info { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #000; }
            .order-info p { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .delivery-address { background: #f5f5f5; padding: 8px; margin-bottom: 10px; border-radius: 4px; font-size: 11px; }
            .items-header { display: flex; justify-content: space-between; font-weight: bold; padding: 5px 0; border-bottom: 1px solid #000; }
            .item-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ccc; }
            .item-name { flex: 1; }
            .item-qty { width: 30px; text-align: center; }
            .item-price { width: 60px; text-align: right; }
            .addons { font-size: 10px; color: #666; padding-left: 10px; }
            .totals { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #000; }
            .totals p { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .totals .grand-total { font-size: 14px; font-weight: bold; margin-top: 5px; padding-top: 5px; border-top: 1px solid #000; }
            .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000; font-size: 11px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Close success modal and clear cart
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setLastOrderData(null);
    clearCart();
    setPaymentMethod('CASH');
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
    <style>{`
      .pos-container {
        padding: 15px;
        background: #f8f9fa;
        height: calc(100vh - 70px);
        overflow: hidden;
      }
      .pos-main-card {
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .pos-header {
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
        flex-shrink: 0;
      }
      .pos-header h5 {
        margin: 0;
        color: ${primaryColor};
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;
      }
      @media (max-width: 768px) {
        .pos-container {
          padding: 10px;
          height: calc(100vh - 60px);
        }
        .pos-header {
          padding: 12px 15px;
        }
        .pos-header h5 {
          font-size: 16px;
          gap: 6px;
        }
      }
      @media (max-width: 480px) {
        .pos-container {
          padding: 8px;
          height: calc(100vh - 55px);
        }
        .pos-header {
          padding: 10px 12px;
        }
        .pos-header h5 {
          font-size: 15px;
        }
      }
    `}</style>
    <div className="pos-container">
      <Row className="g-2 g-md-3" style={{ height: '100%' }}>
        {/* Menu Items - Full Width */}
        <Col xs={12} style={{ height: '100%' }}>
          <div className="pos-main-card">
            {/* Header */}
            <div className="pos-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Restaurant Logo */}
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '20px',
                    boxShadow: `0 4px 12px ${primaryColor}40`
                  }}
                >
                  {branchName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: primaryColor, margin: 0 }}>{branchName}</div>
                  <div style={{ fontSize: '11px', color: '#999', margin: 0 }}>{restaurantName}</div>
                </div>
              </div>
              <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <i className="bi bi-grid-3x3-gap-fill"></i>
                Delivery
              </h5>
            </div>

            {/* Categories & Search Row */}
            <style>{`
              .pos-filter-row {
                display: flex;
                align-items: center;
                gap: 15px;
              }
              .pos-search-box {
                width: 200px;
              }
              .pos-filter-section {
                padding: 12px 20px;
                border-bottom: 1px solid #eee;
                background: #fafafa;
                flex-shrink: 0;
              }
              .pos-category-btn {
                padding: 6px 14px;
                border-radius: 20px;
                font-weight: 500;
                font-size: 12px;
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.2s;
              }
              @media (max-width: 768px) {
                .pos-filter-row {
                  flex-direction: column;
                  align-items: stretch;
                  gap: 10px;
                }
                .pos-search-box {
                  width: 100%;
                }
                .pos-filter-section {
                  padding: 10px 12px;
                }
                .pos-category-btn {
                  padding: 5px 10px;
                  font-size: 11px;
                }
              }
              @media (max-width: 480px) {
                .pos-filter-section {
                  padding: 8px 10px;
                }
                .pos-category-btn {
                  padding: 4px 8px;
                  font-size: 10px;
                }
              }
            `}</style>
            <div className="pos-filter-section">
              <div className="pos-filter-row">
                {/* Categories - Left */}
                <div style={{ display: 'flex', gap: '6px', flex: 1, overflowX: 'auto', paddingBottom: '2px' }}>
                  <button
                    className="pos-category-btn"
                    onClick={() => { setSelectedCategory('all'); setSelectedSubcategory('all'); }}
                    style={{
                      border: selectedCategory === 'all' ? `2px solid ${primaryColor}` : '1px solid #ddd',
                      background: selectedCategory === 'all' ? primaryColor : '#fff',
                      color: selectedCategory === 'all' ? '#fff' : '#333',
                      fontWeight: selectedCategory === 'all' ? '600' : '500'
                    }}
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      className="pos-category-btn"
                      onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory('all'); }}
                      style={{
                        border: selectedCategory === cat.id ? `2px solid ${primaryColor}` : '1px solid #ddd',
                        background: selectedCategory === cat.id ? primaryColor : '#fff',
                        color: selectedCategory === cat.id ? '#fff' : '#333',
                        fontWeight: selectedCategory === cat.id ? '600' : '500'
                      }}
                    >
                      {categoryEmojis[cat.id] || ''} {cat.name}
                    </button>
                  ))}
                </div>

                {/* Search & Clear - Right */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  <div className="pos-search-box" style={{ position: 'relative' }}>
                    <i className="bi bi-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999', zIndex: 1 }}></i>
                    <Form.Control
                      type="text"
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      size="sm"
                      style={{ paddingLeft: '35px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '13px' }}
                    />
                  </div>
                  {(selectedCategory !== 'all' || selectedSubcategory !== 'all' || searchTerm) && (
                    <button
                      onClick={() => { setSelectedCategory('all'); setSelectedSubcategory('all'); setSearchTerm(''); }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid #ddd',
                        background: '#fff',
                        color: '#666',
                        fontWeight: '500',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <i className="bi bi-x-circle"></i>
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Subcategories - Show when category is selected */}
            {selectedCategory !== 'all' && subcategories.length > 0 && (
              <div style={{ padding: '10px 20px', borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eee', background: isDarkMode ? 'rgba(26,26,46,0.9)' : '#f5f5f5' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#666', fontWeight: '500', marginRight: '5px' }}>
                    <i className="bi bi-arrow-return-right"></i>
                  </span>
                  <button
                    onClick={() => setSelectedSubcategory('all')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '15px',
                      border: selectedSubcategory === 'all' ? `2px solid ${primaryColor}` : isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #ccc',
                      background: selectedSubcategory === 'all' ? (isDarkMode ? `rgba(59,130,246,0.15)` : '#fff8f8') : (isDarkMode ? 'rgba(255,255,255,0.06)' : '#fff'),
                      color: selectedSubcategory === 'all' ? primaryColor : (isDarkMode ? '#94a3b8' : '#555'),
                      fontWeight: selectedSubcategory === 'all' ? '600' : '500',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    All
                  </button>
                  {subcategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubcategory(sub.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '15px',
                        border: selectedSubcategory === sub.id ? `2px solid ${primaryColor}` : isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #ccc',
                        background: selectedSubcategory === sub.id ? (isDarkMode ? `rgba(26,26,46,0.6)` : '#fff8f8') : (isDarkMode ? 'rgba(255,255,255,0.06)' : '#fff'),
                        color: selectedSubcategory === sub.id ? primaryColor : (isDarkMode ? '#94a3b8' : '#555'),
                        fontWeight: selectedSubcategory === sub.id ? '600' : '500',
                        fontSize: '12px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                      }}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Items Grid */}
            <style>{`
              .pos-items-container {
                padding: 20px;
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
              }
              .pos-items-container::-webkit-scrollbar {
                width: 6px;
              }
              .pos-items-container::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
              }
              .pos-items-container::-webkit-scrollbar-thumb {
                background: #ccc;
                border-radius: 3px;
              }
              .pos-items-container::-webkit-scrollbar-thumb:hover {
                background: #999;
              }
              @media (max-width: 768px) {
                .pos-items-container {
                  padding: 12px;
                  padding-bottom: 80px;
                }
              }
              @media (max-width: 480px) {
                .pos-items-container {
                  padding: 10px;
                  padding-bottom: 80px;
                }
              }
            `}</style>
            <div className="pos-items-container" ref={itemsContainerRef}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spinner animation="border" style={{ color: primaryColor }} />
                </div>
              ) : menuItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}></i>
                  <p style={{ fontSize: '14px' }}>No items found</p>
                </div>
              ) : (
                <>
                <style>{`
                  .pos-items-grid {
                    display: grid;
                    grid-template-columns: repeat(8, 1fr);
                    gap: 10px;
                  }
                  .pos-item-card {
                    background: #fff;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    overflow: hidden;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    position: relative;
                  }
                  .pos-item-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #333;
                    line-height: 1.3;
                    text-align: center;
                    margin-bottom: 6px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                  }
                  .pos-item-price {
                    font-size: 17px;
                    font-weight: 700;
                    color: ${primaryColor};
                    margin: 0;
                    text-align: center;
                    flex: 1;
                  }
                  .pos-addon-btn {
                    padding: 4px 12px;
                    font-size: 12px;
                    font-weight: 500;
                    background: #fff;
                    border: 1px solid ${primaryColor};
                    color: ${primaryColor};
                    border-radius: 4px;
                    cursor: pointer;
                    width: auto;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                  }
                  .pos-addon-btn:hover {
                    background: ${primaryColor};
                    color: #fff;
                  }
                  @media (max-width: 1400px) {
                    .pos-items-grid { grid-template-columns: repeat(6, 1fr); }
                  }
                  @media (max-width: 1200px) {
                    .pos-items-grid { grid-template-columns: repeat(5, 1fr); }
                  }
                  @media (max-width: 992px) {
                    .pos-items-grid { grid-template-columns: repeat(4, 1fr); }
                  }
                  @media (max-width: 768px) {
                    .pos-items-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
                    .pos-item-card { padding: 6px; }
                    .pos-item-name { font-size: 13px; }
                    .pos-item-price { font-size: 17px; }
                    .pos-addon-btn { padding: 2px 5px; font-size: 10px; }
                  }
                  @media (max-width: 480px) {
                    .pos-items-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
                    .pos-item-card { padding: 5px; }
                    .pos-item-name { font-size: 12px; }
                    .pos-item-price { font-size: 16px; }
                    .pos-addon-btn { padding: 2px 4px; font-size: 9px; }
                  }
                `}</style>
                <style>{`
                  .modern-items-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    padding: 12px;
                  }
                  .modern-item-card {
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 0;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    position: relative;
                  }
                  .modern-item-card:hover {
                    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                    transform: translateY(-4px);
                    border-color: ${primaryColor};
                  }
                  .modern-item-image {
                    width: 100%;
                    height: 180px;
                    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                    position: relative;
                    overflow: hidden;
                  }
                  .modern-item-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                  }
                  .modern-item-badges {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    right: 8px;
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                  }
                  .modern-badge {
                    font-size: 11px;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                  }
                  .modern-badge-veg {
                    background: rgba(34, 197, 94, 0.15);
                    color: #22c55e;
                    border: 1px solid rgba(34, 197, 94, 0.3);
                  }
                  .modern-badge-nonveg {
                    background: rgba(239, 68, 68, 0.15);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                  }
                  .modern-badge-popular {
                    background: #fef3c7;
                    color: #d97706;
                    border: 1px solid #fde68a;
                  }
                  .modern-item-content {
                    padding: 12px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                  }
                  .modern-item-name {
                    font-weight: 700;
                    color: #1f2937;
                    font-size: 14px;
                    line-height: 1.3;
                    margin-bottom: 6px;
                    height: 28px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                  }
                  .modern-item-category {
                    font-size: 11px;
                    color: #9ca3af;
                    margin-bottom: 8px;
                  }
                  .modern-pricing-section {
                    margin-bottom: 10px;
                  }
                  .modern-price-current {
                    font-size: 18px;
                    font-weight: 700;
                    color: ${primaryColor};
                  }
                  .modern-price-original {
                    font-size: 12px;
                    color: #9ca3af;
                    text-decoration: line-through;
                  }
                  .modern-qty-section {
                    display: flex;
                    gap: 6px;
                    margin-top: auto;
                  }
                  .modern-qty-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    background: ${primaryColor};
                    color: #fff;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                  }
                  .modern-qty-btn:hover {
                    opacity: 0.9;
                    transform: scale(1.05);
                  }
                  .modern-qty-input {
                    width: 50px;
                    text-align: center;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    padding: 6px 4px;
                    font-size: 13px;
                    font-weight: 600;
                  }
                  .modern-cart-badge {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: ${primaryColor};
                    color: #fff;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                  }
                  @media (max-width: 1400px) {
                    .modern-items-grid { grid-template-columns: repeat(3, 1fr); }
                  }
                  @media (max-width: 1024px) {
                    .modern-items-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }
                  }
                  @media (max-width: 768px) {
                    .modern-items-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 8px; }
                    .modern-item-image { height: 140px; }
                  }
                  @media (max-width: 480px) {
                    .modern-items-grid { grid-template-columns: 1fr; }
                    .modern-item-card { flex-direction: row; }
                    .modern-item-image { width: 120px; height: 120px; flex-shrink: 0; }
                    .modern-item-content { min-width: 0; }
                  }
                `}</style>

                <style>{`
                  /* ===== DARK MODE OVERRIDES ===== */
                  [data-theme="dark"] .modern-item-card {
                    background: rgba(26, 26, 46, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                  }
                  [data-theme="dark"] .modern-item-card:hover {
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                    border-color: ${primaryColor};
                  }
                  [data-theme="dark"] .modern-item-image {
                    background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 100%);
                  }
                  [data-theme="dark"] .modern-item-name {
                    color: #e2e8f0;
                  }
                  [data-theme="dark"] .modern-item-category {
                    color: #94a3b8;
                  }
                  [data-theme="dark"] .modern-price-original {
                    color: #64748b;
                  }
                  [data-theme="dark"] .modern-qty-input {
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: #e2e8f0;
                  }
                  [data-theme="dark"] .pos-category-btn {
                    background: rgba(26, 26, 46, 0.9) !important;
                    border-color: rgba(255, 255, 255, 0.12) !important;
                    color: #e2e8f0 !important;
                  }
                  [data-theme="dark"] .pos-search-box .form-control {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(255, 255, 255, 0.12);
                    color: #e2e8f0;
                  }
                  [data-theme="dark"] .pos-items-container {
                    background: transparent;
                  }
                  [data-theme="dark"] .modern-item-card .text-muted {
                    color: #94a3b8 !important;
                  }
                `}</style>

                <div className="modern-items-grid">
                  {menuItems.map(item => {
                    const itemInCart = cart.filter(c => c.id === item.id);
                    const itemCount = itemInCart.reduce((sum, c) => sum + c.quantity, 0);
                    return (
                      <div key={item.id} className="modern-item-card">
                        {itemCount > 0 && (
                          <div className="modern-cart-badge">{itemCount}</div>
                        )}

                        <div className="modern-item-image">
                          <img
                            src={item.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22180%22%3E%3Crect fill=%22%232a2a3e%22 width=%22200%22 height=%22180%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-family=%22Arial%22 font-size=%2214%22 fill=%22%234b5563%22%3ENo Image%3C/text%3E%3C/svg%3E'}
                            alt={item.name}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className="modern-item-badges">
                            {item.foodType === 'VEG' && (
                              <span className="modern-badge modern-badge-veg">🟢 Veg</span>
                            )}
                            {item.foodType === 'NON_VEG' && (
                              <span className="modern-badge modern-badge-nonveg">🔴 Non-Veg</span>
                            )}
                            {item.isRecommended && (
                              <span className="modern-badge modern-badge-popular">⭐ Popular</span>
                            )}
                          </div>
                        </div>

                        <div className="modern-item-content">
                          <div className="modern-item-name" title={item.name}>{item.name}</div>
                          <div className="modern-item-category">
                            {item.menuSubCategoryId?.name || item.menuCategoryId?.name || 'Item'}
                          </div>

                          <div className="modern-pricing-section">
                            <div className="modern-price-current">
                              {formatCurrency(item.offerPrice || item.price)}
                            </div>
                            {item.offerPrice && item.offerPrice < item.price && (
                              <div className="modern-price-original">
                                {formatCurrency(item.price)}
                              </div>
                            )}
                          </div>

                          <div className="modern-qty-section">
                            {itemCount > 0 ? (
                              <>
                                <button
                                  onClick={() => {
                                    const lastItem = itemInCart[itemInCart.length - 1];
                                    setCart(prev => prev.filter(c => c !== lastItem));
                                  }}
                                  style={{
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    flex: 0.4
                                  }}
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  value={itemCount}
                                  readOnly
                                  className="modern-qty-input"
                                  style={{ flex: 0.2 }}
                                />
                                <button
                                  onClick={() => addToCart(item)}
                                  className="modern-qty-btn"
                                  style={{ flex: 0.4 }}
                                >
                                  +
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="modern-qty-btn"
                              >
                                <i className="bi bi-plus-circle"></i> Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Loading more indicator */}
                {loadingMore && (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}>
                    <Spinner animation="border" size="sm" style={{ color: primaryColor }} />
                    <span style={{ fontSize: '13px', color: '#666' }}>Loading more items...</span>
                  </div>
                )}

                {/* End of list indicator */}
                {!hasMore && menuItems.length > 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '15px',
                    color: '#999',
                    fontSize: '12px',
                    borderTop: '1px dashed #eee',
                    marginTop: '15px'
                  }}>
                    <i className="bi bi-check-circle me-2"></i>
                    All items loaded ({menuItems.length} items)
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Bottom Total Bar - Always visible when cart has items */}
      {totalItems > 0 && !showCartModal && (
        <>
        <style>{`
          .pos-bottom-bar {
            position: fixed;
            bottom: 15px;
            left: 270px;
            right: 15px;
            z-index: 100;
            background: ${primaryColor};
            color: #fff;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            box-shadow: 0 -4px 15px rgba(0,0,0,0.1);
            border-radius: 12px;
            animation: slideUpBar 0.3s ease-out;
          }
          @keyframes slideUpBar {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @media (max-width: 768px) {
            .pos-bottom-bar {
              left: 10px;
              right: 10px;
              bottom: 10px;
              padding: 10px 15px;
              border-radius: 10px;
            }
          }
        `}</style>
        <div
          className="pos-bottom-bar"
          onClick={() => setShowCartModal(true)}
        >
          {/* Left - Cart Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'relative' }}>
              <i className="bi bi-cart3" style={{ fontSize: '18px' }}></i>
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-10px',
                background: '#fff',
                color: primaryColor,
                fontSize: '9px',
                fontWeight: '700',
                padding: '2px 5px',
                borderRadius: '10px',
                minWidth: '16px',
                textAlign: 'center'
              }}>
                {totalItems}
              </span>
            </div>
          </div>
          {/* Center - Total */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '1px' }}>Total Amount</div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(total)}</div>
          </div>
          {/* Right - View Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', opacity: 0.9 }}>View Cart</span>
            <i className="bi bi-chevron-up" style={{ fontSize: '14px' }}></i>
          </div>
        </div>
        </>
      )}

      {/* Expanded Cart Panel - Slides up from bottom */}
      {totalItems > 0 && (
        <>
        <style>{`
          .pos-cart-panel {
            position: fixed;
            top: 70px;
            bottom: 10px;
            left: 70px;
            right: 10px;
            z-index: 1050;
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .pos-cart-items-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          @media (max-width: 992px) {
            .pos-cart-panel {
              left: 10px;
              top: 60px;
            }
            .pos-cart-items-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 768px) {
            .pos-cart-panel {
              left: 5px;
              right: 5px;
              top: 55px;
              bottom: 5px;
            }
            .pos-cart-items-grid {
              grid-template-columns: repeat(1, 1fr);
            }
          }
        `}</style>
        <div
          className="pos-cart-panel"
          style={{
            transform: showCartModal ? 'translateY(0)' : 'translateY(calc(100% + 100px))',
            pointerEvents: showCartModal ? 'auto' : 'none'
          }}
        >
          {/* Cart Content */}
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
            {/* Cart Header - Professional */}
            <div
              style={{
                padding: '16px',
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                borderRadius: '12px 12px 0 0',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onClick={() => setShowCartModal(false)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }}>
                <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-cart3" style={{ fontSize: '18px' }}></i>
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>Current Order</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>{totalItems} items • DELIVERY</div>
                </div>
              </div>
              <i className="bi bi-chevron-down" style={{ color: '#fff', fontSize: '18px', opacity: 0.8 }}></i>
            </div>

            {/* Main Content - Split Layout */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Left: Cart Items */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', borderRight: '1px solid #f0f0f0', background: '#fafbfc' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Items ({totalItems})</div>
                {cart.map((item, idx) => {
                  const itemKey = item.cartItemId || item.id;
                  const itemPrice = item.totalPrice || item.price;
                  return (
                    <div key={itemKey} style={{
                      padding: '12px',
                      background: '#fff',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      gap: '10px'
                    }}>
                      {/* Item Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '3px' }}>{item.name}</div>
                        {item.addons && item.addons.length > 0 && (
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
                            {item.addons.map(a => `${a.name}`).join(', ')}
                          </div>
                        )}
                        <div style={{ fontSize: '15px', fontWeight: '700', color: primaryColor }}>{formatCurrency(itemPrice)}</div>
                      </div>
                      {/* Quantity & Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <button onClick={() => updateQuantity(itemKey, -1)} style={{ width: '24px', height: '24px', border: '1px solid #ddd', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>−</button>
                          <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center', fontSize: '13px', color: '#1f2937' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(itemKey, 1)} style={{ width: '24px', height: '24px', border: '1px solid #ddd', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryColor }}>+</button>
                        </div>
                        <button onClick={() => removeFromCart(itemKey)} style={{ width: '24px', height: '24px', border: 'none', background: '#fee2e2', borderRadius: '4px', cursor: 'pointer', color: '#dc3545', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: '12px' }}>
                          <i className="bi bi-trash" style={{ fontSize: '11px' }}></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right: Order Summary & Details */}
              <div style={{ width: '280px', overflowY: 'auto', padding: '12px', background: '#fff', borderLeft: '1px solid #f0f0f0' }}>
                {/* Order Type */}
                <div style={{ background: '#f0f9ff', border: `1px solid ${primaryColor}40`, borderRadius: '8px', padding: '10px', marginBottom: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚗 Delivery Order</div>
                </div>

                {/* Customer Info */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>Customer</div>
                  <div style={{ background: '#f3f4f6', borderRadius: '6px', padding: '8px', fontSize: '12px', color: '#666', border: '1px solid #e5e7eb' }}>
                    Select customer to see details
                  </div>
                </div>

                {/* Address Info */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>📍 Address</div>
                  <div style={{ background: '#f3f4f6', borderRadius: '6px', padding: '8px', fontSize: '12px', color: '#666', border: '1px solid #e5e7eb' }}>
                    Select address at checkout
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e5e7eb', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: '13px', color: '#666' }}>Subtotal</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{formatCurrency(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#666' }}>Tax (5%)</span>
                    <span style={{ fontSize: '13px', color: '#666' }}>{formatCurrency(subtotal * 0.05)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#666' }}>Delivery</span>
                    <span style={{ fontSize: '13px', color: '#666' }}>$40</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937' }}>TOTAL</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: primaryColor }}>{formatCurrency(subtotal + (subtotal * 0.05) + 40)}</span>
                  </div>
                </div>

                {/* Special Instructions */}
                <textarea
                  placeholder="Add special instructions..."
                  style={{
                    width: '100%',
                    height: '50px',
                    padding: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    resize: 'none',
                    fontFamily: 'inherit',
                    marginBottom: '12px'
                  }}
                />
              </div>
            </div>

            {/* Footer - Actions */}
            <div style={{ padding: '12px', borderTop: '2px solid #e5e7eb', background: '#f8fafc', borderRadius: '0 0 12px 12px', flexShrink: 0, display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { clearCart(); setShowCartModal(false); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#fff',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.background = '#fff'}
              >
                <i className="bi bi-x-circle me-1"></i>Clear
              </button>
              <button
                onClick={() => { setShowCartModal(false); handleCheckout(); }}
                style={{
                  flex: 2,
                  padding: '12px',
                  background: primaryColor,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: `0 4px 12px ${primaryColor}40`,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = `0 6px 16px ${primaryColor}50`; }}
                onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = `0 4px 12px ${primaryColor}40`; }}
              >
                <i className="bi bi-arrow-right-circle me-1"></i>Continue to Checkout
              </button>
            </div>
          </div>

        </div>
        </>
      )}

      {/* Checkout Modal */}
      <Modal show={showCheckoutModal} onHide={() => setShowCheckoutModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #eee' }}>
          <Modal.Title style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
            <i className="bi bi-receipt me-2" style={{ color: primaryColor }}></i>
            Complete Order
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px' }}>
          {/* Customer Search */}
          <Form.Group className="mb-3" style={{ position: 'relative' }}>
            <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Search Customer<span style={{ color: '#dc3545' }}>*</span></Form.Label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Form.Control
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    if (selectedCustomer) {
                      clearSelectedCustomer();
                    }
                  }}
                  placeholder="Search customer by name..."
                  style={{ borderRadius: '8px', fontSize: '14px', paddingRight: selectedCustomer ? '40px' : '35px' }}
                  disabled={selectedCustomer !== null}
                />
              {customerLoading && (
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #f3f3f3',
                    borderTop: `2px solid ${primaryColor}`,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              )}
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={clearSelectedCustomer}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#fee2e2',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className="bi bi-x" style={{ color: '#dc3545', fontSize: '14px' }}></i>
                </button>
              )}
              </div>
              {/* Add Customer Button */}
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
                style={{
                  width: '38px',
                  height: '38px',
                  border: `2px solid ${primaryColor}`,
                  background: '#fff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                title="Add New Customer"
              >
                <i className="bi bi-plus" style={{ color: primaryColor, fontSize: '20px', fontWeight: 'bold' }}></i>
              </button>
            </div>
            {/* Customer Dropdown */}
            {showCustomerDropdown && customerList.length > 0 && !selectedCustomer && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 1000,
                maxHeight: '200px',
                overflowY: 'auto',
                marginTop: '4px'
              }}>
                {customerList.map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <span style={{ fontWeight: '500', color: '#333', fontSize: '13px' }}>{customer.name || 'N/A'}</span>
                      <span style={{ fontSize: '12px', color: primaryColor, fontWeight: '500', background: `${primaryColor}15`, padding: '2px 8px', borderRadius: '4px' }}>{customer.mobileNumber || 'No phone'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showCustomerDropdown && customerList.length === 0 && customerSearch && !customerLoading && !selectedCustomer && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center',
                color: '#999',
                fontSize: '13px',
                zIndex: 1000,
                marginTop: '4px'
              }}>
                No customers found
              </div>
            )}
          </Form.Group>

          {/* Delivery Address - Always shown for Delivery page */}
          {(
            <Form.Group className="mb-3" style={{ position: 'relative' }}>
              <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Delivery Address<span style={{ color: '#dc3545' }}>*</span></Form.Label>

              {selectedCustomer ? (
                <>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <div
                        onClick={() => !addressesLoading && setShowAddressDropdown(!showAddressDropdown)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #ddd',
                          background: selectedAddress ? '#f8f9fa' : '#fff',
                          cursor: addressesLoading ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          minHeight: '42px'
                        }}
                      >
                        {addressesLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888' }}>
                            <Spinner animation="border" size="sm" style={{ color: primaryColor }} />
                            <span style={{ fontSize: '14px' }}>Loading addresses...</span>
                          </div>
                        ) : selectedAddress ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="bi bi-check-circle-fill" style={{ color: '#28a745', fontSize: '16px' }}></i>
                            <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
                              {selectedAddress.addressType || 'Address'} Selected
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '14px', color: '#999' }}>
                            {customerAddresses.length > 0 ? 'Select delivery address...' : 'No saved addresses'}
                          </span>
                        )}
                        {!addressesLoading && (
                          <i className={`bi bi-chevron-${showAddressDropdown ? 'up' : 'down'}`} style={{ color: '#666' }}></i>
                        )}
                      </div>

                      {/* Address Dropdown */}
                      {showAddressDropdown && customerAddresses.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: '#fff',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          zIndex: 1000,
                          maxHeight: '200px',
                          overflowY: 'auto',
                          marginTop: '4px'
                        }}>
                          {customerAddresses.map((addr, index) => (
                            <div
                              key={addr.id || index}
                              onClick={() => handleSelectAddress(addr)}
                              style={{
                                padding: '12px',
                                cursor: 'pointer',
                                borderBottom: index < customerAddresses.length - 1 ? '1px solid #f0f0f0' : 'none',
                                background: selectedAddress?.id === addr.id ? '#f8f9fa' : '#fff',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                              onMouseLeave={(e) => e.currentTarget.style.background = selectedAddress?.id === addr.id ? '#f8f9fa' : '#fff'}
                            >
                              <div style={{ fontWeight: '500', color: '#333', fontSize: '13px', marginBottom: '4px' }}>
                                <i className="bi bi-geo-alt me-2" style={{ color: primaryColor }}></i>
                                {addr.addressType || `Address ${index + 1}`}
                                {addr.isDefault && <span style={{ marginLeft: '8px', fontSize: '10px', background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', borderRadius: '4px' }}>Default</span>}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', paddingLeft: '22px' }}>
                                {buildFullAddress(addr) || 'No address details'}
                              </div>
                              {addr.deliveryInstructions && (
                                <div style={{ fontSize: '11px', color: '#888', paddingLeft: '22px', marginTop: '4px', fontStyle: 'italic' }}>
                                  <i className="bi bi-info-circle me-1"></i>
                                  {addr.deliveryInstructions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Address Button */}
                    <button
                      type="button"
                      onClick={() => setShowAddAddressModal(true)}
                      style={{
                        background: primaryColor,
                        border: 'none',
                        borderRadius: '8px',
                        width: '42px',
                        height: '42px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#fff',
                        fontSize: '18px',
                        flexShrink: 0
                      }}
                      title="Add new address"
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>

                  {/* Show selected address (read-only) */}
                  {selectedAddress && (
                    <div style={{
                      marginTop: '10px',
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #eee'
                    }}>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>
                          <i className="bi bi-geo-alt-fill me-1" style={{ color: primaryColor }}></i>
                          {selectedAddress.addressType || 'Delivery Address'}
                        </span>
                        {selectedAddress.isDefault && (
                          <span style={{ fontSize: '10px', background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', borderRadius: '4px' }}>Default</span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#333' }}>
                        {buildFullAddress(selectedAddress)}
                      </div>
                      {selectedAddress.deliveryInstructions && (
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', fontStyle: 'italic' }}>
                          <i className="bi bi-info-circle me-1"></i>
                          {selectedAddress.deliveryInstructions}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Show textarea for manual entry when no customer selected */
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  placeholder="Enter full delivery address"
                  style={{ borderRadius: '8px', fontSize: '14px' }}
                />
              )}
            </Form.Group>
          )}

          {/* Payment Method */}
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Payment Method<span style={{ color: '#dc3545' }}>*</span></Form.Label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['CASH', 'COD', 'CARD', 'PG', 'UPI'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    border: paymentMethod === method ? `2px solid ${primaryColor}` : '1px solid #ddd',
                    borderRadius: '6px',
                    background: paymentMethod === method ? `${primaryColor}15` : '#fff',
                    color: paymentMethod === method ? primaryColor : '#555',
                    fontWeight: paymentMethod === method ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '12px'
                  }}
                >
                  <i className={`bi ${method === 'CASH' ? 'bi-cash-coin' : method === 'UPI' ? 'bi-phone' : method === 'COD' ? 'bi-truck' : 'bi-credit-card'} me-1`}></i>
                  {method}
                </button>
              ))}
            </div>
          </Form.Group>

          <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '15px', marginTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', color: '#555' }}>Total Amount</span>
              <span style={{ fontSize: '22px', fontWeight: '700', color: primaryColor }}>{formatCurrency(total)}</span>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #eee', padding: '15px 20px' }}>
          <Button variant="light" onClick={() => setShowCheckoutModal(false)} style={{ borderRadius: '8px', fontWeight: '500' }}>
            Cancel
          </Button>
          <Button
            onClick={processOrder}
            disabled={processingOrder}
            style={{ background: primaryColor, border: 'none', borderRadius: '8px', fontWeight: '500', padding: '8px 20px' }}
          >
            {processingOrder ? <><Spinner animation="border" size="sm" className="me-2" />Processing...</> : <><i className="bi bi-check-circle me-2"></i>Place Order</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Addon Modal */}
      <Modal show={showAddonModal} onHide={() => setShowAddonModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #eee' }}>
          <Modal.Title style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
            <i className="bi bi-plus-circle me-2" style={{ color: primaryColor }}></i>
            Select Addons
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px' }}>
          {/* Item Header - No Image */}
          {selectedItemForAddon && (
            <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)', borderRadius: '10px', padding: '15px', marginBottom: '20px', border: '1px solid #eee' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {/* Veg/Non-veg indicator */}
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: `2px solid ${selectedItemForAddon.dietaryType ? '#28a745' : '#dc3545'}`,
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
                    background: selectedItemForAddon.dietaryType ? '#28a745' : '#dc3545'
                  }}></div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#333' }}>{selectedItemForAddon.name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: primaryColor }}>{formatCurrency(selectedItemForAddon.price)}</div>
                {selectedItemForAddon.spiceLevel && (
                  <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="bi bi-fire" style={{ color: selectedItemForAddon.spiceLevel === 'Hot' ? '#dc3545' : selectedItemForAddon.spiceLevel === 'Medium' ? '#fd7e14' : '#28a745' }}></i>
                    {selectedItemForAddon.spiceLevel}
                  </div>
                )}
              </div>
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
                    {/* Addon Name */}
                    <div style={{ flex: 1, fontWeight: '600', color: '#333', fontSize: '13px' }}>
                      {addon.name}
                    </div>

                    {/* Quantity Controls - Always Visible */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (quantity <= 1) {
                            // Remove addon if quantity would go to 0
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
                            // Add addon with quantity 1
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

                    {/* Price */}
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

      {/* Add New Customer Modal */}
      <Modal show={showAddCustomerModal} onHide={() => setShowAddCustomerModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #eee' }}>
          <Modal.Title style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
            <i className="bi bi-person-plus me-2" style={{ color: primaryColor }}></i>
            Add New Customer
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '15px' }}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-1">
                <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Customer Name<span style={{ color: '#dc3545' }}>*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Enter customer name"
                  style={{ borderRadius: '8px', fontSize: '14px' }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-1">
                <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Mobile Number<span style={{ color: '#dc3545' }}>*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={newCustomer.mobileNumber}
                  onChange={(e) => setNewCustomer({ ...newCustomer, mobileNumber: e.target.value })}
                  placeholder="Enter mobile number"
                  style={{ borderRadius: '8px', fontSize: '14px' }}
                  maxLength={10}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-1">
                <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="Enter email (optional)"
                  style={{ borderRadius: '8px', fontSize: '14px' }}
                />
              </Form.Group>
            </Col>
            
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-1">
                <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Date of Birth</Form.Label>
                <Form.Control
                  type="date"
                  value={newCustomer.dateOfBirth}
                  onChange={(e) => setNewCustomer({ ...newCustomer, dateOfBirth: e.target.value })}
                  style={{ borderRadius: '8px', fontSize: '14px' }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-1">
                <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Address Type</Form.Label>
                <Form.Select
                  value={newCustomer.addressType}
                  onChange={(e) => setNewCustomer({ ...newCustomer, addressType: e.target.value })}
                  style={{ borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '15px', marginTop: '0px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-geo-alt" style={{ color: primaryColor }}></i>
              Delivery Address
            </div>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-1">
                  <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Address Line 1<span style={{ color: '#dc3545' }}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={newCustomer.addressLine1}
                    onChange={(e) => setNewCustomer({ ...newCustomer, addressLine1: e.target.value })}
                    placeholder="House/Flat No., Building Name"
                    style={{ borderRadius: '8px', fontSize: '14px' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-1">
                  <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Address Line 2</Form.Label>
                  <Form.Control
                    type="text"
                    value={newCustomer.addressLine2}
                    onChange={(e) => setNewCustomer({ ...newCustomer, addressLine2: e.target.value })}
                    placeholder="Street, Area"
                    style={{ borderRadius: '8px', fontSize: '14px' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-1">
                  <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Landmark</Form.Label>
                  <Form.Control
                    type="text"
                    value={newCustomer.landmark}
                    onChange={(e) => setNewCustomer({ ...newCustomer, landmark: e.target.value })}
                    placeholder="Near..."
                    style={{ borderRadius: '8px', fontSize: '14px' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-1">
                  <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Latitude</Form.Label>
                  <Form.Control
                    type="text"
                    value={newCustomer.latitude}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                        setNewCustomer({ ...newCustomer, latitude: value });
                      }
                    }}
                    placeholder="e.g., 23.0225"
                    style={{ borderRadius: '8px', fontSize: '14px' }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-1">
                  <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Longitude</Form.Label>
                  <Form.Control
                    type="text"
                    value={newCustomer.longitude}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                        setNewCustomer({ ...newCustomer, longitude: value });
                      }
                    }}
                    placeholder="e.g., 72.5714"
                    style={{ borderRadius: '8px', fontSize: '14px' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-0">
                  <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Delivery Instructions</Form.Label>
                  <Form.Control
                    type="text"
                    value={newCustomer.deliveryInstructions}
                    onChange={(e) => setNewCustomer({ ...newCustomer, deliveryInstructions: e.target.value })}
                    placeholder="e.g., Call before delivery"
                    style={{ borderRadius: '8px', fontSize: '14px' }}
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #eee', padding: '15px 20px' }}>
          <Button variant="light" onClick={() => setShowAddCustomerModal(false)} style={{ borderRadius: '8px', fontWeight: '500' }}>
            Cancel
          </Button>
          <Button
            onClick={addNewCustomer}
            disabled={addingCustomer}
            style={{ background: primaryColor, border: 'none', borderRadius: '8px', fontWeight: '500', padding: '8px 20px' }}
          >
            {addingCustomer ? (
              <><Spinner animation="border" size="sm" className="me-2" />Adding...</>
            ) : (
              <><i className="bi bi-plus-circle me-2"></i>Add Customer</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add New Address Modal */}
      <Modal show={showAddAddressModal} onHide={() => setShowAddAddressModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #eee' }}>
          <Modal.Title style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
            <i className="bi bi-geo-alt me-2" style={{ color: primaryColor }}></i>
            Add New Address
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px' }}>
          {selectedCustomer && (
            <div style={{ background: '#f0f9ff', padding: '10px 12px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px' }}>
              <i className="bi bi-person-fill me-2" style={{ color: primaryColor }}></i>
              Adding address for: <strong>{selectedCustomer.name}</strong>
            </div>
          )}

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Address Type</Form.Label>
                <Form.Select
                  value={newAddress.addressType}
                  onChange={(e) => setNewAddress({ ...newAddress, addressType: e.target.value })}
                  style={{ borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Address Line 1<span style={{ color: '#dc3545' }}>*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={newAddress.addressLine1}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                  placeholder="House/Flat No., Building Name"
                  style={{ borderRadius: '8px', fontSize: '14px' }}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Address Line 2</Form.Label>
                <Form.Control
                  type="text"
                  value={newAddress.addressLine2}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                  placeholder="Street, Area"
                  style={{ borderRadius: '8px', fontSize: '14px' }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Landmark</Form.Label>
                <Form.Control
                  type="text"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                  placeholder="Near..."
                  style={{ borderRadius: '8px', fontSize: '14px' }}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Latitude</Form.Label>
                <Form.Control
                  type="text"
                  value={newAddress.latitude}
                  onChange={(e) => setNewAddress({ ...newAddress, latitude: e.target.value })}
                  placeholder="e.g., 23.0225"
                  style={{ borderRadius: '8px', fontSize: '14px' }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Longitude</Form.Label>
                <Form.Control
                  type="text"
                  value={newAddress.longitude}
                  onChange={(e) => setNewAddress({ ...newAddress, longitude: e.target.value })}
                  placeholder="e.g., 72.5714"
                  style={{ borderRadius: '8px', fontSize: '14px' }}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>Delivery Instructions</Form.Label>
                <Form.Control
                  type="text"
                  value={newAddress.deliveryInstructions}
                  onChange={(e) => setNewAddress({ ...newAddress, deliveryInstructions: e.target.value })}
                  placeholder="e.g., Call before delivery"
                  style={{ borderRadius: '8px', fontSize: '14px' }}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #eee', padding: '15px 20px' }}>
          <Button variant="light" onClick={() => setShowAddAddressModal(false)} style={{ borderRadius: '8px', fontWeight: '500' }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddAddress}
            disabled={addingAddress}
            style={{ background: primaryColor, border: 'none', borderRadius: '8px', fontWeight: '500', padding: '8px 20px' }}
          >
            {addingAddress ? (
              <><Spinner animation="border" size="sm" className="me-2" />Adding...</>
            ) : (
              <><i className="bi bi-plus-circle me-2"></i>Add Address</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Order Success Modal with Print Option */}
      <Modal show={showSuccessModal} onHide={handleCloseSuccessModal} centered size="md">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #eee', background: '#f0fdf4' }}>
          <Modal.Title style={{ fontSize: '18px', fontWeight: '600', color: '#16a34a' }}>
            <i className="bi bi-check-circle-fill me-2"></i>
            Order Placed Successfully!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px' }}>
          {/* Success Animation */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#dcfce7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 15px'
            }}>
              <i className="bi bi-check-lg" style={{ fontSize: '40px', color: '#16a34a' }}></i>
            </div>
            <h5 style={{ color: '#333', marginBottom: '5px' }}>Order #{lastOrderData?.orderNumber}</h5>
            <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>{lastOrderData?.createdAt}</p>
          </div>

          {/* Delivery Address */}
          {lastOrderData?.deliveryAddress && (
            <div style={{ background: '#fef3c7', borderRadius: '8px', padding: '10px 12px', marginBottom: '15px', fontSize: '12px' }}>
              <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '3px' }}>
                <i className="bi bi-geo-alt-fill me-1"></i>Delivery Address
              </div>
              <div style={{ color: '#78350f' }}>{lastOrderData.deliveryAddress}</div>
            </div>
          )}

          {/* Order Summary Preview */}
          <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '15px', marginBottom: '15px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>Order Summary</div>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {lastOrderData?.items?.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dotted #ddd', fontSize: '13px' }}>
                  <span>{item.name} x{item.quantity}</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(item.totalPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', marginTop: '10px', borderTop: '1px solid #ddd' }}>
              <span style={{ fontWeight: '600' }}>Total</span>
              <span style={{ fontWeight: '700', color: primaryColor, fontSize: '16px' }}>{formatCurrency(lastOrderData?.total)}</span>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#666' }}>
            <div style={{ flex: 1, background: '#f0f0f0', padding: '10px', borderRadius: '8px' }}>
              <i className="bi bi-person me-1"></i>
              {lastOrderData?.customer?.name || 'Walk-in Customer'}
            </div>
            <div style={{ flex: 1, background: '#f0f0f0', padding: '10px', borderRadius: '8px' }}>
              <i className="bi bi-credit-card me-1"></i>
              {lastOrderData?.paymentMethod}
            </div>
          </div>

          {/* Hidden Print Content */}
          <div style={{ display: 'none' }}>
            <div ref={printRef}>
              <div className="receipt">
                <div className="receipt-header">
                  <h2>DELIVERY ORDER</h2>
                  <p>Order #{lastOrderData?.orderNumber}</p>
                  <p>{lastOrderData?.createdAt}</p>
                </div>
                <div className="order-info">
                  <p><span>Customer:</span> <span>{lastOrderData?.customer?.name || 'Walk-in'}</span></p>
                  <p><span>Phone:</span> <span>{lastOrderData?.customer?.phone || '-'}</span></p>
                  <p><span>Payment:</span> <span>{lastOrderData?.paymentMethod}</span></p>
                  <p><span>Order Type:</span> <span>{lastOrderData?.orderType}</span></p>
                </div>
                {lastOrderData?.deliveryAddress && (
                  <div className="delivery-address">
                    <strong>Delivery Address:</strong><br/>
                    {lastOrderData.deliveryAddress}
                  </div>
                )}
                <div className="items-header">
                  <span className="item-name">Item</span>
                  <span className="item-qty">Qty</span>
                  <span className="item-price">Price</span>
                </div>
                {lastOrderData?.items?.map((item, index) => (
                  <div key={index}>
                    <div className="item-row">
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">{item.quantity}</span>
                      <span className="item-price">{formatCurrency(item.totalPrice * item.quantity)}</span>
                    </div>
                    {item.addons && item.addons.length > 0 && (
                      <div className="addons">
                        {item.addons.map((addon, i) => (
                          <div key={i}>+ {addon.name} x{addon.quantity || 1}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="totals">
                  <p><span>Subtotal:</span> <span>{formatCurrency(lastOrderData?.subtotal)}</span></p>
                  <p className="grand-total"><span>TOTAL:</span> <span>{formatCurrency(lastOrderData?.total)}</span></p>
                </div>
                <div className="footer">
                  <p>Thank you for your order!</p>
                  <p>Your order will be delivered soon</p>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #eee', padding: '15px 20px', justifyContent: 'center', gap: '10px' }}>
          <Button
            variant="outline-secondary"
            onClick={handleCloseSuccessModal}
            style={{ borderRadius: '8px', fontWeight: '500', padding: '10px 25px' }}
          >
            <i className="bi bi-x-circle me-2"></i>Close
          </Button>
          <Button
            onClick={handlePrint}
            style={{ background: primaryColor, border: 'none', borderRadius: '8px', fontWeight: '500', padding: '10px 25px' }}
          >
            <i className="bi bi-printer me-2"></i>Print Receipt
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
    </>
  );
};

export default Delivery;
