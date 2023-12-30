'use client';
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    ReactNode,
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

// type WebSocketContext = {
//     ready: boolean,
//     val,
//     send: () => {}
// }

const UserContext = createContext<UserContext | null>(null);
const RoomContext = createContext<RoomContext | null>(null);
const WebSocketContext = createContext([false, null, () => {}]);
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
            'useHomePageState must be used within an AppContextProvider'
        );
    }
    return context;
}

export function AppContextProvider({
    children,
}: AppContextProviderProps): JSX.Element {
    const [userID, setUserID] =
        localStorage && localStorage.getItem('uid')
            ? useState(localStorage.getItem('uid'))
            : useState('');
    const [username, setUsername] = useState('');
    const [roomID, setRoomID] = useState('');
    const [isReady, setIsReady] = useState(false);
    const [val, setVal] = useState(null);
    const ws = useRef<WebSocket | null>(null);
    const [pageState, setPageState] = useState('landing');

    useEffect(() => {
        const socket = userID
            ? new WebSocket(`ws://localhost:8000?uid=${userID}`)
            : new WebSocket('ws://localhost:8000');
        socket.onopen = () => {
            console.log('WebSocket connection established');
            setIsReady(true);
        };
        socket.onclose = () => {
            console.log('WebSocket connection closed');
            setIsReady(false);
        };
        socket.onmessage = (event) => setVal(event.data);

        ws.current = socket;

        return () => {
            socket.close();
        };
    }, []);

    const ret = [isReady, val, ws.current?.send.bind(ws.current)];

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
