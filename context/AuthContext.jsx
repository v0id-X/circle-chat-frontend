import { createContext, useState, useEffect } from "react";
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { generateAndWrapKeys, unwrapPrivateKey } from "../src/utils/e2ee";
import { useNavigate } from "react-router-dom";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [privateKey, setPrivateKey] = useState(sessionStorage.getItem("privateKey"));
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSockets] = useState(null);

    const checkAuth = async () => {
        const currentToken = localStorage.getItem("token");
        if (!currentToken) return;

        try {
            const { data } = await axios.get("/api/auth/check");
            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (error) {
            setAuthUser(null);
            setToken(null);
            localStorage.removeItem("token");
            delete axios.defaults.headers.common["token"];
        }
    };

    const login = async (state, credentials) => {
        try {
            let payload = { ...credentials };

            if (state === 'signup') {
                const cryptoPayload = await generateAndWrapKeys(credentials.password);
                payload = { ...payload, ...cryptoPayload };
            }

            const { data } = await axios.post(`/api/auth/${state}`, payload);
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common["token"] = data.token;
                setToken(data.token);
                localStorage.setItem("token", data.token);

                try {
                    const rawPrivateKeyB64 = await unwrapPrivateKey(
                        credentials.password,
                        data.userData.salt,
                        data.userData.nonce,
                        data.userData.encryptedPrivateKey
                    );

                    setPrivateKey(rawPrivateKeyB64);
                    sessionStorage.setItem("privateKey", rawPrivateKeyB64);
                } catch (error) {
                    toast.error("Account accessed, but failed to load chat history");
                }
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        delete axios.defaults.headers.common["token"];
        sessionStorage.removeItem("privateKey");
        setPrivateKey(null);
        toast.success("Logged Out");
        socket?.disconnect();
    };

    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put('/api/auth/update-profile', body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile Updated Successfully");
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;

        const authToken = localStorage.getItem("token");
        const newSocket = io(backendUrl, {
            auth: {
                token: authToken
            }
        });

        newSocket.connect();
        setSockets(newSocket);

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds);
        });

        newSocket.on("connect_error", (err) => {
            console.error("Socket authentication failed:", err.message);
        });
    };

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["token"] = token;
        }
        checkAuth();
    }, []);

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
        privateKey
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};