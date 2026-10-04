AIForge Manual UPI Pricing Update

Replace:
client/src/pages/Static.jsx

New flow:
Pricing -> Upgrade to Pro -> /payment

The payment page handles:
1. UPI QR
2. UPI ID
3. UTR submission
4. Admin verification
5. Pro activation after approval

Admin payment page:
 /admin/payments

Important:
Do not put your UPI ID in Static.jsx.
Keep it in Render environment variables:
UPI_ID=your-real-upi-id
UPI_MERCHANT_NAME=AIForge
