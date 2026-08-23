/** A province and its official capital used by frontend selectors and labels. */
export interface IranLocation {
  province: string;
  city: string;
}

/** Coordinates used by the animated delivery visualizations. */
export interface IranMapCity {
  name: string;
  lat: number;
  lng: number;
}

/**
 * The 31 Iranian provinces and their provincial capitals.
 * This is the single frontend registry for geography labels and selectors.
 */
export const IRAN_LOCATIONS: readonly IranLocation[] = [
  { province: 'آذربایجان شرقی', city: 'تبریز' },
  { province: 'آذربایجان غربی', city: 'ارومیه' },
  { province: 'اردبیل', city: 'اردبیل' },
  { province: 'اصفهان', city: 'اصفهان' },
  { province: 'البرز', city: 'کرج' },
  { province: 'ایلام', city: 'ایلام' },
  { province: 'بوشهر', city: 'بوشهر' },
  { province: 'تهران', city: 'تهران' },
  { province: 'چهارمحال و بختیاری', city: 'شهرکرد' },
  { province: 'خراسان جنوبی', city: 'بیرجند' },
  { province: 'خراسان رضوی', city: 'مشهد' },
  { province: 'خراسان شمالی', city: 'بجنورد' },
  { province: 'خوزستان', city: 'اهواز' },
  { province: 'زنجان', city: 'زنجان' },
  { province: 'سمنان', city: 'سمنان' },
  { province: 'سیستان و بلوچستان', city: 'زاهدان' },
  { province: 'فارس', city: 'شیراز' },
  { province: 'قزوین', city: 'قزوین' },
  { province: 'قم', city: 'قم' },
  { province: 'کردستان', city: 'سنندج' },
  { province: 'کرمان', city: 'کرمان' },
  { province: 'کرمانشاه', city: 'کرمانشاه' },
  { province: 'کهگیلویه و بویراحمد', city: 'یاسوج' },
  { province: 'گلستان', city: 'گرگان' },
  { province: 'گیلان', city: 'رشت' },
  { province: 'لرستان', city: 'خرم‌آباد' },
  { province: 'مازندران', city: 'ساری' },
  { province: 'مرکزی', city: 'اراک' },
  { province: 'هرمزگان', city: 'بندرعباس' },
  { province: 'همدان', city: 'همدان' },
  { province: 'یزد', city: 'یزد' }
];

/** Capital city labels for select controls. */
export const IRAN_PROVINCE_NAMES = IRAN_LOCATIONS.map((location) => location.province);

/** City labels for select controls. */
export const IRAN_CITY_NAMES = IRAN_LOCATIONS.map((location) => location.city);

/** Main Iranian cities shown on the live delivery globe. */
export const IRAN_MAP_CITIES: readonly IranMapCity[] = [
  { name: 'تهران', lat: 35.69, lng: 51.39 },
  { name: 'مشهد', lat: 36.30, lng: 59.61 },
  { name: 'شیراز', lat: 29.59, lng: 52.58 },
  { name: 'اصفهان', lat: 32.65, lng: 51.67 },
  { name: 'تبریز', lat: 38.08, lng: 46.29 },
  { name: 'اهواز', lat: 31.32, lng: 48.67 },
  { name: 'کرج', lat: 35.84, lng: 50.94 },
  { name: 'قم', lat: 34.64, lng: 50.88 },
  { name: 'کرمان', lat: 30.28, lng: 57.08 },
  { name: 'زاهدان', lat: 29.50, lng: 60.86 },
  { name: 'رشت', lat: 37.28, lng: 49.59 },
  { name: 'همدان', lat: 34.80, lng: 48.51 },
  { name: 'بندرعباس', lat: 27.18, lng: 56.28 },
  { name: 'ارومیه', lat: 37.55, lng: 45.08 },
  { name: 'یزد', lat: 31.90, lng: 54.36 }
];

/** Named routes used to animate the delivery network on the Iran map. */
export const IRAN_MAP_CONNECTIONS: readonly [string, string][] = [
  ['تهران', 'کرج'], ['تهران', 'قم'], ['تهران', 'اصفهان'],
  ['تهران', 'مشهد'], ['اصفهان', 'شیراز'], ['تبریز', 'ارومیه'],
  ['اهواز', 'شیراز'], ['تهران', 'همدان'], ['تبریز', 'تهران'],
  ['مشهد', 'زاهدان'], ['کرمان', 'اهواز'], ['یزد', 'کرمان'],
  ['یزد', 'اصفهان'], ['قم', 'همدان']
];

/** Returns the capital city for a province, or an empty value when unknown. */
export function getCapitalCity(province: string | null | undefined): string {
  return IRAN_LOCATIONS.find((location) => location.province === province)?.city ?? '';
}
