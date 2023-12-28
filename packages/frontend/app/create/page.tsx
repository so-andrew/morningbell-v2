'use client';
import React, { useState, useEffect } from 'react';
import CreateForm from './CreateForm';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useRoom } from '../context/providers';


const Create = () => {
    const WS_URL = 'ws://localhost:4000';
    const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(WS_URL);
    const { roomID, setRoomID } = useRoom();

useEffect(() => {
    sendJsonMessage({
        type: 'create',
        params: null
    });
}, []);

useEffect(() => {
    if(lastJsonMessage && lastJsonMessage.type === 'roomUpdate'){
        console.log('Room update received');
        console.log(lastJsonMessage);
        setRoomID(lastJsonMessage.params.code);

    }
}, [lastJsonMessage]);

    return(
        <section className='flex flex-col justify-center'>
            <div className='m-auto text-center text-white max-w-xl'>
                <h1 className='my-6 text-3xl'>Create Room</h1>
                {roomID && (<p>Your room code is {roomID}</p>)}
            </div>
            <div className='m-auto text-white'>
                <CreateForm />
            </div>
        </section>
    )
};

export default Create;