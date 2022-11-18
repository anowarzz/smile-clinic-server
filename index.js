const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000 ;
const app = express();

// Middle Ware
app.use(cors());
app.use(express.json())

// Basic server setUp
app.get('/', (req, res) => {
    res.send('Smile Clinic server in running')
})

// Server running checkup
app.listen(port, () => {
    console.log(`Smile Clinic Running On ${port} Port`);
    
})

