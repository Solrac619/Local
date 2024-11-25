import express from "express";
import mysql from 'mysql2';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const app = express();
app.use(express.json());
app.use(cors());

const CONEXION = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Carlos2001", 
    database: "LocalSave",
    port: "3307"
});

CONEXION.connect((error) => {
    if (error) {
        console.log("Error en la conexión a la base de datos:", error);
    } else {
        console.log("Conexión realizada");
    }
});

const secretoJWT = "TuClaveSecreta123$%";

function generarTokenJWT(usuarioId) {
    return jwt.sign({ userId: usuarioId }, secretoJWT, { expiresIn: '1h' });
}

function compararContraseña(contrasena, hash) {
    return bcrypt.compareSync(contrasena, hash);
}

// Ruta para el registro de usuario
app.post("/registro", (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const sql = "INSERT INTO usuario (emailUsuario, passwordUsuario) VALUES (?, ?)";
    CONEXION.query(sql, [email, hashedPassword], (error, resultado) => {
        if (error) {
            console.log("Error en la consulta SQL:", error);
            return res.status(500).json({ Error: "Error al registrar el usuario" });
        }

        const token = generarTokenJWT(resultado.insertId);
        return res.status(201).json({ Estatus: "OK", token });
    });
});

// Ruta para el inicio de sesión
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT id, passwordUsuario FROM usuario WHERE emailUsuario=?";
    
    CONEXION.query(sql, [email], (error, resultado) => {
        if (error) {
            console.log("Error en la consulta SQL:", error);
            return res.status(500).json({ Error: "Error en la consulta SQL" });
        }

        if (resultado.length === 0) {
            console.log("Usuario no encontrado");
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        const usuario = resultado[0];
        if (compararContraseña(password, usuario.passwordUsuario)) {
            const token = generarTokenJWT(usuario.id);

            // Devuelve la respuesta con el token y usuarioId
            return res.status(200).json({ Estatus: "OK", token, usuarioId: usuario.id });
        } else {
            console.log("Contraseña incorrecta");
            return res.status(401).json({ message: "Credenciales inválidas" });
        }
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const puerto = 8082;

app.listen(puerto, () => {
    console.log(`Servicio disponible en el puerto ${puerto}`);
});
