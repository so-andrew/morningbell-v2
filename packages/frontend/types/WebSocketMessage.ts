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
    chatLogs: Array<LogMessage | ChatMessage>;
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
    chatLogs: Array<LogMessage | ChatMessage>;
};

export type UpdateChatParams = {
    code: string;
    chatLogs: Array<LogMessage | ChatMessage>;
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

export type ClientLeaveParams = {
    code: string;
    userID: string;
};

export type ClientChatParams = {
    code: string;
    userID: string;
    username: string;
    content: string;
};

export type RoomData = {
    _id: string;
    buzzerLocked: boolean;
    buzz: string | null;
    hostID: string;
    users: Map<string, string>;
    logs: Array<LogMessage>;
    chat: Array<ChatMessage>;
    combinedChatLogs: Array<LogMessage | ChatMessage>;
};

export type ChatMessage = {
    code: string;
    userID: string;
    username: string;
    content: string;
    timestamp: number;
};

export type LogMessage = {
    code: string;
    content: string;
    timestamp: number;
};
