// Seed helper


// PBKDF2 parameters matching messages.tsx client-side
// Salt is randomly generated during registration, but for a seeded static owner "as"
// we can use a hardcoded static salt: "000102030405060708090a0b0c0d0e0f"
//
// Let's write a small script to compute the passwordHash, salt, and ECDH keypair locally 
// using Node's native Web Crypto API, then print the values so we can insert them into MongoDB.

const crypto = globalThis.crypto;

async function seedAdmin() {
  const username = "as";
  const password = "as12345";
  const saltHex = "000102030405060708090a0b0c0d0e0f";
  const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  // 1. Calculate passwordHash
  const encoder = new TextEncoder();
  const data = encoder.encode(username + password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const passwordHash = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  // 2. Generate ECDH Keypair
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );

  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

  // 3. Derive KDF key from password + salt using PBKDF2
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const kdfKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  // 4. Encrypt the private key JWK using derived KDF key
  const privKeyBytes = encoder.encode(JSON.stringify(privateKeyJwk));
  const ivHex = "101112131415161718191a1b";
  const ivBytes = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  const cipherBytes = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    kdfKey,
    privKeyBytes
  );

  const ciphertextHex = Array.from(new Uint8Array(cipherBytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const encryptedPrivateKey = {
    iv: ivHex,
    ciphertext: ciphertextHex
  };

  console.log("Seeding data:");
  console.log("passwordHash:", passwordHash);
  console.log("publicKey:", JSON.stringify(publicKeyJwk));
  console.log("encryptedPrivateKey:", JSON.stringify(encryptedPrivateKey));
  console.log("salt:", saltHex);
}

seedAdmin();
