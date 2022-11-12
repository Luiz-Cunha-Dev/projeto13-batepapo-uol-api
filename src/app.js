import express, {json} from "express";
import cors from "cors";
import {MongoClient} from "mongodb";
import dotenv from "dotenv";
import Joi from "joi";
import dayjs from "dayjs";


 const nameSchema = Joi.object({
    name: Joi.string().required()
});

const messageSchema = Joi.object({
    to: Joi.string().required(),
    text: Joi.string().required(),
    type: Joi.string().required().valid('message', 'private_message')
});


const app = express();

dotenv.config();
app.use(cors());
app.use(json());
let db;
let mensagens;
let usuarios;
let now = dayjs();

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


app.post("/messages", async(req, res) => {
    const message = req.body;
    const { user } = req.headers;

    try{
        const usuarioExistente = await usuarios.findOne({name: user})

        if(!user || !usuarioExistente){
            res.sendStatus(422)
            return
        }

        const validation = messageSchema.validate(message, {abortEarly: false});

        if(validation.error){
            const erros = validation.error.details.map(detail => detail.message)
            res.status(422).send(erros)
            return
        }

        const mensagem = {
            from: user,
            to: message.to,
            text: message.text,
            type: message.type,
            time: now.format("HH:mm:ss")
        }

        await mensagens.insertOne(mensagem)

        res.sendStatus(201)

    } catch(err){
        res.status(500)
        console.log(err);
    }
});

app.get("/messages", async(req, res) => {
    const {limit} = req.query;
    const {user} = req.headers;

    try{
        const mensagensSalvas = await mensagens.find().toArray();

        const mensagensFiltradas = mensagensSalvas.filter(m => m.to === user || m.type === "message");
            
            if(!limit){
                res.status(201).send(mensagensFiltradas)
            }else{
                res.status(201).send(mensagensFiltradas.slice(-limit))
            }

    } catch(err){
        res.status(500)
        console.log(err);
    }
});

app.post("/status", async(req, res) => {
    const {user} = req.headers;

    try{
        const usuarioExistente = await usuarios.findOne({name: user})

        if(!usuarioExistente){
            res.sendStatus(404);
        }

        const usuarioAtualizado = {... usuarioExistente, lastStatus: Date.now()}

        await usuarios.updateOne({name: user},{ $set: usuarioAtualizado })

        res.sendStatus(200)

    } catch(err){
        res.status(500);
        console.log(err);
    }

})

app.listen(5000, () => console.log("Server running in port: 5000"))