# toolidi.ir - Angular Frontend

This project is the frontend for toolidi.ir, an e-commerce platform for Iranian and Persian-speaking users.

## Structure

- `src/app/core/` - Core module (singleton services, guards, interceptors, utils)
- `src/app/shared/` - Shared components, directives, pipes
- `src/app/features/` - Feature modules (home, shop, product, cart, checkout, etc.)
- `src/app/admin/` - Admin panel module (lazy loaded)
- `src/app/app.routes.ts` - Application routing (lazy loaded features)
- `src/app/app.module.ts` - Root module
- `src/app/app.component.ts` - Root component
- `src/styles.scss` - Global styles (RTL, Tailwind base)
- `tailwind.config.js` - Tailwind CSS configuration with RTL plugin and Vazirmatn font
- `frontend/demo/index.html` - Visual demo skeleton for the homepage (self-contained HTML with inline Tailwind)

## Features

- Angular 18
- Tailwind CSS with RTL support
- Vazirmatn font (Persian)
- Lazy loaded feature modules
- Performance optimizations (OnPush change detection, lazy loading)
- Admin panel (lazy loaded)
- Responsive design

## Development

1. Install dependencies: `npm install`
2. Start development server: `ng serve`
3. Build for production: `ng build --prod`

## Demo

Open `frontend/demo/index.html` in a browser to see the visual demo of the homepage.