
// Simple XOR-based "Encryption" for the Burner Chat
// Not military grade, but sufficient to obfuscate messages on the wire for a game/sim context.
// In a real production app, use Web Crypto API (SubtleCrypto) with proper key exchange.

const SALT = "CYBERPUNK_RETAIL_PROTOCOL_V1";

export const scramble = (text: string, key: string): string => {
    try {
        const combinedKey = key + SALT;
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ combinedKey.charCodeAt(i % combinedKey.length);
            result += String.fromCharCode(charCode);
        }
        return btoa(result); // Base64 encode to make it transport safe
    } catch (e) {
        return text;
    }
};

export const unscramble = (base64: string, key: string): string => {
    try {
        const text = atob(base64);
        const combinedKey = key + SALT;
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ combinedKey.charCodeAt(i % combinedKey.length);
            result += String.fromCharCode(charCode);
        }
        return result;
    } catch (e) {
        return "[ENCRYPTED DATA]";
    }
};
