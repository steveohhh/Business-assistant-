/**
 * Standardizes floating point numbers to 2 decimal places to prevent
 * JavaScript epsilon errors (e.g., 0.1 + 0.2 !== 0.3).
 */
export const safeFloat = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Formats a number as a currency string.
 */
export const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
};

/**
 * Parses a string input into a safe float, handling empty strings as 0.
 */
export const parseInput = (val: string): number => {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return 0;
    return safeFloat(parsed);
};