# Colonel Badasu Portfolio

A premium personal portfolio website for Colonel Henry Kwaku Badasu. The application presents his professional profile, career history, education, achievements, awards, and gallery in a clean white, black, and military-green visual style.

## Overview

This project is a React, TypeScript, and Vite single-page application. It uses local images from `src/assets/images/` and React Router for internal navigation across the portfolio pages.

The site is designed to feel professional, personal, and responsive, with subtle animations, optimized image loading, and route-level scroll restoration.

## Main Pages

- Home
- Biography
- Career
- Achievements
- Awards
- Education
- Gallery

## Key Features

- Personal hero section for Colonel Badasu
- Animated hero text and image slideshow
- Hero slideshow changes every 7 seconds
- Cloudinary-backed Gallery collections with a local optimized fallback
- Lazy loading for below-the-fold images
- First hero image preload for faster initial rendering
- Reusable Back button on internal pages
- Reusable floating Scroll-to-Top button
- Route navigation that opens each page at the top
- Footer hidden on Biography, Career, and Awards pages
- Minimal portfolio-focused footer on other pages
- Responsive layout for desktop and mobile

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- Framer Motion
- Lucide React
- Yet Another React Lightbox
- Tailwind CSS integration

## Project Structure

```text
src/
  assets/images/        Local portfolio images
  components/           Reusable UI components
  data/                 Officer profile, image, career, award, and education data
  pages/                Application pages
  App.tsx               App shell and routes
  index.css             Global styling
  main.tsx              React entry point
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Content Notes

The application uses supplied profile content and placeholder wording where full biographical detail is not yet available. Avoid adding unverified appointments, achievements, dates, organizations, contact details, or social media accounts.

## Image Notes

The public Gallery reads Cloudinary folders through the Vercel serverless endpoint in `api/gallery.js`. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and optionally `CLOUDINARY_GALLERY_ROOT` in Vercel or a local `.env` file. Never expose `CLOUDINARY_API_SECRET` through `VITE_` variables or frontend code.

Local images in `src/assets/images/` remain available as a development fallback and are optimized by `scripts/optimize-images.mjs`.
