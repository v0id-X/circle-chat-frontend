import { createContext, useState } from "react";
import axios from 'axios'
import toast from 'react-hot-toast'
import { useEffect } from "react";
import {io} from 'socket.io-client'
//import { generateKeys,toB64String } from "../src/utils/e2ee";
//import {openDB} from "idb"
import { generateAndWrapKeys,unwrapPrivateKey } from "../src/utils/e2ee";
import { useNavigate } from "react-router-dom";

const backendUrl = import.meta.env.VITE_BACKEND_URL
axios.defaults.baseURL = backendUrl

/*const getChatDB = async () => {
                    return await openDB('CircleChat', 3, { 
                        upgrade(db) {
                        if (!db.objectStoreNames.contains('key_store')) {
                            db.createObjectStore('key_store');
                            console.log("Created 'key_store' object store safely!");
                        }
                        },
                    });
                    }; */

export const AuthContext = createContext()

export const AuthProvider = ({children})=>{

    const [token,setToken] = useState(localStorage.getItem("token"))
    const [authUser,setAuthUser] = useState(null)
    const [privateKey,setPrivateKey] = useState(sessionStorage.getItem("privateKey"))
    const [onlineUsers,setOnlineUsers] = useState([])
    const [socket,setSockets] = useState(null)

    const checkAuth = async()=>{
        try {
            const {data} = await axios.get("/api/auth/check")
            if(data.success){
                setAuthUser(data.user)
                connectSocket(data.user)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    /* const setupEncryption = async () => {
    const existingKey = await getPrivateKey(); 

    if (existingKey) {
        console.log("Existing identity found. Keeping old keys.");
        setPrivateKey(existingKey);
        return; 
    }

    console.log("No key found. Generating new identity...");
    const userKeys = generateKeys();
    const privB64 = toB64String(userKeys.privateKey);
    const pubB64 = toB64String(userKeys.publicKey);

    const db = await getChatDB();
    await db.put('key_store', privB64, 'user_private_key');
    setPrivateKey(privB64);

    await axios.put(`/api/auth/public-key-update`, { publicKey: pubB64 });
}; */

    //Login to handle auth and sockets conn

    const login = async(state, credentials)=>{
        try {

            let payload = {...credentials}

            if(state === 'signup'){

                console.log("ENTIRE CREDENTIALS OBJECT:", credentials);
    console.log("PASSWORD TYPE:", typeof credentials.password, "| VALUE:", credentials.password);

                const cryptoPayload = await generateAndWrapKeys(credentials.password)
                payload = {...payload, ...cryptoPayload}
            }

            const {data} = await axios.post(`/api/auth/${state}`,payload)
            if(data.success){
                setAuthUser(data.userData)
                connectSocket(data.userData)
                axios.defaults.headers.common["token"] = data.token
                setToken(data.token)
                localStorage.setItem("token",data.token)
                //setupEncryption()

                try {
                    const rawPrivateKeyB64 = await unwrapPrivateKey(
                        credentials.password,
                        data.userData.salt,
                        data.userData.nonce,
                        data.userData.encryptedPrivateKey
                    )

                    setPrivateKey(rawPrivateKeyB64)
                    sessionStorage.setItem("privateKey",rawPrivateKeyB64)

                } catch (error) {
                    toast.error("Account accessed, but failed to load chat history")
                }
                toast.success(data.message)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    /* GENERATING KEY-PAIRS FOR THE AUTH-USER USING THE E2EE LIB 
            AND STORING IT IN THE INDEXED DB*/

            

   /* const updatePublicKey = async ()=>{
                const userKeys =  generateKeys()
                console.log(userKeys.publicKey)
                console.log(userKeys.privateKey)

                if(userKeys){
                    console.log("private key stored in indexedDB"+userKeys)
                    toast.success("private key stored in indexedDb succefully")
                    const db = await getChatDB()
                    await db.put('key_store',toB64String(userKeys.privateKey),'user_private_key')

                    const {data} = await axios.put(`/api/auth/public-key-update`,{
                        publicKey: toB64String(userKeys.publicKey)
                    })

                    if(data.success){
                        console.log(data.message)
                        toast.success(data.message)
                    }
            }
        } */

       /* const getPrivateKey = async ()=>{
            try {
                const db = await getChatDB()
                const privateKey = await db.get('key_store','user_private_key')

                if(!privateKey){
                    console.warn("No private Key found")
                    return null
                }
                console.log('privateKey:',privateKey)
                setPrivateKey(privateKey)
                return privateKey
            } catch (error) {
                console.error('failed to fetch private key'+error.message)
                return null
            }
            
        } */

    //Logout and disconn socket
    const logout = async()=>{
        localStorage.removeItem("token")
        setToken(null)
        setAuthUser(null)
        setOnlineUsers([])
       delete axios.defaults.headers.common["token"] 
        //const db = await getChatDB()
        //await db.clear('key_store')
        sessionStorage.removeItem("privateKey")
        setPrivateKey(null)
        toast.success("Logged Out")
        socket?.disconnect()
    }

    //updating profile

    const updateProfile = async (body)=>{
        try {
            const {data} = await axios.put('/api/auth/update-profile',body)
            if(data.success){
                setAuthUser(data.user)
                toast.success("Profile Updated Successfully")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }


    //socket connection handling
    const connectSocket = (userData)=>{
        if(!userData || socket?.connected) return
        const newSocket = io(backendUrl,{
            query: {
                userId : userData._id
            }
        })

        newSocket.connect()
        setSockets(newSocket)

        newSocket.on("getOnlineUsers",(userIds)=>{
            setOnlineUsers(userIds)
        })
    }

    useEffect(()=>{
        if(token){
            axios.defaults.headers.common["token"] = token
        }
        checkAuth()
        //getPrivateKey()
    },[])

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
        privateKey
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
