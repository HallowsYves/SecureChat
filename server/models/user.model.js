import mongoose from 'mongoose'; 

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    publicKey: Object
});

const User = mongoose.model('User', userSchema);
export default User;
