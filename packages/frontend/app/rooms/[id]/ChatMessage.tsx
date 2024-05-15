import { ChatMessage, LogMessage } from '@/types/WebSocketMessage';

export default function ChatMessageItem(params: {element: ChatMessage | LogMessage}){
    const { element } = params;

    return (
        <>
            <div className={`group bg-white ${element.username ? 'text-black' : 'text-gray-500'} sm:[overflow-anchor:none] last-of-type:[overflow-anchor:auto]`}>{element.username && (<><span className='font-bold'>{element.username}</span><span className='font-normal'>: </span></>)} <span className={`${element.username ? 'not-italic' : 'italic'} break-words`}>{element.content}</span><span className='bg-white text-white group-hover:text-gray-500 text-sm'> ({new Date(element.timestamp).toLocaleTimeString('en-US')})</span></div>
        </>
    );
}