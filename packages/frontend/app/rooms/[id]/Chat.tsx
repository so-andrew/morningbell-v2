'use client';

import { useRoom, useUser, useWs } from '@/app/context/providers';
import { ChatMessage, LogMessage } from '@/types/WebSocketMessage';
import { FormEvent, useState } from 'react';
import ChatMessageItem from './ChatMessage';

export default function Chat(params: {
    chatLogs: Array<LogMessage | ChatMessage>;
}) {
    const { chatLogs } = params;

    const [chatMessageInput, setChatMessageInput] = useState('');
    const { roomID } = useRoom();
    const { userID, username } = useUser();
    const { ready, send } = useWs();

    const handleMessageSend = (e: FormEvent) => {
        e.preventDefault();
        if (chatMessageInput.length === 0) return;
        if (ready) {
            send!(
                JSON.stringify({
                    type: 'chat',
                    params: {
                        code: roomID,
                        userID: userID,
                        username: username,
                        content: chatMessageInput,
                    },
                }),
            );
        } else console.log('WebSocket is not ready');
        setChatMessageInput('');
    };

    return (
        <section className='flex max-h-[50%] flex-col items-center'>
            <h2 className='mx-auto my-6 text-center text-xl font-bold text-white'>
                Chat
            </h2>
            <section className='flex w-[90%] flex-col items-center rounded-lg bg-white md:max-w-lg'>
                <section className='mx-auto my-2 flex max-h-48 w-[90%] flex-col gap-1 overflow-y-auto bg-white py-2'>
                    {chatLogs.map((element, index) => {
                        return (
                            <ChatMessageItem key={index} element={element} />
                        );
                    })}
                </section>
                <form
                    className='flex w-[90%] flex-row gap-4 bg-white py-2'
                    onSubmit={handleMessageSend}
                >
                    <label className='w-full'>
                        <input
                            className='w-full rounded-md px-4 py-2 text-black'
                            type='text'
                            autoComplete='off'
                            placeholder='Send a message'
                            maxLength={250}
                            onChange={(e) => {
                                setChatMessageInput(e.target.value);
                            }}
                            value={chatMessageInput}
                        ></input>
                    </label>
                    <button className='rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-700'>
                        Send
                    </button>
                </form>
            </section>
        </section>
    );
}
