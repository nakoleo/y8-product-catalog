# Y8 Landing Deploy/Update Checklist

This project is a static site. You can keep editing and redeploy quickly.

## 1) Edit content/assets
- Product data: `data/products.json`
- Product images: `assets/images/products/`
- Styles: `css/`
- Behavior: `js/`

## 2) Quick local sanity check
- Open `index.html` in browser and verify:
  - all product cards load images
  - no `undefined` text appears
  - footer/shop links still work

## 3) Deploy to Cloudflare
- In Cloudflare Workers/Pages UI, open your worker:
  - `y8-product-catalog.host-y8.workers.dev`
- Use upload deploy again with files from this folder root:
  - `index.html`, `assets/`, `css/`, `js/`, `data/`, `liff/`

## 4) Post-deploy verification
- Check site URL:
  - `https://y8-product-catalog.host-y8.workers.dev/`
- Check LIFF URL (Published):
  - `https://miniapp.line.me/2009682431-nREmiGML`
- Confirm LIFF opens your deployed page, not LINE default page.

## 5) LINE settings to keep stable
- Keep Endpoint URL (Developing/Review/Published) as:
  - `https://y8-product-catalog.host-y8.workers.dev/`
- Keep LIFF ID in `index.html`:
  - `2009682431-nREmiGML`
