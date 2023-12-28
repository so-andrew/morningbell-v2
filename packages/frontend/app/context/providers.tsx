'use client';
import React, { createContext, useContext, useState } from 'react';

type UserContext = {
    userID: string;
    setUserID: React.Dispatch<React.SetStateAction<string>>;
}

type RoomContext = {
    roomID: string;
    setRoomID: React.Dispatch<React.SetStateAction<string>>;
}

const UserContext = createContext<UserContext | null>(null);
const RoomContext = createContext<RoomContext | null>(null);

export const useRoom = () =>{
    const context = useContext(RoomContext);
    if(!context){
        throw new Error("useRoom must be used within an AppContextProvider");
    }
    return context;
}

export function useUser(){
    const context = useContext(UserContext);
    if(!context){
        throw new Error("useUser must be used within an AppContextProvider");
    }
    return context;
}

export function AppContextProvider({ children }){
    const [userID, setUserID] = useState('');
    const [roomID, setRoomID] = useState('');

    return (
        <RoomContext.Provider value={{ roomID, setRoomID }}>
            <UserContext.Provider value={{ userID, setUserID }}>
                {children}    
            </UserContext.Provider>
        </RoomContext.Provider>
    );
};