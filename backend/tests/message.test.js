import { calculateScheduledDelay } from '../src/services/message.service.js';

describe('Message Service - Delay Calculation Unit Tests', () => {
  it('should calculate delay for future date correctly', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const dayStr = futureDate.toISOString().split('T')[0];

    const { targetDate, delayMs } = calculateScheduledDelay(dayStr, '12:00:00');

    expect(targetDate).toBeInstanceOf(Date);
    expect(delayMs).toBeGreaterThan(0);
  });

  it('should throw error for past date', () => {
    expect(() => {
      calculateScheduledDelay('2020-01-01', '10:00:00');
    }).toThrow('Scheduled time must be in the future');
  });

  it('should throw error for invalid day string format', () => {
    expect(() => {
      calculateScheduledDelay('invalid-date', '12:00');
    }).toThrow('System Error: Invalid date passed to service layer.');
  });

  it('should throw error on invalid time format', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const dayStr = futureDate.toISOString().split('T')[0];

    expect(() => {
      calculateScheduledDelay(dayStr, 'invalid-time');
    }).toThrow('Invalid time format');
  });
});
