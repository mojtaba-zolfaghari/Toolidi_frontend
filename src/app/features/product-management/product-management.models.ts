/** تصویر محلی (آماده آپلود به سرور) */
export interface LocalImage {
  id?: string;
  dataUrl: string;
  altText: string;
  isPrimary: boolean;
}

/** مقدار یک ویژگی (با تصویر اختیاری - client-only) */
export interface AttributeValue {
  id?: string;
  value: string;
  image?: string;
}

/** گروه ویژگی: نام + چند مقدار */
export interface AttributeGroup {
  name: string;
  values: AttributeValue[];
}

/** تنوع محصول */
export interface VariationItem {
  id?: string;
  sku: string;
  displayName: string;
  priceAdjustment: number;
  stockQuantity: number;
  isDefault: boolean;
}
