# QR Code Generator

A fast, client-side QR code generator built with Next.js 16 and React 19. No server, no data collection — everything runs in the browser.

**Live demo:** [qr-code-generator.vercel.app](https://qr-code-generator.vercel.app)

---

## Features

- Instant QR code preview as you type
- Customizable foreground and background colors (presets + full color picker)
- Error correction levels: L, M, Q, H
- Adjustable size (128px – 512px)
- Download as **SVG** or **PNG**
- Dark mode support
- Zero external API calls — fully client-side

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| QR rendering | [react-qr-code](https://github.com/rosskhanas/react-qr-code) |
| Language | TypeScript |
| Deployment | [Vercel](https://vercel.com) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Local development

```bash
git clone https://github.com/Yohannes33/qr-code-generator.git
cd qr-code-generator
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm start
```

## Project Structure

```
app/
├── layout.tsx      # Root layout with font and metadata setup
├── page.tsx        # Main QR generator UI (single-page app)
└── globals.css     # Tailwind base styles and CSS variables
```

## Deployment

Deployed on Vercel. To deploy your own instance:

1. Fork this repo
2. Import it at [vercel.com/new](https://vercel.com/new)
3. Click **Deploy** — no environment variables needed

Or via CLI:

```bash
npx vercel --prod
```

## License

MIT
