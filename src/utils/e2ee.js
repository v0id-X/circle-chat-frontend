
import sodium from 'libsodium-wrappers-sumo';
    
export const toB64String = (data) => {
    return sodium.to_base64(data, sodium.base64_variants.ORIGINAL);
};

export const toString = (data) => {
    return sodium.to_string(data);
};

export const toBinFromB64 = (data) => {
    return sodium.from_base64(data, sodium.base64_variants.ORIGINAL);
};

export const toBinFromString = (data) => {
    return sodium.from_string(data);
};

export const generateAndWrapKeys = async (password) => {

    await sodium.ready;

    const SALT_LEN = sodium.crypto_pwhash_SALTBYTES || 16;
    const NONCE_LEN = sodium.crypto_secretbox_NONCEBYTES || 24;
    const KEY_LEN = sodium.crypto_secretbox_KEYBYTES || 32;
    const OPS_LIMIT = sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE || 2;
    const MEM_LIMIT = sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE || 67108864;
    const ALG = sodium.crypto_pwhash_ALG_ARGON2ID13 || 2;

    const keypair = sodium.crypto_box_keypair();
    const salt = sodium.randombytes_buf(SALT_LEN);
    const nonce = sodium.randombytes_buf(NONCE_LEN);

    const wrappingKey = sodium.crypto_pwhash(
        KEY_LEN,
        password,
        salt,
        OPS_LIMIT,
        MEM_LIMIT,
        ALG
    );

    const encryptedPrivateKey = sodium.crypto_secretbox_easy(keypair.privateKey, nonce, wrappingKey);

    return {
        publicKey: toB64String(keypair.publicKey),
        encryptedPrivateKey: toB64String(encryptedPrivateKey),
        salt: toB64String(salt),
        nonce: toB64String(nonce)
    };
};

export const unwrapPrivateKey = async (password, saltB64, nonceB64, encryptedPrivateKeyB64) => {

    await sodium.ready;

    const KEY_LEN = sodium.crypto_secretbox_KEYBYTES || 32;
    const OPS_LIMIT = sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE || 2;
    const MEM_LIMIT = sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE || 67108864;
    const ALG = sodium.crypto_pwhash_ALG_ARGON2ID13 || 2;

    const salt = toBinFromB64(saltB64);
    const nonce = toBinFromB64(nonceB64);
    const encryptedPrivateKey = toBinFromB64(encryptedPrivateKeyB64);

    const wrappingKey = sodium.crypto_pwhash(
        KEY_LEN,
        password,
        salt,
        OPS_LIMIT,
        MEM_LIMIT,
        ALG
    );

    try {
        const rawPrivateKey = sodium.crypto_secretbox_open_easy(encryptedPrivateKey, nonce, wrappingKey);
        return toB64String(rawPrivateKey); 
    } catch (error) {
        throw new Error("Failed to decrypt private key. Incorrect password or corrupted data.");
    }
};

export const messageEncrypt = (message,receiverPublicKey,senderPrivateKey) =>{

    try{
        const nonce  = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)
        const messageBuf = message
        const cipherTextBuf = sodium.crypto_box_easy(    
        messageBuf,
        nonce,
        receiverPublicKey,
        senderPrivateKey
        )
        return {text:toB64String(cipherTextBuf),nonce:toB64String(nonce)}
    }catch(error){
        console.error('Message encryption failed:', error)
        return {text: null, nonce: null, error: true}
    }
    
    
}

export const messageDecrypt = (cipherText,nonce,senderPublicKey,receiverPrivateKey)=>{
    const cipherTextBuf = cipherText
    const nonceBuf = nonce

    try {
        const decryptedMessageBuf = sodium.crypto_box_open_easy(
            cipherTextBuf,
            nonceBuf,
            senderPublicKey,
            receiverPrivateKey
        )

        const plainText = toString(decryptedMessageBuf)
        return plainText  
    } catch (error) {
        return '{"text":"Unable to load message"}'
    }
}