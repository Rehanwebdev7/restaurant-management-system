INSERT INTO payment_gateway (vendorname, status, on_of, credentials, restaurant_id, payment_method, title, allow_cod)
VALUES ('stripe', true, 'ON', '{"secret_key":"mock","publishable_key":"mock","webhook_secret":"mock","mode":"test","mock_mode":true}', 1, 'stripe', 'Stripe Card', true);
