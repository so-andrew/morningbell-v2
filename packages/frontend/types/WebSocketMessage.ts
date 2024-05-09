type WebSocketRoomUpdateType =
    | 'roomUpdate'
    | 'userUpdate'
    | 'buzzerUpdate'
    | 'chatUpdate';

type WebSocketClientMessageType = 'create' | 'join' | 'hostjoin' | 'buzz' | 'reset';

type WebSocketServerUpdateType = 'error' | 'validJoin' | 'roomInfo' | 'idAssignment';

export type WebSocketMessageType =
    | WebSocketRoomUpdateType
    | WebSocketClientMessageType
    | WebSocketServerUpdateType;

export type WebSocketError = 'roomDoesNotExist' | 'roomIsFull';

// export type WebSocketMessage = {
//     type: WebSocketMessageType;
//     params?:
//         | IdAssignmentParams
//         | UpdateRoomParams
//         | UpdateBuzzerParams
//         | UpdateUserParams
//         | UpdateChatParams;
//     error?: WebSocketError;
// };

export type WebSocketMessage =
    | IdAssignmentMessage
    | UpdateRoomMessage
    | UpdateBuzzerMessage
    | UpdateUserMessage
    | UpdateChatMessage
    | ValidJoinMessage
    | RoomInfoMessage
    | ErrorMessage;

type IdAssignmentMessage = {
    type: 'idAssignment';
    params: IdAssignmentParams;
    error: undefined;
};

type UpdateRoomMessage = {
    type: 'roomUpdate';
    params: UpdateRoomParams;
    error: undefined;
};

type UpdateBuzzerMessage = {
    type: 'buzzerUpdate';
    params: UpdateBuzzerParams;
    error: undefined;
};

type UpdateUserMessage = {
    type: 'userUpdate';
    params: UpdateUserParams;
    error: undefined;
};

type UpdateChatMessage = {
    type: 'chatUpdate';
    params: UpdateChatParams;
    error: undefined;
};

type ValidJoinMessage = {
    type: 'validJoin';
    params: ValidJoinParams;
};

type RoomInfoMessage = {
    type: 'roomInfo';
    params: RoomInfoParams;
};

type ErrorMessage = {
    type: 'error';
    error: WebSocketError;
};

export type IdAssignmentParams = {
    userID: string;
};

export type ValidJoinParams = {
    code: string;
};

export type RoomInfoParams = {
    code: string;
    hostID: string;
};

export type BuzzerResetParams = {
    code: string;
    userID: string;
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
    username?: undefined;
    content: string;
    timestamp: number;
};
