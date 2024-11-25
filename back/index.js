const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');  // Corrección aquí
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Configuración de la conexión a MySQL
const conexion = mysql.createConnection({
  host: 'localhost',
  port: '3307',
  user: 'root',
  password: 'Carlos2001',
  database: 'LocalSave',
});

// Conectar a la base de datos MySQL
conexion.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos MySQL');
});

// Establecer la carpeta 'uploads' como estática para servir imágenes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configurar multer para manejar la subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Directorio donde se guardarán las imágenes
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname); // Nombre de archivo único
  },
});

const upload = multer({ storage: storage });

// Obtener datos del inventario (incluyendo la URL completa de la imagen)
app.get('/inventario', (req, res) => {
  conexion.query('SELECT id, nombre, cantidad, tipo, imagen FROM inventario', (error, resultados) => {
    if (error) {
      console.error('Error al obtener el inventario:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    } else {
      // Modificar la respuesta para incluir la URL base de las imágenes
      const inventarioConURL = resultados.map(item => {
        return {
          ...item,
          imagen: `http://localhost:3001/uploads/${path.basename(item.imagen)}`
        };
      });

      res.json({ inventario: inventarioConURL });
    }
  });
});

// Obtener datos del inventario por ID de usuario (incluyendo la URL completa de la imagen)
app.get('/inventario/:id', (req, res) => {
  const usuarioId = req.params.id;

  conexion.query('SELECT id, nombre, cantidad, tipo, imagen FROM inventario WHERE id_usuario = ?', [usuarioId], (error, resultados) => {
    if (error) {
      console.error('Error al obtener el inventario:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    } else {
      // Modificar la respuesta para incluir la URL base de las imágenes
      const inventarioConURL = resultados.map(item => {
        return {
          ...item,
          imagen: `http://localhost:3001/uploads/${path.basename(item.imagen)}`
        };
      });

      res.json({ inventario: inventarioConURL });
    }
  });
});

// Agregar un elemento al inventario
app.post('/inventario/agregar', upload.single('imagen'), (req, res) => {
  const { nombre, cantidad, tipo, id_usuario } = req.body;

  // Verificar si ya existe un elemento con el mismo nombre
  conexion.query('SELECT * FROM inventario WHERE nombre = ?', [nombre], (error, resultados) => {
    if (error) {
      console.error('Error al verificar duplicados:', error);
      return res.status(500).json({ mensaje: 'Error interno del servidor' });
    }

    if (resultados.length > 0) {
      return res.status(400).json({ mensaje: 'Ya existe un elemento con este nombre.' });
    }

    // Insertar el nuevo elemento en la base de datos
    const query = 'INSERT INTO inventario (nombre, cantidad, tipo, imagen, id_usuario) VALUES (?, ?, ?, ?, ?)';
    const rutaImagen = req.file ? req.file.path : null; // Ruta del archivo de imagen subido

    conexion.query(query, [nombre, cantidad, tipo, rutaImagen, id_usuario], (errorInsert, resultadoInsert) => {
      if (errorInsert) {
        console.error('Error al agregar elemento al inventario:', errorInsert);
        return res.status(500).json({ mensaje: 'Error interno del servidor' });
      }

      res.json({ mensaje: 'Elemento agregado al inventario.' });
    });
  });
});

// Editar un elemento del inventario
app.put('/inventario/editar/:id', upload.single('imagen'), (req, res) => {
  const id = req.params.id;
  const { increment, decrement, cantidad, nombre, tipo } = req.body;
  let rutaImagen = '';

  if (req.file) {
    rutaImagen = req.file.path;
  }

  if (increment) {
    conexion.query('UPDATE inventario SET cantidad = cantidad + 1 WHERE id = ?', [id], (error, results) => {
      if (error) {
        console.error('Error al incrementar la cantidad del producto:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
      } else {
        res.json({ mensaje: 'Producto incrementado.' });
      }
    });
  } else if (decrement) {
    if (cantidad > 0) {
      conexion.query('UPDATE inventario SET cantidad = cantidad - 1 WHERE id = ?', [id], (error, results) => {
        if (error) {
          console.error('Error al decrementar la cantidad del producto:', error);
          res.status(500).json({ mensaje: 'Error interno del servidor' });
        } else {
          res.json({ mensaje: 'Producto decrementado.' });
        }
      });
    } else {
      res.status(400).json({ mensaje: 'La cantidad no puede ser menor que cero.' });
    }
  } else {
    if (rutaImagen) {
      conexion.query('UPDATE inventario SET nombre = ?, cantidad = ?, tipo = ?, imagen = ? WHERE id = ?', [nombre, cantidad, tipo, rutaImagen, id], (error, results) => {
        if (error) {
          console.error('Error al editar el producto con imagen:', error);
          res.status(500).json({ mensaje: 'Error interno del servidor' });
        } else {
          res.json({ mensaje: 'Producto editado con nueva imagen.' });
        }
      });
    } else {
      conexion.query('UPDATE inventario SET nombre = ?, cantidad = ?, tipo = ? WHERE id = ?', [nombre, cantidad, tipo, id], (error, results) => {
        if (error) {
          console.error('Error al editar el producto sin imagen:', error);
          res.status(500).json({ mensaje: 'Error interno del servidor' });
        } else {
          res.json({ mensaje: 'Producto editado.' });
        }
      });
    }
  }
});

// Eliminar un elemento del inventario
app.delete('/inventario/eliminar/:id', (req, res) => {
  const id = req.params.id;

  const query = 'DELETE FROM inventario WHERE id = ?';
  conexion.query(query, [id], (error, resultado) => {
    if (error) {
      console.error('Error al eliminar elemento del inventario:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    } else {
      res.json({ mensaje: 'Elemento eliminado.' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor en funcionamiento en http://localhost:${PORT}`);
});
