'use client';
import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
        setIsLoading(true);
        send(
            JSON.stringify({
                type: 'hostjoin',
                params: {
                    code: roomID,
                    username: username,
                    userID: userID,
                },
            })
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
                <span className='block my-4 text-xl'>Username</span>
                <input
                    className='text-black text-xl rounded-md px-4 py-3'
                    required
                    type='text'
                    autoComplete='off'
                    placeholder='Enter username...'
                    onChange={(e) => setUsername(e.target.value)}
                    value={username}
                />
            </label>
            <button
                className='bg-blue-500 rounded-md my-10 px-16 py-6 text-xl hover:bg-blue-700'
                disabled={isLoading}
            >
                {isLoading && <span>Loading...</span>}
                {!isLoading && <span>Submit</span>}
            </button>
        </form>
    );
}
