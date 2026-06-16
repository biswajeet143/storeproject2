# How to Add Products to ArtStore

Every time you add, edit, or delete a product, follow these 3 steps to make it visible to all visitors:

## Step-by-step

### 1. Open Admin Panel
Go to `https://your-site.github.io/login.html`  
Password: **biswajeet**

### 2. Add / Edit your products
- Click **Add Product** in the sidebar
- Fill in name, price, category, description
- Upload an image (or leave blank for auto-placeholder)
- Click **Save Product**

### 3. Publish to GitHub
Click the green **"Publish (Download JSON)"** button in the top bar.

This downloads a file named **`products.json`**.

Then go to your GitHub repository:
1. Find `products.json` in the root of the repo
2. Click it → click the ✏️ pencil (edit) icon → then click "Upload files" tab  
   **OR** drag the new `products.json` onto the page
3. Click **"Commit changes"**
4. Wait ~30 seconds for GitHub Pages to rebuild
5. Refresh your store → products are live for everyone! 🎉

---

## Why this works

Your website does:
```
fetch('products.json')   ← loaded from GitHub, same for ALL visitors
```

When you commit a new `products.json`, every visitor gets the updated file on their next page load.

---

## Tips

- The admin panel saves changes to your **browser** instantly (LocalStorage)
- Until you Publish + commit, only you can see the changes
- You can add multiple products before publishing — one commit covers everything
- If you switch computers, use **Import** in the Publish section to load the latest products.json into that browser before editing
