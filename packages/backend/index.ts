import { WebSocket, WebSocketServer } from 'ws';
//const dbProvider = 'mongo';
// import { connectToMongoDB } from './mongo.mjs';
// import { GameRoom } from './schemas/gameroom.mjs';
import { v4 as uuidv4 } from 'uuid';
import url from 'url';
import {
    ClientBuzzParams,
    ClientJoinParams,
    RoomData,
} from '../frontend/types/WebSocketMessage';

const maxClients = 64;
//let rooms = new Map(); // Mapping room code to array of WebSockets

// MongoDB connection
// connectToMongoDB();

// Create WebSocket server
const wss = new WebSocketServer({ port: 8000 });
const roomConnections = new Map<string, Map<string, WebSocket>>();
const roomData = new Map<string, RoomData>();
const users = new Map<string, Map<string, string>>();
const logs = new Map<string, Array<string>>();

wss.on('connection', (ws, req) => {
    const params = url.parse(req.url, true);
    //console.log(params);

    // Assign uid by either receiving from connection request or assigning a new one
    const uuid = params && params.query.uid ? params.query.uid : uuidv4();

    console.log(`Number of connected clients: ${wss.clients.size}`);
    console.log(`userID: ${uuid}`);
    ws.send(
        JSON.stringify({
            type: 'idAssignment',
            params: {
                userID: uuid,
            },
        })
    );

    ws.isAlive = true;
    ws.on('error', console.error);
    ws.on('pong', heartbeat);

    /* List of messages
		- create (client -> server): 
			- generates room with unique code, adds it to database, sends to room creator
			- params: N/A
		- join (client -> server):
			- Adds user WebSocket connection to room
			- params: userID, username, roomCode
		- hostjoin (client -> server):
			- Adds host WebSocket connection to room
			- params: hostID, username, roomCode
		- buzz (client -> server):
			- Event sent when player hits the buzzer; upon receipt, server should send lock message to all connected clients
			- params: roomID, userID
		- reset (client -> server):
			- Event sent when host resets buzzer; upon receipt, server should send reset message to all connected clients
			- params: roomID, userID
		- chat (optional, might implement after core functionality)
			- params: roomID, userID, message
		- invalidJoin (server -> client)
		- serverInfo (server -> client):
			- sends server information (i.e. room ID) to client
	*/

    ws.on('message', async (data) => {
        const obj = JSON.parse(data.toString());
        const type = obj.type;
        const params = obj.params;

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
            default:
                console.warn(`Unknown type ${type}`);
                break;
        }
    });

    ws.on('close', () => {
        console.log('Closing connection');
        roomConnections.forEach(
            (room: Map<string, WebSocket>, roomID: string) => {
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
            }
        );
        console.log(`Number of connected clients: ${wss.clients.size}`);
        console.log(`Number of rooms: ${roomConnections.size}`);
    });

    async function create() {
        const roomID = roomCodeGen(5);

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
            })
        );
    }

    async function join(params: ClientJoinParams) {
        const { code: roomID, username } = params;

        // If room does not exist
        if (!roomConnections.has(roomID)) {
            console.warn(`Room ${roomID} does not exist`);
            ws.send(
                JSON.stringify({ type: 'error', error: 'roomDoesNotExist' })
            );
            return;
        }

        // If room is full
        if (roomConnections.get(roomID)!.size >= maxClients) {
            console.warn(`Room ${roomID} is full`);
            ws.send(JSON.stringify({ type: 'error', error: 'roomIsFull' }));
            return;
        }

        // Add user to collection
        if (!roomConnections.get(roomID)!.has(uuid)) {
            roomConnections.get(roomID)!.set(uuid, ws); // Add socket to connection map
            users.get(roomID)!.set(uuid, username); // Add username to user map
            //console.log(users.get(roomID));
            logs.get(roomID)!.push(
                `User ${users.get(roomID)!.get(uuid)} joined the room.`
            ); // Append to log
        }

        // Sending join confirmation message to client
        console.log(`Sending join message to ${uuid}`);
        ws.send(
            JSON.stringify({
                type: 'validJoin',
                params: {
                    code: roomID,
                },
            })
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
            logs: new Array<string>(),
        };

        // Update in-memory collections
        if (!roomConnections.has(roomID)) {
            roomConnections.set(roomID, new Map<string, WebSocket>());
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
            logs.get(roomID)!.push(
                `User ${users.get(roomID)!.get(uuid)} joined the room.`
            ); // Append to log
        }

        // Sending join confirmation message to client
        console.log(`Sending join message to ${uuid}`);
        ws.send(
            JSON.stringify({
                type: 'validJoin',
                params: {
                    code: roomID,
                },
            })
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

    async function leave(params: { roomID: string; userID: string }) {
        const { roomID, userID } = params;
        // users[roomID] = users[roomID].filter(
        //     (userID) => userID !== params.userID
        // );

        if (!users.has(roomID)) {
            console.log(`Room ${roomID} does not exist, returning...`);
            return;
        }

        // Iterate through users in room, remove requesting user
        for (const key of users.get(roomID)!.keys()) {
            if (key === userID) {
                users.get(roomID)!.delete(key);
                roomConnections.get(roomID)!.delete(key);
            }
        }
        //delete roomConnections[roomID][params.userID];

        // Send message to clients
        for (const client of roomConnections.get(roomID)!.values()) {
            client.send(
                JSON.stringify({
                    type: 'userUpdate',
                    params: {
                        code: roomID,
                        users: JSON.stringify(Array.from(users.get(roomID)!)),
                        logs: logs.get(roomID),
                    },
                })
            );
        }

        //if (!roomConnections.get(roomID).has(uuid)) return;
        if (roomConnections.get(roomID)!.size === 0) {
            console.log(`Closing room ${roomID}`);
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
        //console.log(params);
        //console.log(roomData.get(roomID));

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
                    })
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

    async function resetBuzzer(params) {
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
                    })
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

    // function serverInfo(ws){
    //     let obj;
    //     if (ws['room'] !== undefined){
    //         obj = {
    //             'type': 'info',
    //             'params': {
    //                 'room': ws['room'],
    //                 'clients': rooms.get(ws['room']).length,
    //             }
    //         };
    //     }
    //     else {
    //         obj = {
    //             'type': 'info',
    //             'params': {
    //                 'room': 'no room',
    //             }
    //         };
    //     }
    //     ws.send(JSON.stringify(obj));
    // }
});

const interval = setInterval(() => {
    console.log('Running ping code');
    // wss.clients.forEach((ws) => {
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
            if (!socket.isAlive) {
                console.log(`Terminating connection ${userID}`);
                roomConnections.get(roomID)!.delete(userID);
                broadcastRoomUpdate(roomID);
                if (roomConnections.get(roomID)!.size === 0) {
                    console.log(`Closing room ${roomID}`);
                    roomConnections.delete(roomID);
                }
                return socket.terminate();
            }
            socket.isAlive = false;
            console.log(`Pinging client ${userID}`);
            socket.ping();
        }
    }
    //console.log(roomConnections);
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
                    logs: logs.get(roomID),
                },
            })
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
                    logs: logs.get(roomID),
                },
            })
        );
    }
}

function heartbeat() {
    this.isAlive = true;
    console.log('Received pong');
}

function roomCodeGen(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return result;
}
