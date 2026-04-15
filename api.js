/**
 * Cyber Sweeft - API & Configuration Manager
 */

const API_CONFIG = {
  // PAYSTACK KEYS
  // Only use the Public Key here! 
  PAYSTACK_PUBLIC_KEY: 'pk_live_4f95191cb9e257d48bc2b5ea4077a8b760fb230c', 
  
  // GOOGLE SHEETS
  SHEET_ID: '1CdOJ_j-yT7MudoCRd4GFL7bBsKs_wK96ipIStAKO7XY', 
  SHEET_NAME: 'sweeft projects',
  
  FIXED_PRICE: 2500,
  STORAGE_KEY: 'cybersweeft_purchases_v1'
};

/**
 * Generates a unique transaction reference for Paystack.
 * Format: CS-[timestamp]-[random_number]
 */
const generatePaystackReference = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `CS-${timestamp}-${random}`;
};

// Merging the generator into the global config object
window.API_CONFIG = {
  ...API_CONFIG,
  generateReference: generatePaystackReference
};
// Add this to your processPayment success callback
function verifyOnBackend(reference) {
  return fetch('YOUR_DEPLOYED_SCRIPT_URL', {
    method: 'POST',
    mode: 'no-cors', // Apps Script requires careful handling of CORS
    body: JSON.stringify({ reference: reference })
  })
  .then(response => {
    // Once verified, trigger the download
    console.log("Verified by Google Script!");
  });
}
