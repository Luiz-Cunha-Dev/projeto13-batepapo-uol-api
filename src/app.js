import express, {json} from "express";
import cors from "cors";
import {MongoClient} from "mongodb";
import dotenv from "dotenv";
import Joi from "joi";


 const nameSchema = Joi.object({
    name: Joi.string().required()
});

const messageSchema = Joi.object({
    to: Joi.string().required(),
    text: Joi.required(),
    type: Joi.string().required().valid('message', 'private_message')
});


const app = express();

dotenv.config();
app.use(cors());
app.use(json());
let db;
let mensagens;
let usuarios;

try{
    const mongoClient = new MongoClient(process.env.MONGO_URI);
  await  mongoClient.connect();
  db = mongoClient.db("projetoUol")
  mensagens = db.collection("mensagens")
  usuarios = db.collection("usuarios")
} catch(err){
    console.log(err);
}


app.post("/participants", async(req, res) => {
    const name = req.body;

    const nomeJaExistente = await usuarios.findOne(name)
    console.log(nomeJaExistente);

    if(nomeJaExistente){
        res.sendStatus(409)
        return
    }

    try{
        const validation =  nameSchema.validate(name);

        if (validation.error) {
            res.status(422).send(validation.error.details[0].message)
            return
          }

          let usuario ={
            name: name.name,
            lastStatus: Date.now()
          }

        usuarios.insertOne(usuario)

        res.status(201).send("OK")

    } catch(err){
        res.status(500)
        console.log(err);
    }
});

app.get("/participants", async(req, res) => {

    try{
        const participantes = await usuarios.find().toArray();
    
        res.status(201).send(participantes)

    } catch(err){
        res.status(500)
        console.log(err);
    }
});



app.get("/messages", async(req, res) => {

    try{

        res.status(201).send("OK")

    } catch(err){
        res.status(500)
        console.log(err);
    }
});

app.listen(5000, () => console.log("Server running in port: 5000"))