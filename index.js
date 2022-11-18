const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000 ;
const app = express();

// Middle Ware
app.use(cors());
app.use(express.json())




// Connecting to MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.v1rp4a3.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// MongoDb Crud Operations

async function run () {

try{

const appointmentOptionCollection = client.db('SmileClinic').collection('appointmentOptions')

app.get('/appointmentOptions', async(req, res) => {
    const query = {}
    const options = await appointmentOptionCollection.find(query).toArray();
    res.send(options)
})


}


finally{

}


}


run().catch(console.log)






// Basic server setUp
app.get('/', (req, res) => {
    res.send('Smile Clinic server in running and flying')
})

// Server running checkup
app.listen(port, () => {
    console.log(`Smile Clinic Running On ${port} Port`);
    
})

