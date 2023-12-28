import { WebSocketServer } from 'ws';
//const dbProvider = 'mongo';
import { connectToMongoDB } from './mongo.mjs';
import { GameRoom } from './schemas/gameroom.mjs';
import { v4 as uuidv4 } from 'uuid';

const maxClients = 64;
let rooms = new Map(); // Mapping room code to array of WebSockets

// MongoDB connection
connectToMongoDB();

// Create WebSocket server
const wss = new WebSocketServer({ port: 4000 });

wss.on('connection', (ws) => {
    console.log(wss.clients);

    // Generate unique user ID
    ws['userID'] = uuidv4();

    ws.isAlive = true;
    ws.on('error', console.error);
    ws.on('pong', heartbeat);

    /* List of messages
		- create (client -> server): 
			- generates room with unique code, adds it to database, sends to room creator
			- params: N/A
		- join (client -> server):
			- Adds user WebSocket connection to room
			- params: userID, userNickname, roomCode
		- hostjoin (client -> server):
			- Adds host WebSocket connection to room
			- params: hostID, hostNickname, roomCode
		- buzz (client -> server):
			- Event sent when player hits the buzzer; upon receipt, server should send lock message to all connected clients
			- params: userID, timestamp
		- reset (client -> server):
			- Event sent when host resets buzzer; upon receipt, server should send reset message to all connected clients
			- params: userID, timestamp
		- chat (optional, might implement after core functionality)
			- params: message, userID, timestamp

        - invalidJoin (server -> client)
        - serverInfo (server -> client):
            - sends server information (i.e. room ID) to client
	*/
    ws.on('message', async (data) => {
        const obj = JSON.parse(data);
        const type = obj.type;
        const params = obj.params;

        switch (type) {
        case 'create':
            await create(params);
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

    async function create(params){
        const roomID = roomCodeGen(5);
        const gameRoom = {
            _id: roomID,
            buzzerLocked: false,
            buzzerUser: null,
            hostID: null,
            users: new Map(),
            logs: new Map(),
            userCount: 0,
        };
        const res = await GameRoom.insertMany(gameRoom);
        console.log(res);

        ws.send(JSON.stringify({ type: 'roomUpdate', params: {
            code: res[0]._id,
            buzzerLocked: res[0].buzzerLocked,
            buzzedUser: res[0].buzzedUser,
            hostID: res[0].hostID,
            users: res[0].users,
            logs: res[0].logs,
        }}));

        //rooms.set(room, [ws]);
        //ws['room'] = room;
	
        //serverInfo(ws);
    }
	
    async function join(params) {
        const roomID = params.code;

        // Fetch room from database
        const roomEntry = await GameRoom.findOne({ _id: roomID });

        // If room does not exist
        if(!roomEntry){
            console.warn(`Room ${roomID} does not exist`);
            ws.send(JSON.stringify({ type: 'error', error: 'roomDoesNotExist'}));
            return;
        }
	
        // If number of connected users is greater than max
        if (roomEntry.users.size >= maxClients) {
            console.warn(`Room ${roomID} is full`);
            ws.send(JSON.stringify({ type: 'error', error: 'roomIsFull'}));
            return;
        }
        
        // Add user to map of users in database
        let userMap = roomEntry.users;
        ws['roomID'] = roomID;
        ws['username'] = params.username;
        userMap.set(ws['userID'], ws);
        roomEntry['users'] = userMap;

        // Update database
        const res = await GameRoom.updateOne({ _id: roomID }, { $set: { users: userMap }});
        console.log(res);

        // Send message to clients in room
        userMap.forEach(client => {
            client.send(JSON.stringify({ type: 'roomUpdate', params: {
                code: roomEntry._id,
                buzzerLocked: roomEntry.buzzerLocked,
                buzzedUser: roomEntry.buzzedUser,
                hostID: roomEntry.hostID,
                users: roomEntry.users,
                logs: roomEntry.logs,
            }}));
        });
    }
	
    async function hostjoin(params) {
        const roomID = params.code;

        // Fetch room from database
        const roomEntry = await GameRoom.findOne({ _id: roomID });

        // If room does not exist
        if(!roomEntry){
            console.warn(`Room ${roomID} does not exist`);
            ws.send(JSON.stringify({ type: 'error', error: 'roomDoesNotExist'}));
            return;
        }
	
        // If number of connected users is greater than max
        if (roomEntry.users.size >= maxClients) {
            console.warn(`Room ${roomID} is full`);
            ws.send(JSON.stringify({ type: 'error', error: 'roomIsFull'}));
            return;
        }
        
        // Add user to map of users in database
        let userMap = roomEntry.users;
        ws['roomID'] = roomID;
        ws['username'] = params.username;
        userMap.set(ws['userID'], ws);
        roomEntry['users'] = userMap;

        // Update database
        const res = await GameRoom.updateOne({ _id: roomID }, { $set: { users: userMap, hostID: ws['userID'] }});
        console.log(res);

        // Send message to clients in room
        userMap.forEach(client => {
            client.send(JSON.stringify({ type: 'userUpdate', params: {
                code: roomEntry._id,
                hostID: roomEntry.hostID,
                users: roomEntry.users,
                logs: roomEntry.logs,
            }}));
        });
    }
	
    async function leave(params) {
        const roomID = ws['roomID'];

        // Fetch room from database
        const roomEntry = await GameRoom.findOne({ _id: roomID });

        // Filter out user from map of users
        let userMap = roomEntry.users;
        userMap = userMap.filter(userID => userID !== ws['userID']);
        roomEntry['users'] = userMap;
        ws['roomID'] = undefined;

        // Update database
        const res = await GameRoom.updateOne({ _id: roomID }, { $set: { users: userMap, hostID: ws['userID'] }});
        console.log(res);

        // Send message to clients
        userMap.forEach(client => {
            client.send(JSON.stringify({ type: 'userUpdate', params: {
                code: roomEntry._id,
                users: roomEntry.users,
                logs: roomEntry.logs,
            }}));
        });

        if(userMap.size === 0){
            console.log(`Closing room ${room}`);
            await GameRoom.deleteOne({ _id: roomID }); 
        }
    }

    async function buzz(params){
        const roomID = params.code;

        // Fetch room from database
        const roomEntry = await GameRoom.findOne({ _id: roomID });

        // Check if room buzzer is locked
        if(!roomEntry.buzzerLocked){
            // Lock buzzer and set user as the buzzed user
            const res = await GameRoom.updateOne({ _id: roomID }, { $set: { buzzerLocked: true, buzzedUser: ws['userID']}});
            console.log(res);

            let userMap = roomEntry.users;

            // Send message to clients
            userMap.forEach(client => {
                client.send(JSON.stringify({ type: 'buzzerUpdate', params: {
                    code: roomEntry._id,
                    buzzerLocked: true,
                    buzzedUser: ws['userID'],
                }}));
            });
        }
        else {
            console.log('Buzzer is locked');
        }
    }

    async function resetBuzzer(params){
        const roomID = params.code;

        // Fetch room from database
        const roomEntry = await GameRoom.findOne({ _id: roomID });

        // Check if user is host
        if(params.userID === roomEntry.hostID){
            const res = await GameRoom.updateOne({ _id: roomID }, { $set: { buzzerLocked: false }});
            console.log(res);
        }
        else {
            console.warn('User is not host');
        }
    }

    function serverInfo(ws){
        let obj;
        if (ws['room'] !== undefined){
            obj = {
                'type': 'info',
                'params': {
                    'room': ws['room'],
                    'clients': rooms.get(ws['room']).length,
                }
            };
        }
        else {
            obj = {
                'type': 'info',
                'params': {
                    'room': 'no room',
                }
            };
        }
        ws.send(JSON.stringify(obj));
    }
});

const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive !== false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('close', () => {
    clearInterval(interval);
});

function heartbeat() {
    this.isAlive = true;
}

function roomCodeGen(length){
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for(let i = 0; i < length; i++){
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}