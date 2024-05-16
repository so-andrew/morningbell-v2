'use client';
import { WebSocketMessage } from '@/types/WebSocketMessage';
import { useEffect } from 'react';
import CreatePage from './CreatePage';
import JoinPage from './JoinPage';
import Landing from './Landing';
import { useHomePageState, useRoom, useUser, useWs } from './context/providers';

export default function Home() {
    const { userID, setUserID } = useUser();
    const { roomID, setRoomID } = useRoom();
    const { pageState } = useHomePageState();
    const { ready, val } = useWs();

    useEffect(() => {
        if (ready) {
            console.log('WebSocket ready');
            // If you are at the landing page, the app logic should not consider you as having previously loaded a room
            localStorage.setItem('roomInitialLoadFinished', 'false');
            console.log(`Room ID: ${roomID}`);
            console.log(
                `Room ID from local storage: ${localStorage.getItem('roomID')}`,
            );
            // if (roomID) {
            //     send(
            //         JSON.stringify({
            //             type: 'leave',
            //             params: {
            //                 code: roomID,
            //                 userID: userID,
            //             },
            //         }),
            //     );
            // }
            // localStorage.removeItem('roomID');
        }
    }, [ready]);

    useEffect(() => {
        const lastMessage: WebSocketMessage = val;
        if (lastMessage && lastMessage.type === 'idAssignment') {
            setUserID(lastMessage.params!.userID);
            localStorage.setItem('uid', lastMessage.params!.userID);
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
            <div className='w-fit h-20'></div>
        </>
    );
}
