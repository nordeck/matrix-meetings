/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DateTime } from 'luxon';
import { setLocale } from '../../lib/locale';
import { AdapterLuxonWeekday } from './AdapterLuxonWeekday';

describe('AdapterLuxonWeekday', () => {
  const adapter = new AdapterLuxonWeekday();

  describe('for en locale', () => {
    it('generate weekdays', () => {
      expect(adapter.getWeekdays()).toEqual([
        'S',
        'M',
        'T',
        'W',
        'T',
        'F',
        'S',
      ]);
    });

    describe('for the month', () => {
      const dateTime = DateTime.fromISO('2020-01-05T00:00:00Z');

      it('week array should start on Sunday', () => {
        const weeks = adapter.getWeekArray(dateTime);
        expect(weeks[0][0].weekday).toEqual(7);
      });

      it('generate week array', () => {
        const weeks = adapter.getWeekArray(dateTime);
        expect(weeks[0].map((d) => d.toISO())).toEqual([
          '2019-12-29T00:00:00.000Z',
          '2019-12-30T00:00:00.000Z',
          '2019-12-31T00:00:00.000Z',
          '2020-01-01T00:00:00.000Z',
          '2020-01-02T00:00:00.000Z',
          '2020-01-03T00:00:00.000Z',
          '2020-01-04T00:00:00.000Z',
        ]);

        expect(weeks[weeks.length - 1].map((d) => d.toISO())).toEqual([
          '2020-01-26T00:00:00.000Z',
          '2020-01-27T00:00:00.000Z',
          '2020-01-28T00:00:00.000Z',
          '2020-01-29T00:00:00.000Z',
          '2020-01-30T00:00:00.000Z',
          '2020-01-31T00:00:00.000Z',
          '2020-02-01T00:00:00.000Z',
        ]);
      });
    });

    describe('for the month with 1st day been Sunday', () => {
      const dateTime = DateTime.fromISO('2020-03-05T00:00:00Z');

      it('generate week array', () => {
        const weeks = adapter.getWeekArray(dateTime);
        expect(weeks[0].map((d) => d.toISO())).toEqual([
          '2020-03-01T00:00:00.000Z',
          '2020-03-02T00:00:00.000Z',
          '2020-03-03T00:00:00.000Z',
          '2020-03-04T00:00:00.000Z',
          '2020-03-05T00:00:00.000Z',
          '2020-03-06T00:00:00.000Z',
          '2020-03-07T00:00:00.000Z',
        ]);

        expect(weeks[weeks.length - 1].map((d) => d.toISO())).toEqual([
          '2020-03-29T00:00:00.000Z',
          '2020-03-30T00:00:00.000Z',
          '2020-03-31T00:00:00.000Z',
          '2020-04-01T00:00:00.000Z',
          '2020-04-02T00:00:00.000Z',
          '2020-04-03T00:00:00.000Z',
          '2020-04-04T00:00:00.000Z',
        ]);
      });
    });

    describe('for the month with last day been Saturday', () => {
      const dateTime = DateTime.fromISO('2020-02-05T00:00:00Z');

      it('generate week array', () => {
        const weeks = adapter.getWeekArray(dateTime);

        expect(weeks[weeks.length - 1].map((d) => d.toISO())).toEqual([
          '2020-02-23T00:00:00.000Z',
          '2020-02-24T00:00:00.000Z',
          '2020-02-25T00:00:00.000Z',
          '2020-02-26T00:00:00.000Z',
          '2020-02-27T00:00:00.000Z',
          '2020-02-28T00:00:00.000Z',
          '2020-02-29T00:00:00.000Z',
        ]);
      });
    });
  });

  describe('for de locale', () => {
    beforeEach(() => {
      setLocale('de');
    });

    it('generate weekdays', () => {
      expect(adapter.getWeekdays()).toEqual([
        'M',
        'D',
        'M',
        'D',
        'F',
        'S',
        'S',
      ]);
    });

    describe('for the month', () => {
      const dateTime = DateTime.fromISO('2020-01-05T00:00:00Z');

      it('week array should start on Monday', () => {
        const weeks = adapter.getWeekArray(dateTime);
        expect(weeks[0][0].weekday).toEqual(1);
      });

      it('generate week array', () => {
        const weeks = adapter.getWeekArray(dateTime);
        expect(weeks[0].map((d) => d.toISO())).toEqual([
          '2019-12-30T00:00:00.000Z',
          '2019-12-31T00:00:00.000Z',
          '2020-01-01T00:00:00.000Z',
          '2020-01-02T00:00:00.000Z',
          '2020-01-03T00:00:00.000Z',
          '2020-01-04T00:00:00.000Z',
          '2020-01-05T00:00:00.000Z',
        ]);

        expect(weeks[weeks.length - 1].map((d) => d.toISO())).toEqual([
          '2020-01-27T00:00:00.000Z',
          '2020-01-28T00:00:00.000Z',
          '2020-01-29T00:00:00.000Z',
          '2020-01-30T00:00:00.000Z',
          '2020-01-31T00:00:00.000Z',
          '2020-02-01T00:00:00.000Z',
          '2020-02-02T00:00:00.000Z',
        ]);
      });
    });

    describe('for the month with 1st day been Monday', () => {
      const dateTime = DateTime.fromISO('2020-06-05T00:00:00Z');

      it('generate week array', () => {
        const weeks = adapter.getWeekArray(dateTime);
        expect(weeks[0].map((d) => d.toISO())).toEqual([
          '2020-06-01T00:00:00.000Z',
          '2020-06-02T00:00:00.000Z',
          '2020-06-03T00:00:00.000Z',
          '2020-06-04T00:00:00.000Z',
          '2020-06-05T00:00:00.000Z',
          '2020-06-06T00:00:00.000Z',
          '2020-06-07T00:00:00.000Z',
        ]);

        expect(weeks[weeks.length - 1].map((d) => d.toISO())).toEqual([
          '2020-06-29T00:00:00.000Z',
          '2020-06-30T00:00:00.000Z',
          '2020-07-01T00:00:00.000Z',
          '2020-07-02T00:00:00.000Z',
          '2020-07-03T00:00:00.000Z',
          '2020-07-04T00:00:00.000Z',
          '2020-07-05T00:00:00.000Z',
        ]);
      });
    });

    describe('for the month with last day been Sunday', () => {
      const dateTime = DateTime.fromISO('2020-05-05T00:00:00Z');

      it('generate week array', () => {
        const weeks = adapter.getWeekArray(dateTime);

        expect(weeks[weeks.length - 1].map((d) => d.toISO())).toEqual([
          '2020-05-25T00:00:00.000Z',
          '2020-05-26T00:00:00.000Z',
          '2020-05-27T00:00:00.000Z',
          '2020-05-28T00:00:00.000Z',
          '2020-05-29T00:00:00.000Z',
          '2020-05-30T00:00:00.000Z',
          '2020-05-31T00:00:00.000Z',
        ]);
      });
    });
  });
});
