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

const bookingsCollection = client.db('SmileClinic').collection('bookings')



// Use Aggregate to query multiple collection and then merge data
app.get('/appointmentOptions', async(req, res) => {

    const date = req.query.date
    console.log(date);
    
    const query = {}
    const options = await appointmentOptionCollection.find(query).toArray();
// Get the booking of the provided date
    const bookingQuery = {appointmentDate: date}
    const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();

// Code To Be Careful

    options.forEach(option => {
        const optionBooked = alreadyBooked.filter(book => book.treatment === option.name)

    const bookedSlots = optionBooked.map(book => book.slot)

    const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))

    option.slots = remainingSlots;
       
    })

    res.send(options)
})

// Sending appointment bookings to DB
app.post('/bookings', async(req, res) => {
    const booking = req.body;
    const result = await bookingsCollection.insertOne(booking)
    res.send(result)
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

/*
API Naming Convention 

 1. app.get('/bookings')
 2. app.get('/bookings/:id')
 3 app.post('/bookings')
 4. app.patch('/bookings/:id)
 5. app.delete('/bookings/:id)
*/