import React, { useState } from 'react';
import apiClient from '../../api/apiClient';
import { toast } from 'react-toastify';

const RatingModal = ({ show, onClose, order, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [foodHover, setFoodHover] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [serviceHover, setServiceHover] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [deliveryHover, setDeliveryHover] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const themeMode = 'light'; // Force light mode always
  const isDark = false;

  if (!show) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.warning('Please select an overall rating');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        orderId: order.id,
        rating,
        reviewText: reviewText.trim() || null,
        foodRating: foodRating || null,
        serviceRating: serviceRating || null,
        deliveryRating: deliveryRating || null,
      };

      const response = await apiClient.post('/api/customer/reviews', body);
      if (response.data?.Status === 'SUCCESS') {
        toast.success('Thank you for your review!');
        onSuccess && onSuccess(response.data.data);
        onClose();
      } else {
        toast.error(response.data?.message || 'Failed to submit review');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Something went wrong';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarInput = (value, setValue, hoverValue, setHoverValue, size = 28) => {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <i
            key={star}
            className={star <= (hoverValue || value) ? 'bi bi-star-fill' : 'bi bi-star'}
            style={{
              fontSize: size,
              color: star <= (hoverValue || value) ? '#f59e0b' : (isDark ? '#4b5563' : '#d1d5db'),
              cursor: 'pointer',
              transition: 'transform 0.15s ease, color 0.15s ease',
              transform: star <= (hoverValue || value) ? 'scale(1.1)' : 'scale(1)',
            }}
            onClick={() => setValue(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
          />
        ))}
      </div>
    );
  };

  const getRatingLabel = (r) => {
    if (r === 0) return '';
    if (r === 1) return 'Poor';
    if (r === 2) return 'Fair';
    if (r === 3) return 'Good';
    if (r === 4) return 'Very Good';
    if (r === 5) return 'Excellent';
    return '';
  };

  const bgColor = isDark ? '#05070c' : '#f5f2eb';
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const textColor = isDark ? '#f4efe6' : '#1c1917';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0, 0, 0, 0.08)';
  const accentGold = '#b48a1d';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'relative',
        background: cardBg,
        borderRadius: 20,
        padding: 28,
        width: '100%',
        maxWidth: 440,
        maxHeight: '90vh',
        overflowY: 'auto',
        border: `1px solid ${borderCol}`,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${borderCol}`,
            color: textMuted,
            width: 34,
            height: 34,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            transition: 'all 0.2s ease',
          }}
        >
          <i className="bi bi-x-lg"></i>
        </button>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>
            <i className="bi bi-emoji-smile" style={{ color: accentGold }}></i>
          </div>
          <h3 style={{ color: textColor, fontSize: 20, fontWeight: 700, margin: 0 }}>
            Rate Your Order
          </h3>
          {order?.orderNumber && (
            <p style={{ color: textMuted, fontSize: 13, margin: '6px 0 0' }}>
              Order #{order.orderNumber}
            </p>
          )}
        </div>

        {/* Overall Rating */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ color: textMuted, fontSize: 13, marginBottom: 8, fontWeight: 500 }}>
            Overall Experience
          </p>
          {renderStarInput(rating, setRating, hoverRating, setHoverRating, 36)}
          {(hoverRating || rating) > 0 && (
            <p style={{ color: accentGold, fontSize: 13, marginTop: 6, fontWeight: 600 }}>
              {getRatingLabel(hoverRating || rating)}
            </p>
          )}
        </div>

        {/* Sub Ratings */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {/* Food */}
          <div style={{
            flex: 1,
            minWidth: 110,
            textAlign: 'center',
            padding: '12px 8px',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderRadius: 12,
            border: `1px solid ${borderCol}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
              <i className="bi bi-egg-fried" style={{ color: '#f59e0b', fontSize: 14 }}></i>
              <span style={{ color: textMuted, fontSize: 12, fontWeight: 500 }}>Food</span>
            </div>
            {renderStarInput(foodRating, setFoodRating, foodHover, setFoodHover, 18)}
          </div>

          {/* Service */}
          <div style={{
            flex: 1,
            minWidth: 110,
            textAlign: 'center',
            padding: '12px 8px',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderRadius: 12,
            border: `1px solid ${borderCol}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
              <i className="bi bi-person-heart" style={{ color: '#3b82f6', fontSize: 14 }}></i>
              <span style={{ color: textMuted, fontSize: 12, fontWeight: 500 }}>Service</span>
            </div>
            {renderStarInput(serviceRating, setServiceRating, serviceHover, setServiceHover, 18)}
          </div>

          {/* Delivery */}
          <div style={{
            flex: 1,
            minWidth: 110,
            textAlign: 'center',
            padding: '12px 8px',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderRadius: 12,
            border: `1px solid ${borderCol}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
              <i className="bi bi-truck" style={{ color: '#22c55e', fontSize: 14 }}></i>
              <span style={{ color: textMuted, fontSize: 12, fontWeight: 500 }}>Delivery</span>
            </div>
            {renderStarInput(deliveryRating, setDeliveryRating, deliveryHover, setDeliveryHover, 18)}
          </div>
        </div>

        {/* Review Text */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ color: textMuted, fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Write a review (optional)
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience... What did you enjoy?"
            maxLength={500}
            rows={4}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${borderCol}`,
              borderRadius: 12,
              color: textColor,
              fontSize: 14,
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => e.target.style.borderColor = accentGold}
            onBlur={(e) => e.target.style.borderColor = borderCol}
          />
          <div style={{ textAlign: 'right', fontSize: 11, color: textMuted, marginTop: 4 }}>
            {reviewText.length}/500
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: rating > 0
              ? `linear-gradient(135deg, ${accentGold}, #d4a017)`
              : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
            border: 'none',
            borderRadius: 12,
            color: rating > 0 ? '#05070c' : textMuted,
            fontSize: 15,
            fontWeight: 700,
            cursor: rating > 0 && !submitting ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? (
            <span><i className="bi bi-arrow-clockwise" style={{ animation: 'spin 1s linear infinite' }}></i> Submitting...</span>
          ) : (
            <span><i className="bi bi-send-fill" style={{ marginRight: 8 }}></i>Submit Review</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default RatingModal;
