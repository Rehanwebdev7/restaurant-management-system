import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ApiPost } from '../ApiServices/ApiServices';
import { toast } from 'react-toastify';
import { Spinner, Button } from 'react-bootstrap';

const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      '::placeholder': { color: '#aab7c4' },
    },
    invalid: { color: '#fa755a', iconColor: '#fa755a' },
  },
};

// ─── Real Stripe Form (uses Stripe hooks — must be inside <Elements>) ─────────
const RealStripeForm = ({ orderId, onSuccess, onError, apiPrefix }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const res = await ApiPost(`/api/${apiPrefix}/stripe/create-payment-intent`, { orderId });
      if (!res.success) throw new Error(res.fail || 'Failed to create payment intent');

      const { clientSecret, paymentIntentId } = res.success.data.data;
      if (!clientSecret) throw new Error('No client secret received');

      const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (error) throw new Error(error.message);
      if (!paymentIntent || paymentIntent.status !== 'succeeded') throw new Error('Payment was not completed');

      const confirmRes = await ApiPost(`/api/${apiPrefix}/stripe/confirm-payment`, {
        orderId,
        paymentIntentId: paymentIntentId || paymentIntent.id,
      });

      if (confirmRes.success && confirmRes.success.data.data.status === 'succeeded') {
        toast.success('Card payment successful!');
        if (onSuccess) onSuccess(confirmRes.success.data.data);
      } else {
        throw new Error('Payment confirmation failed on server');
      }
    } catch (e) {
      toast.error(e.message || 'Card payment failed');
      if (onError) onError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '16px', background: '#fff' }}>
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      <Button variant="primary" onClick={handlePay} disabled={loading || !stripe} style={{ width: '100%', fontWeight: '600' }}>
        {loading ? <><Spinner animation="border" size="sm" className="me-2" />Processing...</> : <><i className="bi bi-credit-card me-2"></i>Pay with Card</>}
      </Button>
    </div>
  );
};

// ─── Mock Form (NO Stripe hooks — used when publishable key is missing) ───────
const MockStripeForm = ({ orderId, onSuccess, onError, apiPrefix }) => {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await ApiPost(`/api/${apiPrefix}/stripe/create-payment-intent`, { orderId });
      if (!res.success) throw new Error(res.fail || 'Failed to create payment intent');

      const { paymentIntentId } = res.success.data.data;

      const confirmRes = await ApiPost(`/api/${apiPrefix}/stripe/confirm-payment`, {
        orderId,
        paymentIntentId,
      });

      if (confirmRes.success && confirmRes.success.data.data.status === 'succeeded') {
        toast.success('Card payment successful!');
        if (onSuccess) onSuccess(confirmRes.success.data.data);
      } else {
        throw new Error('Payment confirmation failed on server');
      }
    } catch (e) {
      toast.error(e.message || 'Card payment failed');
      if (onError) onError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ padding: '12px', marginBottom: '16px', background: '#f0fdf4', borderRadius: '8px', color: '#15803d', fontSize: '13px', textAlign: 'center' }}>
        Mock mode — no card needed
      </div>
      <Button variant="primary" onClick={handlePay} disabled={loading} style={{ width: '100%', fontWeight: '600' }}>
        {loading ? <><Spinner animation="border" size="sm" className="me-2" />Processing...</> : <><i className="bi bi-credit-card me-2"></i>Pay with Card</>}
      </Button>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const StripeButton = ({ orderId, amount, onSuccess, onError, onCancel, apiPrefix = 'cashier' }) => {
  if (stripePromise) {
    return (
      <Elements stripe={stripePromise}>
        <RealStripeForm orderId={orderId} onSuccess={onSuccess} onError={onError} apiPrefix={apiPrefix} />
      </Elements>
    );
  }
  return <MockStripeForm orderId={orderId} onSuccess={onSuccess} onError={onError} apiPrefix={apiPrefix} />;
};

export default StripeButton;
