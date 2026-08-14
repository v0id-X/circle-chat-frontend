    import { useContext, useState } from "react";
    import { createContext } from "react";
    import {AuthContext} from "../context/AuthContext"
    import toast from "react-hot-toast";
    import { useEffect } from "react";
    import { messageDecrypt, messageEncrypt,toBinFromB64,toBinFromString,toString } from "../src/utils/e2ee";
    export const ChatContext = createContext()

    export const ChatProvider = ({children})=>{

        const [messages,setMessages] = useState([])
        const [users,setUsers] = useState([])
        const [selectedUser,setSelectedUser] = useState(null)
        const [selectedPublicKey,setSelectedPublicKey] = useState(null)
        const [hasMore,setHasMore] = useState(true)
        const[loadingMore,setLoadingMore] = useState(false)
        const [unseenMessages,setUnseenmessages] = useState({})
        const [typingUsers,setTypingUsers] = useState({})


        const {socket,axios,authUser,privateKey} = useContext(AuthContext)

        const getUsers = async() =>{
            try {
                const {data} = await axios.get('/api/messages/users')
                if(data.success){
                    setUsers(data.users)
                    setUnseenmessages(data.unseenMessages)

                }
            } catch (error) {
                toast.error(error.message)
            }
        }

        const getPublicKey = async (userId)=>{
            try {
                const {data} = await axios.get(`/api/auth/get-public-key/${userId}?t=${Date.now()}`)
                if(data.success){
                    return data.publicKey
                }else{
                    return null
                }
            } catch (error) {
                const errMsg = error.response?.data?.message || "falied to fetch public keys"
                return null
            }
        }

        const fetchEncryptedData = async (url)=>{
            try {
                if(url.startsWith('http')){
                    const response = await axios.get(url)
                    return response.data
                }
                return null
            } catch (error) {
                return null
            }
        }

        
const getMessages = async (userId, isLoadMore = false) => {
    if (isLoadMore && !hasMore) return
    if (!userId) return

    const targetPublicKey = await getPublicKey(userId)

    if (targetPublicKey) {
        setSelectedPublicKey(targetPublicKey)
    } else {
        console.warn("user has no key")
    }

    try {
        let url = `/api/messages/${userId}`
        const oldestMessageId = messages[0]?._id
        if (isLoadMore && oldestMessageId) {
            url += `?cursor=${oldestMessageId}`
        }

        const { data } = await axios.get(url)

        if (data.success) {

            if (data.messages.length < 20) {
                setHasMore(false)
            } else if (!isLoadMore) {
                setHasMore(true)
            }

            let readyMessages = data.messages

            if (targetPublicKey && privateKey) {
                readyMessages = await Promise.all(data.messages.map(async (msg) => {
                    if (!msg.nonce) {
                        return {
                            ...msg,
                            text: "Legacy Message"
                        }
                    }

                    const encryptedData = msg.image || msg.text

                    if (encryptedData) {
                        try {
                            const encryptedResponse = msg.image ? await fetchEncryptedData(msg.image) : msg.text

                            if (!encryptedResponse) {
                                return { ...msg, text: "Unable to load message" }
                            }

                            const plainText = messageDecrypt(
                                toBinFromB64(encryptedResponse),
                                toBinFromB64(msg.nonce),
                                toBinFromB64(targetPublicKey),
                                toBinFromB64(privateKey)
                            )

                            let parsedData = {}
                            try {
                                parsedData = JSON.parse(plainText)
                            } catch (error) {
                                parsedData = { text: plainText }
                            }

                            return {
                                ...msg,
                                ...parsedData
                            }
                        } catch (error) {
                            console.warn("Failed to decrypt message", msg._id, error.message)
                            return { ...msg, text: "Unable to load message" }
                        }
                    }
                    return msg
                }))
            }

            readyMessages = readyMessages.filter(Boolean)

            if (isLoadMore) {
                setMessages((prevMessages) => [...readyMessages, ...prevMessages])
            } else {
                setMessages(readyMessages)
            }

            if (!isLoadMore) {
                setUnseenmessages((prevUnseenMessages) => {
                    const updatedUnseen = { ...prevUnseenMessages }
                    delete updatedUnseen[userId]
                    return updatedUnseen
                })
            }
        }
    } catch (error) {
        toast.error(error.message)
    }
}

        const sendMessage = async (messageData) => {
            try {

                const latestPublicKey = await getPublicKey(selectedUser._id);
                
                if (!latestPublicKey) {
                    toast.error("Cannot send message: User has no public key.");
                    return;
                }

                const messageString = JSON.stringify(messageData);
                const encrypted = messageEncrypt(
                    toBinFromString(messageString),
                    toBinFromB64(latestPublicKey), 
                    toBinFromB64(privateKey)
                );

                if (encrypted.error || !encrypted.text) {
                    toast.error("Failed to encrypt message. Please try again.");
                    return;
                }

                const cipherText = encrypted.text;
                const nonce = encrypted.nonce;

                const payload = {
                    text: messageData.text ? cipherText : "",
                    image: messageData.image ? cipherText : "",
                    nonce: nonce 
                };
                
                const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`, payload);
                
                if(data.success){
                const locallyReadableMessage = {
                ...data.newMessage,
                text: messageData.text || "",
                image: messageData.image || "",
            };
                setMessages((prevMessages) => [...prevMessages, locallyReadableMessage]);
        } else { 
            toast.error(data.message);
        }
            } catch (error) {
                toast.error(error.message);
            }
        }

    const messageSubscribe = async () => {
    if (!socket) return

    socket.on("newMessage", async (newMessage) => {
        if (selectedUser && newMessage.senderId === selectedUser._id) {

            newMessage.seen = true
            let readyNewMessage = newMessage

            if (selectedPublicKey && privateKey) {

                const encryptedData = newMessage.image || newMessage.text

                if (encryptedData && newMessage.nonce) {
                    try {
                        const encryptedResponse = newMessage.image ? await fetchEncryptedData(newMessage.image) : newMessage.text

                        if (!encryptedResponse) {
                            readyNewMessage = { ...newMessage, text: "Unable to load message" }
                        } else {
                            let plainText = messageDecrypt(
                                toBinFromB64(encryptedResponse),
                                toBinFromB64(newMessage.nonce),
                                toBinFromB64(selectedPublicKey),
                                toBinFromB64(privateKey)
                            )

                            if (plainText.includes("Unable to load message")) {
                                const freshPublicKey = await getPublicKey(newMessage.senderId)

                                if (freshPublicKey) {
                                    plainText = messageDecrypt(
                                        toBinFromB64(encryptedResponse),
                                        toBinFromB64(newMessage.nonce),
                                        toBinFromB64(freshPublicKey),
                                        toBinFromB64(privateKey)
                                    )
                                    setSelectedPublicKey(freshPublicKey)
                                }
                            }

                            let parsedData = {}
                            try {
                                parsedData = JSON.parse(plainText)
                            } catch (error) {
                                parsedData = { text: plainText }
                            }

                            readyNewMessage = { ...newMessage, ...parsedData }
                        }
                    } catch (error) {
                        console.warn("Failed to decrypt incoming message", newMessage._id, error.message)
                        readyNewMessage = { ...newMessage, text: "Unable to load message" }
                    }
                }
            }

            setMessages((prevMessages) => [...prevMessages, readyNewMessage])
            axios.put(`/api/messages/mark/${newMessage._id}`)
        } else {
            setUnseenmessages((prevUnseenMessages) => ({
                ...prevUnseenMessages,
                [newMessage.senderId]: prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1
            }))
        }
    })

    socket.on("Typing", ({ senderId }) => {
        setTypingUsers((prev) => ({ ...prev, [senderId]: true }))
    })

    socket.on("StoppedTyping", ({ senderId }) => {
        setTypingUsers((prev) => ({ ...prev, [senderId]: false }))
    })
}

            const sendTypingStatus = (receiverId, isTyping) =>{
            if(!socket || !receiverId) return 
            const typingEvent = isTyping ? "Typing" : "StoppedTyping"
            socket.emit(typingEvent,{senderId:authUser._id,receiverId})
        }


        const messageUnsubscribe = ()=>{
            if(socket){
                socket.off("newMessage")
                socket.off("Typing")
                socket.off("StoppedTyping")
            }
        }

        useEffect(()=>{
            messageSubscribe()
            return ()=> messageUnsubscribe()
        },[socket,selectedUser,selectedPublicKey,privateKey])


        const value = {
            messages,
            users,
            selectedUser,
            getUsers,
            getMessages,
            sendMessage,
            setSelectedUser,
            setSelectedPublicKey,
            unseenMessages,
            setUnseenmessages,
            typingUsers,
            setTypingUsers,
            sendTypingStatus
        }

        return(
        <ChatContext.Provider value={value}>
                {children}
        </ChatContext.Provider>
        ) 
    }
