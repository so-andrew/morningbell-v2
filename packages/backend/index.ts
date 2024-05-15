import { WebSocketServer } from 'ws';
//const dbProvider = 'mongo';
// import { connectToMongoDB } from './mongo.mjs';
// import { GameRoom } from './schemas/gameroom.mjs';
import { customAlphabet } from 'nanoid';
import url from 'url';
import { v4 as uuidv4 } from 'uuid';
import { Socket } from './socket';
import dotenv from 'dotenv';

import {
    BuzzerResetParams,
    ChatMessage,
    ClientBuzzParams,
    ClientChatParams,
    ClientJoinParams,
    ClientLeaveParams,
    LogMessage,
    RoomData,
} from '../frontend/types/WebSocketMessage';

dotenv.config();

const maxClients = 64;
//let rooms = new Map(); // Mapping room code to array of WebSockets

// MongoDB connection
// connectToMongoDB();

// Configure nanoid
const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5);

// Create WebSocket server
const wsPath = process.env.NODE_ENV === 'development' ? '/ws/' : '/ws';

const wss = new WebSocketServer({ 
	port: 8000,
	path: wsPath
});
const roomConnections = new Map<string, Map<string, Socket>>();
const roomData = new Map<string, RoomData>();
const users = new Map<string, Map<string, string>>();
const logs = new Map<string, Array<LogMessage>>();

wss.on('connection', (ws:Socket, req) => {
    const params = url.parse(req.url as string, true);

    // Assign uid by either receiving from connection request or assigning a new one
    const uuid =
        params && params.query.uid ? (params.query.uid as string) : uuidv4();

    console.log(`Number of connected clients: ${wss.clients.size}`);
    console.log(`userID: ${uuid}`);
    ws.send(
        JSON.stringify({
            type: 'idAssignment',
            params: {
                userID: uuid,
            },
        }),
    );

    ws.isAlive = true;
    ws.userID = uuid;
    ws.on('error', console.error);
    ws.on('pong', heartbeat);

    ws.on('message', async (data) => {
        const obj = JSON.parse(data.toString());
        const type = obj.type;
        const params = obj.params;

        console.log(obj);

        switch (type) {
            case 'create':
                await create();
                break;
            case 'join':
                join(params);
                break;
            case 'hostjoin':
                hostjoin(params);
                break;
            case 'leave':
                leave(params);
                break;
            case 'buzz':
                buzz(params);
                break;
            case 'reset':
                resetBuzzer(params);
                break;
            case 'chat':
                chat(params);
                break;
            default:
                console.warn(`Unknown type ${type}`);
                break;
        }
    });

    ws.on('close', () => {
        console.log('Closing connection');
        roomConnections.forEach(
            (room: Map<string, Socket>, roomID: string) => {
                if (room.has(uuid)) {
                    console.log(`Removing user ${uuid} from room ${roomID}`);
                    room.delete(uuid);
                    users.get(roomID)!.delete(uuid);
                    //broadcastRoomUpdate(roomID);
                    broadcastUserUpdate(roomID);
                }
                if (room.size === 0) {
                    console.log(`Room ${roomID} is empty, deleting room`);
                    roomConnections.delete(roomID);
                }
            },
        );
        console.log(`Number of connected clients: ${wss.clients.size}`);
        console.log(`Number of rooms: ${roomConnections.size}`);
    });

    async function create() {
        const roomID = nanoid();
        console.log(roomID);

        // const res = await GameRoom.insertMany(gameRoom);
        // console.log(res);

        // Send message to client
        ws.send(
            JSON.stringify({
                type: 'roomInfo',
                params: {
                    code: roomID,
                    hostID: uuid,
                },
            }),
        );
    }

    async function join(params: ClientJoinParams) {
        const { code: roomID, username } = params;

        // If room does not exist
        if (!roomConnections.has(roomID)) {
            console.warn(`Room ${roomID} does not exist`);
            ws.send(
                JSON.stringify({ type: 'error', error: 'roomDoesNotExist' }),
            );
            return;
        }

        // If room is full
        if (roomConnections.get(roomID)!.size >= maxClients) {
            console.warn(`Room ${roomID} is full`);
            ws.send(JSON.stringify({ type: 'error', error: 'roomIsFull' }));
            return;
        }

        // If name is already taken
        for (const name of users.get(roomID)!.values()) {
            if (username === name) {
                console.warn(`Username ${username} already taken.`);
                ws.send(
                    JSON.stringify({ type: 'error', error: 'usernameTaken' }),
                );
                return;
            }
        }

        // Add user to collection
        if (!roomConnections.get(roomID)!.has(uuid)) {
            roomConnections.get(roomID)!.set(uuid, ws); // Add socket to connection map
            users.get(roomID)!.set(uuid, username); // Add username to user map
            //console.log(users.get(roomID));
            const log = {
                code: roomID,
                content: `${users.get(roomID)!.get(uuid)} joined the room.`,
                timestamp: Date.now(),
            };
            logs.get(roomID)!.push(log);
            roomData.get(roomID)!.combinedChatLogs.push(log);
        }

        // Sending join confirmation message to client
        console.log(`Sending join message to ${uuid}`);
        ws.send(
            JSON.stringify({
                type: 'validJoin',
                params: {
                    code: roomID,
                },
            }),
        );

        // Broadcast update to all connected clients in room
        broadcastRoomUpdate(roomID);

        // // Fetch room from database
        // const roomEntry = await GameRoom.findOne({ _id: roomID });

        // // If room does not exist
        // if(!roomEntry){
        //     console.warn(`Room ${roomID} does not exist`);
        //     ws.send(JSON.stringify({ type: 'error', error: 'roomDoesNotExist'}));
        //     return;
        // }

        // // If number of connected users is greater than max
        // if (roomEntry.users.size >= maxClients) {
        //     console.warn(`Room ${roomID} is full`);
        //     ws.send(JSON.stringify({ type: 'error', error: 'roomIsFull'}));
        //     return;
        // }

        // // Add user to map of users in database
        // let userMap = roomEntry.users;
        // ws['roomID'] = roomID;
        // ws['username'] = params.username;
        // userMap.set(ws['userID'], ws);
        // roomEntry['users'] = userMap;

        // // Update database
        // const res = await GameRoom.updateOne({ _id: roomID }, { $set: { users: userMap }});
        // console.log(res);

        // Send message to clients in room
        // userMap.forEach(client => {
        //     client.send(JSON.stringify({ type: 'roomUpdate', params: {
        //         code: roomEntry._id,
        //         buzzerLocked: roomEntry.buzzerLocked,
        //         buzz: roomEntry.buzz,
        //         hostID: roomEntry.hostID,
        //         users: roomEntry.users,
        //         logs: roomEntry.logs,
        //     }}));
        // });
    }

    async function hostjoin(params: ClientJoinParams) {
        const { code: roomID, username, userID } = params;

        const gameRoom = {
            _id: roomID,
            buzzerLocked: false,
            buzz: null,
            hostID: userID,
            users: new Map<string, string>(),
            logs: new Array<LogMessage>(),
            chat: new Array<ChatMessage>(),
            combinedChatLogs: new Array<LogMessage | ChatMessage>(),
        };

        // Update in-memory collections
        if (!roomConnections.has(roomID)) {
            roomConnections.set(roomID, new Map<string, Socket>());
        }
        if (!roomData.has(roomID)) {
            roomData.set(roomID, gameRoom);
        }
        if (!users.has(roomID)) {
            users.set(roomID, new Map<string, string>());
        }
        if (!logs.has(roomID)) {
            logs.set(roomID, []);
        }

        // // If room does not exist
        // if (!roomConnections.has(roomID)) {
        //     console.warn(`Room ${roomID} does not exist`);
        //     ws.send(
        //         JSON.stringify({ type: 'error', error: 'roomDoesNotExist' })
        //     );
        //     return;
        // }

        // // If room is full
        // if (roomConnections.get(roomID)!.size >= maxClients) {
        //     console.warn(`Room ${roomID} is full`);
        //     ws.send(JSON.stringify({ type: 'error', error: 'roomIsFull' }));
        //     return;
        // }

        // Add user to collection
        if (!roomConnections.get(roomID)!.has(uuid)) {
            roomConnections.get(roomID)!.set(uuid, ws); // Add socket to connection map
            users.get(roomID)!.set(uuid, username); // Add username to user map
            //console.log(users.get(roomID));
            roomData.get(roomID)!.hostID = uuid; // Set host UUID
            const log = {
                code: roomID,
                content: `${users.get(roomID)!.get(uuid)} joined the room.`,
                timestamp: Date.now(),
            };
            logs.get(roomID)!.push(log);
            roomData.get(roomID)!.combinedChatLogs.push(log);
        }

        // Sending join confirmation message to client
        console.log(`Sending join message to ${uuid}`);
        ws.send(
            JSON.stringify({
                type: 'validJoin',
                params: {
                    code: roomID,
                },
            }),
        );

        // Broadcast update to all connected clients in room
        broadcastRoomUpdate(roomID);

        // // Fetch room from database
        // const roomEntry = await GameRoom.findOne({ _id: roomID });

        // // If room does not exist
        // if(!roomEntry){
        //     console.warn(`Room ${roomID} does not exist`);
        //     ws.send(JSON.stringify({ type: 'error', error: 'roomDoesNotExist'}));
        //     return;
        // }

        // // If number of connected users is greater than max
        // if (roomEntry.users.size >= maxClients) {
        //     console.warn(`Room ${roomID} is full`);
        //     ws.send(JSON.stringify({ type: 'error', error: 'roomIsFull'}));
        //     return;
        // }

        // // Add user to map of users in database
        // let userMap = roomEntry.users;
        // ws['roomID'] = roomID;
        // ws['username'] = params.username;
        // userMap.set(ws['userID'], ws);
        // roomEntry['users'] = userMap;

        // // Update database
        // const res = await GameRoom.updateOne({ _id: roomID }, { $set: { users: userMap, hostID: ws['userID'] }});
        // console.log(res);

        // // Send message to clients in room
        // userMap.forEach(client => {
        //     client.send(JSON.stringify({ type: 'userUpdate', params: {
        //         code: roomEntry._id,
        //         hostID: roomEntry.hostID,
        //         users: roomEntry.users,
        //         userID: client.userID,
        //         logs: roomEntry.logs,
        //     }}));
        // });
    }

    async function leave(params: ClientLeaveParams) {
        const { code: roomID, userID } = params;
        // users[roomID] = users[roomID].filter(
        //     (userID) => userID !== params.userID
        // );

        // console.log(`leave message received from ${params.userID}`);
        // console.log(params);

        if (!users.has(roomID)) {
            console.log(`Room ${roomID} does not exist, returning...`);
            return;
        }

        // Iterate through users in room, remove requesting user
        for (const key of users.get(roomID)!.keys()) {
            if (key === userID) {
                const log = {
                    code: roomID,
                    content: `${users.get(roomID)!.get(key)} left the room.`,
                    timestamp: Date.now(),
                };
                logs.get(roomID)!.push(log);
                roomData.get(roomID)!.combinedChatLogs.push(log);

                users.get(roomID)!.delete(key);
                roomConnections.get(roomID)!.delete(key);
            }
        }
        //delete roomConnections[roomID][params.userID];

        // Send message to clients
        broadcastUserUpdate(roomID);

        //if (!roomConnections.get(roomID).has(uuid)) return;
        if (roomConnections.get(roomID)!.size === 0) {
            console.log(`Closing room ${roomID} from leave`);
            //delete roomConnections[roomID];
            roomConnections.delete(roomID);
        }

        // // Fetch room from database
        // const roomEntry = await GameRoom.findOne({ _id: roomID });

        // // Filter out user from map of users
        // let userMap = roomEntry.users;
        // userMap = userMap.filter(userID => userID !== ws['userID']);
        // roomEntry['users'] = userMap;
        // ws['roomID'] = undefined;

        // // Update database
        // const res = await GameRoom.updateOne({ _id: roomID }, { $set: { users: userMap, hostID: ws['userID'] }});
        // console.log(res);

        // // Send message to clients
        // userMap.forEach(client => {
        //     client.send(JSON.stringify({ type: 'userUpdate', params: {
        //         code: roomEntry._id,
        //         users: roomEntry.users,
        //         logs: roomEntry.logs,
        //     }}));
        // });

        // if(userMap.size === 0){
        //     console.log(`Closing room ${room}`);
        //     await GameRoom.deleteOne({ _id: roomID });
        // }
    }

    async function buzz(params: ClientBuzzParams) {
        const { code: roomID, userID: buzz } = params;

        if (!roomData.get(roomID)!.buzzerLocked) {
            roomData.get(roomID)!.buzzerLocked = true;
            roomData.get(roomID)!.buzz = buzz;

            for (const client of roomConnections.get(roomID)!.values()) {
                client.send(
                    JSON.stringify({
                        type: 'buzzerUpdate',
                        params: {
                            code: roomID,
                            buzzerLocked: roomData.get(roomID)!.buzzerLocked,
                            buzz: roomData.get(roomID)!.buzz,
                        },
                    }),
                );
            }
        } else {
            console.log('Buzzer is locked');
        }

        // // Fetch room from database
        // const roomEntry = await GameRoom.findOne({ _id: roomID });

        // // Check if room buzzer is locked
        // if(!roomEntry.buzzerLocked){
        //     // Lock buzzer and set user as the buzzed user
        //     const res = await GameRoom.updateOne({ _id: roomID }, { $set: { buzzerLocked: true, buzz: ws['userID']}});
        //     console.log(res);

        //     let userMap = roomEntry.users;

        //     // Send message to clients
        //     userMap.forEach(client => {
        //         client.send(JSON.stringify({ type: 'buzzerUpdate', params: {
        //             code: roomEntry._id,
        //             buzzerLocked: true,
        //             buzz: ws['userID'],
        //         }}));
        //     });
        // }
        // else {
        //     console.log('Buzzer is locked');
        // }
    }

    async function resetBuzzer(params: BuzzerResetParams) {
        const roomID = params.code;

        if (params.userID === roomData.get(roomID)!.hostID) {
            roomData.get(roomID)!.buzzerLocked = false;
            roomData.get(roomID)!.buzz = '';

            for (const client of roomConnections.get(roomID)!.values()) {
                client.send(
                    JSON.stringify({
                        type: 'buzzerUpdate',
                        params: {
                            code: roomID,
                            buzzerLocked: roomData.get(roomID)!.buzzerLocked,
                            buzz: roomData.get(roomID)!.buzz,
                        },
                    }),
                );
            }
        } else {
            console.warn('User is not host');
        }

        // // Fetch room from database
        // const roomEntry = await GameRoom.findOne({ _id: roomID });

        // // Check if user is host
        // if(params.userID === roomEntry.hostID){
        //     const res = await GameRoom.updateOne({ _id: roomID }, { $set: { buzzerLocked: false }});
        //     console.log(res);
        // }
        // else {
        //     console.warn('User is not host');
        // }
    }

    async function chat(params: ClientChatParams) {
        const { code: roomID, userID, username, content: message } = params;

        const chatMessage = {
            code: roomID,
            userID: userID,
            username: username,
            content: message,
            timestamp: Date.now(),
        };

        console.log(chatMessage);
        roomData.get(roomID)!.chat.push(chatMessage);
        roomData.get(roomID)!.combinedChatLogs.push(chatMessage);

        broadcastChatUpdate(roomID);
    }
});

const interval = setInterval(() => {
    // console.log('Running ping code');
    // (wss.clients as Set<Socket>).forEach((ws:Socket) => {
    //     if (!ws.isAlive){
    //         console.log(`Terminating connection ${ws['userID']}`);
    //         return ws.terminate();
    //     }
    //     ws.isAlive = false;
    //     console.log(`Pinging ${ws['userID']}`);
    //     ws.ping();
    // });

    // Check every room for disconnected clients
    for (const [roomID, room] of roomConnections.entries()) {
        for (const [userID, socket] of room.entries()) {
            console.log(socket.userID);
            if (!socket.isAlive) {
                console.log(`Terminating connection ${userID}`);
                roomConnections.get(roomID)!.delete(userID);
                broadcastRoomUpdate(roomID);
                if (roomConnections.get(roomID)!.size === 0) {
                    console.log(`Closing room ${roomID} in interval`);
                    roomConnections.delete(roomID);
                }
                return socket.terminate();
            }
            socket.isAlive = false;
            console.log(`Pinging client ${userID}`);
            socket.ping();
        }
    }
}, 30000);

wss.on('close', () => {
    clearInterval(interval);
    console.log('Server closing');
});

function broadcastRoomUpdate(roomID: string) {
    for (const client of roomConnections.get(roomID)!.values()) {
        client.send(
            JSON.stringify({
                type: 'roomUpdate',
                params: {
                    code: roomID,
                    buzzerLocked: roomData.get(roomID)!.buzzerLocked,
                    buzz: roomData.get(roomID)!.buzz,
                    hostID: roomData.get(roomID)!.hostID,
                    users: JSON.stringify(Array.from(users.get(roomID)!)),
                    chatLogs: roomData.get(roomID)!.combinedChatLogs,
                },
            }),
        );
    }
}

function broadcastUserUpdate(roomID: string) {
    for (const client of roomConnections.get(roomID)!.values()) {
        client.send(
            JSON.stringify({
                type: 'userUpdate',
                params: {
                    code: roomID,
                    users: JSON.stringify(Array.from(users.get(roomID)!)),
                    chatLogs: roomData.get(roomID)!.combinedChatLogs,
                },
            }),
        );
    }
}

function broadcastChatUpdate(roomID: string) {
    for (const client of roomConnections.get(roomID)!.values()) {
        client.send(
            JSON.stringify({
                type: 'chatUpdate',
                params: {
                    code: roomID,
                    chatLogs: roomData.get(roomID)!.combinedChatLogs,
                },
            }),
        );
    }
}

function heartbeat() {
    this.isAlive = true;
    console.log('Received pong');
}
