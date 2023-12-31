'use client';
import { useEffect } from 'react';
import CreateForm from '../CreateForm';
import { useRoom, useUser, useWs } from '../context/providers';

const Create = () => {
    const [ready, val, send] = useWs();
    const { roomID, setRoomID } = useRoom();
    //const { userID, setUserID } = useUser();

    useEffect(() => {
        send(
            JSON.stringify({
                type: 'create',
                params: null,
            })
        );
    }, []);

    useEffect(() => {
        const lastMessage = JSON.parse(val);
        if (lastMessage && lastMessage.type === 'roomInfo') {
            console.log('Room info received');
            console.log(lastMessage);
            setRoomID(lastMessage.params.code);
        }
    }, [val]);

    return (
        <section className='flex flex-col justify-center'>
            <div className='mx-auto my-10 text-center text-white max-w-xl'>
                <h1 className='my-6 text-3xl'>Create Room</h1>
                {roomID && (
                    <p>
                        Your room code is{' '}
                        <span className='font-bold'>{roomID}</span>.
                    </p>
                )}
            </div>
            <div className='m-auto text-white'>
                <CreateForm />
            </div>
        </section>
    );
};

export default Create;
