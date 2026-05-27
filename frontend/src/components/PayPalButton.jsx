import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { ApiPost } from '../ApiServices/ApiServices';
import { toast } from 'react-toastify';

const PayPalButton = ({ orderId, amount, onSuccess, onError, onCancel, apiPrefix = 'cashier' }) => {
  const handleCreateOrder = async (data, actions) => {
    try {
      const response = await ApiPost(`/api/${apiPrefix}/paypal/create-order`, {
        orderId: orderId
      });

      if (response.success) {
        return response.success.data.data.paypalOrderId;
      } else {
        throw new Error(response.fail || 'Failed to create PayPal order');
      }
    } catch (error) {
      console.error('Create order error:', error);
      toast.error('Failed to create PayPal order: ' + error.message);
      throw error;
    }
  };

  const handleApprove = async (data, actions) => {
    try {
      const response = await ApiPost(`/api/${apiPrefix}/paypal/capture-order/${data.orderID}`, {
        orderId: orderId
      });

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.success.data.data);
        }
        toast.success('Payment completed successfully!');
        return true;
      } else {
        throw new Error(response.fail || 'Payment capture failed');
      }
    } catch (error) {
      console.error('Capture order error:', error);
      toast.error('Payment capture failed: ' + error.message);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  };

  const handleError = (err) => {
    const msg = err?.message || String(err) || '';
    // PayPal iframe cross-origin noise on modal close — ignore silently
    if (!msg || msg === 'Script error.' || msg.includes('Script error')) return;
    console.error('PayPal error:', err);
    toast.error('PayPal payment error: ' + msg);
    if (onError) onError(err);
  };

  const handleCancel = (data) => {
    console.log('Payment cancelled:', data);
    toast.info('Payment cancelled');
    if (onCancel) {
      onCancel(data);
    }
  };

  return (
    <PayPalScriptProvider options={{ 'client-id': process.env.REACT_APP_PAYPAL_CLIENT_ID, currency: 'USD' }}>
      <PayPalButtons
        style={{ layout: 'vertical' }}
        createOrder={handleCreateOrder}
        onApprove={handleApprove}
        onError={handleError}
        onCancel={handleCancel}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalButton;
