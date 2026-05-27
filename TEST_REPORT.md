# UAT Testing Report — Restaurant Management System
**Test Date:** 2026-05-27  
**Tester:** Claude (Senior QA)  
**Environment:** Local (Backend 8090, Frontend 3000)  
**Database:** PostgreSQL Supabase (UAT)  
**Test Plan:** 9-Phase Systematic Testing  

---

## PHASE 1: Login Testing (All Roles)

### 1.1 Superadmin Login
**Credentials:** Mobile: 9999999999 | Password: 123456  
**URL:** http://localhost:3000  
**Expected:** Lands on Admin Dashboard  

**Status:** 🔄 PENDING  
**Test Method:** Manual browser → Login page → Enter creds → Verify dashboard  
**Notes:** Will test manually in browser

---

### 1.2 Restaurant (Owner) Login
**Credentials:** Mobile: 9800000001 | Password: spice@123  
**Expected:** Lands on Restaurant Dashboard  

**Status:** 🔄 PENDING  

---

### 1.3 Branch Manager Login
**Credentials:** Mobile: 9800000002 | Password: branch@123  
**Expected:** Lands on Branch Dashboard  

**Status:** 🔄 PENDING  

---

### 1.4 Kitchen Staff Login
**Credentials:** Mobile: 9800000004 | Password: kitchen@123  
**Expected:** Lands on Kitchen Display (KDS)  

**Status:** 🔄 PENDING  

---

### 1.5 Cashier Login
**Credentials:** Mobile: 9800000006 | Password: cashier@123  
**Expected:** Lands on Cashier Dashboard  

**Status:** 🔄 PENDING  

---

### 1.6 Delivery Person Login
**Credentials:** Mobile: 9800000005 | Password: delivery@123  
**Expected:** Lands on Delivery Dashboard  

**Status:** 🔄 PENDING  

---

### 1.7 Customer Flow
**Expected:** Browse menu without login, can login with OTP  

**Status:** 🔄 PENDING  

---

## PHASE 2: Menu Setup (Category → Subcategory → Item)

### 2.1 Create Menu Category
**Path:** Restaurant → Menu Management → Categories  
**Action:** Add new category "UAT_TestCategory"  
**Expected:** Category appears in list  

**Status:** 🔄 PENDING  

---

### 2.2 Create Menu Subcategory
**Path:** Restaurant → Menu Management → Subcategories  
**Action:** Add subcategory under UAT_TestCategory  
**Expected:** Subcategory appears and links correctly  

**Status:** 🔄 PENDING  

---

### 2.3 Add Menu Item
**Path:** Restaurant → Menu Management → Menu Items  
**Action:** 
- Name: "Test Biryani"
- Price: $100
- GST: EXCLUSIVE 5%
- Subcategory: Link to UAT_TestCategory
- Image: Upload (or use test image)

**Expected:** Item created, appears in cashier's menu view  

**Status:** 🔄 PENDING  

---

### 2.4 Add Addon Group
**Path:** Restaurant → Menu Management → Addons  
**Action:** 
- Create addon "Drink Options": Coke ($1), Pepsi ($1), Water (free)
- Link addon to "Test Biryani" item

**Expected:** Item + addon appears in cashier view  

**Status:** 🔄 PENDING  

---

## PHASE 3: Cashier — Create Dining Table Order

### 3.1 View Dining Tables
**Path:** Cashier → Dining Tables  
**Expected:** 
- See all tables
- Table statuses: 1=Available, 2=Running, 3=Printed, 4=Paid, 5=Running KOT

**Status:** 🔄 PENDING  

---

### 3.2 Select Available Table & Open Order
**Action:** Click on Table 1 (or first available)  
**Expected:** Navigate to TableOrder.jsx for that table  

**Status:** 🔄 PENDING  

---

### 3.3 Add Items to Cart
**Action:** 
- Add 1x Test Biryani
- Add 1x Test Biryani with addon (choose Coke)
- Add 1x other existing menu item

**Expected:** Items appear in cart with correct prices  

**Status:** 🔄 PENDING  

---

### 3.4 Verify Pricing Calculation
**Expected:**
```
Item 1: Test Biryani = $100
Item 2: Test Biryani + Coke addon = $100 + $1 = $101
Item 3: [Other item price]

Subtotal: $201 + other
GST (5% EXCLUSIVE): = subtotal * 0.05
Service Charge: (if section has it) = subtotal * %
Total: Subtotal + GST + Service Charge

Frontend display should match backend calculation
```

**Status:** 🔄 PENDING  

---

### 3.5 Send Order to Kitchen
**Action:** Click "Send to Kitchen"  
**Expected:** 
- Order created (POST /api/cashier/orders/adds)
- Table status changes to 2 (Running) or 5 (KOT sent)
- Order ID returned

**Captured Order ID:** (will fill during test)  

**Status:** 🔄 PENDING  

---

## PHASE 4: Kitchen — Process Order

### 4.1 Login as Kitchen
**Credentials:** Mobile: 9800000004 | Password: kitchen@123  
**Expected:** See Kitchen Display with Pending orders  

**Status:** 🔄 PENDING  

---

### 4.2 See New Order in Pending Tab
**Expected:** Find the order created in Phase 3 in Pending tab  

**Captured Order:** (will record order number)  

**Status:** 🔄 PENDING  

---

### 4.3 Status Transitions
**Actions in sequence:**
1. Click "Accept Order" → Status: `ACCEPTED_ORDER`
2. Click "Preparing" → Status: `PREPARING_ORDER`
3. Click "Ready" → Status: `READY_FOR_ORDER`
4. (For dining) Click "Served" → Status: `SERVED`

**Expected:** Each status change reflected immediately on UI  

**Status:** 🔄 PENDING  

---

### 4.4 Verify Push Notification
**Expected:** On `READY_FOR_ORDER`, backend fires FCM push to DELIVERY users  
**How to verify:** Check backend logs for FCM call  

**Status:** 🔄 PENDING  

---

## PHASE 5: Cashier — Collect Payment (Cash)

### 5.1 Return to Table Order
**Action:** Cashier goes back to same table (from Phase 3)  
**Expected:** See order in READY/SERVED state  

**Status:** 🔄 PENDING  

---

### 5.2 Collect Payment (CASH)
**Action:** Click "Collect Payment" → Choose CASH  
**Expected:**
- `paymentStatus: SUCCESS`
- `status: COMPLETED`
- Table status changes to 4 (Paid)

**Status:** 🔄 PENDING  

---

### 5.3 Table Release
**Expected:**
- Immediate: No "Release Table" needed for cash payment
- After 5 minutes (scheduler): Table status → 1 (Available)
- OR: Manual "Release Table" button immediately sets status 1

**Status:** 🔄 PENDING  

---

### 5.4 Test Other Payment Methods
**Actions:**
| Method | Expected |
|---|---|
| UPI | Immediate SUCCESS |
| CARD | Immediate SUCCESS |
| PG (Stripe) | Modal shown, gateway integration tested |
| PG (PayPal) | Modal shown, gateway integration tested |

**Status:** 🔄 PENDING  

---

## PHASE 6: Calculation Verification

### 6.1 GST EXCLUSIVE Verification
**Test case:** Order item = $100, GST EXCLUSIVE 5%  
**Formula:** Payable = $100 + ($100 * 5%) = $105  

**Expected DB record:**
```
- baseAmount: 100
- gstPercentage: 5
- gstType: EXCLUSIVE
- gstAmount: 5
- payableAmount: 105
```

**Status:** 🔄 PENDING  

---

### 6.2 GST INCLUSIVE Verification
**Test case:** Order item = $105 (price already includes 5% tax), GST INCLUSIVE 5%  
**Formula:** 
- Base = $105 / (1 + 0.05) = $100
- Tax extracted = $5
- Payable = $100 (base stays same)

**Expected DB record:**
```
- baseAmount: 100
- gstPercentage: 5
- gstType: INCLUSIVE
- gstAmount: 5
- payableAmount: 100
```

**Status:** 🔄 PENDING  

---

### 6.3 Service Charge Verification
**Test case:** If section has service charge 10%  
**Formula:** serviceCharge = (itemSubtotal + addonsTotal) * 10% / 100  

**Example:**
```
Items: $100 + $101 = $201
Addons: (already included in items)
Service Charge: $201 * 10% = $20.10
Total: $201 + GST + $20.10
```

**Status:** 🔄 PENDING  

---

### 6.4 End-to-End Calculation
**Verify entire order total:**

```
SELECT 
  id, 
  created_at,
  subtotal_amount, 
  gst_amount, 
  service_charge_amount, 
  delivery_fee, 
  discount_amount,
  total_amount,
  payment_status,
  status
FROM orders 
WHERE id = [captured_order_id]
```

**Compare:** Frontend displayed total vs. DB total_amount (should match exactly)  

**Status:** 🔄 PENDING  

---

## PHASE 7: Customer Flow — Place Online Order

### 7.1 Browse Menu (No Login)
**Action:** Open http://localhost:3000 → HomePage  
**Expected:** See menu categories, items, images without login required  

**Status:** 🔄 PENDING  

---

### 7.2 Customer Login
**Action:** Click login → Enter mobile (test number) → Receive OTP  
**Note:** If OTP disabled in UAT, may auto-login  

**Status:** 🔄 PENDING  

---

### 7.3 Add to Cart
**Action:** 
- Add Test Biryani (from Phase 2) to cart
- Add another item
- Change quantity for one item

**Expected:** Cart updates, subtotal calculated  

**Status:** 🔄 PENDING  

---

### 7.4 Apply Coupon (if available)
**Action:** Enter coupon code (test code from database)  
**Expected:** Discount applied, total reduced  

**Status:** 🔄 PENDING  

---

### 7.5 Delivery Address
**Action:** 
- Add new address OR
- Select existing delivery address
- Select delivery zone (should calculate delivery fee)

**Expected:** Delivery fee added to total  

**Status:** 🔄 PENDING  

---

### 7.6 Payment (Cash on Delivery)
**Action:** Choose COD payment  
**Expected:** Order created with `paymentStatus: PENDING`  

**Status:** 🔄 PENDING  

---

### 7.7 Order Appears in Kitchen
**Action:** Verify order appears in Kitchen Display  
**Expected:** Order visible in Kitchen KDS (PENDING tab)  

**Status:** 🔄 PENDING  

---

### 7.8 Track Order Status
**Action:** Go to OrdersPage.jsx, see order status live  
**Expected:** Status updates as kitchen processes → ready → picked up → delivered  

**Status:** 🔄 PENDING  

---

## PHASE 8: Cancellation Flow

### 8.1 Cancel from PENDING
**Action:** Create order → Immediately cancel (before kitchen accepts)  
**Expected:** 
- Order status → CANCELLED
- Table released (if dining)
- No errors

**Status:** 🔄 PENDING  

---

### 8.2 Cancel from PREPARING
**Action:** Create order → Kitchen accepts & marks preparing → Cashier cancels  
**Expected:** 
- Warning displayed
- Order status → CANCELLED
- Table released

**Status:** 🔄 PENDING  

---

### 8.3 Verify in Admin
**Action:** Admin → Orders → Cancelled Orders tab  
**Expected:** Cancelled order appears with timestamp, reason  

**Status:** 🔄 PENDING  

---

## PHASE 9: Edge Cases & Validation

### 9.1 Add Item with $0 Price
**Action:** Try to create menu item with price = 0  
**Expected:** Error or warning (system should validate)  

**Status:** 🔄 PENDING  

---

### 9.2 Order with Addon Only (No Base Item)
**Action:** Add only addon without base menu item  
**Expected:** Validation error: "Cannot order addon without item"  

**Status:** 🔄 PENDING  

---

### 9.3 Duplicate Order to Same Table
**Action:** Create order → Add items to same table → Create another order  
**Expected:** Either warn user or merge items into existing order  

**Status:** 🔄 PENDING  

---

### 9.4 Invalid Coupon Code
**Action:** Enter invalid/expired coupon code  
**Expected:** Error message, no discount applied  

**Status:** 🔄 PENDING  

---

### 9.5 Payment Gateway Mock Mode
**Action:** Check if Stripe/PayPal set to `mock_mode=true`  
**Expected:** Test transactions work without real payment processing  

**Status:** 🔄 PENDING  

---

## Summary

| Phase | Total Tests | Passed | Failed | Pending |
|---|---|---|---|---|
| 1. Login | 7 | 0 | 0 | 7 |
| 2. Menu Setup | 4 | 0 | 0 | 4 |
| 3. Cashier Order | 5 | 0 | 0 | 5 |
| 4. Kitchen Process | 4 | 0 | 0 | 4 |
| 5. Payment | 4 | 0 | 0 | 4 |
| 6. Calculations | 4 | 0 | 0 | 4 |
| 7. Customer Flow | 8 | 0 | 0 | 8 |
| 8. Cancellation | 3 | 0 | 0 | 3 |
| 9. Edge Cases | 5 | 0 | 0 | 5 |
| **TOTAL** | **44** | **0** | **0** | **44** |

---

## Critical Issues Found
(Will be updated as testing progresses)

---

## Recommendations
(Will be added after complete testing)

---

**Test Status:** 🟡 IN PROGRESS  
**Last Updated:** 2026-05-27 09:30 IST
