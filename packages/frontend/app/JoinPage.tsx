'use client';

import Link from 'next/link';
import JoinForm from './JoinForm';
import { useHomePageState, useRoom } from './context/providers';

function JoinPage() {
    const { setRoomID } = useRoom();
    const { setPageState } = useHomePageState();

    function handleCreateClick() {
        setPageState('create');
        setRoomID('');
    }

    return (
        <section className='flex flex-col justify-center'>
            <div className='mx-auto my-10 text-center text-white max-w-xl'>
                <h1 className='my-6 text-3xl'>Join Room</h1>
                <p className='mt-2'>
                    Want to create a room?{' '}
                    <Link
                        className='text-blue-500'
                        href='/'
                        onClick={handleCreateClick}
                    >
                        Click here.
                    </Link>
                </p>
            </div>
            <div className='m-auto text-white'>
                <JoinForm />
            </div>
        </section>
    );
}

export default JoinPage;
