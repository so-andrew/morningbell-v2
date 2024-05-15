import { WebSocket } from 'ws';

export interface Socket extends WebSocket {
    isAlive: boolean,
    userID: string;
}