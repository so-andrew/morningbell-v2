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
        <section className='flex flex-col lg:grid lg:grid-cols-2 content-start h-screen lg:content-center'>
            <div className='mx-auto my-10 px-16 text-center text-white max-w-xl'>
                <h1 className='my-6 text-4xl'>A buzzer app for the masses.</h1>
                <p className='my-2 text-xl'>
                    Create private lobbies for your friends to join, or join an
                    existing lobby with the provided room code.
                </p>
                <span className='my-2 text-xl'>{userID}</span>
            </div>
            <section className='grid grid-rows-2 gap-4 lg:gap-6 mx-auto my-2 lg:my-auto items-center text-center text-white'>
                <button
                    className='bg-blue-500 rounded-md w-full px-16 py-6 text-xl hover:bg-blue-700'
                    onClick={handleCreateRoomButton}
                >
                    Create Room
                </button>
                <button
                    className='bg-gray-500 rounded-md w-full px-16 py-6 text-xl hover:bg-gray-700'
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
