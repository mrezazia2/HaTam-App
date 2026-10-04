export function asciiDigits(value: string) {
  return asciiNumerals(value)
    .replace(/\D/g, "");
}

export function asciiNumerals(value: string) {
  return value
    .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 1632));
}

export function normalizeMobile(value: string) {
  const digits = asciiDigits(value);
  if (/^989\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^9\d{9}$/.test(digits)) return `0${digits}`;
  return /^09\d{9}$/.test(digits) ? digits : null;
}

export function mobileInput(value: string) {
  return (normalizeMobile(value) || asciiDigits(value)).slice(0, 11);
}
