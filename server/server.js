const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import the cors middleware

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors()); // Use the cors middleware
app.get('/', (req, res) => {
  res.send('<h1>server is running</h1>');
});

app.post('/api/createUser', async (req, res) => {
  const objToSave = {
    username: req.body.username,
    password: req.body.password
  };

  const options = {
    headers: {
      'Authorization': '1sa3yLa4EtnOjoz4',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  };

  try {
    const response = await axios.post('http://ubox19:9090/plugins/restapi/v1/users', objToSave, options);
    res.json(response.data);
  } catch (error) {
    console.error('Error creating user:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
