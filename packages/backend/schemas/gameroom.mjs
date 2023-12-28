import * as mongoose from 'mongoose';

const gameroom = mongoose.Schema({
    _id: String, 
    buzzerLocked: Boolean,
    hostID: String,
    users: {
        type: Map,
        of: Object,
    },
    logs: {
        type: Map,
        of: Object
    },
});

const gameroomSchema = mongoose.model('gamerooms', gameroom);

export { gameroomSchema as GameRoom };