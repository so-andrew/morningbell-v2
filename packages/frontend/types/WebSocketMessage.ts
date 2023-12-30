type WebSocketUpdateType = 'roomUpdate' | 'userUpdate' | 'buzzerUpdate';

export type WebSocketMessageType =
    | (WebSocketUpdateType & 'create')
    | 'join'
    | 'hostjoin'
    | 'buzz'
    | 'reset'
    | 'error';

export type WebSocketError = 'roomDoesNotExist' | 'roomIsFull';

export type WebSocketMessage = {
    type: WebSocketMessageType;
    params?: UpdateRoomParams | UpdateBuzzerParams | UpdateUserParams;
    error?: WebSocketError;
};

export type UpdateRoomParams = {
    code: string;
    hostID: string;
    buzzerLocked: boolean;
    buzz: string;
    logs: Array<string>;
    users: string;
};

export type UpdateBuzzerParams = {
    code: string;
    buzzerLocked: boolean;
    buzz: string;
};

export type UpdateUserParams = {
    code: string;
    users: string;
    logs: Array<string>;
};

export type ClientBuzzParams = {
    code: string;
    userID: string;
};

export type ClientJoinParams = {
    code: string;
    username: string;
    userID: string;
};

export type RoomData = {
    _id: string;
    buzzerLocked: boolean;
    buzz: string | null;
    hostID: string;
    users: Map<string, string>;
    logs: Array<string>;
};
