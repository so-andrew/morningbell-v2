'use client';

import { WebSocketMessage } from '@/types/WebSocketMessage';
import Link from 'next/link';
import { useEffect } from 'react';
import { useHomePageState, useRoom, useWs } from './context/providers';
import CreateForm from './CreateForm';

function CreatePage() {
    const { val, send } = useWs();
    const { roomID, setRoomID } = useRoom();
    const { setPageState } = useHomePageState();

    useEffect(() => {
        send!(
            JSON.stringify({
                type: 'create',
            }),
        );
    }, []);

    useEffect(() => {
        //console.log('val = ' + val);
        const lastMessage: WebSocketMessage = val;
        //console.log('lastMessage = ' + lastMessage);
        //console.log('lastMessage.type = ' + lastMessage.type);
        if (lastMessage && lastMessage.type === 'roomInfo') {
            //console.log('Room info received');
            //console.log(lastMessage);
            setRoomID(lastMessage.params!.code);
        }
    }, [val]);

    function handleJoinClick() {
        setPageState('join');
        setRoomID('');
    }

    return (
        <section className='flex flex-col justify-center'>
            <div className='mx-auto my-10 max-w-xl text-center text-white'>
                <h1 className='my-6 text-3xl'>Create Room</h1>
                {roomID && (
                    <p>
                        Your room code is{' '}
                        <span className='font-bold'>{roomID}</span>.
                    </p>
                )}
                <p className='mt-2'>
                    Already have a room code?{' '}
                    <Link
                        className='text-blue-500'
                        href='/'
                        onClick={handleJoinClick}
                    >
                        Click here.
                    </Link>
                </p>
            </div>
            <div className='m-auto text-white'>
                <CreateForm />
            </div>
        </section>
    );
}

export default CreatePage;
