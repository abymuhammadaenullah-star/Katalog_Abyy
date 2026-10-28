const express = require("express");
const app = express();
const cors = require('cors');
const port = 3000;

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res.send("Hello dari server!");
});

app.get('/api/products', (req, res) => {
    const products = [
        {
            id: 1, nama: "Ban dalam ",
            harga: 50000
        }, {
            id: 2, nama: "Stang RZR",
            harga: 120000
        }
    ];
    res.json(products);
})

app.listen(port, () => {
    console.log(`Server berhasil berjalan di http://localhost:${port}`);
});


