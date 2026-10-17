import { describe, expect, it } from 'vitest';
import { ADMIN_AWARD, SIGNUP_BONUS, STACK_REWARD, STACK_WAIT_SECONDS, canCashout } from '@/lib/reward-rules';

describe('EarnRight reward rules', () => {
  it('gives new players five USD', () => expect(SIGNUP_BONUS).toBe(5));
  it('requires twenty USD and sufficient balance to cash out', () => {
    expect(canCashout(20, 19.99)).toBe(false);
    expect(canCashout(20, 20)).toBe(true);
    expect(canCashout(19.99, 20)).toBe(false);
  });
  it('awards ten USD from the admin action', () => expect(ADMIN_AWARD).toBe(10));
  it('requires three seconds for a one-cent Stack reward', () => {
    expect(STACK_WAIT_SECONDS).toBe(3);
    expect(STACK_REWARD).toBe(0.01);
  });
});
