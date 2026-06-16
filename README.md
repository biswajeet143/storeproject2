# ArtStore 🎨

A complete static e-commerce store for handmade art. No backend, no database — runs entirely in the browser using LocalStorage.

## Features
- 🛍 Customer storefront with product grid, search, category filters & sort
- 🛒 Shopping cart with quantity controls
- 📦 Checkout with WhatsApp order integration
- 🔐 Admin panel (password: `biswajeet`) with full product CRUD
- 📸 Base64 image upload & preview
- 🌙 Dark / light mode toggle
- 📤 Import / Export products as JSON
- 🔔 Toast notifications & loading spinner

## Pages
| File | Purpose |
|------|---------|
| `index.html` | Customer storefront |
| `cart.html` | Shopping cart |
| `checkout.html` | Checkout & WhatsApp order |
| `login.html` | Admin login |
| `admin.html` | Admin panel |

## Deploy to GitHub Pages
1. Push all files to a GitHub repository
2. Go to **Settings → Pages**
3. Set Source to `main` branch, `/ (root)` folder
4. Save — your store is live at `https://username.github.io/repo-name`

## Admin
- URL: `/login.html`
- Password: `biswajeet`

## WhatsApp
Orders are sent to **+91 8789484462** via `wa.me` link.

## Data
All data lives in `localStorage` in the visitor's browser. Use **Export JSON** in the admin panel to back up products regularly.
