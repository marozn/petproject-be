import mongoose from "mongoose"

const userSchema = new mongoose.Schema({ email: 'string', password: 'string', firstname: 'string', lastname: 'string', phonenumber: 'string', isAdmin: 'bool', savedPets: [], bio: 'string'});
const userModel = mongoose.model('User', userSchema);

export default userModel;