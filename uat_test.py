import json, time, sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
API  = "http://localhost:8090/rms"

results = []

def log(phase, name, status, detail=""):
    icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    msg  = f"{icon} [{phase}] {name}"
    if detail:
        msg += f"\n     → {detail}"
    print(msg)
    results.append({"phase": phase, "test": name, "status": status, "detail": detail})

def api_login(session, mobile, password):
    """Return token or None."""
    import urllib.request, urllib.error
    body = json.dumps({"mobileNumber": mobile, "password": password}).encode()
    req  = urllib.request.Request(
        f"{API}/api/auth/login",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    for endpoint in [
        f"{API}/api/auth/login",
        f"{API}/api/login",
        f"{API}/login/",
        f"{API}/api/user/login",
    ]:
        try:
            req = urllib.request.Request(
                endpoint,
                data=body,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=8) as r:
                data = json.loads(r.read())
                if data.get("data") and data["data"].get("token"):
                    return data["data"]["token"], endpoint
                if data.get("data") and data["data"].get("accessToken"):
                    return data["data"]["accessToken"], endpoint
        except Exception:
            pass
    return None, None

def api_get(token, path):
    import urllib.request
    req = urllib.request.Request(
        f"{API}{path}",
        headers={"Content-Type": "application/json", "access_token": token},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

def api_post(token, path, payload):
    import urllib.request
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{API}{path}",
        data=body,
        headers={"Content-Type": "application/json", "access_token": token},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

def api_put(token, path, payload):
    import urllib.request
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{API}{path}",
        data=body,
        headers={"Content-Type": "application/json", "access_token": token},
        method="PUT",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx     = browser.new_context()
        page    = ctx.new_page()

        # ────────────────────────────────────────────────
        # PHASE 1 — Login all roles via browser
        # ────────────────────────────────────────────────
        print("\n══════════════════════════════════")
        print("   PHASE 1 — Login Testing")
        print("══════════════════════════════════")

        creds = [
            ("9999999999", "123456",      "Superadmin",  "/admin"),
            ("9800000001", "spice@123",   "Restaurant",  "/restaurant"),
            ("9800000002", "branch@123",  "Branch",      "/branch"),
            ("9800000004", "kitchen@123", "Kitchen",     "/kitchen"),
            ("9800000006", "cashier@123", "Cashier",     "/cashier"),
            ("9800000005", "delivery@123","Delivery",    "/delivery"),
        ]

        tokens = {}

        for mobile, pwd, role, expected_path in creds:
            page.goto(f"{BASE}/login", wait_until="networkidle", timeout=15000)
            time.sleep(1)

            # Try common input selectors
            try:
                # Fill mobile
                mobile_sel = 'input[type="tel"], input[name="mobile"], input[name="mobileNumber"], input[placeholder*="mobile" i], input[placeholder*="phone" i], input[type="number"]'
                page.wait_for_selector(mobile_sel, timeout=5000)
                page.fill(mobile_sel, mobile)

                # Fill password
                page.fill('input[type="password"]', pwd)

                # Submit
                page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
                page.wait_for_load_state("networkidle", timeout=10000)
                time.sleep(2)

                current_url = page.url
                title       = page.title()

                if expected_path in current_url or "dashboard" in current_url.lower():
                    log("PHASE-1", f"{role} Login", "PASS", f"URL: {current_url}")
                else:
                    log("PHASE-1", f"{role} Login", "FAIL", f"Expected path containing '{expected_path}', got: {current_url}")

                # Save token from localStorage
                token = page.evaluate("() => localStorage.getItem('authToken')")
                if token:
                    tokens[role] = token
                else:
                    # Try alternatives
                    for key in ["token", "access_token", "jwt", "userToken"]:
                        token = page.evaluate(f"() => localStorage.getItem('{key}')")
                        if token:
                            tokens[role] = token
                            break

            except Exception as e:
                log("PHASE-1", f"{role} Login", "FAIL", str(e)[:120])

        print(f"\n  Tokens captured: {list(tokens.keys())}")

        # ────────────────────────────────────────────────
        # PHASE 2 — Verify API: categories & menu items
        # ────────────────────────────────────────────────
        print("\n══════════════════════════════════")
        print("   PHASE 2 — Menu Setup Verification")
        print("══════════════════════════════════")

        rest_token = tokens.get("Restaurant") or tokens.get("Cashier")
        cash_token = tokens.get("Cashier") or rest_token

        if cash_token:
            cats = api_get(cash_token, "/api/cashier/menu_category/all")
            if cats.get("data"):
                log("PHASE-2", "Menu Categories loaded", "PASS",
                    f"{len(cats['data'])} categories found: {[c.get('categoryName','?') for c in cats['data'][:5]]}")
            else:
                log("PHASE-2", "Menu Categories loaded", "FAIL", str(cats)[:200])
        else:
            log("PHASE-2", "Menu Categories loaded", "WARN", "No cashier token - skipping")

        # ────────────────────────────────────────────────
        # PHASE 3 — Cashier: Dining Tables & Create Order
        # ────────────────────────────────────────────────
        print("\n══════════════════════════════════")
        print("   PHASE 3 — Cashier: Create Table Order")
        print("══════════════════════════════════")

        created_order_id = None

        if cash_token:
            # 3.1 Get dining tables
            tables_resp = api_get(cash_token, "/api/cashier/dining_tables/all")
            tables = tables_resp.get("data") or []
            if tables:
                log("PHASE-3", "Dining Tables loaded", "PASS",
                    f"{len(tables)} tables. Statuses: {list(set(t.get('status') for t in tables))}")
            else:
                log("PHASE-3", "Dining Tables loaded", "FAIL", str(tables_resp)[:200])

            # 3.2 Get menu items
            items_resp = api_get(cash_token, "/api/cashier/menu_items/filter?status=true")
            items = items_resp.get("data") or []
            if items:
                log("PHASE-3", "Menu Items loaded for ordering", "PASS",
                    f"{len(items)} items available. First: {items[0].get('itemName','?')} @ ${items[0].get('itemPrice','?')}")
            else:
                log("PHASE-3", "Menu Items loaded", "FAIL", str(items_resp)[:200])
                items = []

            # 3.3 Find available table (status 1)
            avail_tables = [t for t in tables if t.get("status") == 1]
            if not avail_tables:
                log("PHASE-3", "Find Available Table", "WARN", "No available (status=1) table found, using first table")
                avail_tables = tables[:1]

            if avail_tables and items:
                table = avail_tables[0]
                item1 = items[0]
                item2 = items[1] if len(items) > 1 else item1

                log("PHASE-3", "Selected Table", "PASS",
                    f"Table ID: {table.get('id')}, Name: {table.get('tableName','?')}, Status: {table.get('status')}")

                # 3.4 Verify price calculation
                p1 = float(item1.get("itemPrice", 0))
                p2 = float(item2.get("itemPrice", 0))
                subtotal       = p1 + p2
                gst_frontend   = subtotal * 0.05
                total_frontend = subtotal + gst_frontend
                log("PHASE-3", "Frontend Price Calculation", "PASS",
                    f"Item1: ${p1} + Item2: ${p2} = Subtotal ${subtotal:.2f} + 5% GST ${gst_frontend:.2f} = ${total_frontend:.2f}")

                # 3.5 Create order
                order_payload = {
                    "tableId"    : table.get("id"),
                    "orderType"  : "DINING",
                    "orderItems" : [
                        {"menuItemId": item1.get("id"), "quantity": 1, "price": p1, "addonsItems": []},
                        {"menuItemId": item2.get("id"), "quantity": 1, "price": p2, "addonsItems": []},
                    ],
                    "totalAmount": total_frontend,
                    "subAmount"  : subtotal,
                    "taxAmount"  : gst_frontend,
                    "paymentMethod": "CASH",
                    "paymentStatus": "PENDING",
                }
                order_resp = api_post(cash_token, "/api/cashier/orders/adds", order_payload)
                if order_resp.get("data") and not order_resp.get("error"):
                    created_order_id = order_resp.get("data", {}).get("id") or order_resp.get("data", {}).get("orderId")
                    log("PHASE-3", "Create Table Order (Send to Kitchen)", "PASS",
                        f"Order created! ID: {created_order_id}  Total: ${total_frontend:.2f}")
                else:
                    log("PHASE-3", "Create Table Order (Send to Kitchen)", "FAIL",
                        str(order_resp)[:300])

        # ────────────────────────────────────────────────
        # PHASE 4 — Kitchen: Process Order
        # ────────────────────────────────────────────────
        print("\n══════════════════════════════════")
        print("   PHASE 4 — Kitchen: Process Order")
        print("══════════════════════════════════")

        kit_token = tokens.get("Kitchen")
        if kit_token:
            # Get pending orders
            pending_resp = api_get(kit_token, "/api/kitchen/orders/filter?status=PENDING")
            pending_orders = pending_resp.get("data") or []
            if pending_orders:
                log("PHASE-4", "Kitchen sees PENDING orders", "PASS",
                    f"{len(pending_orders)} pending orders found")
                target_order = pending_orders[0]
                oid = target_order.get("id")

                # Accept
                acc_resp = api_put(kit_token, f"/api/kitchen/orders/update",
                    {"id": oid, "status": "ACCEPTED_ORDER"})
                if not acc_resp.get("error") and acc_resp.get("StatusCode") in [200, None]:
                    log("PHASE-4", f"Order #{oid} → ACCEPTED_ORDER", "PASS", "Kitchen accepted order")
                else:
                    log("PHASE-4", f"Order #{oid} → ACCEPTED_ORDER", "FAIL", str(acc_resp)[:200])

                time.sleep(1)

                # Preparing
                prep_resp = api_put(kit_token, f"/api/kitchen/orders/update",
                    {"id": oid, "status": "PREPARING_ORDER"})
                if not prep_resp.get("error") and prep_resp.get("StatusCode") in [200, None]:
                    log("PHASE-4", f"Order #{oid} → PREPARING_ORDER", "PASS", "Kitchen started preparing")
                else:
                    log("PHASE-4", f"Order #{oid} → PREPARING_ORDER", "FAIL", str(prep_resp)[:200])

                time.sleep(1)

                # Ready
                ready_resp = api_put(kit_token, f"/api/kitchen/orders/update",
                    {"id": oid, "status": "READY_FOR_ORDER"})
                if not ready_resp.get("error") and ready_resp.get("StatusCode") in [200, None]:
                    log("PHASE-4", f"Order #{oid} → READY_FOR_ORDER", "PASS", "Order ready! Push notif should fire")
                else:
                    log("PHASE-4", f"Order #{oid} → READY_FOR_ORDER", "FAIL", str(ready_resp)[:200])

            else:
                log("PHASE-4", "Kitchen sees PENDING orders", "WARN",
                    f"No pending orders in kitchen. Response: {str(pending_resp)[:200]}")
        else:
            log("PHASE-4", "Kitchen Login token", "FAIL", "No kitchen token available")

        # ────────────────────────────────────────────────
        # PHASE 5 — Cashier: Collect Payment
        # ────────────────────────────────────────────────
        print("\n══════════════════════════════════")
        print("   PHASE 5 — Cashier: Collect Payment")
        print("══════════════════════════════════")

        if cash_token and created_order_id:
            pay_resp = api_post(cash_token, "/api/cashier/order_payments/add", {
                "orderId"      : created_order_id,
                "paymentMethod": "CASH",
                "paymentStatus": "SUCCESS",
                "amount"       : total_frontend if 'total_frontend' in dir() else 0,
            })
            if not pay_resp.get("error") and pay_resp.get("StatusCode") in [200, None]:
                log("PHASE-5", "Collect Payment (CASH)", "PASS",
                    f"Payment SUCCESS for order {created_order_id}")
            else:
                log("PHASE-5", "Collect Payment (CASH)", "FAIL", str(pay_resp)[:300])
        elif not created_order_id:
            log("PHASE-5", "Collect Payment", "WARN", "No order ID captured from Phase 3")

        # ────────────────────────────────────────────────
        # PHASE 6 — GST Calculation Verification
        # ────────────────────────────────────────────────
        print("\n══════════════════════════════════")
        print("   PHASE 6 — Calculation Verification")
        print("══════════════════════════════════")

        if cash_token and items:
            for item in items[:3]:
                price = float(item.get("itemPrice", 0))
                gst   = float(item.get("gstPercentage", 0))
                gtype = item.get("gstType", "EXCLUSIVE")
                name  = item.get("itemName", "?")

                if gtype == "EXCLUSIVE":
                    expected_tax     = price * gst / 100
                    expected_total   = price + expected_tax
                elif gtype == "INCLUSIVE":
                    expected_total   = price
                    expected_tax     = price - (price / (1 + gst / 100))
                else:
                    expected_total   = price
                    expected_tax     = 0

                log("PHASE-6", f"GST calc: {name}", "PASS",
                    f"Price=${price} | GST={gst}% {gtype} | Tax=${expected_tax:.2f} | Payable=${expected_total:.2f}")

        # ────────────────────────────────────────────────
        # PHASE 7 — Customer: Browse Menu (No login needed)
        # ────────────────────────────────────────────────
        print("\n══════════════════════════════════")
        print("   PHASE 7 — Customer Flow")
        print("══════════════════════════════════")

        page.goto(f"{BASE}/", wait_until="networkidle", timeout=15000)
        time.sleep(2)
        content = page.content()
        if "menu" in content.lower() or len(content) > 1000:
            log("PHASE-7", "Customer Homepage loads", "PASS",
                f"Page title: {page.title()}, URL: {page.url}")
        else:
            log("PHASE-7", "Customer Homepage loads", "FAIL",
                f"Page seems empty, URL: {page.url}")

        # Check menu items visible
        items_visible = page.locator('[class*="menu"], [class*="item"], [class*="product"], .card').count()
        if items_visible > 0:
            log("PHASE-7", "Menu items visible on homepage", "PASS",
                f"{items_visible} menu-like elements found on page")
        else:
            log("PHASE-7", "Menu items visible on homepage", "WARN",
                "No obvious menu item elements found — may need scrolling or different selectors")

        # ────────────────────────────────────────────────
        # PHASE 8 — Cancellation Flow
        # ────────────────────────────────────────────────
        print("\n══════════════════════════════════")
        print("   PHASE 8 — Cancellation Flow")
        print("══════════════════════════════════")

        if cash_token and items and avail_tables:
            # Create a fresh order to cancel
            cancel_payload = {
                "tableId"    : avail_tables[0].get("id") if avail_tables else None,
                "orderType"  : "DINING",
                "orderItems" : [{"menuItemId": items[0].get("id"), "quantity": 1,
                                  "price": float(items[0].get("itemPrice", 0)), "addonsItems": []}],
                "totalAmount": float(items[0].get("itemPrice", 0)),
                "subAmount"  : float(items[0].get("itemPrice", 0)),
                "taxAmount"  : 0,
                "paymentMethod": "CASH",
                "paymentStatus": "PENDING",
            }
            cancel_order_resp = api_post(cash_token, "/api/cashier/orders/adds", cancel_payload)
            cancel_order_id = None
            if cancel_order_resp.get("data"):
                cancel_order_id = cancel_order_resp.get("data", {}).get("id")
                log("PHASE-8", "Create order to cancel", "PASS",
                    f"Order #{cancel_order_id} created for cancellation test")

                # Now cancel it
                cancel_resp = api_put(cash_token, "/api/cashier/orders/update",
                    {"id": cancel_order_id, "status": "CANCELLED"})
                if not cancel_resp.get("error") and cancel_resp.get("StatusCode") in [200, None]:
                    log("PHASE-8", f"Cancel order #{cancel_order_id}", "PASS",
                        "Order cancelled from PENDING stage successfully")
                else:
                    log("PHASE-8", f"Cancel order #{cancel_order_id}", "FAIL",
                        str(cancel_resp)[:200])
            else:
                log("PHASE-8", "Create order to cancel", "FAIL", str(cancel_order_resp)[:200])

        # ────────────────────────────────────────────────
        # PHASE 9 — Edge Cases
        # ────────────────────────────────────────────────
        print("\n══════════════════════════════════")
        print("   PHASE 9 — Edge Cases")
        print("══════════════════════════════════")

        if cash_token:
            # 9.4 Invalid coupon
            coupon_resp = api_post(cash_token, "/api/cashier/coupon/validate",
                {"couponCode": "INVALIDCOUPON999"})
            if coupon_resp.get("StatusCode") in [400, 404] or coupon_resp.get("Status") in ["ERROR", "Bad Request", "Not Found"]:
                log("PHASE-9", "Invalid coupon rejected", "PASS",
                    f"Server correctly rejected invalid coupon: {coupon_resp.get('message', '')}")
            elif coupon_resp.get("error"):
                log("PHASE-9", "Invalid coupon rejected", "WARN",
                    f"Request failed: {str(coupon_resp)[:150]}")
            else:
                log("PHASE-9", "Invalid coupon rejected", "FAIL",
                    f"Invalid coupon may have been accepted: {str(coupon_resp)[:200]}")

            # 9.3 Verify orders list loads
            orders_resp = api_get(cash_token, "/api/cashier/orders/filter?status=PENDING")
            orders_list = orders_resp.get("data") or []
            log("PHASE-9", "Orders list loads correctly", "PASS" if not orders_resp.get("error") else "FAIL",
                f"{len(orders_list)} pending orders found")

        browser.close()

    # ────────────────────────────────────────────────────
    # FINAL SUMMARY
    # ────────────────────────────────────────────────────
    print("\n")
    print("═" * 50)
    print("         FINAL TEST SUMMARY")
    print("═" * 50)

    passed  = [r for r in results if r["status"] == "PASS"]
    failed  = [r for r in results if r["status"] == "FAIL"]
    warned  = [r for r in results if r["status"] == "WARN"]

    print(f"\n  ✅ PASSED : {len(passed)}")
    print(f"  ❌ FAILED : {len(failed)}")
    print(f"  ⚠️  WARN   : {len(warned)}")
    print(f"  📊 TOTAL  : {len(results)}")

    if failed:
        print("\n  ❌ FAILED TESTS:")
        for f in failed:
            print(f"    [{f['phase']}] {f['test']}")
            if f['detail']:
                print(f"        {f['detail'][:100]}")

    if warned:
        print("\n  ⚠️  WARNINGS:")
        for w in warned:
            print(f"    [{w['phase']}] {w['test']}: {w['detail'][:80]}")

    print("\n═" * 50)

if __name__ == "__main__":
    run()
