const axios = require('axios');
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/data', async (req, res) => {
    try {
        const { data } = await axios.post('https://example.com/api/data', req.body);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
