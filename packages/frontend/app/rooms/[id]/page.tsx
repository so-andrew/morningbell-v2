'use client';
import {
    useHomePageState,
    useRoom,
    useUser,
    useWs,
} from '@/app/context/providers';
import {
    ChatMessage,
    LogMessage,
    UpdateBuzzerParams,
    UpdateChatParams,
    UpdateRoomParams,
    UpdateUserParams,
} from '@/types/WebSocketMessage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Chat from './Chat';
import HostUserList from './HostList';
import UserList from './UserList';

export default function Room() {
    const router = useRouter();

    // State from providers
    const { roomID, setRoomID } = useRoom();
    const { userID, username, setUsername } = useUser();
    const { pageState, setPageState } = useHomePageState();
    const [ready, val, send] = useWs();

    // State for game room
    const [userList, setUserList] = useState([]);
    const [buzzerLocked, setBuzzerLocked] = useState(false);
    const [buzz, setBuzz] = useState('');
    const [host, setHost] = useState('');
    const [chatLogs, setChatLogs] = useState<Array<LogMessage | ChatMessage>>(
        [],
    );

    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [audio] = useState(new Audio('/bell.mp3'));

    //let rerouteToHome: NodeJS.Timeout | null = null;
    let showErrorMessageTimeout: NodeJS.Timeout | null = null;

    useEffect(() => {
        // If room has not loaded yet
        if (
            localStorage.getItem('roomInitialLoadFinished') === null ||
            localStorage.getItem('roomInitialLoadFinished') === 'false'
        ) {
            // Room has loaded, check if a previous room is still in browser history
            if (localStorage.getItem('backButtonPressed') === 'true') {
                // Go to main page and replace history entry with main page, preventing invalid entry into room
                router.replace('/');
            } else {
                // Room has successfully loaded
                localStorage.setItem('roomInitialLoadFinished', 'true');
            }
        } else {
            // If WebSocket is not in ready state for whatever reason
            if (!ready) {
                // Return to landing page
                router.replace('/');
            }
        }

        return () => {
            // Cleanup function; send leave message to server
            if (ready) {
                send(
                    JSON.stringify({
                        type: 'leave',
                        params: {
                            code: roomID,
                            userID: userID,
                        },
                    }),
                );
                setRoomID('');
                // For handling back button presses (see check above)
                localStorage.setItem('backButtonPressed', 'true');
            } else {
                console.log('WebSocket is not ready');
            }
        };
    }, []);

    useEffect(() => {
        if (ready && showErrorMessageTimeout) {
            clearTimeout(showErrorMessageTimeout);
        } else if (!ready) {
            showErrorMessageTimeout = setTimeout(() => {
                setShowErrorMessage(true);
                //setPageState('landing');
                //setRoomID('');
            }, 1000 * 5);
        }
    }, [ready]);

    useEffect(() => {
        const lastMessage = JSON.parse(val);
        if (lastMessage) {
            switch (lastMessage.type) {
                case 'error':
                    console.log(lastMessage.error);
                    break;
                case 'roomUpdate':
                    updateRoom(lastMessage.params);
                    break;
                case 'userUpdate':
                    updateUsers(lastMessage.params);
                    break;
                case 'buzzerUpdate':
                    updateBuzzer(lastMessage.params);
                    break;
                case 'chatUpdate':
                    updateChat(lastMessage.params);
                    break;
                default:
                    console.log(
                        `Message with type ${lastMessage.type} received`,
                    );
                    break;
            }
        }
    }, [val]);

    function updateRoom(params: UpdateRoomParams): void {
        const {
            code: roomID,
            hostID,
            buzzerLocked,
            buzz,
            chatLogs,
            users,
        } = params;
        setRoomID(roomID);
        setHost(hostID);
        setBuzzerLocked(buzzerLocked);
        setBuzz(buzz);
        //setLogs(logs);
        setUserList(JSON.parse(users));
        setChatLogs(chatLogs);

        localStorage.setItem('roomID', roomID);
    }

    function updateBuzzer(params: UpdateBuzzerParams): void {
        const { buzzerLocked, buzz } = params;
        setBuzzerLocked(buzzerLocked);
        setBuzz(buzz);
    }

    function updateUsers(params: UpdateUserParams): void {
        const { users, chatLogs } = params;
        setUserList(JSON.parse(users));
        setChatLogs(chatLogs);
    }

    function updateChat(params: UpdateChatParams): void {
        const { chatLogs } = params;
        setChatLogs(chatLogs);
    }

    function handleBuzz() {
        if (userID === host) {
            if (buzzerLocked) {
                send(
                    JSON.stringify({
                        type: 'reset',
                        params: {
                            code: roomID,
                            userID: userID,
                        },
                    }),
                );
            } else {
                console.log('Buzzer is not locked');
            }
        } else {
            if (!buzzerLocked) {
                audio.play();
                send(
                    JSON.stringify({
                        type: 'buzz',
                        params: {
                            code: roomID,
                            userID: userID,
                        },
                    }),
                );
            }
        }
    }

    return (
        <>
            {ready && (
                <section className='grid h-screen content-start items-start lg:grid-cols-2 lg:items-center'>
                    <div className='m-auto'>
                        <button
                            className={`${
                                buzzerLocked
                                    ? 'bg-red-500 hover:bg-red-700'
                                    : 'bg-blue-500 hover:bg-blue-700'
                            } my-4 aspect-square min-h-40 rounded-full text-center text-2xl text-white lg:max-h-60`}
                            onClick={handleBuzz}
                        >
                            {userID === host
                                ? 'Reset'
                                : buzzerLocked
                                  ? 'Locked'
                                  : 'Buzz'}
                        </button>
                    </div>
                    <>
                        {userID !== host && (
                            <UserList
                                userList={userList}
                                userID={userID}
                                username={username}
                                buzzedUser={buzz}
                                host={host}
                            />
                        )}
                        {userID === host && (
                            <HostUserList
                                userList={userList}
                                userID={userID}
                                username={username}
                                buzzedUser={buzz}
                            />
                        )}
                    </>
                    <div className='lg:col-start-2'>
                        <Chat chatLogs={chatLogs} />
                    </div>
                </section>
            )}
            {!ready && !showErrorMessage && (
                <h2 className='mx-auto my-10 text-center text-xl text-white'>
                    Loading...
                </h2>
            )}
            {!ready && showErrorMessage && (
                <p className='mx-auto my-10 text-center text-xl text-white'>
                    Something went wrong.{' '}
                    <Link className='text-blue-500' href='/'>
                        Click here
                    </Link>{' '}
                    to go home.
                </p>
            )}
        </>
    );
}
