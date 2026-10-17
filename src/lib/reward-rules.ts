export const SIGNUP_BONUS = 5;
export const MIN_CASHOUT = 20;
export const ADMIN_AWARD = 10;
export const STACK_REWARD = 0.01;
export const STACK_WAIT_SECONDS = 3;
export function canCashout(balance: number, amount: number) {
  return Number.isFinite(amount) && amount >= MIN_CASHOUT && amount <= balance;
}
