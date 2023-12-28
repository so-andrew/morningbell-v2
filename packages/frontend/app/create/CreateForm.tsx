'use client';
import { useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

export default function CreateForm() {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const WS_URL = 'ws://localhost:4000';
    const { sendMessage, lastMessage, readyState } = useWebSocket(WS_URL)

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

    }

    return(
        <form className='flex flex-col items-center'>
            <label>
                <span className='block my-4 text-xl'>Username</span>
                <input className='text-black text-xl rounded-md px-4 py-3' required type='text' autoComplete='off' placeholder='Enter username...' onChange={(e) => setUsername(e.target.value)} value={username}/>
            </label>
            <button className='bg-blue-500 rounded-md my-10 px-16 py-6 text-xl hover:bg-blue-700' disabled={isLoading}>
                {isLoading && <span>Loading...</span>}
                {!isLoading && <span>Submit</span>}
            </button>
        </form>
    )
}