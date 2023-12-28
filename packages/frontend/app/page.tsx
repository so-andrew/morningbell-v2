'use client';
import Image from 'next/image';
import Link from 'next/link';
import useWebSocket, { ReadyState } from 'react-use-websocket';

export default function Home() {

    const WS_URL = 'ws://localhost:4000';
    useWebSocket(WS_URL, {
        share: true,
        onOpen: () => console.log('WebSocket connection opened'),
        shouldReconnect: (closeEvent) => true,
    });

    return (
        <>
            <section className='grid lg:grid-cols-2 bg-gray-800 h-screen'>
                <div className='m-auto px-16 py-4 text-center text-white max-w-xl'>
                    <h1 className='my-6 text-4xl'>A buzzer app for the masses.</h1>
                    <p className='my-2 text-xl'>Create private lobbies for your friends to join, or join an existing lobby with the provided room code.</p>
                </div>
                <section className='grid grid-rows-2 gap-4 lg:gap-6 m-auto align-items-center text-center text-white'>
                    <Link href='/create'>
                        <button className='bg-blue-500 rounded-md mx-12 px-16 py-6 text-xl hover:bg-blue-700'>
              Create Room
                        </button>
                    </Link>
                    <Link href='join'>
                        <button className='bg-gray-400 rounded-md mx-12 px-16 py-6 text-xl hover:bg-gray-700'>
              Join Room
                        </button>
                    </Link>
                </section>
            </section>

            {/* <div className='flex h-screen bg-gray-800'>
        <div className='m-auto p-16 text-center text-white'>
          <h1 className='my-3.5 text-4xl'>A buzzer app for the masses.</h1>
          <p className='my-3.5 text-xl'>Create private lobbies for your friends to join, or join an existing lobby with the provided room code.</p>
        </div>
      </div> */}
        </>
    );
}
