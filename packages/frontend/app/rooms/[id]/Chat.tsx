'use client';

import { useRoom, useUser, useWs } from '@/app/context/providers';
import { ChatMessage, LogMessage } from '@/types/WebSocketMessage';
import { FormEvent, useState } from 'react';
import ChatMessageItem from './ChatMessage';

export default function Chat(params: { chatLogs: Array<LogMessage | ChatMessage> }) {
    const { chatLogs } = params;

    const [chatMessageInput, setChatMessageInput] = useState('');
    const { roomID } = useRoom();
    const { userID, username } = useUser();
    const [ready, val, send] = useWs();

    const handleMessageSend = (e: FormEvent) => {
        e.preventDefault();
        if(chatMessageInput.length === 0) return;
        if (ready) {
            send(
                JSON.stringify({
                    type: 'chat',
                    params: {
                        code: roomID,
                        userID: userID,
                        username: username,
                        content: chatMessageInput
                    }
                })
            );
        }
        else console.log('WebSocket is not ready');
        setChatMessageInput('');
    };

    return (
        <section className='flex flex-col items-center max-h-[50%]'>
            <h2 className='text-white text-center text-xl font-bold my-6 mx-auto'>
                Chat
            </h2>
            <section className='flex flex-col items-center w-[90%] md:max-w-lg bg-white rounded-lg'>
                <section className='flex flex-col bg-white my-2 py-2 mx-auto w-[90%] max-h-48 gap-1 overflow-y-auto'>
                    {chatLogs.map((element, index) => {
                        return (
                            <ChatMessageItem key={index} element={element}/>
                        );
                    })}
                </section>
                <form className='flex flex-row py-2 w-[90%] bg-white gap-4' onSubmit={handleMessageSend}>
                    <label className='w-full'>
                        <input className='text-black py-2 px-4 rounded-md w-full' type='text' autoComplete='off' placeholder='Send a message' maxLength={250} onChange={(e) => {
                            setChatMessageInput(e.target.value);
                        }} value={chatMessageInput}></input>
                    </label>
                    <button className='bg-blue-500 hover:bg-blue-700 rounded-md px-4 py-2 text-white'>Send</button>
                </form>
            </section>
        </section>
    );
}
