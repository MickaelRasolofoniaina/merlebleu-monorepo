import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { PeriodLockService, toFrenchDate } from './period-lock.service';

describe('PeriodLockService', () => {
  let service: PeriodLockService;
  let query: jest.Mock<(...args: any[]) => any>;

  const closedUntil = (date: string | null) =>
    query.mockResolvedValue([{ lockedUntil: date }]);

  beforeEach(async () => {
    query = jest.fn<(...args: any[]) => any>();
    const module = await Test.createTestingModule({
      providers: [
        PeriodLockService,
        { provide: getDataSourceToken(), useValue: { query } },
      ],
    }).compile();
    service = module.get(PeriodLockService);
  });

  it('accepts any date when the cash was never closed', async () => {
    closedUntil(null);

    await expect(service.assertOpen('2020-01-01')).resolves.toBeUndefined();
  });

  it('refuses a date up to the closing day, included', async () => {
    closedUntil('2026-09-30');

    await expect(service.assertOpen('2026-09-30')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.assertOpen('2026-09-01')).rejects.toThrow(
      /jusqu'au 30\/09\/2026/,
    );
  });

  it('accepts the day after the closing', async () => {
    closedUntil('2026-09-30');

    await expect(service.assertOpen('2026-10-01')).resolves.toBeUndefined();
  });

  it('reads an ISO datetime as its calendar day, like the date columns do', async () => {
    closedUntil('2026-09-30');

    await expect(
      service.assertOpen('2026-09-30T22:00:00.000Z'),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.assertOpen('2026-10-01T00:00:00.000Z'),
    ).resolves.toBeUndefined();
  });

  it('ignores empty dates and refuses as soon as one date is closed', async () => {
    closedUntil('2026-09-30');

    await expect(
      service.assertOpen(null, undefined, '2026-10-05'),
    ).resolves.toBeUndefined();
    await expect(
      service.assertOpen('2026-10-05', '2026-09-10'),
    ).rejects.toThrow(BadRequestException);
  });

  it('formats a day for the user', () => {
    expect(toFrenchDate('2026-09-30')).toBe('30/09/2026');
  });
});
