/**
 * Cyber Sweeft - API Configuration
 */

const API_CONFIG = {
  // PAYSTACK KEYS
  PAYSTACK_PUBLIC_KEY: 'pk_live_your_public_key_here', 
  PAYSTACK_SECRET_KEY: 'sk_live_your_secret_key_here',
  
  // GOOGLE SHEETS
  // IMPORTANT: Sheet MUST be set to "Anyone with the link can view"
  SHEET_ID: '1mtOy-WiKy1Jd85amuJeh_JLWxWlAVvCr', 
  SHEET_NAME: 'sweeft projects',
  
  // PRICING
  FIXED_PRICE: 2500,
  
  // STORAGE KEY
  STORAGE_KEY: 'cybersweeft_purchases_v1'
};

window.API_CONFIG = API_CONFIG;
