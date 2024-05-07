'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import Alert from './components/alerts';
import { useRoom, useUser, useWs } from './context/providers';

export default function JoinForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { roomID, setRoomID } = useRoom();
    const { userID, username, setUsername } = useUser();
    const [ready, val, send] = useWs();
    const [roomIDInput, setRoomIDInput] = useState('');
    const [invalidRoomCode, setInvalidRoomCode] = useState(false);
    const [invalidUsername, setInvalidUsername] = useState(false);
    const [roomFull, setRoomFull] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        localStorage.setItem('backButtonPressed', 'false');
        setIsLoading(true);
        if (ready) {
            send(
                JSON.stringify({
                    type: 'join',
                    params: {
                        code: roomIDInput,
                        username: username,
                        userID: userID,
                    },
                }),
            );
        } else {
            console.log('WebSocket is not ready');
        }
    };

    useEffect(() => {
        const lastMessage = JSON.parse(val);
        console.log(val);
        if (lastMessage && lastMessage.type === 'error') {
            //console.log(lastMessage.error);
            handleError(lastMessage.error);
            setIsLoading(false);
        }
        if (lastMessage && lastMessage.type === 'validJoin') {
            setRoomID(lastMessage.params.code);
            router.push(`/rooms/${lastMessage.params.code}`);
        }
        if (lastMessage && lastMessage.type === 'roomUpdate') {
            setRoomID(lastMessage.params.code);
            router.push(`/rooms/${lastMessage.params.code}`);
        }
    }, [val]);

    useEffect(() => {
        setInvalidRoomCode(false);
        setInvalidUsername(false);
        setRoomFull(false);
    }, []);

    function handleError(error: string) {
        switch (error) {
            case 'roomDoesNotExist': {
                setInvalidRoomCode(true);
                setIsLoading(false);
                break;
            }
            case 'roomIsFull': {
                setRoomFull(true);
                setIsLoading(false);
                break;
            }
            case 'usernameTaken': {
                setInvalidUsername(true);
                setIsLoading(false);
                break;
            }
        }
    }

    return (
        <form
            className='flex flex-col items-center gap-4'
            onSubmit={handleSubmit}
        >
            {invalidRoomCode && <Alert message={'This room does not exist.'} />}
            {invalidUsername && (
                <Alert message={'Username is already taken.'} />
            )}
            {roomFull && <Alert message={'This room is full.'} />}
            <label>
                <span className='my-4 block text-xl'>Room Code</span>
                <input
                    className='rounded-md px-4 py-3 text-xl text-black'
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
                <span className='my-4 block text-xl'>Username</span>
                <input
                    className='rounded-md px-4 py-3 text-xl text-black'
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
                className='my-10 rounded-md bg-blue-500 px-16 py-6 text-xl hover:bg-blue-700'
                disabled={isLoading}
            >
                {isLoading && <span>Loading...</span>}
                {!isLoading && <span>Submit</span>}
            </button>
        </form>
    );
}
