# Cyber Sweeft - Final Year Project Store

A complete project store with Paystack payments, Google Sheets backend (via Gviz trick for unlimited reads), and automatic file downloads from Google Drive.

## Files

| File | Purpose |
|------|---------|
| `api.js` | Configuration - Paystack keys and Sheet settings |
| `projects.js` | Data manager - fetches from Sheets using Gviz API |
| `index.html` | Main storefront - UI, payments, downloads |

---

## Setup Instructions

### 1. Google Sheets Setup

Create a Google Sheet with these columns:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| ID | Name | Department | Description | Price | DriveID | CreatedAt | Status |

**Column Details:**
- **A (ID)**: Auto-generated unique ID (e.g., `PRJ-A1B2C3`)
- **B (Name)**: Project title
- **C (Department)**: Must match one of the 34 departments exactly
- **D (Description)**: Short project description
- **E (Price)**: Price in Naira (default: 2500)
- **F (DriveID)**: Google Drive file ID (from shareable link)
- **G (CreatedAt)**: Timestamp (auto-filled by Apps Script)
- **H (Status)**: `active` or `inactive` (only active shows)

**Get Sheet ID:**
From URL `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`

---

### 2. Paystack Setup

1. Create account at [paystack.com](https://paystack.com)
2. Go to Settings → Developer → API Keys
3. Copy your **Public Key** and **Secret Key**

---

### 3. Configure api.js

Edit `api.js` and replace:

```javascript
PAYSTACK_PUBLIC_KEY: 'pk_live_your_public_key_here',
PAYSTACK_SECRET_KEY: 'sk_live_your_secret_key_here',
SHEET_ID: 'your-google-sheet-id-here'
```

---

### 4. Upload to Hosting

Upload all 3 files to your web host:
- Netlify
- Vercel
- GitHub Pages
- Any static hosting

---

## Features

### User Features
- **Department Dropdown**: All 34 departments with school mapping
- **Search**: Find projects by name, department, school, or keywords
- **Paystack Payment**: Secure NGN payments
- **Auto-Download**: File downloads automatically after payment
- **Download Again**: Free re-download on same device (session storage)
- **One-Time Purchase**: Tracks purchases in localStorage
- **Dark Mode**: Toggle between light/dark themes

### Admin Features (via Apps Script)
- Add projects via POST
- Delete projects
- Auto-generated IDs
- Status control (active/inactive)

---

## How It Works

### Data Flow (Reading - No Limits)
```
User Site → Gviz API → Google Sheets
```
Uses `https://docs.google.com/spreadsheets/d/ID/gviz/tq` endpoint - **no quota limits**.

### Data Flow (Writing - Admin Only)
```
Admin Panel → Apps Script → Google Sheets
```
Your existing Apps Script handles POST/DELETE.

### Payment Flow
```
1. User clicks "Buy Now"
2. Paystack popup opens
3. User pays
4. Callback saves purchase
5. Auto-download starts
6. Success screen shows
```

---

## All 34 Departments (Pre-mapped)

### SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY
- Department of Science Laboratory Technology
- Department of Home and Rural Economics
- Department of Food Technology
- Department of Statistics
- Department of Hospitality Management
- Department of Computer Science
- Department of Agricultural Technology
- Department of Horticultural Technology

### SCHOOL OF ARTS, DESIGN AND PRINTING TECHNOLOGY
- Department of Fashion Design & Clothing Technology
- Department of Printing Technology
- Department of Fine and Applied Arts

### SCHOOL OF BUSINESS STUDIES
- Department of Business Administration & Management
- Department of Public Administration
- Department of Office Technology and Management
- Department of Marketing

### SCHOOL OF ENGINEERING TECHNOLOGY
- Department of Civil Engineering Technology
- Department of Mechanical Engineering Technology
- Department of Electrical/Electronics Engineering Technology
- Department of Agricultural and Bio Environmental Engineering Technology
- Department of Computer Engineering Technology
- Department of Chemical Engineering

### SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY
- Department of Architecture
- Department of Building Technology
- Department of Estate Management
- Department of Urban and Regional Planning
- Department of Quantity Surveying
- Department of Surveying and Geo-informatics

### SCHOOL OF FINANCIAL STUDIES
- Department of Banking and Finance
- Department of Accountancy
- Department of Insurance

### SCHOOL OF GENERAL STUDIES
- Department of Natural Science
- Department of Social Science
- Department of Languages

### SCHOOL OF INFORMATION TECHNOLOGY
- Department of Mass Communication
- Department of Library and Information Science

---

## Google Drive File Setup

1. Upload PDF to Google Drive
2. Right-click → Share → Anyone with link
3. Copy link: `https://drive.google.com/file/d/FILE_ID/view`
4. Extract FILE_ID (the long string)
5. Paste in Sheet column F

---

## Security Notes

- **Public Key** in `index.html` - safe to expose
- **Secret Key** in `api.js` - keep secure, server-side only if possible
- **Sheet ID** - make sheet "Anyone can view" for Gviz to work
- Purchases tracked in browser localStorage (device-specific)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Projects not loading | Check Sheet ID, ensure sheet is public |
| Payment not working | Verify Paystack keys, check browser console |
| Download not starting | Check Drive ID, ensure file is public |
| Department not showing | Must match exact spelling from list |

---

## License

For Cyber Sweeft Services use only.
