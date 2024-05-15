'use client';
import { WebSocketMessage } from '@/types/WebSocketMessage';
import React, {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

type AppContextProviderProps = { children: ReactNode };

type UserContext = {
    userID: string;
    setUserID: React.Dispatch<React.SetStateAction<string>>;
    username: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
};

type RoomContext = {
    roomID: string;
    setRoomID: React.Dispatch<React.SetStateAction<string>>;
};

type HomePageContext = {
    pageState: string;
    setPageState: React.Dispatch<React.SetStateAction<string>>;
};

type WSContext = {
    ready: boolean;
    val: WebSocketMessage;
    send:
        | ((data: string | ArrayBufferLike | Blob | ArrayBufferView) => void)
        | undefined;
};

const UserContext = createContext<UserContext | null>(null);
const RoomContext = createContext<RoomContext | null>(null);
const WebSocketContext = createContext<WSContext | undefined>(undefined);
const HomePageContext = createContext<HomePageContext | null>(null);

export const useRoom = () => {
    const context = useContext(RoomContext);
    if (!context) {
        throw new Error('useRoom must be used within an AppContextProvider');
    }
    return context;
};

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within an AppContextProvider');
    }
    return context;
}

export function useWs() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWs must be used within an AppContextProvider');
    }
    return context;
}

export function useHomePageState() {
    const context = useContext(HomePageContext);
    if (!context) {
        throw new Error(
            'useHomePageState must be used within an AppContextProvider',
        );
    }
    return context;
}

function getUIDFromLocalStorage(): string {
    const uid = localStorage.getItem('uid');
    console.log(uid);
    return uid ? uid : '';
}

export function AppContextProvider({
    children,
}: AppContextProviderProps): React.JSX.Element {
    // State relating to game rooms
    const [userID, setUserID] = useState('');

    useEffect(() => {
        setUserID(getUIDFromLocalStorage());
        localStorage.setItem('backButtonPressed', 'false');
    }, []);

    // const [userID, setUserID] =
    //     localStorage && localStorage.getItem('uid')
    //         ? useState(localStorage.getItem('uid'))
    //         : useState('');
    const [username, setUsername] = useState('');
    const [roomID, setRoomID] = useState('');
    const [isReady, setIsReady] = useState(false);

    // State relating to websockets
    const [val, setVal] = useState(null as unknown as WebSocketMessage);
    const ws = useRef<WebSocket | null>(null);
    const [waitingToReconnect, setWaitingToReconnect] = useState(false);

    // State relating to landing page display
    const [pageState, setPageState] = useState('landing');

    useEffect(() => {
        // Wait to reconnect
        if (waitingToReconnect) {
            console.log('Waiting to reconnect');
            return;
        }

        // If no WebSocket connection, establish one
        if (!ws.current) {
            const localUID = getUIDFromLocalStorage();
            setUserID(localUID);

            const protocol = window.location.protocol.includes('https') ? 'wss' : 'ws';
            let socket;

            console.log(process.env.NODE_ENV);
            if(process.env.NODE_ENV === 'development'){
                socket = localUID
                ? new WebSocket(`ws://localhost:8000/ws/?uid=${localUID}`)
                : new WebSocket('ws://localhost:8000/ws/');
            }
            else {
                socket = localUID
                ? new WebSocket(`${protocol}://${window.location.host}/ws/?uid=${localUID}`)
                : new WebSocket(`${protocol}://${window.location.host}/ws/`);
            }
            
            ws.current = socket;
            console.log(ws.current);

            socket.onopen = () => {
                console.log('WebSocket connection established');
                setIsReady(true);
            };

            socket.onclose = () => {
                if (ws.current) {
                    console.log('WebSocket connection closed due to failure');
                } else {
                    console.log(
                        'WebSocket connection closed by app component unmount',
                    );
                    return;
                }

                if (waitingToReconnect) {
                    return;
                }

                setIsReady(false);
                setWaitingToReconnect(true);
                setTimeout(() => setWaitingToReconnect(false), 3000);
            };
            socket.onmessage = (event) => {
                console.log(event.data);
                setVal(JSON.parse(event.data) as WebSocketMessage);
            };

            return () => {
                ws.current = null;
                socket.close();
            };
        }
    }, [waitingToReconnect]);

    const ret: WSContext = {
        ready: isReady,
        val: val,
        send: ws.current?.send.bind(ws.current),
    };

    return (
        <WebSocketContext.Provider value={ret}>
            <HomePageContext.Provider value={{ pageState, setPageState }}>
                <RoomContext.Provider value={{ roomID, setRoomID }}>
                    <UserContext.Provider
                        value={{ userID, setUserID, username, setUsername }}
                    >
                        {children}
                    </UserContext.Provider>
                </RoomContext.Provider>
            </HomePageContext.Provider>
        </WebSocketContext.Provider>
    );
}
