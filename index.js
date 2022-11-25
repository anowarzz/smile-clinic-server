const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

// Middle Ware
app.use(cors());
app.use(express.json());

// Connecting to MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.v1rp4a3.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// MongoDb Crud Operations

async function run() {
  try {
    const appointmentOptionCollection = client
      .db("SmileClinic")
      .collection("appointmentOptions");

    const bookingsCollection = client.db("SmileClinic").collection("bookings");

    // Use Aggregate to query multiple collection and then merge data
    app.get("/appointmentOptions", async (req, res) => {
      const date = req.query.date;
      console.log(date);

      const query = {};
      const options = await appointmentOptionCollection.find(query).toArray();
      // Get the booking of the provided date
      const bookingQuery = { appointmentDate: date };
      const alreadyBooked = await bookingsCollection
        .find(bookingQuery)
        .toArray();

      // Code To Be Careful
      options.forEach((option) => {
        const optionBooked = alreadyBooked.filter(
          (book) => book.treatment === option.name
        );

        const bookedSlots = optionBooked.map((book) => book.slot);

        const remainingSlots = option.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );

        option.slots = remainingSlots;
      });

      res.send(options);
    });

    // api with version number
    app.get("/v2/appointmentOptions", async(req, res) => {
      const date = req.query.date;
      const options = await appointmentOptionCollection.aggregate([
        {
          $lookup: {
            from: "bookings",
            localField: "name",
            foreignField: "treatment",
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$appointmentDate", date],
                  },
                },
              },
              
            ],
            as: "booked",
          },
        },
        {
            $project: {
                name: 1,
                slots: 1, 
                booked: {
                    $map: {
                        input: '$booked',
                        as: 'book',
                        in: '$book.slot'
                    }
                }
            }
        },
        {
        $project: {
            name: 1, 
            slots: {
                setDifference: ['$slots1', '$booked']
            }
        }
        }
      ]).toArray();
      res.send(options)
    });

    // Sending appointment bookings to DB
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const query = {
        appointmentDate: booking.appointmentDate,
        email: booking.email,
        treatment: booking.treatment
      }
      const alreadyBooked = await bookingsCollection.find(query).toArray();

      if(alreadyBooked.length){
        const message = `You already have a booking on ${booking.appointmentDate}`
        return res.send({acknowledged: false, message})
      }


      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });



    // Loading My appointments from server

    app.get('/bookings', async(req, res) => {
      const email = req.query.email;
      const query = {email : email}
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings)

    })


  } finally {
  }
}

run().catch(console.log);

// Basic server setUp
app.get("/", (req, res) => {
  res.send("Smile Clinic server in running and flying");
});

// Server running checkup
app.listen(port, () => {
  console.log(`Smile Clinic Running On ${port} Port`);
});

/*
API Naming Convention 

 1. app.get('/bookings')
 2. app.get('/bookings/:id')
 3 app.post('/bookings')
 4. app.patch('/bookings/:id)
 5. app.delete('/bookings/:id)
*/
