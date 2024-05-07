'use client';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useRoom, useUser, useWs } from './context/providers';

export default function CreateForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { roomID, setRoomID } = useRoom();
    const { userID, setUserID, username, setUsername } = useUser();
    const [ready, val, send] = useWs();
    const router = useRouter();

    // const WS_URL = 'ws://localhost:4000';
    // const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(WS_URL, {
    //     share: true,
    // });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        localStorage.setItem('backButtonPressed', 'false');
        setIsLoading(true);
        send(
            JSON.stringify({
                type: 'hostjoin',
                params: {
                    code: roomID,
                    username: username,
                    userID: userID,
                },
            }),
        );
    };

    useEffect(() => {
        const lastMessage = JSON.parse(val);
        if (lastMessage && lastMessage.type === 'error') {
            console.log(lastMessage.error);
        }
        if (lastMessage && lastMessage.type === 'validJoin') {
            //console.log(lastMessage.params);
            setRoomID(lastMessage.params.code);
            router.push(`/rooms/${lastMessage.params.code}`);
        }
    }, [val]);

    return (
        <form className='flex flex-col items-center' onSubmit={handleSubmit}>
            <label>
                <span className='my-4 block text-xl'>Username</span>
                <input
                    className='rounded-md px-4 py-3 text-xl text-black'
                    required
                    type='text'
                    autoComplete='off'
                    placeholder='Enter username...'
                    onChange={(e) => setUsername(e.target.value)}
                    value={username}
                />
            </label>
            <button
                className='my-10 rounded-md bg-blue-500 px-16 py-6 text-xl hover:bg-blue-700'
                disabled={isLoading}
            >
                {isLoading && <span>Loading...</span>}
                {!isLoading && <span>Submit</span>}
            </button>
        </form>
    );
}
