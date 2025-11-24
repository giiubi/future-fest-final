const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const porta = 3000;
const methodOverride = require('method-override');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'segredo-floresce-150890',
    resave: false,
    saveUninitialized: true,
}));
app.use(express.static(__dirname + '/public'))
app.use(methodOverride('_method'));

const urlMongo = 'mongodb+srv://giu:giu081008@giulianna.fkfgfak.mongodb.net/?appName=giulianna';

const connectDb = async () => {
  try {
    await mongoose.connect(urlMongo, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Conectado ao MongoDB com sucesso!");
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
  }
};

connectDb();

const usuarioSchema = new mongoose.Schema({
    usuario: String,
    email: String,
    senha: String,
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/home.html');
});

app.get('/cadastro', (req, res) => {
    res.sendFile(__dirname + '/cadastro.html');
});

app.post('/cadastro', async (req, res) => {
    try {
        const usuarioExistente = await Usuario.findOne({ email: req.body.email });

        if (usuarioExistente) {
            res.send("E-mail já cadastrado! Tente outro e-mail.");
        } else {
            const senhaCriptografada = await bcrypt.hash(req.body.senha, 10);
            const novoUsuario = new Usuario({
                usuario: req.body.usuario,
                email: req.body.email,
                senha: senhaCriptografada,
            });

            await novoUsuario.save();
            res.redirect('/login');
        }
    } catch (erro) {
        console.error("Erro ao registrar o usuário:", erro);
        res.send("Erro ao registrar o usuário. Tente novamente");
    }
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.post('/login', async (req, res) => {
    try {
        let usuario = await Usuario.findOne({ email: req.body.email });

        if (usuario) {
            usuario = await Usuario.findOne({ usuario: req.body.usuario });
        }

        if (usuario && await bcrypt.compare(req.body.senha, usuario.senha)) {
            req.session.usuario = req.body.usuario;
            res.redirect('/chat');
        } else {
            res.send("E-mail, senha ou nome de usuário incorretos.");
        }
    } catch (erro) {
        res.send("Erro ao realizar login. Tente novamente");
    }
});

function protegerChat(req, res, proximo) {
    if (req.session.usuario) {
        proximo();
    } else {
        res.redirect('/login');
    }
}

app.get('/chat', protegerChat, (req, res) => {
    res.sendFile(__dirname + '/chat.html');
});

app.get('/erro', protegerChat, (req, res) => {
    res.sendFile(__dirname + '/erro.html');
});

app.get('/sair', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.send("Erro ao sair!");
        }
        res.redirect('/login');
    });
});

app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${porta}`);
});
