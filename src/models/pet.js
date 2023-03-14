import mongoose from "mongoose"

const petSchema = new mongoose.Schema({type: 'string', name: 'string',adoptionStatus: 'string',picture: 'string',height: 'number',weight: 'number',color: 'string',bio: 'string',hypoallergenic: 'bool',dietRestrictions: 'string',breed: 'string', currentOwner: 'string'});
const petModel = mongoose.model('Pet', petSchema);

export default petModel;