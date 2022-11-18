const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000 ;
const app = express();

// Middle Ware
app.use(cors());
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.v1rp4a3.mongodb.net/?retryWrites=true&w=majority`;

console.log(uri);


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});











// Basic server setUp
app.get('/', (req, res) => {
    res.send('Smile Clinic server in running')
})

// Server running checkup
app.listen(port, () => {
    console.log(`Smile Clinic Running On ${port} Port`);
    
})

