const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(bodyParser.json());

// Replace with your email and app password (for Gmail, generate an App Password)
const STORE_EMAIL = 'yourstoreemail@gmail.com';
const STORE_EMAIL_PASSWORD = 'your-app-password'; // Use App Password, not your main password
const STORE_OWNER_EMAIL = 'yourowneremail@gmail.com';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: STORE_EMAIL,
    pass: STORE_EMAIL_PASSWORD,
  },
});

// Shopify will POST checkout data here
app.post('/webhook/checkout', async (req, res) => {
  try {
    const checkout = req.body;

    // Get customer and order info
    const customerEmail = checkout.email;
    const lineItems = checkout.line_items || [];
    const shipping = checkout.shipping_address || {};

    // Format order details for email
    const orderDetails = lineItems.map(item => 
      `${item.quantity} x ${item.title} (${item.variant_title || ""}) - ${item.price} ${item.currency || ""}`
    ).join('\n');

    const emailBody = `
A customer has started checkout:

Customer email: ${customerEmail}
Shipping to: ${shipping.address1 || ""}, ${shipping.city || ""}, ${shipping.country || ""}

Order:
${orderDetails}
    `;

    // Send to customer
    await transporter.sendMail({
      from: `"Your Store" <${STORE_EMAIL}>`,
      to: customerEmail,
      subject: 'Your Order Details (Not Yet Paid)',
      text: emailBody,
    });

    // Send to store owner
    await transporter.sendMail({
      from: `"Your Store" <${STORE_EMAIL}>`,
      to: STORE_OWNER_EMAIL,
      subject: 'New Checkout Started (Unpaid)',
      text: emailBody,
    });

    res.status(200).send('Webhook processed');
  } catch (err) {
    console.error('Error handling webhook:', err);
    res.status(500).send('Server error');
  }
});

app.get('/', (req, res) => {
  res.send('Shopify Webhook Email Service Running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
