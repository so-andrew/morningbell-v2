'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useRoom, useUser, useWs } from './context/providers';

export default function JoinForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { roomID, setRoomID } = useRoom();
    const { userID, setUserID, username, setUsername } = useUser();
    const [ready, val, send] = useWs();
    const [roomIDInput, setRoomIDInput] = useState('');
    const [invalidRoomCode, setInvalidRoomCode] = useState(false);
    const [invalidUsername, setInvalidUsername] = useState(false);
    const [roomFull, setRoomFull] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        send(
            JSON.stringify({
                type: 'join',
                params: {
                    code: roomIDInput,
                    username: username,
                    userID: userID,
                },
            })
        );
    };

    useEffect(() => {
        const lastMessage = JSON.parse(val);
        if (lastMessage && lastMessage.type === 'error') {
            //console.log(lastMessage.error);
            handleError(lastMessage.error);
            setIsLoading(false);
        }
        if (lastMessage && lastMessage.type === 'validJoin') {
            console.log(lastMessage.params);
            console.log(lastMessage.params.code);
            setRoomID(lastMessage.params.code);
            router.push(`/rooms/${lastMessage.params.code}`);
        }
    }, [val]);

    function handleError(error: string) {
        switch (error) {
            case 'roomDoesNotExist': {
                setInvalidRoomCode(true);
                break;
            }
            case 'roomIsFull': {
                setRoomFull(true);
                break;
            }
            case 'usernameTaken': {
                setInvalidUsername(true);
                break;
            }
        }
    }

    return (
        <form className='flex flex-col items-center' onSubmit={handleSubmit}>
            <label>
                <span className='block my-4 text-xl'>Room Code</span>
                <input
                    className='text-black text-xl rounded-md px-4 py-3'
                    required
                    type='text'
                    maxLength={5}
                    autoComplete='off'
                    placeholder='Enter room code...'
                    onChange={(e) => {
                        setRoomIDInput(e.target.value.toUpperCase());
                        setInvalidRoomCode(false);
                        setRoomFull(false);
                        setInvalidUsername(false);
                    }}
                    value={roomIDInput}
                />
            </label>
            <label>
                <span className='block my-4 text-xl'>Username</span>
                <input
                    className='text-black text-xl rounded-md px-4 py-3'
                    required
                    type='text'
                    maxLength={20}
                    autoComplete='off'
                    placeholder='Enter username...'
                    onChange={(e) => {
                        setUsername(e.target.value);
                        setInvalidRoomCode(false);
                        setRoomFull(false);
                        setInvalidUsername(false);
                    }}
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
