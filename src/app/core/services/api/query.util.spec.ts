import { buildQueryString } from './query.util';

describe('buildQueryString', () => {
  it('serializes provided values and omits empty values', () => {
    expect(buildQueryString({ page: 2, isActive: false, search: '', missing: undefined })).toBe('?page=2&isActive=false');
  });

  it('returns an empty string when no parameters are provided', () => {
    expect(buildQueryString()).toBe('');
  });
});
