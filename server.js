const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware pour servir les fichiers statiques du dossier public
app.use(express.static(path.join(__dirname, 'public')));

// Route principale pour servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Serveur Express lancé sur http://localhost:${port}`);
});