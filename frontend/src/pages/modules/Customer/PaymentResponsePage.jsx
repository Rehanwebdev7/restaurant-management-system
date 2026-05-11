import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiPost } from '../../../ApiServices/CustomerApiServices';
import { toast } from 'react-toastify';

const PaymentResponsePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    console.log('🎯 PaymentResponsePage loaded');
    console.log('🔗 Current URL:', window.location.href);
    console.log('📋 URL Params:', Object.fromEntries(searchParams));
    handlePaymentResponse();
  }, []);

  const handlePaymentResponse = async () => {
    try {
      console.log('\n=== 🚀 PAYMENT RESPONSE HANDLER STARTED ===');

      // Check if we have status param (redirected from backend after CCAvenue callback)
      const status = searchParams.get('status');
      const orderNumber = searchParams.get('orderNumber');
      const orderId = searchParams.get('orderId');
      const trackingId = searchParams.get('trackingId');
      const bankRefNo = searchParams.get('bankRefNo');
      const amount = searchParams.get('amount');
      const paymentMode = searchParams.get('paymentMode');
      const message = searchParams.get('message');

      console.log('📦 Extracted Parameters:');
      console.log('  - status:', status);
      console.log('  - orderNumber:', orderNumber);
      console.log('  - orderId:', orderId);
      console.log('  - trackingId:', trackingId);
      console.log('  - bankRefNo:', bankRefNo);
      console.log('  - amount:', amount);
      console.log('  - paymentMode:', paymentMode);
      console.log('  - message:', message);

      // If we have status param, it means backend already processed the payment
      if (status) {
        console.log('✅ Payment already processed by backend, showing result');
        setProcessing(false);

        const details = {
          order_number: orderNumber,
          order_id: orderId,
          tracking_id: trackingId,
          bank_ref_no: bankRefNo,
          amount: amount,
          payment_mode: paymentMode,
          message: message
        };

        if (status === 'SUCCESS') {
          console.log('✅ Payment SUCCESS');
          setPaymentStatus('success');
          setPaymentDetails(details);
          toast.success('Payment successful!');
        } else if (status === 'ABORTED') {
          console.log('⚠️ Payment ABORTED');
          setPaymentStatus('aborted');
          setPaymentDetails(details);
          toast.warning('Payment was cancelled');
        } else {
          console.log('❌ Payment FAILED');
          setPaymentStatus('failed');
          setPaymentDetails({ ...details, status_message: message });
          toast.error(message || 'Payment failed');
        }
        return;
      }

      // Legacy handling: If we have encResp, call backend API
      const encResp = searchParams.get('encResp');
      const orderNo = searchParams.get('orderNo');

      console.log('📦 Legacy Parameters:');
      console.log('  - encResp:', encResp ? `${encResp.substring(0, 50)}...` : 'NULL');
      console.log('  - orderNo:', orderNo);

      if (!encResp) {
        console.error('❌ No status or encResp parameter found!');
        toast.error('Invalid payment response');
        navigate('/menu');
        return;
      }

      console.log('✅ encResp parameter found, calling backend API...');

      const apiUrl = `/api/customer/ccavenue/payment-response?encResp=${encodeURIComponent(encResp)}&orderNo=${orderNo}`;
      console.log('🔗 API URL:', apiUrl);

      // Call backend to process the encrypted response
      const response = await ApiPost(apiUrl);

      console.log('📥 Backend Response Received:');
      console.log('  - Full Response:', JSON.stringify(response, null, 2));

      setProcessing(false);

      if (response.success) {
        console.log('✅ Payment SUCCESS');
        setPaymentStatus('success');
        setPaymentDetails(response.data);
        toast.success('Payment successful!');
      } else if (response.status === 'ABORTED') {
        console.log('⚠️ Payment ABORTED');
        setPaymentStatus('aborted');
        setPaymentDetails(response.data);
        toast.warning('Payment was cancelled');
      } else {
        console.log('❌ Payment FAILED');
        setPaymentStatus('failed');
        setPaymentDetails(response.data);
        toast.error(response.fail || 'Payment failed');
      }

      console.log('=== ✨ PAYMENT RESPONSE HANDLER COMPLETED ===\n');
    } catch (error) {
      console.error('\n=== ❌ ERROR IN PAYMENT RESPONSE HANDLER ===');
      console.error('Error:', error.message);

      setProcessing(false);
      setPaymentStatus('error');
      toast.error('Failed to process payment response');
    }
  };

  const handleContinueShopping = () => {
    console.log('🛒 Continue Shopping button clicked');
    console.log('🔀 Navigating to: /');
    navigate('/menu');
  };

  const handleViewOrders = () => {
    console.log('📋 View Orders button clicked');
    console.log('🔀 Navigating to: /orders');
    navigate('/orders');
  };

  if (processing) {
    console.log('⏳ Rendering: PROCESSING state');
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #dc3545',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h2>Processing Payment...</h2>
        <p>Please wait while we verify your payment</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  console.log('🎨 Rendering payment status UI');
  console.log('  - Current paymentStatus:', paymentStatus);
  console.log('  - Payment Details:', paymentDetails);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '40px',
        textAlign: 'center'
      }}>
        {/* Success */}
        {paymentStatus === 'success' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#28a745',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <i className="bi bi-check-lg" style={{ fontSize: '48px', color: 'white' }}></i>
            </div>
            <h2 style={{ color: '#28a745', marginBottom: '15px' }}>Payment Successful!</h2>
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '25px' }}>
              Thank you for your order. Your payment has been processed successfully.
            </p>
            {paymentDetails && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '25px',
                textAlign: 'left'
              }}>
                {paymentDetails.order_number && (
                  <p><strong>Order Number:</strong> {paymentDetails.order_number}</p>
                )}
                {paymentDetails.amount && (
                  <p><strong>Amount:</strong> ${paymentDetails.amount}</p>
                )}
                {paymentDetails.tracking_id && (
                  <p><strong>Transaction ID:</strong> {paymentDetails.tracking_id}</p>
                )}
                {paymentDetails.bank_ref_no && (
                  <p><strong>Bank Reference:</strong> {paymentDetails.bank_ref_no}</p>
                )}
                {paymentDetails.payment_mode && (
                  <p><strong>Payment Mode:</strong> {paymentDetails.payment_mode}</p>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={handleViewOrders}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                View Orders
              </button>
              <button
                onClick={handleContinueShopping}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}

        {/* Failed */}
        {paymentStatus === 'failed' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#dc3545',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <i className="bi bi-x-lg" style={{ fontSize: '48px', color: 'white' }}></i>
            </div>
            <h2 style={{ color: '#dc3545', marginBottom: '15px' }}>Payment Failed</h2>
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '25px' }}>
              Unfortunately, your payment could not be processed. Please try again.
            </p>
            {paymentDetails && paymentDetails.status_message && (
              <div style={{
                backgroundColor: '#f8d7da',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '25px',
                color: '#721c24'
              }}>
                <p><strong>Reason:</strong> {paymentDetails.status_message}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={handleContinueShopping}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          </>
        )}

        {/* Aborted */}
        {paymentStatus === 'aborted' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#ffc107',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <i className="bi bi-exclamation-lg" style={{ fontSize: '48px', color: 'white' }}></i>
            </div>
            <h2 style={{ color: '#ffc107', marginBottom: '15px' }}>Payment Cancelled</h2>
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '25px' }}>
              You have cancelled the payment. Your order is still pending.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={handleContinueShopping}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}

        {/* Error */}
        {paymentStatus === 'error' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#dc3545',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <i className="bi bi-exclamation-triangle" style={{ fontSize: '48px', color: 'white' }}></i>
            </div>
            <h2 style={{ color: '#dc3545', marginBottom: '15px' }}>Something Went Wrong</h2>
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '25px' }}>
              We encountered an error while processing your payment response.
            </p>
            <button
              onClick={handleContinueShopping}
              style={{
                padding: '12px 30px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Go to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResponsePage;
