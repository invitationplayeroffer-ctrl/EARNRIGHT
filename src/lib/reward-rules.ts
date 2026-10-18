export const SIGNUP_BONUS = 5;
export const MIN_CASHOUT = 20;
export const ADMIN_AWARD = 10;
export const STACK_REWARD = 0.01;
export const STACK_WAIT_SECONDS = 3;
export const OFFER_AD_URL = 'https://www.profitableratecpmnetwork.com/vwikgawy61?key=2733a9f76350db8589179208af49683e';
export const BOX_MIN = 0.05;
export const BOX_MAX = 0.1;
export const BOX_WAIT_SECONDS = 5;
export const BOX_COOLDOWN_MINUTES = 10;
export function canCashout(balance: number, amount: number) {
  return Number.isFinite(amount) && amount >= MIN_CASHOUT && amount <= balance;
}
