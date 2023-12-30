'use client';
import {
    useHomePageState,
    useRoom,
    useUser,
    useWs,
} from '@/app/context/providers';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserList from './UserList';
import Chat from './Chat';
import HostUserList from './HostList';
import {
    UpdateBuzzerParams,
    UpdateRoomParams,
    UpdateUserParams,
} from '@/types/WebSocketMessage';
import Link from 'next/link';

export default function Room() {
    const router = useRouter();
    const { roomID, setRoomID } = useRoom();
    const { userID, setUserID, username, setUsername } = useUser();
    const { pageState, setPageState } = useHomePageState();
    const [ready, val, send] = useWs();

    const [userList, setUserList] = useState([]);
    const [buzzerLocked, setBuzzerLocked] = useState(false);
    const [buzz, setBuzz] = useState('');
    const [host, setHost] = useState('');
    const [logs, setLogs] = useState<Array<string>>([]);

    const [showErrorMessage, setShowErrorMessage] = useState(false);

    //let rerouteToHome: NodeJS.Timeout | null = null;
    let showErrorMessageTimeout: NodeJS.Timeout | null = null;

    useEffect(() => {
        //console.log(`Room ${roomID}, user ${userID}`);
        if (
            localStorage.getItem('roomInitialLoadFinished') === null ||
            localStorage.getItem('roomInitialLoadFinished') === 'false'
        ) {
            localStorage.setItem('roomInitialLoadFinished', 'true');
            //localStorage.setItem('uid', userID);
            //localStorage.setItem('roomID', roomID);
        } else {
            if (!ready) {
                // rerouteToHome = setTimeout(() => {
                //     router.replace('/');
                //     localStorage.setItem('roomInitialLoadFinished', 'false');
                // }, 1000 * 10);

                router.replace('/');
                localStorage.setItem('roomInitialLoadFinished', 'false');
                // send(
                //     JSON.stringify({
                //         type: 'leave',
                //         params: {
                //             roomID: localStorage.getItem('roomID'),
                //             userID: localStorage.getItem('uuid'),
                //         },
                //     })
                // );
            }
        }
    }, []);

    useEffect(() => {
        if (ready && showErrorMessageTimeout) {
            clearTimeout(showErrorMessageTimeout);
        } else if (!ready) {
            showErrorMessageTimeout = setTimeout(() => {
                setShowErrorMessage(true);
                setPageState('landing');
                setRoomID('');
            }, 1000 * 5);
        }
    }, [ready]);

    useEffect(() => {
        //console.log(`Running useEffect, val = ${val}`);
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
                default:
                    console.log(
                        `Message with type ${lastMessage.type} received`
                    );
                    break;
            }
        }
        // if (lastMessage && lastMessage.type === 'error') {
        //     console.log(lastMessage.error);
        // }
        // if (lastMessage && lastMessage.type === 'roomUpdate') {
        //     console.log(lastMessage.params);
        //     updateRoom(lastMessage.params);
        // }
        // if (lastMessage && lastMessage.type === 'userUpdate') {
        //     console.log(lastMessage.params);
        //     updateUsers(lastMessage.params);
        // }
        // if (lastMessage && lastMessage.type === 'buzzerUpdate') {
        //     //console.log(lastMessage.params);
        //     updateBuzzer(lastMessage.params);
        // }
    }, [val]);

    function updateRoom(params: UpdateRoomParams): void {
        const {
            code: roomID,
            hostID,
            buzzerLocked,
            buzz,
            logs,
            users,
        } = params;
        setRoomID(roomID);
        setHost(hostID);
        setBuzzerLocked(buzzerLocked);
        setBuzz(buzz);
        setLogs(logs);
        setUserList(JSON.parse(users));

        localStorage.setItem('roomID', roomID);
    }

    function updateBuzzer(params: UpdateBuzzerParams): void {
        const { buzzerLocked, buzz } = params;
        setBuzzerLocked(buzzerLocked);
        setBuzz(buzz);
    }

    function updateUsers(params: UpdateUserParams): void {
        const { users, logs } = params;
        setUserList(JSON.parse(users));
        setLogs(logs);
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
                    })
                );
            } else {
                console.log('Buzzer is not locked');
            }
        } else {
            if (!buzzerLocked) {
                send(
                    JSON.stringify({
                        type: 'buzz',
                        params: {
                            code: roomID,
                            userID: userID,
                        },
                    })
                );
            }
        }
    }

    return (
        <>
            {ready && (
                <section className='grid lg:grid-cols-2 content-start items-start lg:items-center h-screen'>
                    <div className='m-auto'>
                        <button
                            className={`${
                                buzzerLocked
                                    ? 'bg-red-500 hover:bg-red-700'
                                    : 'bg-blue-500 hover:bg-blue-700'
                            } my-4 aspect-square min-h-40 lg:max-h-60 rounded-full text-2xl text-white text-center`}
                            onClick={handleBuzz}
                        >
                            {userID === host
                                ? 'Reset'
                                : buzzerLocked
                                  ? 'Locked'
                                  : 'Buzz'}
                        </button>
                    </div>
                    <div>
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
                    </div>
                    <div>
                        <Chat />
                    </div>
                </section>
            )}
            {!ready && !showErrorMessage && (
                <h2 className='mx-auto my-10 text-center text-white text-xl'>
                    Loading...
                </h2>
            )}
            {!ready && showErrorMessage && (
                <div className='mx-auto my-10 text-center text-white text-xl'>
                    <p>
                        Something went wrong.{' '}
                        <Link className='text-blue-500' href='/'>
                            Click here
                        </Link>{' '}
                        to go home.
                    </p>
                </div>
            )}
        </>
    );
}
