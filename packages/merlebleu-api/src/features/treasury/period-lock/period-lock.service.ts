import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/** YYYY-MM-DD to DD/MM/YYYY */
export const toFrenchDate = (date: string): string =>
  `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;

/**
 * Once the cash is closed, the movements dated up to the closing day are frozen.
 * Every write that creates or changes such a movement goes through `assertOpen`.
 */
@Injectable()
export class PeriodLockService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Date of the latest closing (YYYY-MM-DD), null when the cash was never closed. */
  async getLockedUntil(): Promise<string | null> {
    const [row] = await this.dataSource.query<{ lockedUntil: string | null }[]>(
      `SELECT MAX(date)::text AS "lockedUntil" FROM cash_closings`,
    );
    return row?.lockedUntil ?? null;
  }

  /** Throws when one of the dates falls in a closed period. Empty dates are ignored. */
  async assertOpen(...dates: (string | null | undefined)[]): Promise<void> {
    const lockedUntil = await this.getLockedUntil();
    if (!lockedUntil) {
      return;
    }
    // an ISO datetime is stored as its calendar day, like the `date` columns do
    if (dates.some((date) => date && date.slice(0, 10) <= lockedUntil)) {
      throw new BadRequestException(
        `Cette date est dans une période clôturée (jusqu'au ${toFrenchDate(lockedUntil)}). Choisis une date postérieure ou demande de rouvrir la clôture.`,
      );
    }
  }
}
