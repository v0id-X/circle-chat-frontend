import _sodium from "libsodium-wrappers"

//Init sodium
await _sodium.ready
const sodium = _sodium

//Helper Functions
export const toB64String = (data)=>{

    return sodium.to_base64(data)
}

export const toString = (data)=>{
    return sodium.to_string(data)
}

export const toBinFromB64 = (data)=>{
    return sodium.from_base64(data)
}
export const toBinFromString = (data)=>{
    return sodium.from_string(data)
}

//E2ee functions

export const generateKeys = ()=>{

     return sodium.crypto_box_keypair() //return type: Uint8Array
}

export const messageEncrypt = (message,receiverPublicKey,senderPrivateKey) =>{

    try{
        const nonce  = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)
        const messageBuf = message
        const cipherTextBuf = sodium.crypto_box_easy(      //return type: Uint8Array
        messageBuf,
        nonce,
        receiverPublicKey,
        senderPrivateKey
        )
        console.log("encrypted text",toB64String(cipherTextBuf))
        return {text:toB64String(cipherTextBuf),nonce:toB64String(nonce)}
    }catch(error){
        console.log(error.message)
        return '{"text": "Message Cannot Be Encrypted"}'
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
        return plainText    //return type: string
    } catch (error) {
        console.log(error.message)
        return '{"text":"Message Encrypted With An Older Key"}'
    }
}