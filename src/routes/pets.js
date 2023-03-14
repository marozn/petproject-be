import express from "express";
import auth from '../lib/auth.js'
import mongodb from 'mongodb';
import petModel from "../models/pet.js"
import userModel from "../models/user.js";
import Ajv from "ajv";
import S from 'fluent-json-schema';
const router = express.Router();

const ajv = new Ajv();
const petSchema = S.object()
    .prop('type', S.string().required())
    .prop('name', S.string().required())
    .prop('adoptionStatus', S.string().required())
    .prop('picture', S.string().required())
    .prop('height', S.number().required())
    .prop('weight', S.number().required())
    .prop('color', S.string().required())
    .prop('bio', S.string().required())
    .prop('hypoallergenic', S.boolean().required())
    .prop('dietRestrictions', S.string().required())
    .prop('breed', S.string().required())
    .valueOf();
const validatePet = ajv.compile(petSchema);


router.post("/",auth, async (req, res) => {
    let user = await userModel.findOne({_id: new mongodb.ObjectId(req.decoded.id)})
    if (user)
    {
      console.log(req.body)
      const valid = validatePet(req.body);
      if (!valid) {
        res.status(406).send("error: invalid request format");
      }
      else if (user.isAdmin)
      {
  
        let newPet = {type: req.body.type, name: req.body.name,adoptionStatus: req.body.adoptionStatus,picture: req.body.picture,height: req.body.height,weight: req.body.weight,color: req.body.color,bio: req.body.bio,hypoallergenic: req.body.hypoallergenic,dietRestrictions: req.body.dietRestrictions,breed: req.body.breed, currentOwner: ''};
        petModel.create(newPet);
        res.send("OK");
      }
      else
      {
        res.send('error: permission denied')
      }
    }
  
  });
  
  router.get("/:id",async (req, res) => {
    let pet = await petModel.findOne({_id: new mongodb.ObjectId(req.params.id)})
    res.send(pet)
  })
  
  router.put("/:id",auth,async (req, res) => {
    let user = await userModel.findOne({_id: new mongodb.ObjectId(req.decoded.id)})
    if (user)
    {
      const valid = validatePet(req.body);
      if (!valid) {
        res.status(406).send("error: invalid request format");
      }
      else if (user.isAdmin)
      {
        if (mongoose.isValidObjectId(req.params.id))
        {
          let newPet = {type: req.body.type, name: req.body.name,adoptionStatus: req.body.adoptionStatus,picture: req.body.picture,height: req.body.height,weight: req.body.weight,color: req.body.color,bio: req.body.bio,hypoallergenic: req.body.hypoallergenic,dietRestrictions: req.body.dietRestrictions,breed: req.body.breed};
          await petModel.updateOne({ _id: new mongodb.ObjectId(req.params.id) }, newPet);
          res.send('ok')
        }
      }
      else
      {
        res.send('error: permission denied')
      }
    }
  })
  router.post("/:id/adopt",auth,async (req, res) => {
    let pet = await petModel.findOne({_id: new mongodb.ObjectId(req.params.id)})
    if (pet.currentOwner === '' || pet.currentOwner === req.decoded.id)
    {
    await petModel.updateOne({ _id: new mongodb.ObjectId(req.params.id) }, {adoptionStatus: req.body.type, currentOwner: req.decoded.id});
    res.send('ooo')
    }
    else
    {
  
      res.send('pet already adopted by somebody else!')
    }
  })
  
  router.post("/:id/return",auth,async (req, res) => {
    let pet = await petModel.findOne({_id: new mongodb.ObjectId(req.params.id)})
    if (pet.adoptionStatus != '')
    {
    if (pet.currentOwner === req.decoded.id)
    {
    await petModel.updateOne({ _id: new mongodb.ObjectId(req.params.id) }, {adoptionStatus: "", currentOwner: ""});
    res.send('ooo')
    }
    else
    {
      res.send('permission denied!')
    }
    }
    else
    {
      res.send('pet not taken by anybody!')
    }
  })
  
  router.post("/:id/save",auth,async (req, res) => {
    let user = await userModel.findOne({_id: new mongodb.ObjectId(req.decoded.id)})
    const arr = user.savedPets
    arr.push(req.params.id)
    await userModel.updateOne({ _id: new mongodb.ObjectId(req.decoded.id) }, {savedPets: arr});
    res.send('ok')
  })
  
  router.delete("/:id/save",auth,async (req, res) => {
    let user = await userModel.findOne({_id: new mongodb.ObjectId(req.decoded.id)})
    const arr = user.savedPets
    const index = arr.indexOf(req.params.id);
    if (index > -1) 
    {
      arr.splice(req.params.id, 1);
    }
    await userModel.updateOne({ _id: new mongodb.ObjectId(req.decoded.id) }, {savedPets: arr});
    res.send('ok')
  })
  
  router.get("/user/:id/:type",async (req, res) => {
    if (req.params.type === 'saved')
    {
      let resPets = []
      let user = await userModel.findOne({_id: new mongodb.ObjectId(req.params.id)})
      for (let i = 0; i < user.savedPets.length; i++)
      {
        let pet = await petModel.findOne({_id: new mongodb.ObjectId(user.savedPets[i])})
        if (pet != null)
        {
          resPets.push(pet)
        }
      }
      res.send(resPets)
    }
    else
    {
      let pets = await petModel.find({currentOwner: req.params.id})
      res.send(pets)
    }
  })  

export default router;
