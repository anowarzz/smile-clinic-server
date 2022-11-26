const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
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

// Verifying Jwt token
function verifyJWT(req, res, next) {
  console.log("token inside verify token", req.headers.authorization);

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("Unauthorized access");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

// MongoDb Crud Operations
async function run() {
  try {
    const appointmentOptionCollection = client
      .db("SmileClinic")
      .collection("appointmentOptions");

    const bookingsCollection = client.db("SmileClinic").collection("bookings");

    const usersCollection = client.db("SmileClinic").collection("users");
    const doctorsCollection = client.db("SmileClinic").collection("doctors");


// Verify admin has to run after verify jwt
const verifyAdmin = async(req, res, next) => {

const decodedEmail = req.decoded.email;
const query = {email : decodedEmail}
const user = await usersCollection.findOne(query);

if(user?.role !== 'admin'){
  return res.status(403).send({message: 'forbidden access'})
}
next();
}




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
    // app.get("/v2/appointmentOptions", async (req, res) => {
    //   const date = req.query.date;
    //   const options = await appointmentOptionCollection
    //     .aggregate([
    //       {
    //         $lookup: {
    //           from: "bookings",
    //           localField: "name",
    //           foreignField: "treatment",
    //           pipeline: [
    //             {
    //               $match: {
    //                 $expr: {
    //                   $eq: ["$appointmentDate", date],
    //                 },
    //               },
    //             },
    //           ],
    //           as: "booked",
    //         },
    //       },
    //       {
    //         $project: {
    //           name: 1,
    //           slots: 1,
    //           booked: {
    //             $map: {
    //               input: "$booked",
    //               as: "book",
    //               in: "$book.slot",
    //             },
    //           },
    //         },
    //       },
    //       {
    //         $project: {
    //           name: 1,
    //           slots: {
    //             setDifference: ["$slots1", "$booked"],
    //           },
    //         },
    //       },
    //     ])
    //     .toArray();
    //   res.send(options);
    // });

    // Sending appointment bookings to DB
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const query = {
        appointmentDate: booking.appointmentDate,
        email: booking.email,
        treatment: booking.treatment,
      };
      const alreadyBooked = await bookingsCollection.find(query).toArray();

      if (alreadyBooked.length) {
        const message = `You already have a booking on ${booking.appointmentDate}`;
        return res.send({ acknowledged: false, message });
      }

      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    // Loading My appointments from server
    app.get("/bookings", verifyJWT, async (req, res) => {
      const email = req.query.email;

      const decodedEmail = req.decoded.email;

      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    // sending jwt token to client side while login/signup
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);

      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1d",
        });
        return res.send({ accessToken: token });
      }

      res.status(403).send({ accessToken: "" });
    });

    // Saving User information in database
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = usersCollection.insertOne(user);
      res.send(result);
    });

    // Loading all users to display in all users
    app.get('/users', async(req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users)
    })


// Making an user admin (updating user info)
app.put('/users/admin/:id', verifyJWT, verifyAdmin, async(req, res) => {


  const id = req.params.id;
  const filter = {_id: ObjectId(id)}
  const options = {upsert: true}
  const updatedDoc = {
    $set: {
      role :'admin'
    }
  }
  const result = await usersCollection.updateOne(filter, updatedDoc, options)
  res.send(result)

})

// check if a user is admin or not
app.get('/users/admin/:email', async(req, res) => {
  const email = req.params.email; 
  const query = {email}
  const user = await usersCollection.findOne(query)
 res.send({isAdmin : user?.role === 'admin'})
})

// Doctor specialty name for while adding a doctor
app.get('/appointmentSpecialty', async(req, res) => {
  const query = {}
  const result = await appointmentOptionCollection.find(query).project({name: 1}).toArray();
  res.send(result)
})

// adding a  doctor to database
app.post('/doctors', verifyJWT, verifyAdmin, async(req, res) => {
  const doctor = req.body;
  const result = await doctorsCollection.insertOne(doctor);
  res.send(result)
})

// Displaying all doctors in manage doctors
app.get('/doctors',verifyJWT, verifyAdmin, async(req, res) => {
  const query = {};
  const doctors = await doctorsCollection.find(query).toArray();
  res.send(doctors)
})

// Deleting one doctor
app.delete('/doctors/:id', verifyJWT, verifyAdmin, async(req, res) => {
  const id = req.params.id;
  const filter = {_id: ObjectId(id)};
  const result = await doctorsCollection.deleteOne(filter);
  res.send(result)

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
