import { LoadChildren, Route, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

/**
 * قالب پنل (سایدبار) به‌صورت lazy بارگذاری می‌شود تا Angular Material
 * از باندل اولیه خارج بماند و فقط با ورود به پنل‌ها دانلود شود.
 */
const loadAdminLayout = () =>
  import('./shared/panel/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent);

const loadHomeChildren = () => import('./features/home/home.module').then(m => m.HomeModule);
const loadSearchChildren = () => import('./features/search/search.module').then(m => m.SearchModule);
const loadShopChildren = () => import('./features/shop/shop.module').then(m => m.ShopModule);
const loadProductChildren = () => import('./features/product/product.module').then(m => m.ProductModule);
const loadBlogChildren = () => import('./features/blog/blog.module').then(m => m.BlogModule);
const loadContactChildren = () => import('./features/contact/contact.module').then(m => m.ContactModule);
const loadDealsChildren = () => import('./features/deals/deals.module').then(m => m.DealsModule);
const loadTopPerformersChildren = () => import('./features/top-performers/top-performers.module').then(m => m.TopPerformersModule);
const loadShippingChildren = () => import('./features/shipping/shipping.module').then(m => m.ShippingModule);
const loadAuthChildren = () => import('./features/auth/auth.module').then(m => m.AuthModule);
const loadProfileChildren = () => import('./features/profile/profile.module').then(m => m.ProfileModule);
const loadOrdersChildren = () => import('./features/orders/orders.module').then(m => m.OrdersModule);
const loadCartChildren = () => import('./features/cart/cart.module').then(m => m.CartModule);
const loadCheckoutChildren = () => import('./features/checkout/checkout.module').then(m => m.CheckoutModule);
const loadSellerChildren = () => import('./features/seller/seller.module').then(m => m.SellerModule);
const loadSupplierChildren = () => import('./features/supplier/supplier.module').then(m => m.SupplierModule);
const loadAgentChildren = () => import('./features/agent/agent.module').then(m => m.AgentModule);
const loadAdminChildren = () => import('./features/admin/admin.module').then(m => m.AdminModule);

/** مسیرهای محافظت‌شده‌ی پنل: قالب lazy + ماژول feature لِزی به‌عنوان فرزند */
const panelRoute = (path: string, guards: NonNullable<Route['canActivate']>, loadChildren: LoadChildren): Route => ({
  path,
  canActivate: guards,
  children: [
    {
      path: '',
      loadComponent: loadAdminLayout,
      children: [
        { path: '', loadChildren }
      ]
    }
  ]
});

export const routes: Routes = [
  {
    path: '',
    loadChildren: loadHomeChildren
  },
  {
    path: 'search',
    loadChildren: loadSearchChildren
  },
  {
    path: 'shop',
    loadChildren: loadShopChildren
  },
  {
    path: 'product',
    loadChildren: loadProductChildren
  },
  {
    path: 'blog',
    loadChildren: loadBlogChildren
  },
  {
    path: 'contact',
    loadChildren: loadContactChildren
  },
  {
    path: 'deals',
    loadChildren: loadDealsChildren
  },
  {
    path: 'top-performers',
    loadChildren: loadTopPerformersChildren
  },
  {
    path: 'shipping',
    loadChildren: loadShippingChildren
  },
  {
    path: 'auth',
    loadChildren: loadAuthChildren
  },
  { path: 'login', redirectTo: 'auth/login' },
  { path: 'register', redirectTo: 'auth/register' },

  // مسیرهای محافظت‌شده — نیازمند ورود
  {
    path: 'profile',
    loadChildren: loadProfileChildren,
    canActivate: [AuthGuard]
  },
  {
    path: 'orders',
    loadChildren: loadOrdersChildren,
    canActivate: [AuthGuard]
  },
  {
    path: 'cart',
    loadChildren: loadCartChildren,
    canActivate: [AuthGuard]
  },
  {
    path: 'checkout',
    loadChildren: loadCheckoutChildren,
    canActivate: [AuthGuard]
  },

  // مسیرهای ویژه‌ی نقش — قالب مشترک پنل (lazy)
  panelRoute('seller', [AuthGuard, RoleGuard('Seller', 'Admin')], loadSellerChildren),
  panelRoute('supplier', [AuthGuard], loadSupplierChildren),
  panelRoute('agent', [AuthGuard, RoleGuard('Agent', 'Admin')], loadAgentChildren),
  panelRoute('admin', [AuthGuard, RoleGuard('Admin')], loadAdminChildren),

  { path: '**', redirectTo: '' }
];
