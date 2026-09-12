import {
  generateOtp,
  hashPassword,
  hashToken,
  verifyPassword,
} from './crypto.util';

describe('crypto.util', () => {
  it('hashes and verifies passwords', async () => {
    const hash = await hashPassword('ChangeMe123!');
    expect(await verifyPassword(hash, 'ChangeMe123!')).toBe(true);
    expect(await verifyPassword(hash, 'wrong')).toBe(false);
  });

  it('hashes tokens deterministically', () => {
    expect(hashToken('abc')).toEqual(hashToken('abc'));
    expect(hashToken('abc')).not.toEqual(hashToken('abcd'));
  });

  it('generates numeric otps', () => {
    expect(generateOtp(6)).toMatch(/^\d{6}$/);
  });
});
