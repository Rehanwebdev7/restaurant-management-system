import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ApiGet, ApiPut } from '../ApiServices/ApiServices';
import { toast } from 'react-toastify';

const OrderAlertContext = createContext();

export const useOrderAlert = () => {
  const context = useContext(OrderAlertContext);
  if (!context) {
    return {
      pendingOrders: [],
      isRinging: false,
      acceptOrder: () => {},
      rejectOrder: () => {},
      actionLoading: null
    };
  }
  return context;
};

// Roles that should receive order alerts
const ALERT_ROLES = ['kitchen'];

// Role-specific API configuration
const getRoleConfig = (role) => {
  if (role === 'supadmin' || role === 'admin') return null;

  switch (role) {
    case 'restaurant':
      return {
        fetchEndpoint: '/api/restaurant/orders/filter',
        updateEndpoint: '/api/restaurant/orders/update',
        acceptStatus: 'CONFIRMED',
        rejectStatus: 'CANCELLED',
        fetchParams: { status: 'PENDING', pageSize: 50, pageNumber: 0 }
      };
    case 'kitchen':
      return {
        fetchEndpoint: '/api/kitchen/orders/filter',
        updateEndpoint: '/api/kitchen/orders/update',
        acceptStatus: 'ACCEPTED_ORDER',
        rejectStatus: 'CANCELLED',
        fetchParams: { status: 'PENDING', pageSize: 50, pageNumber: 0 }
      };
    case 'cashier':
      return {
        fetchEndpoint: '/api/cashier/orders/filter',
        updateEndpoint: '/api/cashier/orders/update',
        acceptStatus: 'CONFIRMED',
        rejectStatus: 'CANCELLED',
        fetchParams: { status: 'PENDING', pageSize: 50, pageNumber: 0 }
      };
    default:
      return null;
  }
};

export const OrderAlertProvider = ({ children }) => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [isRinging, setIsRinging] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('UserRole') || '');
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const audioContextRef = useRef(null);
  const soundIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const audioElementRef = useRef(null);

  // Detect user role
  useEffect(() => {
    const role = localStorage.getItem('UserRole') || '';
    setUserRole(role);

    const handleStorage = () => {
      const newRole = localStorage.getItem('UserRole') || '';
      setUserRole(newRole);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ─── Unlock audio on first user interaction (browser autoplay policy) ───
  useEffect(() => {
    const unlockAudio = async () => {
      // Create or resume AudioContext
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new AudioCtx();
          }
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
        }
      } catch (e) { /* ignore */ }

      console.log('[OrderAlert] Audio unlocked by user interaction');
      setAudioUnlocked(true);
      // Remove listeners after first interaction
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // ─── Web Audio API: Generate bell ring sound ───
  const playBellSound = useCallback(async () => {
    return; // Sound disabled
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;

      // Must await resume — browsers block sound until context is running
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      if (ctx.state !== 'running') return;

      const t = ctx.currentTime;

      // Master gain for volume control
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.0, t);
      masterGain.connect(ctx.destination);

      // Master compressor for loudness
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-10, t);
      compressor.knee.setValueAtTime(0, t);
      compressor.ratio.setValueAtTime(20, t);
      compressor.attack.setValueAtTime(0, t);
      compressor.release.setValueAtTime(0.01, t);
      compressor.connect(masterGain);

      const createBellNote = (freq, startTime, duration, vol) => {
        // Main tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(compressor);
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);

        // Harmonic for richer tone
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(compressor);
        osc2.type = 'triangle';
        osc2.frequency.value = freq * 2;
        gain2.gain.setValueAtTime(vol * 0.4, startTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.8);
        osc2.start(startTime);
        osc2.stop(startTime + duration * 0.8);
      };

      // Urgent three-note alarm pattern — played twice for attention
      createBellNote(587.33, t, 0.3, 1.0);          // D5
      createBellNote(880, t + 0.15, 0.3, 1.0);      // A5
      createBellNote(1174.66, t + 0.3, 0.5, 1.0);   // D6
      // Repeat after short gap
      createBellNote(587.33, t + 0.7, 0.3, 0.8);    // D5
      createBellNote(880, t + 0.85, 0.3, 0.8);      // A5
      createBellNote(1174.66, t + 1.0, 0.5, 0.8);   // D6
    } catch (err) {
      console.warn('Could not play bell sound:', err);
    }
  }, []);

  // Start ringing
  const startRinging = useCallback(() => {
    // Clear any existing interval first to allow restart
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    setIsRinging(true);
    playBellSound();
    soundIntervalRef.current = setInterval(() => {
      playBellSound();
    }, 3000); // Ring every 3 seconds
  }, [playBellSound]);

  // Stop ringing
  const stopRinging = useCallback(() => {
    setIsRinging(false);
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
  }, []);

  // ─── Poll for pending orders ───
  const fetchPendingOrders = useCallback(async () => {
    const config = getRoleConfig(userRole);
    if (!config) return;

    try {
      // Don't restrict by date — fetch ALL pending orders regardless of when they were created
      const params = { ...config.fetchParams };

      const response = await ApiGet(config.fetchEndpoint, params);
      if (response.success) {
        const data = response.success.data?.data;
        const records = data?.records || [];
        setPendingOrders(records);
      }
    } catch (error) {
      console.warn('Order alert poll failed:', error);
    }
  }, [userRole]);

  // ─── Manage ringing based on pending orders + audio unlock ───
  useEffect(() => {
    if (pendingOrders.length > 0 && audioUnlocked) {
      startRinging();
    } else if (pendingOrders.length === 0) {
      stopRinging();
    }
  }, [pendingOrders.length, audioUnlocked, startRinging, stopRinging]);

  // ─── Start/Stop polling based on role ───
  useEffect(() => {
    if (!ALERT_ROLES.includes(userRole) || userRole === 'supadmin') {
      stopRinging();
      setPendingOrders([]);
      return;
    }

    // Initial fetch
    fetchPendingOrders();

    // Poll every 10 seconds
    pollIntervalRef.current = setInterval(fetchPendingOrders, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [userRole, fetchPendingOrders, stopRinging]);

  // ─── Cleanup on unmount ───
  useEffect(() => {
    return () => {
      stopRinging();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stopRinging]);

  // ─── Accept order ───
  const acceptOrder = useCallback(async (orderId) => {
    const config = getRoleConfig(userRole);
    if (!config) return;

    setActionLoading(orderId);
    try {
      const payload = { id: orderId, status: config.acceptStatus };
      const response = await ApiPut(config.updateEndpoint, payload);

      if (response.success) {
        toast.success('Order accepted successfully');
        setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        toast.error(response.fail || 'Failed to accept order');
      }
    } catch (error) {
      toast.error('Error accepting order');
    } finally {
      setActionLoading(null);
    }
  }, [userRole]);

  // ─── Reject order ───
  const rejectOrder = useCallback(async (orderId) => {
    const config = getRoleConfig(userRole);
    if (!config) return;

    setActionLoading(orderId);
    try {
      const payload = { id: orderId, status: config.rejectStatus };
      const response = await ApiPut(config.updateEndpoint, payload);

      if (response.success) {
        toast.info('Order rejected');
        setPendingOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        toast.error(response.fail || 'Failed to reject order');
      }
    } catch (error) {
      toast.error('Error rejecting order');
    } finally {
      setActionLoading(null);
    }
  }, [userRole]);

  return (
    <OrderAlertContext.Provider value={{
      pendingOrders,
      isRinging,
      acceptOrder,
      rejectOrder,
      actionLoading
    }}>
      {children}
    </OrderAlertContext.Provider>
  );
};

export default OrderAlertContext;
