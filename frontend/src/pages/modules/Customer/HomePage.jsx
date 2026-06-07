import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentTheme } from '../../../services/themeService';
import { useTheme } from '../../../contexts/ThemeContext';
import { ApiGet, ApiPost } from '../../../ApiServices/CustomerApiServices';
import PayPalButton from '../../../components/PayPalButton';
import StripeButton from '../../../components/StripeButton';
import apiClient from '../../../api/apiClient';
import { toast } from 'react-toastify';
import { server_api } from '../../../utils/constants';
import '../../../styles/HomePage.css';

const CUSTOMER_CART_KEY = 'customer_cart';
const CUSTOMER_WISHLIST_KEY = 'customer_wishlist';

// "All" category constant
const ALL_CATEGORY = { id: 'all', name: 'All', icon: null };
// "Recommended" category constant
const RECOMMENDED_CATEGORY = { id: 'recommended', name: 'Recommended', icon: null };
// "Order Again" category constant
const FREQUENTLY_CATEGORY = { id: 'frequently', name: 'Order Again', icon: null };
// "All subcategories" constant - used when user clicks "All {category}" in subcategory chips
const ALL_SUBCATEGORY = { id: 'all_sub', name: 'All' };

const CustomerLanding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const isMenuPage = currentPath === '/menu' || currentPath === '/' || currentPath === '/home';
  const isSignaturePage = currentPath === '/signature';
  const isWhyUsPage = currentPath === '/why-us';
  const isGalleryPage = currentPath === '/gallery';
  const isContactPage = currentPath === '/contact';

  // Dynamic Hero content config
  const getHeroContent = () => {
    if (isSignaturePage) {
      return {
        bg: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
        subtitle: 'OUR SPECIAL SIGNATURE DISHES',
        title: <>Chef's Special <br /> <span>Dishes</span></>,
        description: 'Enjoy our delicious food made by our best chefs to give you a wonderful dining experience.',
        showButtons: false
      };
    } else if (isWhyUsPage) {
      return {
        bg: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
        subtitle: 'GREAT FOOD & FRIENDLY SERVICE',
        title: <>Our Story of <br /> <span>Great Taste</span></>,
        description: 'We use high-quality fresh ingredients, follow strict hygiene standards, and offer warm hospitality to make your visit special.',
        showButtons: false
      };
    } else if (isGalleryPage) {
      return {
        bg: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80',
        subtitle: 'OUR RESTAURANT & FOOD PHOTOS',
        title: <>A Photo <br /> <span>Gallery</span></>,
        description: 'Browse through photos of our delicious dishes, beautiful dining area, and happy moments of our customers.',
        showButtons: false
      };
    } else if (isContactPage) {
      return {
        bg: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80',
        subtitle: 'EASY TABLE BOOKING & LOCATIONS',
        title: <>Book Your <br /> Table <span>Online</span></>,
        description: 'Book your table in advance for a smooth visit. We are ready to serve you with warm hospitality.',
        showButtons: true
      };
    } else {
      // Menu Page / Home
      return {
        bg: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=80',
        subtitle: 'FRESH & DELICIOUS MEALS',
        title: <>Delicious Food <br /> & Great <span>Taste</span></>,
        description: "Enjoy great food and a wonderful dining atmosphere. Every dish is prepared with fresh and high-quality ingredients.",
        showButtons: true
      };
    }
  };

  const heroContent = getHeroContent();

  // Scroll to top or specific hash on route transitions
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      window.scrollTo(0, 0);
    }
  }, [currentPath, location.hash]);

  const { restaurantId, loading: themeLoading, socialMediaDetails } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('customerThemeMode') || 'dark';
  });
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [reservation, setReservation] = useState({
    name: '',
    email: '',
    phone: '',
    guests: 2,
    date: '',
    time: '',
    notes: ''
  });

  const handleReservationSubmit = (e) => {
    e.preventDefault();
    if (!reservation.name || !reservation.phone || !reservation.date || !reservation.time) {
      toast.error('Please fill in all required fields.');
      return;
    }
    toast.success('Table reserved successfully! A confirmation details SMS has been sent.');
    setReservation({
      name: '',
      email: '',
      phone: '',
      guests: 2,
      date: '',
      time: '',
      notes: ''
    });
  };
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [currentBannerSlide, setCurrentBannerSlide] = useState(0);
  const [bannerHovered, setBannerHovered] = useState(false);
  // Initialize cart from localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem(CUSTOMER_CART_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });
  const [showCart, setShowCart] = useState(false);
  // Initialize wishlist from localStorage
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem(CUSTOMER_WISHLIST_KEY);
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error);
      return [];
    }
  });
  const [showWishlist, setShowWishlist] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [vegOnly, setVegOnly] = useState(() => {
    const savedVegOnly = localStorage.getItem('vegOnly');
    return savedVegOnly === 'true';
  });
  const categoryScrollRef = useRef(null);

  // Branch & Location States
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading'); // 'loading', 'granted', 'denied', 'error'

  // Location Search States
  const [locationSearch, setLocationSearch] = useState('');
  const locationSelectedRef = useRef(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [showCartBranchDropdown, setShowCartBranchDropdown] = useState(false);
  const [showNoBranchModal, setShowNoBranchModal] = useState(false);
  const [noBranchMessage, setNoBranchMessage] = useState('');
  const [modalLocationSearch, setModalLocationSearch] = useState('');
  const [modalLocationSuggestions, setModalLocationSuggestions] = useState([]);
  const [modalLocationSearching, setModalLocationSearching] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locating, setLocating] = useState(false);
  const locationModalSelectedRef = useRef(false);
  const debounceModalRef = useRef(null);

  // Categories State
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesPage, setCategoriesPage] = useState(0);
  const [hasMoreCategories, setHasMoreCategories] = useState(true);
  const [loadingMoreCategories, setLoadingMoreCategories] = useState(false);

  // Subcategories State
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);

  // Menu Items State
  const [menuItems, setMenuItems] = useState([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);
  const [menuItemsPage, setMenuItemsPage] = useState(0);
  const [hasMoreMenuItems, setHasMoreMenuItems] = useState(true);
  const [loadingMoreMenuItems, setLoadingMoreMenuItems] = useState(false);

  // Addons Modal State
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [selectedItemForAddon, setSelectedItemForAddon] = useState(null);
  const [addonItems, setAddonItems] = useState([]);
  const [addonLoading, setAddonLoading] = useState(false);
  const [maxAddon, setMaxAddon] = useState(0); // Maximum addon limit
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState(''); // Spice level selection for configurable items
  const [minAddon, setMinAddon] = useState(0); // Minimum addon limit (required addons)

  // Sliders State
  const [sliders, setSliders] = useState([]);
  const [slidersLoading, setSlidersLoading] = useState(true);

  // Customer login state
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState({}); // { addonId: quantity }
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [faviconUrl, setFaviconUrl] = useState('/app-favicon.svg');

  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Marquee state
  const [marqueeMessages, setMarqueeMessages] = useState([]);

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentGateways, setPaymentGateways] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectedOrderType, setSelectedOrderType] = useState('DELIVERY');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [showOrderSummaryDetails, setShowOrderSummaryDetails] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [payPalOrderId, setPayPalOrderId] = useState(null);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeOrderId, setStripeOrderId] = useState(null);

  // Coupon States
  const [coupons, setCoupons] = useState({ global: [], suggested: [], firstOrder: [] });
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [lotteryAnimation, setLotteryAnimation] = useState(null);
  const [showCouponList, setShowCouponList] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [isPercentDiscount, setIsPercentDiscount] = useState(false);
  const [couponPaybleAmount, setCouponPaybleAmount] = useState(null);

  // Tax Details State
  const [taxDetails, setTaxDetails] = useState(null);

  // Trending Items State
  const [trendingItems, setTrendingItems] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);

  // Frequently Ordered Items State
  const [frequentlyOrderedItems, setFrequentlyOrderedItems] = useState([]);
  const [frequentlyLoading, setFrequentlyLoading] = useState(false);

  // Address States
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [addressAllowedStatus, setAddressAllowedStatus] = useState(null); // null | 'loading' | 'SUCCESS' | 'FAILURE'
  const [addressAllowedMessage, setAddressAllowedMessage] = useState('');
  const [apiDeliveryCharge, setApiDeliveryCharge] = useState(0);

  // Add Address Modal States
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressLocationStatus, setAddressLocationStatus] = useState('loading');
  const [addressMapSearch, setAddressMapSearch] = useState('');
  const [addressMapSuggestions, setAddressMapSuggestions] = useState([]);
  const [showAddressMapSuggestions, setShowAddressMapSuggestions] = useState(false);
  const [addressMapSearchLoading, setAddressMapSearchLoading] = useState(false);
  const addressMapRef = useRef(null);
  const addressMapSelectedRef = useRef(false);
  const [newAddressData, setNewAddressData] = useState({
    addressType: 'Home',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    deliveryInstructions: '',
    latitude: 0,
    longitude: 0
  });

  // Customer Info States for checkout
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Get theme colors from themeService
  const theme = getCurrentTheme();
  const primaryColor = theme.primary || '#4cb7ec';
  const secondaryColor = theme.secondary || '#4cb7ec8a';
  const fontColor = theme.fontColor || '#000000';
  const logoUrl = theme.logoUrl || '/app-favicon.svg';
  const restaurantName = theme.restaurantName || 'RMS';
  const defaultImage = theme.feviconUrl || '/app-favicon.svg';
  // Contact Info from theme
  const contactAddress = theme.address || '';
  const contactPhone = theme.phone || '';
  const contactEmail = theme.email || '';

  // Add item to cart
  const addToCart = (item) => {
    const currentBranchId = selectedBranch?.id || localStorage.getItem('CustomerBranchId');

    // If item has addons, always add as new entry with unique cartItemId
    if (item.addons && item.addons.length > 0) {
      const cartItemId = `${item.id}-${Date.now()}`;
      setCartItems([...cartItems, { ...item, cartItemId, quantity: 1, branchId: currentBranchId }]);
      return;
    }

    // For items without addons, check if same item exists (without addons) for the same branch
    const existingItem = cartItems.find(cartItem =>
      cartItem.id === item.id &&
      (!cartItem.addons || cartItem.addons.length === 0) &&
      cartItem.branchId == currentBranchId
    );

    if (existingItem) {
      const itemKey = existingItem.cartItemId || existingItem.id;
      setCartItems(cartItems.map(cartItem => {
        const cartKey = cartItem.cartItemId || cartItem.id;
        return cartKey === itemKey && cartItem.branchId == currentBranchId
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem;
      }));
    } else {
      setCartItems([...cartItems, { ...item, quantity: 1, branchId: currentBranchId }]);
    }
  };

  // Remove item from cart (decrease quantity) - uses cartItemId for items with addons
  const removeFromCart = (cartItemId) => {
    const existingItem = cartItems.find(item => (item.cartItemId || item.id) === cartItemId);
    if (existingItem && existingItem.quantity > 1) {
      setCartItems(cartItems.map(item =>
        (item.cartItemId || item.id) === cartItemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCartItems(cartItems.filter(item => (item.cartItemId || item.id) !== cartItemId));
    }
  };

  // Delete item completely from cart - uses cartItemId for items with addons
  const deleteItemFromCart = (cartItemId) => {
    setCartItems(cartItems.filter(item => (item.cartItemId || item.id) !== cartItemId));
  };

  // Clear items from cart for current branch only
  const clearCart = () => {
    const currentBranchId = selectedBranch?.id || localStorage.getItem('CustomerBranchId');
    // Keep items from other branches, remove only current branch items
    setCartItems(cartItems.filter(item => item.branchId != currentBranchId));
  };

  // Get wishlist items filtered by current branch
  const getFilteredWishlistItems = () => {
    const currentBranchId = selectedBranch?.id || localStorage.getItem('CustomerBranchId');
    return wishlistItems.filter(item => item.branchId == currentBranchId);
  };

  // Toggle item in wishlist
  const toggleWishlist = (item, e) => {
    if (e) e.stopPropagation();
    const currentBranchId = selectedBranch?.id || localStorage.getItem('CustomerBranchId');
    const isInWishlistForBranch = wishlistItems.some(wishItem => wishItem.id === item.id && wishItem.branchId == currentBranchId);
    if (isInWishlistForBranch) {
      removeFromWishlist(item.id);
    } else {
      addToWishlist(item);
    }
  };

  // Add item to wishlist
  const addToWishlist = (item) => {
    const currentBranchId = selectedBranch?.id || localStorage.getItem('CustomerBranchId');
    const exists = wishlistItems.some(wishItem => wishItem.id === item.id && wishItem.branchId == currentBranchId);
    if (!exists) {
      setWishlistItems([...wishlistItems, { ...item, branchId: currentBranchId }]);
    }
  };

  // Remove item from wishlist (for current branch only)
  const removeFromWishlist = (itemId) => {
    const currentBranchId = selectedBranch?.id || localStorage.getItem('CustomerBranchId');
    setWishlistItems(wishlistItems.filter(item => !(item.id === itemId && item.branchId == currentBranchId)));
  };

  // Check if item is in wishlist (for current branch)
  const isInWishlist = (itemId) => {
    const currentBranchId = selectedBranch?.id || localStorage.getItem('CustomerBranchId');
    return wishlistItems.some(item => item.id === itemId && item.branchId == currentBranchId);
  };

  // Add wishlist item to cart
  const addWishlistItemToCart = (item, e) => {
    if (e) e.stopPropagation();
    if (item.addonsId) {
      // If item has addons, open addon modal
      openAddonModal(item);
    } else {
      // Directly add to cart
      addToCart(item);
      toast.success(`${item.name} added to cart`);
    }
  };

  // Fetch payment gateways
  const fetchPaymentGateways = async () => {
    if (!restaurantId) return;
    setPaymentLoading(true);
    try {
      const result = await ApiGet(`/api/customer/payment_gateway/restaurantId?restaurantId=${restaurantId}`);
      if (result.success) {
        const gateways = result.success.data.data || [];
        setPaymentGateways(gateways);
        if (gateways.length > 0) {
          setSelectedPaymentMethod(gateways[0].paymentMethod || gateways[0].gatewayName || 'COD');
        }
      } else {
        toast.error(result.fail || 'Failed to load payment options');
      }
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
      toast.error('Failed to load payment options');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Fetch tax details
  const fetchTaxDetails = async (orderType) => {
    try {
      const branchId = selectedBranch?.id || localStorage.getItem('CustomerBranchId');
      if (!branchId) return;
      const result = await ApiGet(`/api/public/customer/sections/tax-details?orderType=${orderType}&branchId=${branchId}`);
      if (result.success) {
        setTaxDetails(result.success.data.data || null);
      } else {
        console.error('Failed to fetch tax details');
        setTaxDetails(null);
      }
    } catch (error) {
      console.error('Error fetching tax details:', error);
      setTaxDetails(null);
    }
  };

  // Fetch customer addresses
  const fetchAddresses = async () => {
    setAddressLoading(true);
    try {
      const result = await ApiGet('/api/customer/customer_delivery_addresses/getAddress');
      if (result.success) {
        const data = result.success.data.data;
        const allAddresses = [];

        // Add prior address first if exists
        if (data.priorAddress) {
          allAddresses.push(data.priorAddress);
        }

        // Add other addresses
        if (data.otherAddresses && data.otherAddresses.length > 0) {
          allAddresses.push(...data.otherAddresses);
        }

        setAddresses(allAddresses);

        // Auto-select first address (prior address)
        if (allAddresses.length > 0) {
          setSelectedAddress(allAddresses[0]);
          checkAddressAllowed(allAddresses[0].id);
        }
      } else {
        console.error('Failed to fetch addresses:', result.fail);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setAddressLoading(false);
    }
  };

  // Fetch available coupons for cart items
  const fetchCoupons = async () => {
    setCouponsLoading(true);
    try {
      const branchId = selectedBranch?.id || localStorage.getItem('CustomerBranchId');

      // Get unique item IDs from cart
      const menuItemIds = [...new Set(cartItems.map(item => item.id))];

      if (!branchId || menuItemIds.length === 0) {
        setCoupons({ global: [], suggested: [], firstOrder: [] });
        setCouponsLoading(false);
        return;
      }

      const response = await apiClient.post('/api/customer/coupon/available', {
        branchId: parseInt(branchId),
        menuItemId: menuItemIds
      });

      if (response.data?.Status === 'SUCCESS' && response.data?.data) {
        // Transform each category of coupons
        const transformCouponList = (couponList) =>
          (couponList || [])
            .filter(coupon => coupon.displayOnScreen)
            .map(coupon => ({
              id: coupon.id,
              code: coupon.couponCode,
              title: coupon.title,
              description: coupon.description || 'Available coupon',
              couponName: coupon.couponName,
              discount: coupon.isPercent ? parseFloat(coupon.title) : parseInt(coupon.title),
              type: coupon.isPercent ? 'PERCENT' : 'FLAT',
              isPercent: coupon.isPercent,
              logo: coupon.logo,
              validity: coupon.validity,
              usageLimit: coupon.usageLimit,
              firstOrder: coupon.firstOrder,
              quantity: coupon.quantity,
            }));

        setCoupons({
          global: transformCouponList(response.data.data.global),
          suggested: transformCouponList(response.data.data.suggested),
          firstOrder: transformCouponList(response.data.data.firstOrder),
        });
      } else {
        console.error('Failed to fetch coupons:', response.data?.message);
        setCoupons({ global: [], suggested: [], firstOrder: [] });
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons({ global: [], suggested: [], firstOrder: [] });
      // Optionally show error toast
      // toast.error('Failed to load available coupons');
    } finally {
      setCouponsLoading(false);
    }
  };

  // Check if delivery is allowed for selected address
  const checkAddressAllowed = async (addressId) => {
    const branchId = selectedBranch?.id || localStorage.getItem('CustomerBranchId');
    if (!addressId || !branchId) return;
    setAddressAllowedStatus('loading');
    setAddressAllowedMessage('');
    try {
      const response = await apiClient.get(`/api/customer/orders/isAllowedOrder?addressId=${addressId}&branchId=${branchId}`);
      if (response.data?.Status === 'SUCCESS') {
        setAddressAllowedStatus('SUCCESS');
        setAddressAllowedMessage(response.data.message || 'Delivery available');
        setApiDeliveryCharge(parseFloat(response.data.data?.deliveryCharge || 0));
      } else {
        setAddressAllowedStatus('FAILURE');
        setAddressAllowedMessage(response.data?.message || 'Delivery not available at this location');
        setApiDeliveryCharge(0);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Delivery not available at this location';
      setAddressAllowedStatus('FAILURE');
      setAddressAllowedMessage(msg);
      setApiDeliveryCharge(0);
    }
  };

  // Get user location for add address
  const getAddressLocation = () => {
    if (!navigator.geolocation) {
      setAddressLocationStatus('error');
      return;
    }
    setAddressLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setNewAddressData(prev => ({ ...prev, latitude, longitude }));
        setAddressLocationStatus('granted');
      },
      () => {
        setAddressLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Address map search API
  const searchAddressMapApi = async (query) => {
    if (!query || query.trim().length < 2) {
      setAddressMapSuggestions([]);
      setShowAddressMapSuggestions(false);
      return;
    }
    try {
      setAddressMapSearchLoading(true);
      const response = await apiClient.get(`/api/public/customer/search?q=${encodeURIComponent(query.trim())}`);
      const data = response.data || [];
      setAddressMapSuggestions(Array.isArray(data) ? data : []);
      setShowAddressMapSuggestions(Array.isArray(data) && data.length > 0);
    } catch (error) {
      console.error('Error searching address map:', error);
      setAddressMapSuggestions([]);
    } finally {
      setAddressMapSearchLoading(false);
    }
  };

  // Parse address string into form fields
  const parseAddressToFields = (address) => {
    if (!address) return { addressLine1: '', addressLine2: '', landmark: '' };

    const parts = address.split(',').map(p => p.trim()).filter(Boolean);

    let landmark = '';
    let landmarkIndex = -1;
    // Extract landmark (part containing "near")
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].toLowerCase().includes('near')) {
        landmark = parts[i];
        landmarkIndex = i;
        break;
      }
    }

    const remaining = parts.filter((_, i) => i !== landmarkIndex);

    // Split: first half → Address Line 1, second half → Address Line 2
    const mid = Math.ceil(remaining.length / 2);
    const addressLine1 = remaining.slice(0, mid).join(', ');
    const addressLine2 = remaining.slice(mid).join(', ');

    return { addressLine1, addressLine2, landmark };
  };

  // Select a location for address map
  const selectAddressMapLocation = async (placeId, title) => {
    try {
      addressMapSelectedRef.current = true;
      setAddressMapSearch(title);
      setShowAddressMapSuggestions(false);
      setAddressMapSuggestions([]);

      const response = await apiClient.get(`/api/public/customer/details?placeId=${placeId}`);
      const { lat, lng, address } = response.data || {};
      if (lat && lng) {
        const parsed = parseAddressToFields(address || title);
        setNewAddressData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          addressLine1: parsed.addressLine1,
          addressLine2: parsed.addressLine2,
          landmark: parsed.landmark
        }));
        setAddressLocationStatus('granted');
      }
    } catch (error) {
      console.error('Error fetching address map details:', error);
    }
  };

  // Debounced address map search
  useEffect(() => {
    if (addressMapSelectedRef.current) {
      addressMapSelectedRef.current = false;
      return;
    }
    if (!addressMapSearch || addressMapSearch.trim().length < 2) {
      setAddressMapSuggestions([]);
      setShowAddressMapSuggestions(false);
      return;
    }
    const timer = setTimeout(() => {
      searchAddressMapApi(addressMapSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [addressMapSearch]);

  // Handle window resize for mobile/desktop view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Open add address modal
  const openAddAddressModal = () => {
    setShowPaymentModal(false); // Close payment modal first
    setNewAddressData({
      addressType: 'Home',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      deliveryInstructions: '',
      latitude: 0,
      longitude: 0
    });
    setAddressMapSearch('');
    setAddressMapSuggestions([]);
    setAddressLocationStatus('loading');
    setShowAddAddressModal(true);
    getAddressLocation();
  };

  // Close add address modal
  const closeAddAddressModal = () => {
    setShowAddAddressModal(false);
    setShowPaymentModal(true); // Reopen payment modal
    setNewAddressData({
      addressType: 'Home',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      deliveryInstructions: '',
      latitude: 0,
      longitude: 0
    });
  };

  // Save new address
  const handleSaveAddress = async () => {
    if (!newAddressData.addressLine1) {
      toast.error('Please enter address');
      return;
    }

    try {
      setSavingAddress(true);
      const result = await ApiPost('/api/customer/customer_delivery_addresses/add', {
        addressType: newAddressData.addressType,
        addressLine1: newAddressData.addressLine1,
        addressLine2: newAddressData.addressLine2,
        landmark: newAddressData.landmark,
        deliveryInstructions: newAddressData.deliveryInstructions,
        latitude: newAddressData.latitude || 0,
        longitude: newAddressData.longitude || 0,
        isActive: true
      });

      if (result.success) {
        toast.success('Address added successfully');
        closeAddAddressModal();
        fetchAddresses();
      } else {
        toast.error(result.fail || 'Failed to add address');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Failed to add address. Please try again.');
    } finally {
      setSavingAddress(false);
    }
  };

  // Open payment modal
  const openPaymentModal = () => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      toast.error('Please login to proceed with checkout');
      localStorage.setItem('pendingCheckout', 'true');
      navigate('/login');
      return;
    }

    setShowCart(false);
    setShowPaymentModal(true);
    fetchPaymentGateways();
    fetchAddresses();
    fetchTaxDetails('DELIVERY');
    fetchCoupons();

    if (customerData) {
      setCustomerName(customerData.name || '');
      setCustomerPhone(customerData.mobileNumber || '');
      setCustomerEmail(customerData.email || '');
    }
  };

  // Close payment modal
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
    setSelectedOrderType('DELIVERY');
    setSelectedAddress(null);
    setAddresses([]);
    setAddressAllowedStatus(null);
    setAddressAllowedMessage('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setSelectedCoupon(null);
    setAppliedDiscount(0);
    setIsPercentDiscount(false);
    setCouponPaybleAmount(null);
    setShowCouponList(false);
    setCoupons({ global: [], suggested: [], firstOrder: [] });
  };

  // Place order
  const handlePlaceOrder = async () => {
    // Validate customer name
    if (!customerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    // Validate customer phone
    if (!customerPhone.trim()) {
      toast.error('Please enter your mobile number');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Validate address for delivery orders
    if (selectedOrderType === 'DELIVERY' && !selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    setProcessingOrder(true);
    try {
      // Get branch ID from selected branch or localStorage
      const branchId = selectedBranch?.id || localStorage.getItem('CustomerBranchId');

      const orderData = {
        orderType: selectedOrderType,
        branchId: branchId ? { id: parseInt(branchId) } : null,
        paymentMethod: selectedPaymentMethod,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        cutomerEmail: customerEmail.trim(), // Note: API has typo "cutomerEmail"
        items: getFilteredCartItems().map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          special_instructions: item.special_instructions || null,
          addonItems: item.addons && item.addons.length > 0
            ? item.addons.map(addon => ({
              addonItemId: addon.id,
              quantity: addon.quantity || 1
            }))
            : []
        })),
        custAddressId: selectedOrderType === 'DELIVERY' && selectedAddress ? { id: selectedAddress.id } : null,
        distance: parseFloat(selectedBranch?.distance || localStorage.getItem('CustomerBranchDistance') || 0),
        couponCode: selectedCoupon ? selectedCoupon.code : null
      };

      const result = await ApiPost('/api/customer/orders/adds', orderData);
      if (result.success) {
        const orderResponseData = result.success.data?.data;
        const createdOrderId = orderResponseData?.orderId || orderResponseData?.order?.id || orderResponseData?.id;

        // ===== PAYPAL PAYMENT GATEWAY =====
        if (selectedPaymentMethod === 'paypal') {
          if (!createdOrderId) {
            toast.error('Order created but ID missing for PayPal payment');
            return;
          }
          setPayPalOrderId(createdOrderId);
          setShowPayPalModal(true);
          setProcessingOrder(false);
          return;
        }

        // ===== STRIPE PAYMENT GATEWAY =====
        if (selectedPaymentMethod === 'stripe') {
          if (!createdOrderId) {
            toast.error('Order created but ID missing for Stripe payment');
            return;
          }
          setStripeOrderId(createdOrderId);
          setShowStripeModal(true);
          setProcessingOrder(false);
          return;
        }

        // ===== CCAVENUE PAYMENT GATEWAY INTEGRATION =====
        // If payment method is PG (Payment Gateway), redirect to CCAvenue
        if (selectedPaymentMethod === 'PG') {
          try {
            console.log('Full order creation result:', result);

            // Extract order from the response - NEW: Backend now returns order object
            const orderResponseData = result.success.data.data;
            console.log('Order response data:', orderResponseData);

            if (!orderResponseData) {
              toast.error('Unable to process payment. Invalid order response.');
              return;
            }

            // Check if order object is present in response
            let createdOrder = null;

            console.log('🔍 Checking orderResponseData type:', typeof orderResponseData);
            console.log('🔍 Has order property?', orderResponseData.order ? 'YES' : 'NO');

            if (orderResponseData.order) {
              // NEW FORMAT: Order object directly available
              createdOrder = orderResponseData.order;
              console.log('✅ Order object received directly from backend:', createdOrder);
            } else if (typeof orderResponseData === 'string' && orderResponseData.includes('Order ID:')) {
              // FALLBACK: Old format with just string message
              console.warn('⚠️ FALLBACK: Old string format detected, calling /api/customer/orders/all');
              const orderIdMatch = orderResponseData.match(/Order ID:\s*(\S+)/);
              if (!orderIdMatch) {
                toast.error('Unable to process payment. Order ID not found.');
                return;
              }

              const orderNumber = orderIdMatch[1];
              console.log('Extracted order number:', orderNumber);

              // Fetch order details
              const ordersResponse = await ApiGet('/api/customer/orders/all');
              if (!ordersResponse.success) {
                toast.error('Unable to fetch order details');
                return;
              }

              const orders = ordersResponse.success.data.data || ordersResponse.success.data;
              createdOrder = Array.isArray(orders)
                ? orders.find(order => order.orderNumber === orderNumber)
                : null;
            }

            if (!createdOrder) {
              console.error('Order not found in response');
              toast.error('Order created but unable to process payment');
              return;
            }

            console.log('Created order ID:', createdOrder.id);

            // Call CCAvenue payment request API
            console.log('Requesting CCAvenue payment for order ID:', createdOrder.id);
            const paymentResponse = await ApiPost('/api/customer/ccavenue/payment-request', {
              orderId: createdOrder.id
            });

            console.log('CCAvenue payment response:', paymentResponse);

            if (paymentResponse.success) {
              const { encRequest, access_code, ccavenue_url } = paymentResponse.success.data.data;

              // Create a hidden form and submit to CCAvenue
              const form = document.createElement('form');
              form.method = 'POST';
              form.action = ccavenue_url;

              // Add encrypted request
              const encRequestInput = document.createElement('input');
              encRequestInput.type = 'hidden';
              encRequestInput.name = 'encRequest';
              encRequestInput.value = encRequest;
              form.appendChild(encRequestInput);

              // Add access code
              const accessCodeInput = document.createElement('input');
              accessCodeInput.type = 'hidden';
              accessCodeInput.name = 'access_code';
              accessCodeInput.value = access_code;
              form.appendChild(accessCodeInput);

              // Append to body and submit
              document.body.appendChild(form);
              form.submit();

              // Clear cart and close modals
              clearCart();
              closePaymentModal();
              setShowCart(false);

            } else {
              console.error('Payment request failed:', paymentResponse.fail);
              toast.error(paymentResponse.fail || 'Failed to initiate payment');
            }
          } catch (paymentError) {
            console.error('CCAvenue payment error:', paymentError);
            toast.error('Payment error: ' + (paymentError.message || 'Please try again'));
          }
        } else {
          // For COD and other payment methods, show success directly
          clearCart();
          closePaymentModal();
          setShowCart(false);
          setShowOrderSuccess(true);
        }
      } else {
        toast.error(result.fail || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setProcessingOrder(false);
    }
  };

  const handlePayPalSuccess = () => {
    setShowPayPalModal(false);
    setPayPalOrderId(null);
    clearCart();
    closePaymentModal();
    setShowCart(false);
    setShowOrderSuccess(true);
  };

  const handlePayPalError = (error) => {
    toast.error('PayPal payment failed. Please try again.');
    setShowPayPalModal(false);
    setPayPalOrderId(null);
  };

  const handlePayPalCancel = () => {
    setShowPayPalModal(false);
    setPayPalOrderId(null);
    toast.info('Payment cancelled');
  };

  const handleStripeSuccess = () => {
    setShowStripeModal(false);
    setStripeOrderId(null);
    clearCart();
    closePaymentModal();
    setShowCart(false);
    setShowOrderSuccess(true);
  };

  const handleStripeError = (error) => {
    toast.error('Card payment failed. Please try again.');
    setShowStripeModal(false);
    setStripeOrderId(null);
  };

  const handleStripeCancel = () => {
    setShowStripeModal(false);
    setStripeOrderId(null);
    toast.info('Payment cancelled');
  };

  // Update addon quantity in cart - uses cartItemId for items with addons
  const updateCartAddonQuantity = (cartItemId, addonId, change) => {
    setCartItems(cartItems.map(item => {
      if ((item.cartItemId || item.id) === cartItemId && item.addons) {
        const updatedAddons = item.addons.map(addon => {
          if (addon.id === addonId) {
            const newQty = addon.quantity + change;
            return newQty > 0 ? { ...addon, quantity: newQty } : addon;
          }
          return addon;
        }).filter(addon => addon.quantity > 0);

        return { ...item, addons: updatedAddons };
      }
      return item;
    }));
  };

  // Get cart items filtered by current branch
  const getFilteredCartItems = () => {
    const currentBranchId = selectedBranch?.id || localStorage.getItem('CustomerBranchId');
    return cartItems.filter(item => item.branchId == currentBranchId);
  };

  // Get item quantity in cart (counts all instances including those with addons) for current branch
  const getItemQuantity = (itemId) => {
    return getFilteredCartItems()
      .filter(item => item.id === itemId)
      .reduce((total, item) => total + item.quantity, 0);
  };

  // Get total cart count for current branch
  const getTotalCartCount = () => {
    return getFilteredCartItems().reduce((total, item) => total + item.quantity, 0);
  };

  // Get total cart amount (including addons) for current branch
  const getTotalCartAmount = () => {
    return getFilteredCartItems().reduce((total, item) => {
      const itemPrice = item.price * item.quantity;
      const addonPrice = item.addons ? item.addons.reduce((addonTotal, addon) => addonTotal + (addon.price * addon.quantity), 0) * item.quantity : 0;
      return total + itemPrice + addonPrice;
    }, 0);
  };

  // Get only addons total (without item prices)
  const getAddonsTotal = () => {
    return getFilteredCartItems().reduce((total, item) => {
      const addonPrice = item.addons ? item.addons.reduce((addonTotal, addon) => addonTotal + (addon.price * addon.quantity), 0) * item.quantity : 0;
      return total + addonPrice;
    }, 0);
  };

  // Get tax amounts (GST + Service Charge) based on items amount
  // If coupon is applied, use paybleAmount + addons; otherwise use total cart amount
  const getTaxAmounts = () => {
    let baseAmount;
    if (couponPaybleAmount !== null) {
      // Coupon is applied: use paybleAmount + addons
      baseAmount = couponPaybleAmount + getAddonsTotal();
    } else {
      // No coupon: use total cart amount (items + addons)
      baseAmount = getTotalCartAmount();
    }

    const gstAmount = taxDetails ? (baseAmount * taxDetails.gstPercentage) / 100 : 0;
    const serviceChargeAmount = taxDetails ? (baseAmount * taxDetails.serviceChargePercentage) / 100 : 0;
    return { gstAmount, serviceChargeAmount, totalTax: gstAmount + serviceChargeAmount };
  };

  // Get grand total including delivery charge and taxes
  const getGrandTotal = () => {
    // Use coupon payble amount if available, otherwise use total cart amount
    const itemsTotal = couponPaybleAmount !== null ? couponPaybleAmount + getAddonsTotal() : getTotalCartAmount();
    const deliveryCharge = selectedOrderType === 'DELIVERY' ? apiDeliveryCharge : 0;
    const { totalTax } = getTaxAmounts();

    // If coupon is applied, paybleAmount already includes discount, so don't subtract again
    // Otherwise, subtract the discount amount
    const discountAmount = couponPaybleAmount === null && appliedDiscount > 0
      ? (isPercentDiscount ? (itemsTotal * appliedDiscount) / 100 : appliedDiscount)
      : 0;

    return itemsTotal + deliveryCharge + totalTax - discountAmount;
  };

  // Handle coupon selection with lottery animation and congrats effect
  const handleSelectCoupon = async (coupon) => {
    setLotteryAnimation(coupon.id);
    setSelectedCoupon(coupon);

    // Prepare items for API call
    const items = getFilteredCartItems().map(item => ({
      menu_item_id: item.id,
      quantity: item.quantity
    }));

    // Call coupon apply API
    const result = await ApiPost('/api/customer/coupon/apply', {
      couponCode: coupon.code,
      items
    });

    if (result.success && result.success.data?.data) {
      const { discount, isPercent, paybleAmount } = result.success.data.data;
      setAppliedDiscount(discount);
      setIsPercentDiscount(isPercent);
      // Store the paybleAmount from API for tax calculation
      setCouponPaybleAmount(paybleAmount || null);
    } else {
      setAppliedDiscount(0);
      setIsPercentDiscount(false);
      setCouponPaybleAmount(null);
    }

    setShowCongrats(true);
    setTimeout(() => setLotteryAnimation(null), 600);
    setTimeout(() => setShowCongrats(false), 2500);
  };

  // Handle coupon unselection
  const handleUnselectCoupon = (e) => {
    e.stopPropagation();
    setSelectedCoupon(null);
    setAppliedDiscount(0);
    setIsPercentDiscount(false);
    setCouponPaybleAmount(null);
  };

  // Handle coupon image error - fallback to favicon
  const handleCouponImageError = (e) => {
    e.target.src = faviconUrl;
  };

  // Get item total with addons
  const getItemTotalWithAddons = (item) => {
    const basePrice = item.price * item.quantity;
    const addonPrice = item.addons ? item.addons.reduce((total, addon) => total + (addon.price * addon.quantity), 0) * item.quantity : 0;
    return basePrice + addonPrice;
  };

  // Handle image error - show default image
  const handleImageError = (e) => {
    console.log('Image failed to load:', e.target.src);
    e.target.src = defaultImage;
  };

  // Scroll categories
  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = 300;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Handle category click
  const handleCategoryClick = (category) => {
    if (selectedCategory?.id === category.id) {
      // If clicking the same category, go back to "All"
      setSelectedCategory(ALL_CATEGORY);
      setSelectedSubcategory(null);
    } else {
      setSelectedCategory(category);
      setSelectedSubcategory(null);
    }
  };

  // Handle subcategory click
  const handleSubcategoryClick = (subcategory) => {
    if (selectedSubcategory?.id === subcategory.id) {
      // Re-clicking same subcategory goes back to "All" for that category
      setSelectedSubcategory(ALL_SUBCATEGORY);
    } else {
      setSelectedSubcategory(subcategory);
    }
  };

  // Get filtered items based on veg filter (category/subcategory already filtered by API)
  const getFilteredItems = () => {
    // Return items even when 'all' category is selected
    if (!selectedCategory) return [];

    // For 'frequently' category, return frequently ordered items
    let filtered = selectedCategory.id === 'frequently' ? frequentlyOrderedItems : menuItems;

    // Apply veg only filter on client side
    if (vegOnly) {
      filtered = filtered.filter(item => item.isVeg === true);
    }

    return filtered;
  };

  const filteredItems = getFilteredItems();

  // Fetch sliders from API
  const fetchSliders = async (restId) => {
    try {
      setSlidersLoading(true);

      if (!restId) {
        console.warn('Restaurant ID not found');
        setSlidersLoading(false);
        return;
      }

      const endpoint = `/api/public/customer/sliders/get_sliders?restaurantId=${restId}&platform=web`;
      const response = await ApiGet(endpoint);

      if (response.success) {
        const slidersData = response.success.data.data || [];
        setSliders(slidersData);
      } else {
        console.error('Failed to fetch sliders:', response.fail);
        setSliders([]);
      }
    } catch (error) {
      console.error('Error fetching sliders:', error);
      setSliders([]);
    } finally {
      setSlidersLoading(false);
    }
  };

  // Fetch marquee messages (live + scheduled)
  const fetchMarquee = async (restId) => {
    try {
      if (!restId) return;
      const response = await ApiGet(`/api/global/marquee/getByRestId?restId=${restId}`);
      if (response.success) {
        const data = response.success.data.data;
        if (data && Array.isArray(data) && data.length > 0) {
          setMarqueeMessages(data);
        }
      }
    } catch (error) {
      console.error('Error fetching marquee:', error);
    }
  };

  // Get banners - use API sliders or fallback to default
  const banners = sliders.length > 0 ? sliders.map(slider => ({
    id: slider.id,
    title: slider.title || '',
    subtitle: slider.description || '',
    image: slider.imageUrl,
    gradient: 'linear-gradient(to right, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.2))',
  })) : [
    {
      id: 1,
      title: 'Welcome',
      subtitle: 'Explore our delicious menu',
      gradient: 'linear-gradient(to right, rgba(215, 68, 64, 0.85), rgba(215, 68, 64, 0.4))',
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    }
  ];

  // Fetch nearest branches from API
  const fetchNearestBranches = async (latitude, longitude, restId) => {
    try {
      setBranchesLoading(true);

      if (!restId) {
        console.warn('Restaurant ID not found');
        setBranchesLoading(false);
        return;
      }

      const endpoint = `/api/public/customer/nearest-branches?restaurantId=${restId}&latitude=${latitude}&longitude=${longitude}`;
      const response = await ApiGet(endpoint);

      if (response.success) {
        const branchData = response.success.data.data || [];
        // Map API response to component structure
        const mappedBranches = branchData.map(branch => ({
          id: branch.branchId,
          name: branch.branchName,
          address: branch.address,
          phone: branch.phone,
          distance: branch.distance_km,
          timeText: branch.time_text,
          timeMinutes: branch.time_minutes,
          deliveryCharge: branch.deliveryCharge
        }));
        setBranches(mappedBranches);

        // Check if there's a previously selected branch in localStorage
        if (mappedBranches.length > 0) {
          const savedBranchId = localStorage.getItem('CustomerBranchId');
          let branchToSelect = null;

          // If there's a saved branch ID, try to find it in the fetched branches
          if (savedBranchId) {
            branchToSelect = mappedBranches.find(branch => String(branch.id) === String(savedBranchId));
            if (branchToSelect) {
              console.log('Restored previously selected branch:', branchToSelect.name);
            }
          }

          // If no saved branch or saved branch not found, select the first (nearest) branch
          if (!branchToSelect) {
            branchToSelect = mappedBranches[0];
            localStorage.setItem('CustomerBranchId', branchToSelect.id);
            localStorage.setItem('CustomerBranchDistance', branchToSelect.distance || 0);
            localStorage.setItem('CustomerBranchMinutes', branchToSelect.timeMinutes || 0);
            // Save lat/long used for this branch selection
            localStorage.setItem('CustomerBranchLat', latitude);
            localStorage.setItem('CustomerBranchLng', longitude);
            console.log('Auto-selected nearest branch:', branchToSelect.name);
          }

          setSelectedBranch(branchToSelect);
        }

        console.log('Branches fetched successfully:', mappedBranches);
      } else {
        console.error('Failed to fetch branches:', response.fail);
        const failMsg = response.fail?.data?.message || response.fail?.message || 'No branches available near your location';
        setBranches([]);
        setSelectedBranch(null);
        setCategories([]);
        setSubcategories([]);
        setMenuItems([]);
        setTrendingItems([]);
        setNoBranchMessage(failMsg);
        setShowNoBranchModal(true);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to fetch nearest branches. Please try again.');
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  // Fetch all branches without location filtering
  const fetchAllBranches = async (restId) => {
    try {
      setBranchesLoading(true);
      const response = await ApiGet(`/api/customer/users/all-branches?restaurantId=${restId}`);

      if (response.success) {
        const branchData = response.success.data?.data || [];
        // Map API response to component structure
        const mappedBranches = branchData.map(branch => ({
          id: branch.branchId,
          name: branch.branchName,
          address: branch.address,
          phone: branch.phone,
          distance: null,
          timeText: null,
          timeMinutes: null,
          deliveryCharge: branch.deliveryCharge
        }));
        setBranches(mappedBranches);

        // Auto-select first branch or restore previously selected
        if (mappedBranches.length > 0) {
          const savedBranchId = localStorage.getItem('CustomerBranchId');
          let branchToSelect = savedBranchId ?
            mappedBranches.find(b => String(b.id) === String(savedBranchId)) : null;

          if (!branchToSelect) {
            branchToSelect = mappedBranches[0];
            localStorage.setItem('CustomerBranchId', branchToSelect.id);
          }
          setSelectedBranch(branchToSelect);
          console.log('Auto-selected branch:', branchToSelect.name);
        }
      } else {
        const errorMsg = response.fail?.data?.message || 'Failed to fetch branches';
        setBranches([]);
        setSelectedBranch(null);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error fetching all branches:', error);
      toast.error('Failed to load branches. Please try again.');
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  // Location search API (returns plain array, not standard ApiGet format)
  const searchLocationApi = async (query) => {
    if (!query || query.trim().length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }
    try {
      setLocationSearchLoading(true);
      const response = await apiClient.get(`/api/public/customer/search?q=${encodeURIComponent(query.trim())}`);
      const data = response.data || [];
      setLocationSuggestions(Array.isArray(data) ? data : []);
      setShowLocationSuggestions(Array.isArray(data) && data.length > 0);
    } catch (error) {
      console.error('Error searching location:', error);
      setLocationSuggestions([]);
    } finally {
      setLocationSearchLoading(false);
    }
  };

  // Select a location from suggestions (returns plain object, not standard ApiGet format)
  const selectLocation = async (placeId, title) => {
    try {
      locationSelectedRef.current = true;
      setLocationSearch(title);
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
      setBranchesLoading(true);

      const response = await apiClient.get(`/api/public/customer/details?placeId=${placeId}`);
      const { lat, lng } = response.data || {};
      if (lat && lng) {
        // Clear saved branch so new location search selects nearest branch
        localStorage.removeItem('CustomerBranchId');
        localStorage.removeItem('CustomerBranchLat');
        localStorage.removeItem('CustomerBranchLng');
        fetchNearestBranches(lat, lng, restaurantId);
      }
    } catch (error) {
      console.error('Error fetching location details:', error);
      setBranchesLoading(false);
    }
  };

  // Debounced location search
  useEffect(() => {
    if (locationSelectedRef.current) {
      locationSelectedRef.current = false;
      return;
    }
    if (!locationSearch || locationSearch.trim().length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }
    const timer = setTimeout(() => {
      searchLocationApi(locationSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [locationSearch]);

  // Modal location search - debounced
  useEffect(() => {
    if (!modalLocationSearch || modalLocationSearch.trim().length < 2) {
      setModalLocationSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setModalLocationSearching(true);
      try {
        const response = await apiClient.get(`/api/public/customer/search?q=${encodeURIComponent(modalLocationSearch.trim())}`);
        const data = response.data || [];
        setModalLocationSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        setModalLocationSuggestions([]);
      } finally {
        setModalLocationSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [modalLocationSearch]);

  const handleModalSelectLocation = async (placeId, title) => {
    setModalLocationSearch(title);
    setModalLocationSuggestions([]);
    try {
      setBranchesLoading(true);
      const response = await apiClient.get(`/api/public/customer/details?placeId=${placeId}`);
      const { lat, lng } = response.data || {};
      if (lat && lng) {
        localStorage.removeItem('CustomerBranchId');
        localStorage.removeItem('CustomerBranchLat');
        localStorage.removeItem('CustomerBranchLng');
        setShowNoBranchModal(false);
        setModalLocationSearch('');
        setLocationSearch(title);
        locationSelectedRef.current = true;
        fetchNearestBranches(lat, lng, restaurantId);
      }
    } catch (error) {
      console.error('Error fetching location details:', error);
      setBranchesLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        localStorage.removeItem('CustomerBranchId');
        localStorage.setItem('CustomerBranchLat', coords.latitude);
        localStorage.setItem('CustomerBranchLng', coords.longitude);
        localStorage.setItem('CustomerLocationName', 'Current Location');
        setLocating(false);
        setShowLocationModal(false);
        toast.success('Current location selected!', { autoClose: 2000 });
        fetchNearestBranches(coords.latitude, coords.longitude, restaurantId);
      },
      () => {
        setLocating(false);
        toast.error('Unable to get your location. Please allow permission and try again.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Fetch categories from API with pagination
  const fetchCategories = async (branchId, pageNumber = 0, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMoreCategories(true);
      } else {
        setCategoriesLoading(true);
        setCategories([]);
        setCategoriesPage(0);
        setHasMoreCategories(true);
      }

      const endpoint = `/api/customer/menu_category/public/filter?branchId=${branchId}&pageNumber=${pageNumber}&pageSize=12`;
      const response = await ApiGet(endpoint);

      if (response.success) {
        const responseData = response.success.data.data;
        const categoryData = responseData?.records || [];
        const totalPages = responseData?.totalPages || 1;
        const currentPage = responseData?.currentPage || 1;

        // Map API response to component structure (same as menu items)
        const mappedCategories = categoryData.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          icon: cat.iconUrl || defaultImage,
          subcategories: cat.subcategories || []
        }));

        console.log('Category data from API:', categoryData);
        console.log('Mapped categories:', mappedCategories);

        if (isLoadMore) {
          // Append to existing categories
          setCategories(prev => [...prev, ...mappedCategories]);
        } else {
          setCategories(mappedCategories);
        }

        // Check if there are more pages (currentPage is 1-indexed from API)
        setHasMoreCategories(currentPage < totalPages);
        setCategoriesPage(pageNumber);

        console.log('Categories fetched successfully:', { page: pageNumber, total: totalPages, count: mappedCategories.length });
      } else {
        console.error('Failed to fetch categories:', response.fail);
        if (!isLoadMore) {
          setCategories([]);
        }
        setHasMoreCategories(false);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (!isLoadMore) {
        setCategories([]);
      }
      setHasMoreCategories(false);
    } finally {
      setCategoriesLoading(false);
      setLoadingMoreCategories(false);
    }
  };

  // Fetch categories when branch is selected
  useEffect(() => {
    if (selectedBranch?.id) {
      fetchCategories(selectedBranch.id, 0, false);
    }
  }, [selectedBranch?.id]);

  // Save cart to localStorage whenever cartItems changes
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMER_CART_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  // Save wishlist to localStorage whenever wishlistItems changes
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMER_WISHLIST_KEY, JSON.stringify(wishlistItems));
    } catch (error) {
      console.error('Error saving wishlist to localStorage:', error);
    }
  }, [wishlistItems]);

  // Load favicon URL from app_theme in localStorage
  useEffect(() => {
    try {
      const appTheme = localStorage.getItem('app_theme');
      if (appTheme) {
        const themeData = JSON.parse(appTheme);
        if (themeData.faviconUrl) {
          setFaviconUrl(themeData.faviconUrl);
        }
      }
    } catch (error) {
      console.error('Error loading favicon URL from app_theme:', error);
    }
  }, []);

  // Fetch subcategories from API
  const fetchSubcategories = async (categoryId, branchId) => {
    try {
      setSubcategoriesLoading(true);
      setSubcategories([]);

      const endpoint = `/api/public/customer/subCategories/getByCategoriesId?categoryId=${categoryId}&branchId=${branchId}`;
      const response = await ApiGet(endpoint);

      if (response.success) {
        const subCatData = response.success.data.data || [];
        // Map API response - adjust field names based on actual response
        const mappedSubcategories = subCatData.map(sub => ({
          id: sub.id,
          name: sub.name || sub.subCategoryName,
          description: sub.description
        }));
        setSubcategories(mappedSubcategories);
        console.log('Subcategories fetched successfully:', mappedSubcategories);
      } else {
        console.error('Failed to fetch subcategories:', response.fail);
        setSubcategories([]);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  // Fetch subcategories when category is selected (skip for 'All', 'Recommended' and 'Frequently' category)
  useEffect(() => {
    if (selectedCategory?.id && selectedCategory.id !== 'all' && selectedCategory.id !== 'recommended' && selectedCategory.id !== 'frequently' && selectedBranch?.id) {
      fetchSubcategories(selectedCategory.id, selectedBranch.id);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategory?.id, selectedBranch?.id]);

  // Fetch menu items from API with pagination
  const fetchMenuItems = async (branchId, categoryId, subcategoryId = null, pageNumber = 0, isLoadMore = false, searchValue = '', recommended = false) => {
    try {
      if (isLoadMore) {
        setLoadingMoreMenuItems(true);
      } else {
        setMenuItemsLoading(true);
        setMenuItems([]);
        setMenuItemsPage(0);
        setHasMoreMenuItems(true);
      }

      // Build endpoint - if categoryId is 'all' or 'recommended', don't include categoryId
      let endpoint = `/api/customer/menu_items/public/advanceFilter?branchId=${branchId}&pageNumber=${pageNumber}&pageSize=12`;
      if (categoryId && categoryId !== 'all' && categoryId !== 'recommended') {
        endpoint += `&categoryId=${categoryId}`;
      }
      if (subcategoryId) {
        endpoint += `&subcategoryId=${subcategoryId}`;
      }
      // Add recommended filter
      if (recommended) {
        endpoint += `&recommended=true`;
      }
      // Add searchValue if provided
      if (searchValue && searchValue.trim()) {
        endpoint += `&searchValue=${encodeURIComponent(searchValue.trim())}`;
      }
      // Add dietaryType filter if vegOnly is true in localStorage
      const vegOnlyFilter = localStorage.getItem('vegOnly');
      if (vegOnlyFilter === 'true') {
        endpoint += `&dietaryType=true`;
      }

      const response = await ApiGet(endpoint);

      if (response.success) {
        const responseData = response.success.data.data;
        const itemsData = responseData?.records || [];
        const totalPages = responseData?.totalPages || 1;
        const currentPage = responseData?.currentPage || 1;

        // Map API response to component structure
        const mappedItems = itemsData.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          mrp: item.mrp,
          image: item.imageUrl || defaultImage,
          isVeg: item.foodType === 'VEG' || item.dietaryType === 'veg' || item.dietaryType === true,
          isAvailable: item.isAvailable,
          prepTime: item.prepTime || item.preparationMinutes,
          deliveryTime: item.deliveryMinutes,
          isRecommended: item.isRecommended,
          spiceLevel: item.spiceLevel,
          priority: item.priority || 999,
          rating: item.rating || 0,
          category: item.menuCategoryId?.name,
          subcategory: item.menuSubcategoryId?.name,
          addonsId: item.addonsId?.id || null
        }));

        // Sort: Recommended first, then by priority, then by name
        mappedItems.sort((a, b) => {
          if (a.isRecommended && !b.isRecommended) return -1;
          if (!a.isRecommended && b.isRecommended) return 1;
          if (a.priority !== b.priority) return (a.priority || 999) - (b.priority || 999);
          return (a.name || '').localeCompare(b.name || '');
        });

        if (isLoadMore) {
          setMenuItems(prev => [...prev, ...mappedItems]);
        } else {
          setMenuItems(mappedItems);
        }

        setHasMoreMenuItems(currentPage < totalPages);
        setMenuItemsPage(pageNumber);

        console.log('Menu items fetched:', { page: pageNumber, total: totalPages, count: mappedItems.length });
      } else {
        console.error('Failed to fetch menu items:', response.fail);
        if (!isLoadMore) {
          setMenuItems([]);
        }
        setHasMoreMenuItems(false);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      if (!isLoadMore) {
        setMenuItems([]);
      }
      setHasMoreMenuItems(false);
    } finally {
      setMenuItemsLoading(false);
      setLoadingMoreMenuItems(false);
    }
  };

  const branchId = selectedBranch?.id || localStorage.getItem('CustomerBranchId');

  // Fetch trending items from API
  const fetchTrendingItems = async (bId) => {
    try {
      if (!bId) {
        console.warn('Branch ID not found for trending items');
        return;
      }
      setTrendingLoading(true);
      const endpoint = `/api/customer/menu_items/public/advanceFilter?branchId=${bId}&pageNumber=0&pageSize=6&recommended=true`;
      const response = await ApiGet(endpoint);

      if (response.success) {
        const responseData = response.success.data.data;
        const itemsData = responseData?.records || [];

        const mappedItems = itemsData.map(item => ({
          id: item.id,
          name: item.name,
          restaurant: restaurantName,
          price: item.price,
          rating: item.rating || 4.5,
          image: item.imageUrl || defaultImage,
          tag: item.isRecommended ? "Chef's Pick" : (item.foodType === 'VEG' || item.dietaryType ? 'Veg' : 'Non-Veg'),
          isVeg: item.foodType === 'VEG' || item.dietaryType === 'veg' || item.dietaryType === true
        }));

        setTrendingItems(mappedItems);
      } else {
        console.error('Failed to fetch trending items:', response.fail);
        setTrendingItems([]);
      }
    } catch (error) {
      console.error('Error fetching trending items:', error);
      setTrendingItems([]);
    } finally {
      setTrendingLoading(false);
    }
  };

  // Fetch frequently ordered items from API (requires customer login)
  const fetchFrequentlyOrderedItems = async () => {
    try {
      const customerToken = localStorage.getItem('customerToken');
      if (!customerToken) {
        console.warn('Customer not logged in for frequently ordered items');
        setFrequentlyOrderedItems([]);
        return;
      }
      setFrequentlyLoading(true);
      const endpoint = `/api/customer/orders/ordered-menu-items`;
      const response = await ApiGet(endpoint);

      if (response.success) {
        const itemsData = response.success.data.data || [];

        // Map items and remove duplicates based on menuItemId
        const uniqueItemsMap = new Map();
        itemsData.forEach(item => {
          const menuItem = item.menuItemId;
          if (menuItem && !uniqueItemsMap.has(menuItem.id)) {
            uniqueItemsMap.set(menuItem.id, {
              id: menuItem.id,
              name: menuItem.name,
              description: menuItem.description,
              price: menuItem.price,
              mrp: menuItem.mrp,
              image: menuItem.imageUrl || defaultImage,
              isVeg: menuItem.foodType === 'VEG' || menuItem.dietaryType === 'veg' || menuItem.dietaryType === true,
              isAvailable: menuItem.isAvailable !== false,
              prepTime: menuItem.prepTime || menuItem.preparationMinutes,
              deliveryTime: menuItem.deliveryMinutes,
              isRecommended: menuItem.isRecommended,
              spiceLevel: menuItem.spiceLevel,
              category: menuItem.menuCategoryId?.name,
              subcategory: menuItem.menuSubcategoryId?.name,
              addonsId: menuItem.addonsId?.id || null
            });
          }
        });

        const mappedItems = Array.from(uniqueItemsMap.values());
        setFrequentlyOrderedItems(mappedItems);
      } else {
        console.error('Failed to fetch frequently ordered items:', response.fail);
        setFrequentlyOrderedItems([]);
      }
    } catch (error) {
      console.error('Error fetching frequently ordered items:', error);
      setFrequentlyOrderedItems([]);
    } finally {
      setFrequentlyLoading(false);
    }
  };

  // Fetch trending items when branch is selected
  useEffect(() => {
    if (selectedBranch?.id) {
      fetchTrendingItems(selectedBranch.id);
    }
  }, [selectedBranch?.id]);

  // Fetch menu items when category, subcategory, vegOnly or searchTerm changes (with debounce for search)
  useEffect(() => {
    if (selectedBranch?.id && selectedCategory?.id) {
      // For 'frequently' category, fetch frequently ordered items
      if (selectedCategory.id === 'frequently') {
        fetchFrequentlyOrderedItems();
        return;
      }

      // For regular categories (not all/recommended), wait for subcategories to load
      // If subcategories exist but none is selected, don't fetch items yet
      // EXCEPT when user is searching — always fetch so search works across all categories
      const isRegularCategory = selectedCategory.id !== 'all' && selectedCategory.id !== 'recommended';
      if (isRegularCategory && !searchTerm) {
        // Still loading subcategories - wait
        if (subcategoriesLoading) {
          return;
        }
        // Subcategories exist but none selected - show subcategories only, no items
        if (subcategories.length > 0 && !selectedSubcategory) {
          setMenuItems([]);
          return;
        }
      }

      // Debounce search to avoid too many API calls
      const debounceTimer = setTimeout(() => {
        // For 'all' or 'recommended' category, don't pass subcategory
        // For 'all_sub' subcategory, don't pass subcategory ID (fetch all items in category)
        const subcatId = isRegularCategory && selectedSubcategory?.id !== 'all_sub' ? selectedSubcategory?.id : null;
        const isRecommended = selectedCategory.id === 'recommended';
        fetchMenuItems(selectedBranch.id, selectedCategory.id, subcatId, 0, false, searchTerm, isRecommended);
      }, searchTerm ? 500 : 0); // 500ms debounce for search, immediate for other changes

      return () => clearTimeout(debounceTimer);
    } else {
      setMenuItems([]);
    }
  }, [selectedBranch?.id, selectedCategory?.id, selectedSubcategory?.id, subcategoriesLoading, subcategories.length, vegOnly, searchTerm]);

  // Load more menu items
  const loadMoreMenuItems = () => {
    if (selectedBranch?.id && selectedCategory?.id && hasMoreMenuItems && !loadingMoreMenuItems) {
      const nextPage = menuItemsPage + 1;
      const subcatId = (selectedCategory.id === 'all' || selectedCategory.id === 'recommended' || selectedSubcategory?.id === 'all_sub') ? null : selectedSubcategory?.id;
      const isRecommended = selectedCategory.id === 'recommended';
      fetchMenuItems(selectedBranch.id, selectedCategory.id, subcatId, nextPage, true, searchTerm, isRecommended);
    }
  };

  // Fetch addon items from API
  const fetchAddonItems = async (addonId) => {
    try {
      setAddonLoading(true);
      setAddonItems([]);
      setSelectedAddons({});
      setMaxAddon(0);

      const endpoint = `/api/public/customer/addons_items/addonId?addonId=${addonId}`;
      const response = await ApiGet(endpoint);

      if (response.success) {
        const addonsData = response.success.data.data || [];
        // Get maxAddon from first addon item's addonsId
        const maxAddonLimit = addonsData[0]?.addonsId?.maxAddon || 0;
        const minAddonLimit = addonsData[0]?.addonsId?.minAddon || 0;
        setMaxAddon(maxAddonLimit);
        setMinAddon(minAddonLimit);

        const mappedAddons = addonsData
          .filter(addon => addon.isActive)
          .map(addon => ({
            id: addon.id,
            name: addon.name,
            price: addon.price,
            attribute: addon.attribute,
            addonGroupName: addon.addonsId?.name
          }));
        setAddonItems(mappedAddons);
        console.log('Addon items fetched:', mappedAddons, 'Max addon limit:', maxAddonLimit);
      } else {
        console.error('Failed to fetch addon items:', response.fail);
        setAddonItems([]);
      }
    } catch (error) {
      console.error('Error fetching addon items:', error);
      setAddonItems([]);
    } finally {
      setAddonLoading(false);
    }
  };

  // Open addon modal
  const openAddonModal = (item, e) => {
    if (e) e.stopPropagation();
    setSelectedItemForAddon(item);
    setShowAddonModal(true);
    setAddonItems([]);
    setSelectedAddons({});
    setSelectedSpiceLevel(item.spiceLevel || '');
    setMinAddon(0);
    setSpecialInstructions('');
    setItemQuantity(1);
    if (item.addonsId) {
      fetchAddonItems(item.addonsId);
    }
  };

  // Close addon modal
  const closeAddonModal = () => {
    setShowAddonModal(false);
    setSelectedItemForAddon(null);
    setAddonItems([]);
    setSelectedAddons({});
    setMaxAddon(0);
    setMinAddon(0);
    setSelectedSpiceLevel('');
    setSpecialInstructions('');
    setItemQuantity(1);
  };

  // Get total selected addons count
  const getTotalSelectedAddonsCount = () => {
    return Object.values(selectedAddons).reduce((total, qty) => total + qty, 0);
  };

  // Update addon quantity
  const updateAddonQuantity = (addonId, delta) => {
    // Check max addon limit when adding
    if (delta > 0 && maxAddon > 0) {
      const currentTotal = getTotalSelectedAddonsCount();
      if (currentTotal >= maxAddon) {
        toast.warning(`Maximum ${maxAddon} addon(s) allowed`);
        return;
      }
    }

    setSelectedAddons(prev => {
      const currentQty = prev[addonId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      if (newQty === 0) {
        const { [addonId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [addonId]: newQty };
    });
  };

  // Calculate total addon price
  const getTotalAddonPrice = () => {
    return Object.entries(selectedAddons).reduce((total, [addonId, qty]) => {
      const addon = addonItems.find(a => a.id === parseInt(addonId));
      return total + (addon ? addon.price * qty : 0);
    }, 0);
  };

  // Add item with addons to cart
  const addItemWithAddons = () => {
    if (!selectedItemForAddon) return;

    // Validate required addons (minAddon > 0 means at least one addon required)
    if (minAddon > 0 && addonItems.length > 0) {
      const totalSelected = getTotalSelectedAddonsCount();
      if (totalSelected < minAddon) {
        toast.warning(`Please select at least ${minAddon} add-on(s)`);
        return;
      }
    }

    // Check if any addon marked as required attribute is selected
    const requiredAddons = addonItems.filter(a => (a.attribute || '').toLowerCase() === 'required');
    if (requiredAddons.length > 0) {
      const hasSelectedRequired = requiredAddons.some(a => selectedAddons[a.id] > 0);
      if (!hasSelectedRequired) {
        toast.warning('Please select at least one required add-on');
        return;
      }
    }

    const selectedAddonsList = Object.entries(selectedAddons)
      .filter(([_, qty]) => qty > 0)
      .map(([addonId, qty]) => {
        const addon = addonItems.find(a => a.id === parseInt(addonId));
        return { ...addon, quantity: qty };
      });

    const itemWithAddons = {
      ...selectedItemForAddon,
      addons: selectedAddonsList,
      totalAddonPrice: getTotalAddonPrice(),
      selectedSpiceLevel: selectedSpiceLevel || selectedItemForAddon.spiceLevel || null,
      special_instructions: specialInstructions.trim() || null
    };

    // Add to cart with correct quantity
    const currentBranchId = selectedBranch?.id || localStorage.getItem('CustomerBranchId');
    if (selectedAddonsList.length > 0) {
      // Items with addons: add as new entry with specified quantity
      const cartItemId = `${itemWithAddons.id}-${Date.now()}`;
      setCartItems(prev => [...prev, { ...itemWithAddons, cartItemId, quantity: itemQuantity, branchId: currentBranchId }]);
    } else {
      // Items without addons: use addToCart which handles duplicates
      for (let i = 0; i < itemQuantity; i++) {
        addToCart(itemWithAddons);
      }
    }
    closeAddonModal();
  };

  // Handle category scroll for infinite loading
  const handleCategoryScroll = () => {
    if (!categoryScrollRef.current || loadingMoreCategories || !hasMoreCategories) return;

    const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
    // Check if scrolled near the end (within 100px of the right edge)
    const isNearEnd = scrollLeft + clientWidth >= scrollWidth - 100;

    if (isNearEnd && selectedBranch?.id) {
      const nextPage = categoriesPage + 1;
      console.log('Loading more categories, page:', nextPage);
      fetchCategories(selectedBranch.id, nextPage, true);
    }
  };

  // Load more categories on button click
  const loadMoreCategories = () => {
    if (selectedBranch?.id && hasMoreCategories && !loadingMoreCategories) {
      const nextPage = categoriesPage + 1;
      fetchCategories(selectedBranch.id, nextPage, true);
    }
  };

  // Add scroll event listener for categories
  useEffect(() => {
    const scrollContainer = categoryScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleCategoryScroll);
      return () => scrollContainer.removeEventListener('scroll', handleCategoryScroll);
    }
  }, [selectedBranch?.id, categoriesPage, hasMoreCategories, loadingMoreCategories]);

  // Check customer login status
  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const data = localStorage.getItem('customerData');
    if (token && data) {
      setIsCustomerLoggedIn(true);
      setCustomerData(JSON.parse(data));

      // Check if user was trying to checkout before login
      const pendingCheckout = localStorage.getItem('pendingCheckout');
      if (pendingCheckout === 'true') {
        localStorage.removeItem('pendingCheckout');
        // Open checkout page after login
        setShowCart(false);
        // Small delay to ensure state settles before opening checkout
        setTimeout(() => {
          setShowPaymentModal(true);
          fetchPaymentGateways();
          fetchAddresses();
          // Set customer info from logged-in user
          const userData = JSON.parse(data);
          if (userData) {
            setCustomerName(userData.name || '');
            setCustomerPhone(userData.mobileNumber || '');
            setCustomerEmail(userData.email || '');
          }
        }, 300);
      }
    } else {
      setIsCustomerLoggedIn(false);
      setCustomerData(null);
    }
  }, []);

  // Fetch sliders when restaurantId is available
  useEffect(() => {
    if (!themeLoading && restaurantId) {
      fetchSliders(restaurantId);
    }
  }, [themeLoading, restaurantId]);

  // Fetch marquee when restaurantId is available
  useEffect(() => {
    if (!themeLoading && restaurantId) {
      fetchMarquee(restaurantId);
    }
  }, [themeLoading, restaurantId]);

  // Fetch all branches without location requirement
  useEffect(() => {
    if (themeLoading || !restaurantId) {
      return;
    }
    console.log('Fetching all branches for restaurant:', restaurantId);
    fetchAllBranches(restaurantId);
  }, [themeLoading, restaurantId]);

  // Auto-slide for banners (pause on hover)
  useEffect(() => {
    if (bannerHovered) return;
    const interval = setInterval(() => {
      setCurrentBannerSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length, bannerHovered]);

  // Banner navigation
  const goToSlide = (index) => {
    setCurrentBannerSlide(index);
  };

  const nextSlide = () => {
    setCurrentBannerSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentBannerSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <>
      <style>{`
        :root {
          --primary-color: ${primaryColor};
          --secondary-color: ${secondaryColor};
          --font-color: ${fontColor};
        }
      `}</style>

      <div className={`landing-container ${themeMode === 'light' ? 'light-mode' : 'dark-mode'}`}>
        {/* Mobile Menu Overlay */}
        <div
          className={`mobile-menu-overlay ${showMobileMenu ? 'active' : ''}`}
          onClick={() => setShowMobileMenu(false)}
        ></div>

        {/* Mobile Menu Drawer */}
        <div className={`mobile-menu-drawer ${showMobileMenu ? 'active' : ''}`}>
          <div className="mobile-menu-header">
            <img
              src={logoUrl}
              alt={restaurantName}
              style={{ height: '40px', objectFit: 'contain' }}
            />
            <button className="mobile-menu-close" onClick={() => setShowMobileMenu(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="mobile-menu-content">
            {/* Wishlist */}
            <div className="mobile-menu-item" onClick={() => { setShowWishlist(true); setShowMobileMenu(false); }}>
              <i className="bi bi-heart"></i>
              <span>Saved Items</span>
              {getFilteredWishlistItems().length > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: primaryColor,
                  color: '#fff',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {getFilteredWishlistItems().length}
                </span>
              )}
            </div>

            {/* Profile/Login */}
            {isCustomerLoggedIn ? (
              <div className="mobile-menu-item" onClick={() => { navigate('/profile'); setShowMobileMenu(false); }}>
                <i className="bi bi-person-circle"></i>
                <span>My Profile</span>
              </div>
            ) : (
              <div className="mobile-menu-item" onClick={() => { navigate('/login'); setShowMobileMenu(false); }}>
                <i className="bi bi-box-arrow-in-right"></i>
                <span>Log In</span>
              </div>
            )}

            {/* My Orders */}
            <div className="mobile-menu-item" onClick={() => { navigate('/orders'); setShowMobileMenu(false); }}>
              <i className="bi bi-bag-check"></i>
              <span>My Orders</span>
            </div>

            {/* Router navigation for mobile */}
            <div className="mobile-menu-item" onClick={() => { navigate('/menu'); setShowMobileMenu(false); }}>
              <i className="bi bi-book"></i>
              <span>Special Menu</span>
            </div>
            <div className="mobile-menu-item" onClick={() => { navigate('/signature'); setShowMobileMenu(false); }}>
              <i className="bi bi-star"></i>
              <span>Signature Dishes</span>
            </div>
            <div className="mobile-menu-item" onClick={() => { navigate('/why-us'); setShowMobileMenu(false); }}>
              <i className="bi bi-bookmark-star"></i>
              <span>Why Choose Us</span>
            </div>
            <div className="mobile-menu-item" onClick={() => { navigate('/gallery'); setShowMobileMenu(false); }}>
              <i className="bi bi-images"></i>
              <span>Our Gallery</span>
            </div>
            <div className="mobile-menu-item" onClick={() => { navigate('/contact'); setShowMobileMenu(false); }}>
              <i className="bi bi-calendar-check"></i>
              <span>Book A Table</span>
            </div>

            <div className="mobile-menu-divider"></div>

            {/* Other Menu Items */}
            <div className="mobile-menu-item" onClick={() => { navigate('/about'); setShowMobileMenu(false); }}>
              <i className="bi bi-info-circle"></i>
              <span>About Us</span>
            </div>
            <div className="mobile-menu-item" onClick={() => { navigate('/contact'); setShowMobileMenu(false); }}>
              <i className="bi bi-headset"></i>
              <span>Contact Us</span>
            </div>
          </div>
        </div>

        {/* Mobile Wishlist Modal — visible only on mobile */}
        {showWishlist && isMobileView && (
          <div className="wishlist-mobile-modal" onClick={() => setShowWishlist(false)}>
            <div className="wishlist-mobile-content" onClick={(e) => e.stopPropagation()}>
              <div className="wishlist-header">
                <h3><i className="bi bi-heart-fill"></i>Saved Items</h3>
                <button className="wishlist-close" onClick={() => setShowWishlist(false)}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
              <div className="wishlist-content">
                {getFilteredWishlistItems().length === 0 ? (
                  <div className="wishlist-empty">
                    <i className="bi bi-heart"></i>
                    <p>Your wishlist is empty</p>
                    <p style={{ fontSize: '12px', marginTop: '8px', color: '#aaa' }}>
                      Tap the heart icon on items to add them here
                    </p>
                  </div>
                ) : (
                  getFilteredWishlistItems().map(item => (
                    <div key={item.id} className="wishlist-item">
                      <div className="wishlist-item-image">
                        <img src={item.image} alt={item.name} onError={handleImageError} />
                      </div>
                      <div className="wishlist-item-details">
                        <div className="wishlist-item-name">{item.name}</div>
                        <div className="wishlist-item-cuisine">
                          <span className={item.isVeg ? 'veg-icon' : 'nonveg-icon'}></span>
                          {item.description || item.category || item.restaurant}
                        </div>
                        <div className="wishlist-item-price">
                          ${item.price}
                          {item.mrp > item.price && (
                            <span className="mrp-price">${item.mrp}</span>
                          )}
                        </div>
                      </div>
                      <div className="wishlist-item-actions">
                        <button
                          className="wishlist-add-cart"
                          onClick={(e) => addWishlistItemToCart(item, e)}
                          disabled={!item.isAvailable}
                        >
                          <i className="bi bi-cart-plus"></i> Add
                        </button>
                        <button
                          className="wishlist-remove"
                          onClick={() => removeFromWishlist(item.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="landing-header">
          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" onClick={() => setShowMobileMenu(true)}>
            <i className="bi bi-list"></i>
          </button>

          <div className="header-left">
            <div className="header-logo">
              <img
                src={logoUrl || '/app-favicon.svg'}
                alt={restaurantName}
                style={{ height: '50px', objectFit: 'contain' }}
              />
            </div>

            {/* Header Branch Selector */}
            <div className="header-branch-selector" onClick={(e) => e.stopPropagation()}>
              <button className="header-branch-btn" onClick={() => setShowBranchDropdown(!showBranchDropdown)}>
                <i className="bi bi-shop"></i>
                <span className="header-branch-name">{selectedBranch?.name || 'Select Branch'}</span>
                <i className={`bi bi-chevron-${showBranchDropdown ? 'up' : 'down'}`} style={{ fontSize: '10px' }}></i>
              </button>
              {showBranchDropdown && (
                <>
                  <div className="header-branch-overlay" onClick={() => setShowBranchDropdown(false)}></div>
                  <div className="header-branch-dropdown">
                    <div className="header-branch-dropdown-header">
                      <i className="bi bi-shop me-1"></i> Select Branch
                    </div>
                    {branches.map(branch => (
                      <div
                        key={branch.id}
                        className={`header-branch-item ${selectedBranch?.id === branch.id ? 'selected' : ''}`}
                        onClick={() => {
                          const isSameBranch = selectedBranch?.id === branch.id;
                          setSelectedBranch(branch);
                          localStorage.setItem('CustomerBranchId', branch.id);
                          localStorage.setItem('CustomerBranchDistance', branch.distance || 0);
                          localStorage.setItem('CustomerBranchMinutes', branch.timeMinutes || 0);
                          if (userLocation?.latitude && userLocation?.longitude) {
                            localStorage.setItem('CustomerBranchLat', userLocation.latitude);
                            localStorage.setItem('CustomerBranchLng', userLocation.longitude);
                          }
                          setShowBranchDropdown(false);
                          if (!isSameBranch) {
                            setSelectedCategory(ALL_CATEGORY);
                            setSelectedSubcategory(null);
                            setSearchTerm('');
                            fetchCategories(branch.id, 0, false);
                            fetchTrendingItems(branch.id);
                            fetchMenuItems(branch.id, 'all', null, 0, false, '', false);
                          }
                        }}
                      >
                        <div>
                          <div className="header-branch-item-name">{branch.name}</div>
                          <div className="header-branch-item-address">{branch.address}</div>
                          {branch.distance && (
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                              <i className="bi bi-geo"></i> {branch.distance.toFixed(2)} km{branch.timeText ? ` · ${branch.timeText}` : ''}
                            </div>
                          )}
                        </div>
                        {selectedBranch?.id === branch.id && (
                          <i className="bi bi-check-circle-fill" style={{ color: '#4caf50' }}></i>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <nav className="desktop-nav-links">
            <span className={isMenuPage ? 'active' : ''} onClick={() => navigate('/menu')}>Home</span>
            <span className={isSignaturePage ? 'active' : ''} onClick={() => navigate('/signature')}>Signature</span>
            <span className={isWhyUsPage ? 'active' : ''} onClick={() => navigate('/why-us')}>Why Us</span>
            <span className={isGalleryPage ? 'active' : ''} onClick={() => navigate('/gallery')}>Gallery</span>
            <span className={isWhyUsPage && location.hash === '#testimonials' ? 'active' : ''} onClick={() => navigate('/why-us#testimonials')}>Reviews</span>
            <span className={isContactPage ? 'active' : ''} onClick={() => navigate('/contact')}>Contact</span>
          </nav>

          {/* Mobile Logo */}
          <div className="mobile-header-logo">
            <img
              src={logoUrl || '/app-favicon.svg'}
              alt={restaurantName}
              style={{ height: '36px', objectFit: 'contain' }}
            />
          </div>

          {/* Mobile Branch Selector - shows only on mobile (left) */}
          <div className="mobile-header-branch-selector" onClick={(e) => e.stopPropagation()}>
            <button className="mobile-header-branch-btn" onClick={() => setShowBranchDropdown(!showBranchDropdown)}>
              <i className="bi bi-shop"></i>
              <span className="mobile-header-branch-name">{selectedBranch?.name || 'Branch'}</span>
              <i className={`bi bi-chevron-${showBranchDropdown ? 'up' : 'down'}`} style={{ fontSize: '9px' }}></i>
            </button>
            {showBranchDropdown && (
              <>
                <div className="mobile-header-branch-overlay" onClick={() => setShowBranchDropdown(false)}></div>
                <div className="mobile-header-branch-dropdown">
                  <div className="mobile-header-branch-dropdown-header">
                    <i className="bi bi-shop me-1"></i> Select Branch
                  </div>
                  {branches.map(branch => (
                    <div
                      key={branch.id}
                      className={`mobile-header-branch-item ${selectedBranch?.id === branch.id ? 'selected' : ''}`}
                      onClick={() => {
                        const isSameBranch = selectedBranch?.id === branch.id;
                        setSelectedBranch(branch);
                        localStorage.setItem('CustomerBranchId', branch.id);
                        localStorage.setItem('CustomerBranchDistance', branch.distance || 0);
                        localStorage.setItem('CustomerBranchMinutes', branch.timeMinutes || 0);
                        if (userLocation?.latitude && userLocation?.longitude) {
                          localStorage.setItem('CustomerBranchLat', userLocation.latitude);
                          localStorage.setItem('CustomerBranchLng', userLocation.longitude);
                        }
                        setShowBranchDropdown(false);
                        // Force fetch even if same branch selected
                        if (!isSameBranch) {
                          setSelectedCategory(ALL_CATEGORY);
                          setSelectedSubcategory(null);
                          setSearchTerm('');
                          fetchCategories(branch.id, 0, false);
                          fetchTrendingItems(branch.id);
                          fetchMenuItems(branch.id, 'all', null, 0, false, '', false);
                        }
                      }}
                    >
                      <div>
                        <div className="mobile-header-branch-item-name">{branch.name}</div>
                        {branch.distance && (
                          <div style={{ fontSize: '10px', color: '#888', marginTop: '1px' }}>
                            <i className="bi bi-geo"></i> {branch.distance.toFixed(2)} km
                          </div>
                        )}
                      </div>
                      {selectedBranch?.id === branch.id && (
                        <i className="bi bi-check-circle-fill" style={{ color: '#4caf50', fontSize: '12px' }}></i>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Mobile Right Icons */}
          <div className="mobile-header-icons">
            <button
              className="btn-icon-only"
              onClick={() => setShowLocationModal(true)}
              title="Location"
            >
              <i className="bi bi-geo-alt-fill"></i>
            </button>
            <button
              className="btn-icon-only"
              onClick={() => {
                const newMode = themeMode === 'light' ? 'dark' : 'light';
                setThemeMode(newMode);
                localStorage.setItem('customerThemeMode', newMode);
              }}
              title={themeMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {themeMode === 'light' ? <i className="bi bi-moon-fill"></i> : <i className="bi bi-sun-fill"></i>}
            </button>
            {isCustomerLoggedIn ? (
              <>
                <button
                  className="btn-icon-only"
                  onClick={() => navigate('/orders')}
                  title="My Orders"
                >
                  <i className="bi bi-bag-check"></i>
                </button>
                <button
                  className="btn-icon-only"
                  onClick={() => navigate('/profile')}
                  title="Profile"
                >
                  <i className="bi bi-person-circle"></i>
                </button>
              </>
            ) : (
              <button className="btn-icon-only" onClick={() => navigate('/login')} title="Log In">
                <i className="bi bi-person"></i>
              </button>
            )}
          </div>

          {/* Search - Desktop */}
          <div className="header-search desktop-search">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search for dishes, cuisines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Mobile Search Row */}
          <div className="mobile-search-row">
            <div className="header-search">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Search for dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Right side actions - Veg Toggle, Wishlist, Profile */}
          <div className="header-right-actions">
            <div className="veg-toggle-container">
              <span className={`veg-label ${vegOnly ? 'active' : ''}`}>
                <span className="veg-dot"></span>
                Veg Mode
              </span>
              <label className="veg-toggle-switch">
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={() => {
                    const newValue = !vegOnly;
                    setVegOnly(newValue);
                    localStorage.setItem('vegOnly', newValue.toString());
                  }}
                />
                <span className="veg-toggle-slider">
                  <span className="toggle-text">{vegOnly ? 'ON' : 'OFF'}</span>
                </span>
              </label>
            </div>

            {/* Theme Toggle Button */}
            <button
              className="btn-theme-toggle"
              onClick={() => {
                const newMode = themeMode === 'light' ? 'dark' : 'light';
                setThemeMode(newMode);
                localStorage.setItem('customerThemeMode', newMode);
              }}
              title={themeMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {themeMode === 'light' ? <i className="bi bi-moon-fill"></i> : <i className="bi bi-sun-fill"></i>}
            </button>

            {/* Wishlist Button - Desktop */}
            <div className="wishlist-container desktop-signin">
              <button className="btn-wishlist" onClick={() => setShowWishlist(!showWishlist)}>
                <i className="bi bi-bookmark"></i>
                {getFilteredWishlistItems().length > 0 && (
                  <span className="wishlist-badge">{getFilteredWishlistItems().length}</span>
                )}
              </button>

              {/* Wishlist Dropdown — visible only on desktop */}
              {showWishlist && !isMobileView && (
                <>
                  <div className="wishlist-overlay" onClick={() => setShowWishlist(false)}></div>
                  <div className="wishlist-dropdown">
                    <div className="wishlist-header">
                      <h3><i className="bi bi-bookmark-fill"></i>Saved Items</h3>
                      <button className="wishlist-close" onClick={() => setShowWishlist(false)}>
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                    <div className="wishlist-content">
                      {getFilteredWishlistItems().length === 0 ? (
                        <div className="wishlist-empty">
                          <i className="bi bi-bookmark"></i>
                          <p>Your saved Items are empty</p>
                          <p style={{ fontSize: '12px', marginTop: '8px', color: '#aaa' }}>
                            Tap the save icon on items to add them here
                          </p>
                        </div>
                      ) : (
                        getFilteredWishlistItems().map(item => (
                          <div key={item.id} className="wishlist-item">
                            <div className="wishlist-item-image">
                              <img src={item.image} alt={item.name} onError={handleImageError} />
                            </div>
                            <div className="wishlist-item-details">
                              <div className="wishlist-item-name">{item.name}</div>
                              <div className="wishlist-item-cuisine">
                                <span className={item.isVeg ? 'veg-icon' : 'nonveg-icon'}></span>
                                {item.description || item.category}
                              </div>
                              <div className="wishlist-item-price">
                                ${item.price}
                                {item.mrp > item.price && (
                                  <span className="mrp-price">${item.mrp}</span>
                                )}
                              </div>
                            </div>
                            <div className="wishlist-item-actions">
                              <button
                                className="wishlist-add-cart"
                                onClick={(e) => addWishlistItemToCart(item, e)}
                                disabled={!item.isAvailable}
                              >
                                <i className="bi bi-cart-plus"></i> Add
                              </button>
                              <button
                                className="wishlist-remove"
                                onClick={() => removeFromWishlist(item.id)}
                              >
                                <i className="bi bi-trash"></i> Remove
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Location Button */}
            <button
              className="btn-icon-only"
              onClick={() => setShowLocationModal(true)}
              title="Location"
            >
              <i className="bi bi-geo-alt-fill"></i>
            </button>

            {/* Desktop Login/Profile - hidden on mobile */}
            {isCustomerLoggedIn ? (
              <>
                <button
                  className="btn-icon-only"
                  onClick={() => navigate('/orders')}
                  title="My Orders"
                >
                  <i className="bi bi-bag-check"></i>
                </button>
                <button
                  className="btn-icon-only"
                  onClick={() => navigate('/profile')}
                  title="Profile"
                >
                  <i className="bi bi-person-circle"></i>
                </button>
              </>
            ) : (
              <button className="header-btn btn-signin desktop-signin" onClick={() => navigate('/login')}>
                <i className="bi bi-person"></i>
                Log In
              </button>
            )}
          </div>

          {/* Mobile Search Bar - Shows only on mobile */}
          <div className="mobile-search-bar">
            <div className="mobile-search-input-wrapper">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Search for dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="mobile-search-veg-toggle">
              <span className={`veg-label ${vegOnly ? 'active' : ''}`}>
                <span className="veg-dot"></span>
                Veg Mode
              </span>
              <label className="veg-toggle-switch">
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={() => {
                    const newValue = !vegOnly;
                    setVegOnly(newValue);
                    localStorage.setItem('vegOnly', newValue.toString());
                  }}
                />
                <span className="veg-toggle-slider">
                  <span className="toggle-text">{vegOnly ? 'ON' : 'OFF'}</span>
                </span>
              </label>
            </div>
          </div>
        </header>

        {/* Marquee / Ticker - all active messages in one scrolling bar */}
        {marqueeMessages.length > 0 && (
          <div className="marquee-bar" style={{
            background: marqueeMessages[0].bgColor || '#1a1a2e',
            color: marqueeMessages[0].textColor || '#ffffff'
          }}>
            <div className="marquee-track" style={{
              animationDuration: `${marqueeMessages[0].speed || 30}s`
            }}>
              {marqueeMessages.map(msg => (
                <span key={msg.id} className="marquee-content">{msg.message} &nbsp;&nbsp;&nbsp; 🍽️ &nbsp;&nbsp;&nbsp; </span>
              ))}
              {marqueeMessages.map(msg => (
                <span key={`r-${msg.id}`} className="marquee-content">{msg.message} &nbsp;&nbsp;&nbsp; 🍽️ &nbsp;&nbsp;&nbsp; </span>
              ))}
            </div>
          </div>
        )}

        {/* Luxury Hero Section */}
        <section className="luxury-hero" id="home" style={{ backgroundImage: `url(${heroContent.bg})` }}>
          <div className="hero-bg-overlay"></div>
          <div className="hero-content">
            <span className="hero-subtitle-tag animate-fade-in-up">{heroContent.subtitle}</span>
            <h1 className="hero-title animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {heroContent.title}
            </h1>
            <p className="hero-description animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              {heroContent.description}
            </p>
            {heroContent.showButtons && (
              <div className="hero-actions animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <button className="btn-reserve" onClick={() => {
                  if (isContactPage) {
                    document.getElementById('reservation-section')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/contact');
                  }
                }}>
                  <i className="bi bi-calendar-check"></i> Book Table
                </button>
                <button className="btn-explore-menu" onClick={() => {
                  if (isMenuPage) {
                    document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/menu');
                  }
                }}>
                  Explore Menu <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            )}
          </div>
          
          {/* Scroll Indicator */}
          <div className="hero-scroll-indicator" onClick={() => {
            if (isMenuPage) {
              document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
            } else if (isSignaturePage) {
              document.getElementById('recommendations')?.scrollIntoView({ behavior: 'smooth' });
            } else if (isWhyUsPage) {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            } else if (isGalleryPage) {
              document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
            } else if (isContactPage) {
              document.getElementById('reservation-section')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}>
            <span>SCROLL DOWN</span>
            <div className="indicator-arrow">
              <i className="bi bi-chevron-down"></i>
            </div>
          </div>
        </section>

        {/* Experience Highlights */}
        {isMenuPage && (
          <section className="experience-highlights-section">
            <div className="section-header text-center">
              <span className="section-subheading">DINING EXPERIENCE</span>
              <h2 className="section-title">Why Customers Choose Us</h2>
            </div>
            <div className="experience-highlights-grid">
              <div className="experience-highlight-card">
                <div className="experience-highlight-icon">
                  <i className="bi bi-bag-check"></i>
                </div>
                <h3>Thoughtful Service</h3>
                <p>Friendly staff, smooth ordering, and a calm dining flow from start to finish.</p>
              </div>
              <div className="experience-highlight-card">
                <div className="experience-highlight-icon">
                  <i className="bi bi-flower1"></i>
                </div>
                <h3>Fresh Everyday</h3>
                <p>Ingredients are selected fresh so every order keeps the same quality and consistency.</p>
              </div>
              <div className="experience-highlight-card">
                <div className="experience-highlight-icon">
                  <i className="bi bi-stars"></i>
                </div>
                <h3>Special Taste</h3>
                <p>Classic flavors and chef specials prepared to be delicious and memorable for you.</p>
              </div>
            </div>
          </section>
        )}

        {/* Special Offers Section */}
        {isMenuPage && (
          <>
            <section className="luxury-offers-section" id="offers">
          <div className="section-header text-center">
            <span className="section-subheading">EXCLUSIVE OFFERS</span>
            <h2 className="section-title">Special Discounts For You</h2>
          </div>
          <div className="offers-grid">
            <div className="offer-card gold-gradient">
              <div className="offer-badge">50% OFF</div>
              <div className="offer-content">
                <h3>Welcome Feast</h3>
                <p>Enjoy a 50% discount on your first order. Use coupon code below at checkout.</p>
                <div className="coupon-code">FIRST50</div>
              </div>
            </div>
            <div className="offer-card dark-gold-gradient">
              <div className="offer-badge">FREE DELIVERY</div>
              <div className="offer-content">
                <h3>Weekend Special</h3>
                <p>Get free delivery for all orders above $40 on Friday, Saturday, and Sunday.</p>
                <div className="coupon-code">WEEKEND40</div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="categories-section" id="menu-section">
          <div className="categories-container">
            <button
              className="category-scroll-btn left"
              onClick={() => scrollCategories('left')}
              disabled={categoriesLoading || categories.length === 0}
            >
              <i className="bi bi-chevron-left"></i>
            </button>

            <div className="categories-scroll" ref={categoryScrollRef}>
              {categoriesLoading ? (
                // Loading skeleton
                [...Array(8)].map((_, index) => (
                  <div key={index} className="category-card skeleton">
                    <div className="category-icon skeleton-icon"></div>
                    <div className="category-name skeleton-text"></div>
                  </div>
                ))
              ) : categories.length > 0 ? (
                <>
                  {/* All Category Chip - styled like subcategory chip */}
                  <span
                    className={`subcategory-chip category-all-chip ${selectedCategory?.id === 'all' ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(ALL_CATEGORY)}
                  >
                    All
                  </span>
                  {/* Recommended Category Card */}
                  <div
                    className={`category-card ${selectedCategory?.id === 'recommended' ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(RECOMMENDED_CATEGORY)}
                  >
                    <div className="category-icon-emoji">⭐</div>
                    <div className="category-name">Recommended</div>
                  </div>
                  {/* Frequently Category Card - Only show when customer is logged in */}
                  {isCustomerLoggedIn && (
                    <div
                      className={`category-card ${selectedCategory?.id === 'frequently' ? 'active' : ''}`}
                      onClick={() => handleCategoryClick(FREQUENTLY_CATEGORY)}
                    >
                      <div className="category-icon-emoji">🔁</div>
                      <div className="category-name">Order Again</div>
                    </div>
                  )}
                  {categories.map(category => {
                    console.log('Category row:', category, 'Icon URL:', category.icon);
                    return (
                      <div
                        key={category.id}
                        className={`category-card ${selectedCategory?.id === category.id ? 'active' : ''}`}
                        onClick={() => handleCategoryClick(category)}
                      >
                        <img
                          src={category.icon}
                          alt={category.name}
                          className="category-icon"
                          onError={handleImageError}
                          onLoad={() => console.log('Image loaded successfully:', category.icon)}
                        />
                        <div className="category-name">{category.name}</div>
                      </div>
                    );
                  })}
                  {/* Load More Card */}
                  {hasMoreCategories && !loadingMoreCategories && (
                    <div
                      className="category-card load-more-card"
                      onClick={loadMoreCategories}
                    >
                      <div className="load-more-icon">
                        <i className="bi bi-plus-lg"></i>
                      </div>
                      <div className="category-name">Load More</div>
                    </div>
                  )}
                  {/* Loading more indicator */}
                  {loadingMoreCategories && (
                    <div className="category-card skeleton">
                      <div className="category-icon skeleton-icon"></div>
                      <div className="category-name skeleton-text"></div>
                    </div>
                  )}
                </>
              ) : (
                <div className="categories-empty">
                  <i className="bi bi-grid"></i>
                  <span>No categories available</span>
                </div>
              )}
            </div>

            <button
              className="category-scroll-btn right"
              onClick={() => scrollCategories('right')}
              disabled={categoriesLoading || categories.length === 0}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </section>

        {/* Subcategories - Show only for regular categories that have subcategories */}
        {selectedCategory && selectedCategory.id !== 'all' && selectedCategory.id !== 'recommended' && selectedCategory.id !== 'frequently' && (subcategoriesLoading || subcategories.length > 0) && (
          <section className="subcategories-section">
            <div className="subcategories-header">
              <span className="subcategories-title">
                <i className="bi bi-arrow-return-right" style={{ marginRight: '8px', color: primaryColor }}></i>
                {selectedCategory.name} Types
              </span>
              <button
                className="subcategories-close"
                onClick={() => {
                  setSelectedCategory(ALL_CATEGORY);
                  setSelectedSubcategory(null);
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="subcategories-list">
              <span
                className={`subcategory-chip ${selectedSubcategory?.id === 'all_sub' ? 'active' : ''}`}
                onClick={() => setSelectedSubcategory(ALL_SUBCATEGORY)}
              >
                All {selectedCategory.name}
              </span>
              {subcategoriesLoading ? (
                // Loading skeleton chips
                [...Array(5)].map((_, index) => (
                  <span key={index} className="subcategory-chip skeleton-chip"></span>
                ))
              ) : (
                subcategories.map((sub) => (
                  <span
                    key={sub.id}
                    className={`subcategory-chip ${selectedSubcategory?.id === sub.id ? 'active' : ''}`}
                    onClick={() => handleSubcategoryClick(sub)}
                  >
                    {sub.name}
                  </span>
                ))
              )}
            </div>
          </section>
        )}

        {/* Filtered Items - Hide when subcategories exist but none selected */}
        {selectedCategory && !(selectedCategory.id !== 'all' && selectedCategory.id !== 'recommended' && selectedCategory.id !== 'frequently' && !subcategoriesLoading && subcategories.length > 0 && !selectedSubcategory) && (
          <section className="filtered-items-section">
            <div className="section-header">
              <h2 className="section-title">
                {selectedCategory.id === 'all' ? 'All Items' : selectedCategory.id === 'recommended' ? 'Recommended Items' : selectedCategory.id === 'frequently' ? 'Order Again Items' : (selectedSubcategory?.id === 'all_sub' ? selectedCategory.name : (selectedSubcategory?.name || selectedCategory.name))}
              </h2>
            </div>

            {(menuItemsLoading || (selectedCategory?.id === 'frequently' && frequentlyLoading)) ? (
              // Loading skeleton
              <div className="filtered-items-grid">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="filtered-item-card skeleton-card">
                    <div className="filtered-item-image skeleton-image"></div>
                    <div className="filtered-item-details">
                      <div className="skeleton-text" style={{ width: '80%', height: '16px' }}></div>
                      <div className="skeleton-text" style={{ width: '60%', height: '12px', marginTop: '8px' }}></div>
                      <div className="skeleton-text" style={{ width: '40%', height: '14px', marginTop: '12px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length > 0 ? (
              <>
                <div className="filtered-items-grid">
                  {filteredItems.map((item) => (
                    <div key={item.id} className={`filtered-item-card ${!item.isAvailable ? 'unavailable' : ''}`} onClick={() => item.isAvailable && openAddonModal(item)}>
                      <div className="filtered-item-image">
                        <img src={item.image} alt={item.name} className="filtered-item-img" onError={handleImageError} />
                        {getItemQuantity(item.id) > 0 ? (
                          <span className="filtered-item-tag selected-count">
                            <i className="bi bi-check-circle-fill"></i> {getItemQuantity(item.id)}
                          </span>
                        ) : item.isRecommended ? (
                          <span className="filtered-item-tag recommended-badge">
                            <i className="bi bi-star-fill"></i> Chef's Pick
                          </span>
                        ) : null}
                        {!item.isAvailable && (
                          <div className="unavailable-overlay">Currently Unavailable</div>
                        )}
                        {/* Veg/Non-veg indicator on image */}
                        {item.isVeg !== undefined && (
                          <span className={`filtered-item-diet ${item.isVeg === true ? 'veg-icon' : 'nonveg-icon'}`}></span>
                        )}
                        <span
                          className={`filtered-item-heart ${isInWishlist(item.id) ? 'active' : ''}`}
                          onClick={(e) => toggleWishlist(item, e)}
                        >
                          <i className={`bi ${isInWishlist(item.id) ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
                        </span>
                      </div>
                      <div className="filtered-item-details">
                        <div className="filtered-item-name">{item.name}</div>
                        <div className="filtered-item-meta">
                          {item.rating > 0 && (
                            <span className="filtered-item-rating-inline">
                              <i className="bi bi-star-fill"></i> {item.rating}
                            </span>
                          )}
                          <span className="filtered-item-time">
                            <i className="bi bi-clock"></i>
                            {item.prepTime || 'N/A'} min
                          </span>
                          <span className="filtered-item-price">${item.price}</span>
                        </div>
                        {item.mrp > item.price && (
                          <div className="filtered-item-offer">
                            <span className="offer-tag">OFFER</span>
                            <span className="offer-text">{Math.round((item.mrp - item.price) / item.mrp * 100)}% OFF</span>
                          </div>
                        )}
                      </div>
                      {/* Zomato-style: counter when in cart, ADD + Customise when not */}
                      <div className="filtered-item-bottom">
                        {getItemQuantity(item.id) > 0 ? (
                          <>
                            <div className="card-counter">
                              <button className="counter-btn" onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}>
                                <i className="bi bi-dash-lg"></i>
                              </button>
                              <span className="counter-num">{getItemQuantity(item.id)}</span>
                              <button className="counter-btn" onClick={(e) => { e.stopPropagation(); addToCart(item); }}>
                                <i className="bi bi-plus-lg"></i>
                              </button>
                            </div>
                            {item.addonsId && (
                              <div className="card-customise" onClick={(e) => { e.stopPropagation(); openAddonModal(item); }}>
                                Customise ▾
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              className="filtered-item-add-btn"
                              onClick={(e) => { e.stopPropagation(); if (item.isAvailable) addToCart(item); }}
                              disabled={!item.isAvailable}
                            >
                              + ADD
                            </button>
                            {item.addonsId && <div className="card-customisable-tag">Customisable</div>}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button - Hide for frequently category */}
                {selectedCategory?.id !== 'frequently' && hasMoreMenuItems && !loadingMoreMenuItems && (
                  <div className="load-more-container">
                    <button className="load-more-btn" onClick={loadMoreMenuItems}>
                      <i className="bi bi-arrow-down-circle"></i>
                      Load More
                    </button>
                  </div>
                )}

                {/* Loading more indicator */}
                {selectedCategory?.id !== 'frequently' && loadingMoreMenuItems && (
                  <div className="load-more-container">
                    <div className="load-more-spinner">
                      <div className="spinner-border" role="status"></div>
                      <span>Loading more items...</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-items-message">
                <i className="bi bi-inbox"></i>
                <p>
                  {selectedCategory?.id === 'frequently'
                    ? (isCustomerLoggedIn
                        ? 'No frequently ordered items yet. Start ordering to see your favorites here!'
                        : 'Please log in to see your frequently ordered items')
                    : 'No items found in this category'}
                </p>
              </div>
            )}
          </section>
        )}
          </>
        )}

        {/* Trending / Chef Recommendation Section */}
        {isSignaturePage && (
          <section className="trending-section" id="recommendations">
          <div className="section-header text-center">
            <span className="section-subheading">CHEF RECOMMENDATION</span>
            <h2 className="section-title">Signature Dishes</h2>
          </div>

          <div className="trending-grid">
            {trendingLoading ? (
              <div className="trending-loading" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                <div className="spinner-border" role="status" style={{ color: theme.primaryColor }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : trendingItems.length === 0 ? (
              <div className="no-trending-items" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666' }}>
                No trending items available
              </div>
            ) : (
              trendingItems
                .filter(item => !vegOnly || item.isVeg)
                .map(item => (
                  <div key={item.id} className="food-card">
                    <div className="food-image">
                      <img src={item.image} alt={item.name} onError={handleImageError} />
                      <span className="food-tag">
                        {item.tag === "Chef's Pick" && <i className="bi bi-star-fill"></i>} {item.tag}
                      </span>
                      <span
                        className={`food-heart ${isInWishlist(item.id) ? 'active' : ''}`}
                        onClick={(e) => toggleWishlist(item, e)}
                      >
                        <i className={`bi ${isInWishlist(item.id) ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                      </span>
                    </div>
                    <div className="food-details">
                      <div className="food-name">{item.name}</div>
                      <div className="food-restaurant">{item.restaurant}</div>
                      <div className="food-meta">
                        <span className="food-price">${item.price}</span>
                        <span className="food-rating">
                          <i className="bi bi-star-fill"></i>
                          {item.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>
        )}

        {/* Why Choose Us Section */}
        {isWhyUsPage && (
          <>
          <section className="why-choose-us" id="features">
          <div className="section-header text-center">
            <span className="section-subheading">OUR VALUES</span>
            <h2 className="section-title">Why Choose Our Restaurant</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-egg-fried"></i>
              </div>
              <h3>Quality Ingredients</h3>
              <p>We source only organic, farm-fresh vegetables and premium cuts of meat to prepare delicious, healthy dishes.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-award"></i>
              </div>
              <h3>Expert Chefs</h3>
              <p>Our kitchen is run by professional chefs with many years of cooking experience.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-lightning-charge"></i>
              </div>
              <h3>Great Service</h3>
              <p>Your satisfaction is our goal. Enjoy friendly service and quick food delivery.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-shield-check"></i>
              </div>
              <h3>Hygiene Standard</h3>
              <p>We enforce 5-star clean standards. Daily sanitation, sterile equipment, and safe preparation policies.</p>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="luxury-stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">15K+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">120+</div>
              <div className="stat-label">Signature Dishes</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">15+</div>
              <div className="stat-label">Years of Ambiance</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">4.9★</div>
              <div className="stat-label">Average Rating</div>
            </div>
          </div>
        </section>

        <section className="chef-spotlight-section">
          <div className="chef-spotlight-card">
            <div className="chef-spotlight-image">
              <img
                src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=900&q=80"
                alt="Chef spotlight"
              />
            </div>
            <div className="chef-spotlight-content">
              <span className="section-subheading">CHEF SPOTLIGHT</span>
              <h3>Prepared by Expert Chefs</h3>
              <p>
                Our kitchen team blends traditional Indian recipes with modern presentation, precise timing,
                and high-quality ingredients to keep every plate memorable.
              </p>
              <div className="chef-spotlight-points">
                <div className="chef-point">
                  <i className="bi bi-check2-circle"></i>
                  <span>Expert chefs with signature techniques</span>
                </div>
                <div className="chef-point">
                  <i className="bi bi-check2-circle"></i>
                  <span>Fresh ingredients prepared daily</span>
                </div>
                <div className="chef-point">
                  <i className="bi bi-check2-circle"></i>
                  <span>Balanced flavors with premium presentation</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip-section">
          <div className="trust-strip-grid">
            <div className="trust-strip-item">
              <div className="trust-strip-value">100%</div>
              <div className="trust-strip-label">Fresh Prep</div>
            </div>
            <div className="trust-strip-item">
              <div className="trust-strip-value">24/7</div>
              <div className="trust-strip-label">Kitchen Support</div>
            </div>
            <div className="trust-strip-item">
              <div className="trust-strip-value">A+</div>
              <div className="trust-strip-label">Hygiene Standard</div>
            </div>
            <div className="trust-strip-item">
              <div className="trust-strip-value">Fast</div>
              <div className="trust-strip-label">Service Flow</div>
            </div>
          </div>
        </section>

        <section className="why-us-cta-section">
          <div className="why-us-cta-card">
            <div>
              <span className="section-subheading">READY TO VISIT</span>
              <h3>Experience the same flow, now with a stronger story.</h3>
              <p>
                Explore the menu, reserve a table, and enjoy a premium dining experience without any flow change.
              </p>
            </div>
            <div className="why-us-cta-actions">
              <button className="btn-reserve" onClick={() => navigate('/contact')}>
                <i className="bi bi-calendar-check"></i> Book Table
              </button>
              <button className="btn-explore-menu" onClick={() => navigate('/menu')}>
                View Menu <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </section>
          </>
        )}

        {/* Restaurant Gallery Section */}
        {isGalleryPage && (
          <section className="restaurant-gallery" id="gallery">
          <div className="section-header text-center">
            <span className="section-subheading">VISUAL JOURNEY</span>
            <h2 className="section-title">Our Dining Area</h2>
          </div>
          <div className="gallery-masonry">
            <div className="gallery-item size-large">
              <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80" alt="Restaurant Interior" />
              <div className="gallery-overlay">
                <span>Main Dining Room</span>
              </div>
            </div>
            <div className="gallery-item size-tall">
              <img src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80" alt="Special Dish" />
              <div className="gallery-overlay">
                <span>Delicious Platters</span>
              </div>
            </div>
            <div className="gallery-item size-tall">
              <img src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80" alt="Cozy Dining Area" />
              <div className="gallery-overlay">
                <span>Cozy Lounge</span>
              </div>
            </div>
            <div className="gallery-item size-large">
              <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80" alt="Gourmet Food" />
              <div className="gallery-overlay">
                <span>Chef's Specials</span>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Customer Testimonials Section */}
        {isWhyUsPage && (
          <section className="testimonials-section" id="testimonials">
          <div className="section-header text-center">
            <span className="section-subheading">TESTIMONIALS</span>
            <h2 className="section-title">What Our Customers Say</h2>
          </div>
          <div className="testimonial-slider-container">
            <div className="testimonial-card-slide">
              <div className="testimonial-stars">
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
                <i className="bi bi-star-fill"></i>
              </div>
              <p className="testimonial-text">
                {activeTestimonial === 0 && "“Absolutely delicious! The atmosphere is cozy, the service is fast, and the food is cooked to perfection. Best place to eat in years.”"}
                {activeTestimonial === 1 && "“The steaks here are amazing, and the presentation of each dish looks great. Truly a wonderful meal.”"}
                {activeTestimonial === 2 && "“Very clean, friendly staff, and an amazing collection of sweet desserts. Will definitely come back with family!”"}
              </p>
              <div className="testimonial-user">
                <img 
                  src={activeTestimonial === 0 ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" : 
                       activeTestimonial === 1 ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" : 
                       "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"} 
                  alt="Customer" 
                  className="testimonial-avatar" 
                />
                <div className="testimonial-meta">
                  <h4>
                    {activeTestimonial === 0 && "Sophia Loren"}
                    {activeTestimonial === 1 && "David Marcus"}
                    {activeTestimonial === 2 && "Emily Watson"}
                  </h4>
                  <span>
                    {activeTestimonial === 0 && "Food Lover"}
                    {activeTestimonial === 1 && "Food Critic"}
                    {activeTestimonial === 2 && "Regular Customer"}
                  </span>
                </div>
              </div>
            </div>
            <div className="testimonial-dots">
              <span className={`dot ${activeTestimonial === 0 ? 'active' : ''}`} onClick={() => setActiveTestimonial(0)}></span>
              <span className={`dot ${activeTestimonial === 1 ? 'active' : ''}`} onClick={() => setActiveTestimonial(1)}></span>
              <span className={`dot ${activeTestimonial === 2 ? 'active' : ''}`} onClick={() => setActiveTestimonial(2)}></span>
            </div>
          </div>
        </section>
        )}

        {/* Reservation Section */}
        {isContactPage && (
          <section className="reservation-section" id="reservation-section">
          <div className="section-header text-center">
            <span className="section-subheading">TABLE BOOKING</span>
            <h2 className="section-title">Reserve A Table</h2>
          </div>
          <div className="reservation-container">
            <form onSubmit={handleReservationSubmit} className="reservation-form">
              <div className="form-row">
                <div className="form-group-lux">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="Enter your name" 
                    value={reservation.name}
                    onChange={(e) => setReservation({...reservation, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group-lux">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="Enter email address" 
                    value={reservation.email}
                    onChange={(e) => setReservation({...reservation, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group-lux">
                  <label>Mobile Number *</label>
                  <input 
                    type="tel" 
                    placeholder="Enter 10 digit number" 
                    value={reservation.phone}
                    onChange={(e) => setReservation({...reservation, phone: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group-lux">
                  <label>Number of Guests *</label>
                  <select 
                    value={reservation.guests}
                    onChange={(e) => setReservation({...reservation, guests: parseInt(e.target.value)})}
                    required
                  >
                    <option value="1">1 Person</option>
                    <option value="2">2 Persons</option>
                    <option value="3">3 Persons</option>
                    <option value="4">4 Persons</option>
                    <option value="5">5 Persons</option>
                    <option value="6">6+ Persons</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group-lux">
                  <label>Booking Date *</label>
                  <input 
                    type="date" 
                    value={reservation.date}
                    onChange={(e) => setReservation({...reservation, date: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group-lux">
                  <label>Booking Time *</label>
                  <input 
                    type="time" 
                    value={reservation.time}
                    onChange={(e) => setReservation({...reservation, time: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <div className="form-group-lux">
                <label>Special Notes (Optional)</label>
                <textarea 
                  rows="3" 
                  placeholder="E.g., birthday celebration, window table request, food allergies..."
                  value={reservation.notes}
                  onChange={(e) => setReservation({...reservation, notes: e.target.value})}
                ></textarea>
              </div>
              <div className="text-center mt-4">
                <button type="submit" className="btn-book-submit">
                  Confirm Reservation <i className="bi bi-calendar-plus"></i>
                </button>
              </div>
            </form>
          </div>
        </section>
        )}

        {/* Location & Contact Section */}
        {isContactPage && (
          <section className="location-contact-section" id="contact">
          <div className="section-header text-center">
            <span className="section-subheading">FIND US</span>
            <h2 className="section-title">Location & Hours</h2>
          </div>
          <div className="location-grid">
            <div className="contact-details-card">
              <h3>Contact Info</h3>
              <div className="contact-item">
                <i className="bi bi-geo-alt"></i>
                <div>
                  <h4>Our Address</h4>
                  <p>{contactAddress || '101, Luxury Boulevard, Regent District, NY'}</p>
                </div>
              </div>
              <div className="contact-item">
                <i className="bi bi-telephone"></i>
                <div>
                  <h4>Phone Number</h4>
                  <p>{contactPhone || '+1 (555) 123-4567'}</p>
                </div>
              </div>
              <div className="contact-item">
                <i className="bi bi-envelope"></i>
                <div>
                  <h4>Email Address</h4>
                  <p>{contactEmail || 'reservations@royaldining.com'}</p>
                </div>
              </div>
              <div className="contact-item">
                <i className="bi bi-clock"></i>
                <div>
                  <h4>Opening Hours</h4>
                  <p>Mon - Fri: 11:00 AM - 11:00 PM</p>
                  <p>Sat - Sun: 10:00 AM - 12:00 AM</p>
                </div>
              </div>
            </div>
            <div className="map-container-lux">
              <iframe 
                title="Restaurant Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.6175390977823!2d-73.98685838459392!3d40.74844047932822!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a163!2sEmpire%20State%20Building!5e0!3m2!1sen!2sin!4v1655029367123!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0, borderRadius: '20px' }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </section>
        )}

        {/* Footer */}
        <footer className="main-footer" style={{ marginBottom: 0 }}>
          {/* Footer Links */}
          <div className="footer-content">
            <div className="footer-grid">
              {/* Brand Section */}
              <div className="footer-brand">
                {theme.logoUrl ? (
                  <img src={theme.logoUrl} alt={restaurantName} className="footer-logo-img" />
                ) : (
                  <div className="footer-logo">
                    <span className="footer-logo-icon">🍽️</span>
                    <span>{restaurantName}</span>
                  </div>
                )}
                <p className="footer-subtitle">{theme.tagline || ''}</p>
                <p className="footer-tagline">Delicious food delivered to your doorstep. Experience the finest quality with authentic recipes.</p>
                {(socialMediaDetails?.facebook || socialMediaDetails?.instagram || socialMediaDetails?.twitter || socialMediaDetails?.youtube) && (
                  <div className="footer-social">
                    {socialMediaDetails?.facebook && <a href={socialMediaDetails.facebook} target="_blank" rel="noopener noreferrer" className="social-link" style={{ color: '#1877F2', backgroundColor: '#fff' }}><i className="bi bi-facebook"></i></a>}
                    {socialMediaDetails?.instagram && <a href={socialMediaDetails.instagram} target="_blank" rel="noopener noreferrer" className="social-link" style={{ color: '#E4405F', backgroundColor: '#fff' }}><i className="bi bi-instagram"></i></a>}
                    {socialMediaDetails?.twitter && <a href={socialMediaDetails.twitter} target="_blank" rel="noopener noreferrer" className="social-link" style={{ color: '#000000', backgroundColor: '#fff' }}><i className="bi bi-twitter-x"></i></a>}
                    {socialMediaDetails?.youtube && <a href={socialMediaDetails.youtube} target="_blank" rel="noopener noreferrer" className="social-link" style={{ color: '#FF0000', backgroundColor: '#fff' }}><i className="bi bi-youtube"></i></a>}
                  </div>
                )}
                <div className="newsletter-box mt-4">
                  <h5>Join Our Newsletter</h5>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px' }}>Subscribe to get updates on luxury events and signature menus.</p>
                  <form onSubmit={(e) => { e.preventDefault(); toast.success("Thank you for subscribing!"); e.target.reset(); }} className="newsletter-form">
                    <input type="email" placeholder="Your Email Address" required style={{
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px 0 0 8px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      outline: 'none',
                      width: '180px'
                    }} />
                    <button type="submit" style={{
                      padding: '10px 16px',
                      background: 'var(--accent)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0 8px 8px 0',
                      cursor: 'pointer'
                    }}><i className="bi bi-send"></i></button>
                  </form>
                </div>
              </div>

              {/* Quick Links */}
              <div className="footer-links-section footer-quick-links">
                <h4 className="footer-heading">Quick Links</h4>
                <ul className="footer-links">
                  <li><span onClick={() => navigate('/about')}><i className="bi bi-chevron-right"></i> About Us</span></li>
                  <li><span onClick={() => navigate('/contact')}><i className="bi bi-chevron-right"></i> Contact Us</span></li>
                  <li><span onClick={() => navigate(isCustomerLoggedIn ? '/profile' : '/login')}><i className="bi bi-chevron-right"></i> {isCustomerLoggedIn ? 'My Profile' : 'Login / Sign Up'}</span></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="footer-links-section footer-legal">
                <h4 className="footer-heading">Legal</h4>
                <ul className="footer-links">
                  <li><span onClick={() => navigate('/terms')}><i className="bi bi-chevron-right"></i> Terms & Conditions</span></li>
                  <li><span onClick={() => navigate('/privacy')}><i className="bi bi-chevron-right"></i> Privacy Policy</span></li>
                  <li><span onClick={() => navigate('/refund')}><i className="bi bi-chevron-right"></i> Refund Policy</span></li>
                </ul>
              </div>

              {/* Contact Info */}
              <div className="footer-links-section footer-contact-section">
                <h4 className="footer-heading">Contact Info</h4>
                <ul className="footer-contact">
                  {contactAddress && <li><i className="bi bi-geo-alt"></i> {contactAddress}</li>}
                  {contactPhone && <li><i className="bi bi-telephone"></i> {contactPhone}</li>}
                  {contactEmail && <li><i className="bi bi-envelope"></i> {contactEmail}</li>}
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="footer-bottom">
              <p>&copy; {new Date().getFullYear()} {restaurantName}. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* Addons Modal */}
        {showAddonModal && selectedItemForAddon && (
          <>
            <div className="addon-modal-overlay" onClick={closeAddonModal} style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
            }}></div>
            <div className="addon-modal" style={{
              position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '100%', maxWidth: '520px', maxHeight: '92vh',
              background: '#fff', borderRadius: '20px 20px 0 0',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
              overflow: 'hidden', zIndex: 2001
            }}>
              {/* Drag Handle + Title */}
              <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
                <div style={{ width: '40px', height: '4px', background: '#d1d5db', borderRadius: '2px', margin: '0 auto 12px' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1a1a1a' }}>Customize your dish</h3>
                  <button onClick={closeAddonModal} style={{
                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#f5f5f5', border: 'none', borderRadius: '50%', cursor: 'pointer', color: '#888', fontSize: '0.9rem'
                  }}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
                {/* 1. Full-width Item Image */}
                <div style={{ width: '100%', height: '200px', overflow: 'hidden', background: '#f8f8f8', flexShrink: 0 }}>
                  <img
                    src={selectedItemForAddon.image || defaultImage}
                    alt={selectedItemForAddon.name}
                    onError={handleImageError}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>

                {/* 2. Item Name + Veg/Non-Veg Icon + Price */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3, flex: 1 }}>{selectedItemForAddon.name}</h3>
                    {selectedItemForAddon.isVeg !== undefined && (
                      <span className={selectedItemForAddon.isVeg === true ? 'veg-icon' : 'nonveg-icon'}></span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent, #c8956c)' }}>${selectedItemForAddon.price}</span>
                    {selectedItemForAddon.prepTime && (
                      <span style={{ padding: '3px 10px', background: '#f5f5f5', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#888', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <i className="bi bi-clock"></i>
                        {selectedItemForAddon.prepTime} min
                      </span>
                    )}
                    {selectedItemForAddon.spiceLevel && (
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', color: selectedItemForAddon.spiceLevel === 'EXTRA_HOT' ? '#dc2626' : selectedItemForAddon.spiceLevel === 'HOT' ? '#ef4444' : selectedItemForAddon.spiceLevel === 'MEDIUM' ? '#f97316' : '#f59e0b', background: selectedItemForAddon.spiceLevel === 'EXTRA_HOT' ? '#fecaca' : selectedItemForAddon.spiceLevel === 'HOT' ? '#fee2e2' : selectedItemForAddon.spiceLevel === 'MEDIUM' ? '#ffedd5' : '#fef3c7' }}>
                        <i className="bi bi-fire"></i>
                        {(selectedItemForAddon.spiceLevel || '').replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    )}
                  </div>

                  {/* 3. Item Description */}
                  {selectedItemForAddon.description && (
                    <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: '#888', lineHeight: 1.5 }}>{selectedItemForAddon.description}</p>
                  )}
                </div>

                {/* Spice Level Selector */}
                {selectedItemForAddon.spiceLevel && (
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="bi bi-fire" style={{ color: '#ef4444' }}></i>
                      Choose Spice Level
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { value: 'MILD', label: 'Mild', emoji: '🌶', color: '#f59e0b', bg: '#fef3c7' },
                        { value: 'MEDIUM', label: 'Medium', emoji: '🌶🌶', color: '#f97316', bg: '#ffedd5' },
                        { value: 'HOT', label: 'Hot', emoji: '🌶🌶🌶', color: '#ef4444', bg: '#fee2e2' },
                        { value: 'EXTRA_HOT', label: 'Extra Hot', emoji: '🔥', color: '#dc2626', bg: '#fecaca' },
                      ].map(level => {
                        const isSelected = selectedSpiceLevel === level.value;
                        return (
                          <button key={level.value} onClick={() => setSelectedSpiceLevel(level.value)}
                            style={{ padding: '8px 16px', borderRadius: '20px', border: `2px solid ${isSelected ? level.color : '#e2e8f0'}`, background: isSelected ? level.bg : '#fff', color: isSelected ? level.color : '#64748b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Inter', sans-serif" }}>
                            <span>{level.emoji}</span> {level.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Add-ons Section */}
                {selectedItemForAddon.addonsId && (
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="bi bi-plus-circle" style={{ color: 'var(--accent, #c8956c)' }}></i>
                      Add-ons
                    </div>
                    {addonLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '30px', color: '#888' }}>
                        <div className="spinner-border spinner-border-sm" role="status"></div>
                        <span>Loading addons...</span>
                      </div>
                    ) : addonItems.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {minAddon > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, marginBottom: '4px', padding: '6px 12px', background: '#fef3c7', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '0.7rem' }}></i>
                            Select at least {minAddon} add-on(s)
                          </div>
                        )}
                        {addonItems.map(addon => {
                          const isRequired = (addon.attribute || '').toLowerCase() === 'required';
                          const isAddonSelected = selectedAddons[addon.id];
                          return (
                            <div key={addon.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '12px 14px', background: isAddonSelected ? '#fff7ed' : '#f9fafb',
                              border: `1px solid ${isAddonSelected ? 'var(--accent, #c8956c)' : '#e5e7eb'}`,
                              borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontWeight: 500, fontSize: '0.85rem', color: '#1a1a1a' }}>
                                  {addon.name}
                                  {isRequired && <span style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 700, marginLeft: '6px', background: '#fee2e2', padding: '1px 6px', borderRadius: '4px' }}>REQUIRED</span>}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: '#888' }}>+${addon.price}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isAddonSelected ? (
                                  <>
                                    <button onClick={() => updateAddonQuantity(addon.id, -1)}
                                      style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', color: '#555', fontSize: '0.9rem' }}>
                                      <i className="bi bi-dash"></i>
                                    </button>
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: '22px', textAlign: 'center', color: '#1a1a1a' }}>{selectedAddons[addon.id]}</span>
                                    <button onClick={() => updateAddonQuantity(addon.id, 1)}
                                      style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', color: '#555', fontSize: '0.9rem' }}>
                                      <i className="bi bi-plus"></i>
                                    </button>
                                  </>
                                ) : (
                                  <button onClick={() => updateAddonQuantity(addon.id, 1)}
                                    style={{ padding: '6px 18px', background: 'transparent', color: 'var(--accent, #c8956c)', border: '1.5px solid var(--accent, #c8956c)', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.5px' }}>
                                    ADD
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '30px 20px', color: '#888', fontSize: '0.85rem' }}>
                        <i className="bi bi-box" style={{ display: 'block', fontSize: '1.5rem', marginBottom: '8px' }}></i>
                        No add-ons available
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Special Instructions */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="bi bi-pencil-square" style={{ color: 'var(--accent, #c8956c)' }}></i>
                    Special Instructions
                  </div>
                  <textarea
                    placeholder="E.g. No onions, extra spicy, allergies..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    maxLength={250}
                    rows={2}
                    style={{
                      width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '12px',
                      fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', color: '#1a1a1a', background: '#f9fafb',
                      resize: 'none', outline: 'none', lineHeight: 1.5, boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* 6 & 7. Sticky Bottom: Quantity + Add to Cart */}
              <div style={{
                padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '12px', background: '#fff', flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f5f5f5', border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '4px' }}>
                    <button onClick={() => setItemQuantity(prev => Math.max(1, prev - 1))} disabled={itemQuantity <= 1}
                      style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: itemQuantity <= 1 ? 'not-allowed' : 'pointer', color: '#555', fontSize: '0.9rem', opacity: itemQuantity <= 1 ? 0.4 : 1 }}>
                      <i className="bi bi-dash"></i>
                    </button>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: '22px', textAlign: 'center', color: '#1a1a1a' }}>{itemQuantity}</span>
                    <button onClick={() => setItemQuantity(prev => prev + 1)}
                      style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', color: '#555', fontSize: '0.9rem' }}>
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a', lineHeight: 1.2 }}>
                      ${(selectedItemForAddon.price + getTotalAddonPrice()) * itemQuantity}
                    </span>
                    {getTotalAddonPrice() > 0 && <span style={{ fontSize: '0.65rem', color: '#888' }}>incl. ${getTotalAddonPrice()} add-ons</span>}
                  </div>
                </div>
                <button onClick={addItemWithAddons}
                  style={{
                    padding: '12px 24px', background: 'var(--accent, #c8956c)', color: '#fff', border: 'none',
                    borderRadius: '12px', fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
                  }}>
                  Add to Cart
                </button>
              </div>
            </div>
          </>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="payment-modal-overlay" onClick={closePaymentModal}>
            <div className="payment-modal checkout-shell" onClick={(e) => e.stopPropagation()}>
              <div className="payment-modal-header">
                <button type="button" className="payment-modal-back" onClick={closePaymentModal}>
                  <i className="bi bi-arrow-left"></i>
                </button>
                <h3>Checkout</h3>
                <button type="button" className="payment-modal-close" onClick={closePaymentModal}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="payment-modal-body checkout-modal-body">
                <div className="checkout-summary-panel">
                  <div className="checkout-summary-header">
                    <span className="section-subheading">YOUR CART</span>
                    <h4>Review Items Before Payment</h4>
                  </div>

                  <div className="checkout-summary-items">
                    {getFilteredCartItems().map(item => {
                      const itemKey = item.cartItemId || item.id;
                      return (
                        <div key={itemKey} className="checkout-summary-item">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="checkout-summary-image"
                            onError={handleImageError}
                          />
                          <div className="checkout-summary-info">
                            <div className="checkout-summary-name">{item.name}</div>
                            <div className="checkout-summary-meta">
                              <span>{item.isVeg === true ? 'Veg' : 'Non-Veg'}</span>
                              {item.prepTime && <span>{item.prepTime} min</span>}
                            </div>
                            {item.addons && item.addons.length > 0 && (
                              <div className="checkout-summary-addons">
                                {item.addons.map(addon => (
                                  <span key={addon.id} className="cart-addon-tag">
                                    {addon.name} x{addon.quantity}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="checkout-summary-side">
                            <button
                              className="checkout-summary-remove"
                              onClick={() => deleteItemFromCart(itemKey)}
                              title="Remove item"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                            <div className="checkout-summary-price">${getItemTotalWithAddons(item)}</div>
                            <div className="checkout-summary-qty">
                              <button type="button" onClick={() => removeFromCart(itemKey)}>−</button>
                              <span>{item.quantity}</span>
                              <button type="button" onClick={() => openAddonModal(item)}>+</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="checkout-summary-total">
                    <span>Total Amount</span>
                    <strong>${getTotalCartAmount()}</strong>
                  </div>

                  <button type="button" className="checkout-summary-back" onClick={closePaymentModal}>
                    <i className="bi bi-arrow-left"></i>
                    Back to Cart
                  </button>
                </div>

                <div className="checkout-form-panel">
                {/* Customer Info Section */}
                <div className="payment-section" style={{ paddingBottom: '6px' }}>
                  <h4 className="payment-section-title">Customer Details</h4>
                  <div className="customer-info-form">
                    <div className="customer-form-group">
                      <label className="form-label">Name <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Enter your name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    {/* Mobile and Email in one row */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div className="customer-form-group" style={{ flex: 1 }}>
                        <label className="form-label">Mobile <span className="required">*</span></label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="Mobile number"
                          value={customerPhone}
                          maxLength={10}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setCustomerPhone(value);
                          }}
                        />
                      </div>
                      <div className="customer-form-group" style={{ flex: 1 }}>
                        <label className="form-label">Email <span className="optional">(Optional)</span></label>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="Email address"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Type Selection - Smaller buttons */}
                <div className="payment-section" style={{ paddingBottom: '6px' }}>
                  <h4 className="payment-section-title">Order Type</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div
                      onClick={() => { setSelectedOrderType('DELIVERY'); fetchTaxDetails('DELIVERY'); }}
                      style={{
                        flex: 1,
                        padding: '10px 10px',
                        border: selectedOrderType === 'DELIVERY' ? '2px solid #dc3545' : '1px solid #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: selectedOrderType === 'DELIVERY' ? '#fff5f5' : '#fff',
                        color: '#111827',
                        minWidth: 0
                      }}
                    >
                      <i className="bi bi-truck" style={{ fontSize: '15px', color: selectedOrderType === 'DELIVERY' ? '#dc3545' : '#6b7280', flexShrink: 0 }}></i>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Delivery</span>
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 800, marginLeft: 'auto', whiteSpace: 'nowrap' }}>+${apiDeliveryCharge.toFixed(0)}</span>
                    </div>
                    <div
                      onClick={() => { setSelectedOrderType('TAKEAWAY'); fetchTaxDetails('TAKEAWAY'); }}
                      style={{
                        flex: 1,
                        padding: '10px 10px',
                        border: selectedOrderType === 'TAKEAWAY' ? '2px solid #dc3545' : '1px solid #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: selectedOrderType === 'TAKEAWAY' ? '#fff5f5' : '#fff',
                        color: '#111827',
                        minWidth: 0
                      }}
                    >
                      <i className="bi bi-bag" style={{ fontSize: '15px', color: selectedOrderType === 'TAKEAWAY' ? '#dc3545' : '#6b7280', flexShrink: 0 }}></i>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Takeaway</span>
                    </div>
                    <div
                      onClick={() => { setSelectedOrderType('DINE_IN'); fetchTaxDetails('DINE_IN'); }}
                      style={{
                        flex: 1,
                        padding: '10px 10px',
                        border: selectedOrderType === 'DINE_IN' ? '2px solid #dc3545' : '1px solid #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: selectedOrderType === 'DINE_IN' ? '#fff5f5' : '#fff',
                        color: '#111827',
                        minWidth: 0
                      }}
                    >
                      <i className="bi bi-cup-hot" style={{ fontSize: '15px', color: selectedOrderType === 'DINE_IN' ? '#dc3545' : '#6b7280', flexShrink: 0 }}></i>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Dine In</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Address - Compact */}
                {selectedOrderType === 'DELIVERY' && (
                  <div className="payment-section" style={{ paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <h4 className="payment-section-title" style={{ margin: 0 }}>Delivery Address</h4>
                      {addresses.length > 0 && (
                        <button type="button" onClick={openAddAddressModal} style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          background: 'transparent',
                          color: '#dc3545',
                          border: '1px solid #dc3545',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <i className="bi bi-plus" style={{ fontSize: '12px' }}></i>
                          Add New
                        </button>
                      )}
                    </div>
                    {addressLoading ? (
                      <div style={{ padding: '10px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                        <div className="spinner-border spinner-border-sm" role="status"></div>
                        <span style={{ marginLeft: '8px' }}>Loading...</span>
                      </div>
                    ) : addresses.length > 0 ? (
                      <div style={{ position: 'relative' }}>
                        {/* Custom Dropdown Trigger */}
                        <div
                          onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: showAddressDropdown ? '1.5px solid #dc3545' : '1.5px solid #ddd',
                            borderRadius: '8px',
                            background: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.2s'
                          }}
                        >
                          {selectedAddress ? (
                            <>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: '#f8f9fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <i className={`bi ${selectedAddress.addressType === 'Home' ? 'bi-house-door-fill' : selectedAddress.addressType === 'Work' ? 'bi-building-fill' : 'bi-geo-alt-fill'}`} style={{ fontSize: '16px', color: '#dc3545' }}></i>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>{selectedAddress.addressType}</div>
                                <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedAddress.addressLine1}</div>
                              </div>
                              {addressAllowedStatus === 'loading' ? (
                                <div className="spinner-border spinner-border-sm" style={{ color: '#999', width: '18px', height: '18px' }} role="status"></div>
                              ) : addressAllowedStatus === 'SUCCESS' ? (
                                <i className="bi bi-check-circle-fill" style={{ fontSize: '18px', color: '#22c55e', flexShrink: 0 }} title={addressAllowedMessage}></i>
                              ) : addressAllowedStatus === 'FAILURE' ? (
                                <i className="bi bi-x-circle-fill" style={{ fontSize: '18px', color: '#ef4444', flexShrink: 0 }} title={addressAllowedMessage}></i>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: '#f8f9fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <i className="bi bi-geo-alt" style={{ fontSize: '16px', color: '#999' }}></i>
                              </div>
                              <span style={{ fontSize: '13px', color: '#999' }}>Select Delivery Address</span>
                            </>
                          )}
                          <i className={`bi bi-chevron-${showAddressDropdown ? 'up' : 'down'}`} style={{ fontSize: '14px', color: '#666', marginLeft: 'auto' }}></i>
                        </div>

                        {/* Dropdown Options */}
                        {showAddressDropdown && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 100,
                            maxHeight: '200px',
                            overflowY: 'auto'
                          }}>
                            {addresses.map((address, index) => (
                              <div
                                key={address.id}
                                onClick={() => {
                                  setSelectedAddress(address);
                                  setShowAddressDropdown(false);
                                  checkAddressAllowed(address.id);
                                }}
                                style={{
                                  padding: '10px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  cursor: 'pointer',
                                  background: selectedAddress?.id === address.id ? '#fff5f5' : '#fff',
                                  borderBottom: index < addresses.length - 1 ? '1px solid #f0f0f0' : 'none',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                                onMouseLeave={(e) => e.currentTarget.style.background = selectedAddress?.id === address.id ? '#fff5f5' : '#fff'}
                              >
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  background: selectedAddress?.id === address.id ? '#dc354520' : '#f8f9fa',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <i className={`bi ${address.addressType === 'Home' ? 'bi-house-door-fill' : address.addressType === 'Work' ? 'bi-building-fill' : 'bi-geo-alt-fill'}`} style={{ fontSize: '14px', color: selectedAddress?.id === address.id ? '#dc3545' : '#666' }}></i>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>{address.addressType}</div>
                                  <div style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{address.addressLine1}</div>
                                </div>
                                {selectedAddress?.id === address.id && (
                                  <i className="bi bi-check-circle-fill" style={{ color: '#dc3545', fontSize: '16px' }}></i>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {addressAllowedStatus === 'FAILURE' && addressAllowedMessage && (
                          <div style={{ marginTop: '6px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="bi bi-exclamation-triangle-fill" style={{ color: '#ef4444', fontSize: '13px', flexShrink: 0 }}></i>
                            <span style={{ fontSize: '12px', color: '#dc2626', lineHeight: 1.3 }}>{addressAllowedMessage}</span>
                          </div>
                        )}
                        {addressAllowedStatus === 'SUCCESS' && addressAllowedMessage && (
                          <div style={{ marginTop: '6px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="bi bi-check-circle-fill" style={{ color: '#22c55e', fontSize: '13px', flexShrink: 0 }}></i>
                            <span style={{ fontSize: '12px', color: '#16a34a', lineHeight: 1.3 }}>{addressAllowedMessage}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button type="button" className="add-address-dashed-btn" onClick={openAddAddressModal}>
                        <i className="bi bi-plus-circle"></i>
                        Add Address
                      </button>
                    )}
                  </div>
                )}

                {/* Payment Methods - One row */}
                <div className="payment-section" style={{ paddingBottom: '6px' }}>
                  <h4 className="payment-section-title">Payment Method</h4>
                  {paymentLoading ? (
                    <div style={{ padding: '10px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                      <div className="spinner-border spinner-border-sm" role="status"></div>
                      <span style={{ marginLeft: '8px' }}>Loading...</span>
                    </div>
                  ) : paymentGateways.length > 0 ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {paymentGateways.map(gateway => (
                        <div
                          key={gateway.id}
                          onClick={() => setSelectedPaymentMethod(gateway.paymentMethod)}
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            border: selectedPaymentMethod === gateway.paymentMethod ? '2px solid #dc3545' : '1px solid #ddd',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: selectedPaymentMethod === gateway.paymentMethod ? '#fff5f5' : '#fff',
                            color: '#111827'
                          }}
                        >
                          <i className={`bi ${gateway.paymentMethod === 'COD' ? 'bi-cash-stack' : 'bi-credit-card'}`} style={{ fontSize: '18px', color: selectedPaymentMethod === gateway.paymentMethod ? '#dc3545' : '#6b7280' }}></i>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{gateway.title}</span>
                          {selectedPaymentMethod === gateway.paymentMethod && (
                            <i className="bi bi-check-circle-fill" style={{ color: '#dc3545', fontSize: '14px', marginLeft: 'auto' }}></i>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '15px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px' }}>
                      <i className="bi bi-credit-card-2-back" style={{ fontSize: '20px', color: '#999' }}></i>
                      <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>No payment options available</p>
                    </div>
                  )}
                </div>

                {/* Coupon Section - Collapsible */}
                <div className="coupon-section" style={{ paddingBottom: '6px' }}>
                  <h4 className="payment-section-title">Select Coupon</h4>
                  <div
                    className="coupon-header-toggle"
                    onClick={() => setShowCouponList(!showCouponList)}
                  >
                    <div className="coupon-header-left">
                      <div className="coupon-tag-icon">
                        <i className="bi bi-ticket-perforated"></i>
                      </div>
                      <div className="coupon-header-text">
                        <h4>{selectedCoupon ? 'Applied Coupon' : 'Select Coupon'}</h4>
                        {!selectedCoupon && (
                          <p>{couponsLoading ? 'Loading coupons...' : `${(coupons.global?.length || 0) + (coupons.suggested?.length || 0) + (coupons.firstOrder?.length || 0)} available coupons`}</p>
                        )}
                      </div>
                    </div>
                    <div className="coupon-header-info">
                      {selectedCoupon && (
                        <>
                          <div className="coupon-selected-amount">{selectedCoupon.code}</div>
                          <div className="coupon-selected-name">{selectedCoupon.title}</div>
                        </>
                      )}
                    </div>
                    {selectedCoupon && (
                      <button
                        className="coupon-unselect-btn"
                        onClick={handleUnselectCoupon}
                        title="Remove"
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: 0,
                          minWidth: '32px',
                          flexShrink: 0
                        }}
                      >
                        <i className="bi bi-x" style={{ fontSize: '18px', fontWeight: 'bold' }}></i>
                      </button>
                    )}
                    <i className={`bi bi-chevron-down coupon-toggle-icon ${showCouponList ? 'open' : ''}`}></i>
                  </div>

                  <div className={`coupon-list-container ${showCouponList ? 'open' : ''}`}>
                    <div className="coupon-list">
                      {couponsLoading ? (
                        <div style={{ padding: '15px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                          <i className="bi bi-hourglass-split" style={{ marginRight: '8px' }}></i>
                          Loading coupons...
                        </div>
                      ) : (coupons.global?.length === 0 && coupons.suggested?.length === 0 && coupons.firstOrder?.length === 0) ? (
                        <div style={{ padding: '15px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                          <i className="bi bi-ticket" style={{ marginRight: '8px', color: '#ccc' }}></i>
                          No coupons available for your order
                        </div>
                      ) : (
                        <>
                          {/* Global Coupons */}
                          {coupons.global?.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ padding: '8px 12px', background: '#f0f0f0', fontSize: '12px', fontWeight: '600', color: '#666', borderRadius: '4px 4px 0 0' }}>
                                ⭐ Global Offers
                              </div>
                              {coupons.global.map(coupon => (
                                <div
                                  key={coupon.id}
                                  onClick={() => {
                                    handleSelectCoupon(coupon);
                                    setTimeout(() => setShowCouponList(false), 300);
                                  }}
                                  className={`coupon-item ${selectedCoupon?.id === coupon.id ? 'selected' : ''} ${lotteryAnimation === coupon.id ? 'lottery-animation' : ''}`}
                                  style={{ borderRadius: coupon === coupons.global[coupons.global.length - 1] ? '0 0 4px 4px' : '0' }}
                                >
                                  <div className="coupon-radio">
                                    {selectedCoupon?.id === coupon.id && (
                                      <i className="bi bi-check-fill"></i>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
                                    <img
                                      src={coupon.logo || faviconUrl}
                                      alt={coupon.code}
                                      onError={handleCouponImageError}
                                      style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                                    />
                                    <div className="coupon-content" style={{ flex: 1 }}>
                                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#333', marginBottom: '2px' }}>{coupon.title}</div>
                                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#dc3545', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Code: {coupon.code}</div>
                                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', lineHeight: '1.4' }}>{coupon.description}</div>
                                      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#999' }}>
                                        {coupon.quantity && (
                                          <span>Qty: {coupon.quantity}</span>
                                        )}
                                        <span style={{ color: '#dc3545', fontWeight: '600' }}>Till: {coupon.validity}</span>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', minWidth: '90px' }}>
                                      <div style={{ background: '#dc3545', color: 'white', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '700', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                        {coupon.couponName || 'Apply Now'}
                                      </div>
                                      {coupon.quantity && (
                                        <div style={{ fontSize: '10px', color: '#999', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                          {coupon.quantity === 'Unlimited' ? 'Unlimited' : `${coupon.quantity} left`}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Suggested Coupons */}
                          {coupons.suggested?.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ padding: '8px 12px', background: '#fff3cd', fontSize: '12px', fontWeight: '600', color: '#856404', borderRadius: '4px 4px 0 0' }}>
                                💡 Recommended For You
                              </div>
                              {coupons.suggested.map(coupon => (
                                <div
                                  key={coupon.id}
                                  onClick={() => {
                                    handleSelectCoupon(coupon);
                                    setTimeout(() => setShowCouponList(false), 300);
                                  }}
                                  className={`coupon-item ${selectedCoupon?.id === coupon.id ? 'selected' : ''} ${lotteryAnimation === coupon.id ? 'lottery-animation' : ''}`}
                                  style={{ borderRadius: coupon === coupons.suggested[coupons.suggested.length - 1] ? '0 0 4px 4px' : '0' }}
                                >
                                  <div className="coupon-radio">
                                    {selectedCoupon?.id === coupon.id && (
                                      <i className="bi bi-check-fill"></i>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
                                    <img
                                      src={coupon.logo || faviconUrl}
                                      alt={coupon.code}
                                      onError={handleCouponImageError}
                                      style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                                    />
                                    <div className="coupon-content" style={{ flex: 1 }}>
                                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#333', marginBottom: '2px' }}>{coupon.title}</div>
                                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#dc3545', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Code: {coupon.code}</div>
                                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', lineHeight: '1.4' }}>{coupon.description}</div>
                                      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#999' }}>
                                        {coupon.quantity && (
                                          <span>Qty: {coupon.quantity}</span>
                                        )}
                                        <span style={{ color: '#dc3545', fontWeight: '600' }}>Till: {coupon.validity}</span>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', minWidth: '90px' }}>
                                      <div style={{ background: '#dc3545', color: 'white', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '700', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                        {coupon.couponName || 'Apply Now'}
                                      </div>
                                      {coupon.quantity && (
                                        <div style={{ fontSize: '10px', color: '#999', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                          {coupon.quantity === 'Unlimited' ? 'Unlimited' : `${coupon.quantity} left`}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* First Order Coupons */}
                          {coupons.firstOrder?.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ padding: '8px 12px', background: '#d4edda', fontSize: '12px', fontWeight: '600', color: '#155724', borderRadius: '4px 4px 0 0' }}>
                                🎁 First Order Special
                              </div>
                              {coupons.firstOrder.map(coupon => (
                                <div
                                  key={coupon.id}
                                  onClick={() => {
                                    handleSelectCoupon(coupon);
                                    setTimeout(() => setShowCouponList(false), 300);
                                  }}
                                  className={`coupon-item ${selectedCoupon?.id === coupon.id ? 'selected' : ''} ${lotteryAnimation === coupon.id ? 'lottery-animation' : ''}`}
                                  style={{ borderRadius: coupon === coupons.firstOrder[coupons.firstOrder.length - 1] ? '0 0 4px 4px' : '0' }}
                                >
                                  <div className="coupon-radio">
                                    {selectedCoupon?.id === coupon.id && (
                                      <i className="bi bi-check-fill"></i>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
                                    <img
                                      src={coupon.logo || faviconUrl}
                                      alt={coupon.code}
                                      onError={handleCouponImageError}
                                      style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                                    />
                                    <div className="coupon-content" style={{ flex: 1 }}>
                                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#333', marginBottom: '2px' }}>{coupon.title}</div>
                                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#dc3545', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>Code: {coupon.code}</div>
                                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', lineHeight: '1.4' }}>{coupon.description}</div>
                                      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#999' }}>
                                        {coupon.quantity && (
                                          <span>Qty: {coupon.quantity}</span>
                                        )}
                                        <span style={{ color: '#dc3545', fontWeight: '600' }}>Till: {coupon.validity}</span>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', minWidth: '90px' }}>
                                      <div style={{ background: '#dc3545', color: 'white', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '700', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                        {coupon.couponName || 'Apply Now'}
                                      </div>
                                      {coupon.quantity && (
                                        <div style={{ fontSize: '10px', color: '#999', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                          {coupon.quantity === 'Unlimited' ? 'Unlimited' : `${coupon.quantity} left`}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Confetti Animation */}
                  {showCongrats && (
                    <div className="confetti-container">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="confetti"></div>
                      ))}
                    </div>
                  )}

                  {/* Congrats Message */}
                  {showCongrats && selectedCoupon && (
                    <div className="congrats-message">
                      <div className="congrats-content">
                        <div className="congrats-icon">🎉</div>
                        <p className="congrats-text">Great Choice!</p>
                        <p className="congrats-subtext">Coupon Applied Successfully</p>
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '500' }}>Code</div>
                          <div style={{ fontSize: '18px', fontWeight: '800', color: '#dc3545', letterSpacing: '1px', marginBottom: '8px' }}>{selectedCoupon.code}</div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#333' }}>{selectedCoupon.title}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Summary - Collapsible */}
                <div className="payment-section" style={{ paddingBottom: '4px' }}>
                  <details open={showOrderSummaryDetails} onToggle={(e) => setShowOrderSummaryDetails(e.target.open)}>
                    <summary style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      listStyle: 'none'
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                        <i className="bi bi-receipt" style={{ marginRight: '8px' }}></i>
                        Order Summary
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#dc3545' }}>
                        ${getGrandTotal().toFixed(2)}
                        <i className={`bi bi-chevron-${showOrderSummaryDetails ? 'up' : 'down'}`} style={{ marginLeft: '8px', fontSize: '12px' }}></i>
                      </span>
                    </summary>
                    <div style={{ padding: '12px', background: '#fafafa', borderRadius: '0 0 8px 8px', marginTop: '-4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#666' }}>
                        <span>Items ({getTotalCartCount()})</span>
                        <span>+${couponPaybleAmount !== null ? couponPaybleAmount.toFixed(2) : getTotalCartAmount().toFixed(2)}</span>
                      </div>
                      {couponPaybleAmount !== null && getAddonsTotal() > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#666' }}>
                          <span>Addons</span>
                          <span>+${getAddonsTotal().toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrderType === 'DELIVERY' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#666' }}>
                          <span>Delivery Charge</span>
                          <span>+${apiDeliveryCharge.toFixed(2)}</span>
                        </div>
                      )}
                      {taxDetails && taxDetails.gstPercentage > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#666' }}>
                          <span>GST ({taxDetails.gstPercentage}%)</span>
                          <span>+${getTaxAmounts().gstAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {taxDetails && taxDetails.serviceChargePercentage > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#666' }}>
                          <span>Service Charge ({taxDetails.serviceChargePercentage}%)</span>
                          <span>+${getTaxAmounts().serviceChargeAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {appliedDiscount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#dc3545' }}>
                          <span>Discount {isPercentDiscount ? `(${appliedDiscount}%)` : ''}</span>
                          <span>-${isPercentDiscount ? (((couponPaybleAmount !== null ? couponPaybleAmount + getAddonsTotal() : getTotalCartAmount()) * appliedDiscount) / 100).toFixed(2) : appliedDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: '14px', fontWeight: 700, borderTop: '1px dashed #ddd', marginTop: '6px' }}>
                        <span>Total</span>
                        <span style={{ color: '#dc3545' }}>${getGrandTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </details>
                </div>
              </div>

                </div>

              <div className="payment-modal-footer">
                <button
                  type="button"
                  className="payment-place-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={!selectedPaymentMethod || processingOrder || (selectedOrderType === 'DELIVERY' && addressAllowedStatus !== 'SUCCESS')}
                >
                  {processingOrder ? (
                    <>
                      <div className="spinner-border spinner-border-sm" role="status"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle"></i>
                      Place Order - ${getGrandTotal().toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Branch Modal - DISABLED */}
        {false && showNoBranchModal && <div/>}

        {/* Floating Cart Button — hidden when drawer is open */}
        {getTotalCartCount() > 0 && !showCart && (
          <div className="cart-float-btn" onClick={() => setShowCart(true)}>
            <div className="cart-float-info">
              <i className="bi bi-cart3"></i>
              <span key={getTotalCartCount()} className="cart-count-num">
                {getTotalCartCount()} item{getTotalCartCount() > 1 ? 's' : ''}
              </span>
              <div className="cart-float-sep"></div>
              <span className="cart-float-total">${getTotalCartAmount()}</span>
            </div>
            <div className="cart-float-cta">
              View Cart <i className="bi bi-chevron-right"></i>
            </div>
          </div>
        )}

        {/* Cart Overlay */}
        <div
          className={`cart-overlay ${showCart ? 'active' : ''}`}
          onClick={() => setShowCart(false)}
        ></div>

        {/* Cart Slide Panel */}
        <div className={`cart-panel ${showCart ? 'active' : ''}`}>
          <div className="cart-panel-header">
            <h3 className="cart-panel-title">
              <i className="bi bi-cart3"></i>
              Your Cart
            </h3>
            <div className="cart-header-actions">
              {getFilteredCartItems().length > 0 && (
                <button type="button" className="clear-cart-btn" onClick={clearCart}>
                  <i className="bi bi-trash3"></i>
                  Clear All
                </button>
              )}
              <button type="button" className="cart-panel-close" onClick={() => setShowCart(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          <div className="cart-panel-body">
            {getFilteredCartItems().length > 0 ? (
              <div className="cart-items-grid">
                {getFilteredCartItems().map(item => {
                  const itemKey = item.cartItemId || item.id;
                  return (
                    <div key={itemKey} className="cart-item">
                      <button
                        className="cart-item-remove"
                        onClick={() => deleteItemFromCart(itemKey)}
                        title="Remove item"
                      >
                        <i className="bi bi-x"></i>
                      </button>

                      {/* Top section - Image and Info */}
                      <div className="cart-item-top">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="cart-item-image"
                          onError={handleImageError}
                        />
                        <div className="cart-item-details">
                          <div className="cart-item-name">{item.name}</div>
                          <div className="cart-item-info">
                            {item.isVeg !== undefined && (
                              <span className={`cart-item-veg ${item.isVeg === true ? 'veg' : 'non-veg'}`}>
                                <i className={`bi ${item.isVeg === true ? 'bi-circle-fill' : 'bi-triangle-fill'}`}></i>
                                {item.isVeg === true ? 'Veg' : 'Non-Veg'}
                              </span>
                            )}
                            {item.prepTime && (
                              <span className="cart-item-time">
                                <i className="bi bi-clock"></i> {item.prepTime} min
                              </span>
                            )}
                          </div>
                          <div className="cart-item-price">${getItemTotalWithAddons(item)}</div>
                        </div>
                      </div>

                      {/* Addons section */}
                      {item.addons && item.addons.length > 0 && (
                        <div className="cart-item-addons">
                          {item.addons.map(addon => (
                            <span key={addon.id} className="cart-addon-tag">
                              {addon.name} x{addon.quantity}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Quantity controls */}
                      <div className="cart-item-actions">
                        <div className="cart-item-qty-controls">
                          <button type="button" className="cart-qty-btn" onClick={() => removeFromCart(itemKey)}>
                            −
                          </button>
                          <span className="cart-qty">{item.quantity}</span>
                          <button type="button" className="cart-qty-btn" onClick={() => {
                            // Open addon modal for this item so user can select addons
                            openAddonModal(item);
                          }}>
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-cart">
                <i className="bi bi-cart-x"></i>
                <p>Your cart is empty</p>
              </div>
            )}
          </div>

          {getFilteredCartItems().length > 0 && (
            <div className="cart-panel-footer">
              <div className="cart-summary">
                <span className="cart-summary-label">Total Amount</span>
                <span className="cart-summary-value">${getTotalCartAmount()}</span>
              </div>
              <button type="button" className="checkout-btn" onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openPaymentModal();
              }}>
                <i className="bi bi-bag-check"></i>
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddAddressModal && (
        <div className="add-address-modal-overlay" onClick={closeAddAddressModal}>
          <div className="add-address-modal-content" onClick={e => e.stopPropagation()}>
            <div className="add-address-modal-header">
              <span className="add-address-modal-title">Add New Address</span>
              <button className="add-address-modal-close" onClick={closeAddAddressModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="add-address-modal-body">
              {/* Map & Location Search */}
              <div className="add-address-map-section">
                <div className="add-address-map-container" ref={addressMapRef}>
                  {newAddressData.latitude && newAddressData.longitude && newAddressData.latitude !== 0 ? (
                    <iframe
                      title="Address Map"
                      width="100%"
                      height="100%"
                      style={{ border: 0, borderRadius: '12px' }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${newAddressData.latitude},${newAddressData.longitude}&z=16&output=embed`}
                    ></iframe>
                  ) : (
                    <div className="add-address-map-placeholder">
                      {addressLocationStatus === 'loading' ? (
                        <>
                          <div className="add-address-location-spinner"></div>
                          <span>Getting your location...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-geo-alt" style={{ fontSize: '32px', color: '#ccc' }}></i>
                          <span style={{ color: '#999', fontSize: '13px' }}>Search a location below</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="add-address-map-search-wrapper">
                  <div className="add-address-map-search-input">
                    <i className="bi bi-geo-alt-fill"></i>
                    <input
                      type="text"
                      placeholder="Search location..."
                      value={addressMapSearch}
                      onChange={(e) => setAddressMapSearch(e.target.value)}
                      onFocus={() => {
                        if (addressMapSuggestions.length > 0) setShowAddressMapSuggestions(true);
                      }}
                    />
                    {addressMapSearchLoading && (
                      <div className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px', borderWidth: '2px', color: '#999' }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    )}
                    {addressMapSearch && !addressMapSearchLoading && (
                      <button style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: 0 }} onClick={() => { setAddressMapSearch(''); setAddressMapSuggestions([]); setShowAddressMapSuggestions(false); }}>
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                  {showAddressMapSuggestions && (
                    <div className="add-address-map-suggestions">
                      {addressMapSuggestions.map((item, index) => (
                        <div
                          key={index}
                          className="add-address-map-suggestion-item"
                          onClick={() => selectAddressMapLocation(item.place_id, item.entity_title)}
                        >
                          <i className="bi bi-geo-alt" style={{ color: primaryColor, marginTop: '2px' }}></i>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>{item.entity_title}</div>
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '1px' }}>{item.entity_subtitle}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {addressLocationStatus === 'granted' && newAddressData.latitude !== 0 && (
                  <div className="add-address-location-confirmed">
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Location selected</span>
                  </div>
                )}
              </div>

              <div className="add-address-form-group">
                <label className="add-address-form-label">Address Type</label>
                <div className="add-address-type-selector">
                  {['Home', 'Work', 'Office', 'Other'].map(type => (
                    <div
                      key={type}
                      className={`add-address-type-option ${newAddressData.addressType === type ? 'selected' : ''}`}
                      onClick={() => setNewAddressData({ ...newAddressData, addressType: type })}
                    >
                      <i className={`bi ${type === 'Home' ? 'bi-house-door' : type === 'Work' ? 'bi-briefcase' : type === 'Office' ? 'bi-building' : 'bi-geo-alt'}`}></i>
                      <span>{type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="add-address-form-group">
                <label className="add-address-form-label">Address Line 1 *</label>
                <textarea
                  className="add-address-form-input add-address-form-textarea"
                  placeholder="House/Flat No., Building, Street"
                  value={newAddressData.addressLine1}
                  onChange={e => setNewAddressData({ ...newAddressData, addressLine1: e.target.value })}
                ></textarea>
              </div>

              <div className="add-address-form-group">
                <label className="add-address-form-label">Address Line 2</label>
                <input
                  type="text"
                  className="add-address-form-input"
                  placeholder="Area, Colony (optional)"
                  value={newAddressData.addressLine2}
                  onChange={e => setNewAddressData({ ...newAddressData, addressLine2: e.target.value })}
                />
              </div>

              <div className="add-address-form-group">
                <label className="add-address-form-label">Landmark</label>
                <input
                  type="text"
                  className="add-address-form-input"
                  placeholder="Nearby landmark (optional)"
                  value={newAddressData.landmark}
                  onChange={e => setNewAddressData({ ...newAddressData, landmark: e.target.value })}
                />
              </div>

              <div className="add-address-form-group">
                <label className="add-address-form-label">Delivery Instructions</label>
                <input
                  type="text"
                  className="add-address-form-input"
                  placeholder="e.g., Call before delivery (optional)"
                  value={newAddressData.deliveryInstructions}
                  onChange={e => setNewAddressData({ ...newAddressData, deliveryInstructions: e.target.value })}
                />
              </div>
            </div>
            <div className="add-address-modal-footer">
              <button className="add-address-btn-cancel" onClick={closeAddAddressModal}>Cancel</button>
              <button
                className="add-address-btn-save"
                onClick={handleSaveAddress}
                disabled={savingAddress}
              >
                {savingAddress ? (
                  <>
                    <span className="add-address-btn-spinner"></span>
                    Saving...
                  </>
                ) : (
                  'Save Address'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal - DISABLED */}
      {false && showLocationModal && (
        <div
          className="location-modal-overlay"
          onClick={() => setShowLocationModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 9999,
          }}
        >
          <div
            className="location-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '80vh',
              background: 'white',
              borderRadius: '20px 20px 0 0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <style>{`
              @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
              .location-modal-content {
                animation: slideUp 0.3s ease-out;
              }
            `}</style>

            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fff',
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: '#1e293b',
              }}>Select Location</h2>
              <button
                onClick={() => setShowLocationModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
            }}>
              {/* Search Field */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                border: `1.5px solid #e2e8f0`,
                borderRadius: '12px',
                background: '#f8fafc',
                marginBottom: '12px',
                transition: 'all 0.2s ease',
              }}>
                <i className="bi bi-search" style={{ color: primaryColor, fontSize: '1.1rem' }}></i>
                <input
                  type="text"
                  placeholder="Search for area, street, landmark..."
                  value={modalLocationSearch}
                  onChange={(e) => setModalLocationSearch(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.9rem',
                    color: '#1e293b',
                  }}
                />
                {modalLocationSearching && (
                  <div className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px', borderWidth: '2px', color: '#999' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                )}
                {modalLocationSearch && !modalLocationSearching && (
                  <button
                    onClick={() => { setModalLocationSearch(''); setModalLocationSuggestions([]); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>

              {/* Suggestions List */}
              {modalLocationSuggestions.length > 0 && (
                <div style={{
                  marginBottom: '16px',
                  maxHeight: '250px',
                  overflowY: 'auto',
                }}>
                  {modalLocationSuggestions.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleModalSelectLocation(item.place_id, item.entity_title)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        cursor: 'pointer',
                        borderRadius: '10px',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: `${primaryColor}12`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: primaryColor,
                      }}>
                        <i className="bi bi-geo-alt"></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          color: '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>{item.entity_title}</div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '2px',
                        }}>{item.entity_subtitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* OR Divider */}
              <div style={{
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 500,
                margin: '16px 0',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: '40%',
                  height: '1px',
                  background: '#e2e8f0',
                }}></div>
                OR
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  right: 0,
                  width: '40%',
                  height: '1px',
                  background: '#e2e8f0',
                }}></div>
              </div>

              {/* Use Current Location */}
              <button
                onClick={useCurrentLocation}
                disabled={locating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '14px',
                  border: `1.5px dashed ${primaryColor}55`,
                  borderRadius: '12px',
                  background: `${primaryColor}08`,
                  color: primaryColor,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: locating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: locating ? 0.6 : 1,
                }}
                onMouseEnter={(e) => !locating && (e.target.style.background = `${primaryColor}15`)}
                onMouseLeave={(e) => !locating && (e.target.style.background = `${primaryColor}08`)}
              >
                <i className="bi bi-crosshair" style={{ fontSize: '1.1rem' }}></i>
                {locating ? 'Detecting location...' : 'Use my current location'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Congratulation Modal */}
      {showOrderSuccess && (
        <div className="order-success-overlay">
          {/* Confetti pieces */}
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="order-success-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * -10}%`,
                background: ['#dc3545', '#28a745', '#ffc107', '#007bff', '#ff6b6b', '#20c997', '#6f42c1', '#fd7e14'][i % 8],
                width: `${Math.random() * 8 + 6}px`,
                height: `${Math.random() * 8 + 6}px`,
                borderRadius: i % 3 === 0 ? '50%' : '2px',
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${Math.random() * 1.5 + 2}s`,
              }}
            />
          ))}
          <div className="order-success-modal" onClick={e => e.stopPropagation()}>
            <div className="order-success-checkmark">
              <i className="bi bi-check-lg"></i>
            </div>
            <div className="order-success-title">Congratulations!</div>
            <div className="order-success-subtitle">
              Your order has been placed successfully.<br />
              We're preparing your delicious meal!
            </div>
            <button className="order-success-btn" onClick={() => setShowOrderSuccess(false)}>
              Continue ordering
            </button>
          </div>
        </div>
      )}

      {/* PayPal Payment Modal */}
      {showPayPalModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '24px',
            width: '360px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h5 style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>Pay with PayPal</h5>
              <button
                onClick={handlePayPalCancel}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}
              >✕</button>
            </div>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              Amount: <strong style={{ color: '#1f2937' }}>${getGrandTotal().toFixed(2)}</strong>
            </p>
            {payPalOrderId ? (
              <PayPalButton
                orderId={payPalOrderId}
                amount={getGrandTotal()}
                apiPrefix="customer"
                onSuccess={handlePayPalSuccess}
                onError={handlePayPalError}
                onCancel={handlePayPalCancel}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Loading...</div>
            )}
          </div>
        </div>
      )}

      {showStripeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '24px',
            width: '380px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h5 style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>
                <i className="bi bi-credit-card me-2"></i>Pay with Card
              </h5>
              <button
                onClick={handleStripeCancel}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}
              >✕</button>
            </div>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              Amount: <strong style={{ color: '#1f2937' }}>${getGrandTotal().toFixed(2)}</strong>
            </p>
            {stripeOrderId ? (
              <StripeButton
                orderId={stripeOrderId}
                amount={getGrandTotal()}
                apiPrefix="customer"
                onSuccess={handleStripeSuccess}
                onError={handleStripeError}
                onCancel={handleStripeCancel}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Loading...</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerLanding;
