import { ChatMessage, LogMessage } from '@/types/WebSocketMessage';

export default function ChatMessageItem(params: {element: ChatMessage | LogMessage}){
    const { element } = params;

    return (
        <section className='flex flex-1 w-0 min-w-full items-center justify-between gap-2'>
            <div className={`bg-white ${element.username ? 'text-black' : 'text-gray-50-'} break-words`}>{element.username && (<span className='font-bold'>{element.username}:</span>)} <span className={`${element.username ? 'not-italic' : 'italic'}`}>{element.content}</span></div>
            <div className='bg-white text-gray-500 text-sm'>({new Date(element.timestamp).toLocaleTimeString('en-US')})</div>
        </section>
    );
}