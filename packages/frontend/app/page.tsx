'use client';
import { useEffect, useState } from 'react';
import { useRoom, useUser, useWs, useHomePageState } from './context/providers';
import Landing from './Landing';
import CreatePage from './CreatePage';
import JoinPage from './JoinPage';

export default function Home() {
    const { userID, setUserID } = useUser();
    const { roomID, setRoomID } = useRoom();
    const { pageState, setPageState } = useHomePageState();
    const [ready, val, send] = useWs();

    useEffect(() => {
        if (ready) {
            console.log('WebSocket ready');
            localStorage.setItem('roomInitialLoadFinished', 'false');
            localStorage.removeItem('roomID');
        }
    }, [ready]);

    useEffect(() => {
        const lastMessage = JSON.parse(val);
        if (lastMessage && lastMessage.type === 'idAssignment') {
            console.log(lastMessage.params.userID);
            setUserID(lastMessage.params.userID);
            localStorage.setItem('uid', lastMessage.params.userID);
        }
    }, [val]);

    useEffect(() => {
        setRoomID('');
    }, []);

    return (
        <>
            {pageState === 'landing' && <Landing userID={userID} />}
            {pageState === 'create' && <CreatePage />}
            {pageState === 'join' && <JoinPage />}
        </>
    );
}
