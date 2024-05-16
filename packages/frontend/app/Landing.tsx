'use client';
import Footer from './Footer';
import { useHomePageState } from './context/providers';

function Landing(params: { userID: string }) {
    const { setPageState } = useHomePageState();
    const { userID } = params;

    function handleCreateRoomButton() {
        setPageState('create');
    }

    function handleJoinRoomButton() {
        setPageState('join');
    }

    return (
        <section className='flex flex-col lg:grid lg:grid-cols-2 lg:content-center'>
            <div className='mx-auto my-10 max-w-xl px-16 text-center text-white'>
                <h1 className='my-6 text-4xl'>A buzzer app for the masses.</h1>
                <p className='my-2 text-xl'>
                    Create private lobbies for your friends to join, or join an
                    existing lobby with a provided room code.
                </p>
                <span className='my-2 text-xl'>{userID}</span>
            </div>
            <section className='mx-auto my-2 grid grid-rows-2 items-center gap-4 text-center text-white lg:my-auto lg:gap-6'>
                <button
                    className='w-full rounded-md bg-blue-500 px-16 py-6 text-xl hover:bg-blue-700'
                    onClick={handleCreateRoomButton}
                >
                    Create Room
                </button>
                <button
                    className='w-full rounded-md bg-gray-500 px-16 py-6 text-xl  hover:bg-gray-700'
                    onClick={handleJoinRoomButton}
                >
                    Join Room
                </button>
            </section>
            <Footer />
        </section>
    );
}

export default Landing;
