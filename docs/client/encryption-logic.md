# Encryption Logic (`encrypt.ts`)

This document explains the functionality of the `encrypt.ts` file, which is used to securely encrypt and decrypt sensitive strings (like GitHub Personal Access Tokens) before storing them in the database.

## Overview
The file uses Node.js's built-in `crypto` module to perform **AES-256-CBC** symmetric encryption. This means the same secret key is used for both encrypting and decrypting the data.

## Line-by-Line Explanation

### Setup and Configuration

```typescript
import crypto from 'crypto';
```
Imports the built-in Node.js `crypto` library, which provides cryptographic functionality like ciphers, hashes, and random number generation.

```typescript
const algortihm = "aes-256-cbc"
```
Defines the encryption algorithm. 
- **AES (Advanced Encryption Standard)** is an industry-standard encryption algorithm.
- **256** refers to the key size (256 bits or 32 bytes), providing a very high level of security.
- **CBC (Cipher Block Chaining)** is a mode of operation that mixes each block of text with the previous encrypted block, ensuring that identical plaintexts encrypt to different ciphertexts (when combined with a unique Initialization Vector).

```typescript
const key = process.env.ENCRYPTION_KEY!
```
Retrieves the secret encryption key from the environment variables. 
> [!IMPORTANT]
> The `ENCRYPTION_KEY` **must be exactly 32 bytes (64 hex characters) long** to work with `aes-256`. The `!` tells TypeScript we are confident this value exists and won't be undefined.

---

### The `encrypt` Function

```typescript
export function encrypt(text:string){
```
Exports the `encrypt` function, which takes a plain text string as input.

```typescript
    const iv=crypto.randomBytes(16)
```
Generates a random **Initialization Vector (IV)** of 16 bytes. The IV is crucial for CBC mode; it ensures that encrypting the same text multiple times will result in different encrypted outputs, protecting against pattern attacks. The IV does not need to be secret, but it *must* be unique for every encryption.

```typescript
    const cipher = crypto.createCipheriv(algortihm,Buffer.from(key),iv)
```
Creates the `Cipher` object using the defined algorithm, the secret key (converted to a Buffer), and the randomly generated IV.

```typescript
    const encrypted = Buffer.concat([cipher.update(text),cipher.final()])
```
Encrypts the actual text. 
- `cipher.update(text)` encrypts the main body of the text.
- `cipher.final()` finalizes the encryption and pads any remaining blocks.
- `Buffer.concat` merges the results into a single buffer.

```typescript
    return iv.toString("hex") + ":"+ encrypted.toString("hex")
}
```
Returns a single string containing both the IV and the encrypted text, separated by a colon (`:`). Both are converted to hexadecimal strings. *We must store the IV alongside the ciphertext because it is required for decryption.*

---

### The `decrypt` Function

```typescript
export function decrypt(text: string) {
    // 1. Guard against non-string, null, undefined, or empty values
    if (typeof text !== 'string' || !text) {
        return '';
    }
```
* **Defense-in-depth Guard:** Prior to processing, the utility strictly checks the input's runtime type. If `text` is `null`, `undefined`, a number, or an empty string, it immediately exits and returns `""`, completely preventing uncaught `TypeError` crashes during string manipulations.

```typescript
    // 2. If it does not contain a colon, it's likely legacy or already plaintext
    if (!text.includes(':')) {
        return text;
    }
```
* **Plaintext Detection:** If the string does not contain a colon separator (`:`), it is classified as already decrypted or legacy plaintext (e.g., standard API keys saved before encryption was introduced) and returned unchanged.

```typescript
    try {
        const [ivHex, encryptedHex] = text.split(":");
        
        // 3. Ensure both parts exist
        if (!ivHex || !encryptedHex) {
            return text;
        }
```
* **Format Split:** Safely splits the encrypted string at the colon (`:`) to extract the IV and ciphertext. If either side is missing or empty, it gracefully returns the original input.

```typescript
        // 4. Validate that ivHex is exactly 32 hex characters (16 bytes IV)
        // and encryptedHex contains only valid hex characters
        const hexRegex = /^[0-9a-fA-F]+$/;
        if (ivHex.length !== 32 || !hexRegex.test(ivHex) || !hexRegex.test(encryptedHex)) {
            return text;
        }
```
* **Structural Layout Validation:** Checks two critical cryptographic constraints:
  1. The `ivHex` must be exactly 32 hexadecimal characters long (which represents a 16-byte IV required for the `aes-256-cbc` algorithm). If the IV length is incorrect, `crypto` will crash with `Invalid IV length`.
  2. Both `ivHex` and `encryptedHex` must consist exclusively of valid hexadecimal characters (`0-9`, `a-f`). If invalid hex characters are parsed, `Buffer.from()` fails.
  * If either constraint is violated, the function aborts and returns the original string.

```typescript
        const iv = Buffer.from(ivHex, "hex");
        const encryptedText = Buffer.from(encryptedHex, "hex");

        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        const decrypted = Buffer.concat([
            decipher.update(encryptedText),
            decipher.final(),
        ]);

        return decrypted.toString();
```
* **Cryptographic Decryption:** Converts the clean hexadecimal strings back into binary Buffers, instantiates the decipher, processes the ciphertext blocks, and returns the successfully decrypted UTF-8 plain-text string.

```typescript
    } catch (error) {
        console.warn("[Decryption Utility] Failed to decrypt, returning original text:", error);
        return text;
    }
}
```
* **Exception Shield (Try-Catch):** Wraps the entire operation in a structured exception handler. If decryption fails at any step (e.g., due to key mismatch, data corruption, signature/padding failures, or `bad decrypt`), the warning is logged to the console, and the original string is returned gracefully rather than crashing the thread.

> [!TIP]
> This defensive design achieves absolute crash-resilience, ensuring that no database record (even if malformed or legacy plain-text) can ever bring down Recovera's server!
