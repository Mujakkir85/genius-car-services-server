const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { decode } = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000
const app = express();

//middleware
app.use(cors());
app.use(express.json())


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log('inside verifyJWT', authHeader);

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        console.log('decoded', decoded)
        req.decoded = decoded;
        next();
    })

}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rsw8e.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('geniusCar').collection('service');
        const orderCollection = client.db('geniusCar').collection('order')

        //AUTH
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ accessToken })
        })
        //load all data
        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        });

        //load a single service data
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service)
        })

        //Post
        app.post('/service', async (req, res) => {
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result);
        })

        //Delete

        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        })

        //Order Collection API

        //load order
        app.get('/order', verifyJWT, async (req, res) => {
            const decodeEmail = req.decoded.email;
            const email = req.query.email;
            //console.log(email);
            if (email === decodeEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const order = await cursor.toArray()
                res.send(order);
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }
        })

        //create order
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })
    }
    finally {

    }
}

run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('Running Genius Server')
});

app.listen(port, () => {
    console.log('Listening to port', port)
})