// ═══════════════════════════════════════════════════════════════════════
// TASK-FE-PRODUCT-DETAIL-INFO — product info section shapes
// ═══════════════════════════════════════════════════════════════════════

/** گواهی محصول (ISO / CE / RoHS / Halal و …) */
export interface CertificationEntry {
  code: string;           // مثال: 'ISO9001', 'CE', 'RoHS', 'Halal'
  title: string;          // مثال: 'گواهی استاندارد ISO 9001'
  description: string;    // متن توضیح که در tooltip نمایش داده می‌شود
  icon: string;           // نام mat-icon (یا ikon دلخواه)
}

/** سطح قیمت پلکانی بر اساس تعداد (MOQ-based tier pricing) */
export interface PriceTier {
  minQty: number;         // حداقل تعداد برای این سطوح
  unitPrice: number;      // قیمت واحد در این سطوح (تومان)
  discountPercent?: number; // درصد تخفیف نسبت به قیمت پایه (اختیاری)
}

/** روش ارسال */
export interface ShippingMethod {
  id: string;
  name: string;           // مثال: 'پست normals', 'پی سی پی', 'اشتراکی'
  byCity: boolean;
  byNationwide: boolean;
  deliveryDays?: number;  // روز کاری تخمینی (در صورت وجود)
  cost?: number;          // هزینه تخمینی (تومان) — در صورت وجود
  note?: string;          // یادداشت 만한
}

/** اطلاعات ارسال محصول */
export interface ShippingInfo {
  city: string;
  cityDays: number;
  nationwideDays: number;
  methods: ShippingMethod[];
  moq?: number;           // حداقل تعداد سفارش (در صورت وجود)
  leadTimeNote?: string;  // یادداشت مخصوص زمان تولید (در صورت وجود)
}

/** خلاصه سیاست بازگشت وجه */
export interface RefundPolicySummary {
  short: string;          // خلاصه کوتاه (یک خط)
  detailUrl: string;      // لینک به صفحه سیاست کامل
  highlight?: string;     // 강조사항 مهم (در صورت وجود)
}

/** یک سوال و جواب در بخش Q&A */
export interface QnaItem {
  question: string;
  answer: string;
  askedBy?: string;
  askedAt?: string;       // تاریخ درخواست (در صورت وجود)
}

/** بسته‌ی کامل اطلاعات اضافی محصول */
export interface ProductInfoSections {
  certifications?: CertificationEntry[];
  tieredPricing?: PriceTier[];
  shippingInfo?: ShippingInfo;
  refundPolicy?: RefundPolicySummary;
  qaItems?: QnaItem[];
}
