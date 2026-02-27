/**
 * Cyber Sweeft - API Configuration
 * Keep this file secure - do not expose secret keys publicly
 */

const API_CONFIG = {
  // PAYSTACK KEYS
  // Get from: https://dashboard.paystack.com/#/settings/developer
  PAYSTACK_PUBLIC_KEY: 'pk_live_your_public_key_here',  // Replace with your live public key
  PAYSTACK_SECRET_KEY: 'sk_live_your_secret_key_here',  // Replace with your live secret key
  
  // GOOGLE SHEETS (Gviz trick - no Apps Script needed for reading)
  // Sheet ID from URL: https://docs.google.com/spreadsheets/d/SHEET_ID/edit
  SHEET_ID: '1mtOy-WiKy1Jd85amuJeh_JLWxWlAVvCr',
  SHEET_NAME: 'sweeft projects',
  
  // PRICING
  FIXED_PRICE: 2500,
  
  // STORAGE KEY for local purchases
  STORAGE_KEY: 'cybersweeft_purchases_v1'
};

// Make available globally
window.API_CONFIG = API_CONFIG;
