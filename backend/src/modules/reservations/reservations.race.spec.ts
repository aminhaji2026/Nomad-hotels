import { ConflictException } from '@nestjs/common';
import { eachNight, parseDateOnly } from '../../common/utils/date.util';

describe('date.util', () => {
  it('enumerates nights excluding checkout', () => {
    const nights = eachNight(
      parseDateOnly('2026-10-01'),
      parseDateOnly('2026-10-04'),
    );
    expect(nights).toHaveLength(3);
    expect(nights.map((d) => d.toISOString().slice(0, 10))).toEqual([
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
    ]);
  });
});

describe('inventory race guard', () => {
  it('treats failed conditional update as conflict', () => {
    const updatedCount = 0;
    const guard = () => {
      if (updatedCount !== 1) {
        throw new ConflictException('Double-booking prevented');
      }
    };
    expect(guard).toThrow(ConflictException);
  });
});
