const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const multer = require('multer');
const base64 = require('base-64');
const mysql = require('mysql2');


fs.writeFile(pathe, base64Image, { encoding: 'base64' }, (err) => {
    if (err) {
        console.error('Error writing the image file:', err);
    } else {
      console.log(base64Image)
        console.log('Image file created successfully:', pathe);
    }
});
//esto es para decirle que los archivos que se envien en la api se cargen en memoria
const storage = multer.memoryStorage();
//Aqui creamos el metodo para leer las imagenes
const uploadd2 = multer({ storage: storage });
// Configuración de multer para subir archivos

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
 password: 'Juan@20',
  database: 'pruebas'
});

connection.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
    return;
  }
  console.log('Conexión a la base de datos exitosa');
});


const app = express();
app.use(bodyParser.json());


// Conexión a la base de datos
const sequelize = new Sequelize('pruebas', 'root', 'Juan@20', {
  dialect: 'mysql',
  host: 'localhost',
});
// Definición del modelo Usuario
const Usuario = sequelize.define('usuarios', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    contraseña: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  });
  
  // Definición del modelo Imagen

const Imagen = sequelize.define('imagenes', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  datos: {
    type: DataTypes.BLOB('long'),
    allowNull: false,
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios', // Nombre de la tabla a la que hace referencia
      key: 'id', // Nombre de la columna a la que hace referencia
    },
  },
}, {
  timestamps: false, // Desactivar la creación automática de las columnas createdAt y updatedAt
}
);


  // Relación entre las tablas Usuario e Imagen
  Usuario.hasMany(Imagen);
  Imagen.belongsTo(Usuario);

// Función para renderizar la imagen en base64

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Aqui utilizamos nadamas una imagen con el metodo single OJO: dentro del metodo tiene que ir el nombre 
//del campo donde va estar NO DE LA IMAGEN
app.post('/upload/:id', uploadd2.single('image'), (req, res) => {
  // Obtener la imagen en formato Base64
  const imageBase64 = req.file.buffer.toString('base64');
  const idusuario = req.params.id
  // Guardar la imagen en la base de datos
  const query = 'INSERT INTO imagenes (usuarioId,nombre, datos) VALUES (? ,?, ?)';
  connection.query(query, [idusuario,req.file.originalname, imageBase64], (err, result) => {
    if (err) {
      console.error('Error al guardar la imagen en la base de datos:', err);
      res.status(500).send('Error interno del servidor');
      return;
    }
    console.log('Imagen guardada en la base de datos');
    res.send('Imagen guardada exitosamente');
  });
});
//lo mismo pero inidicamos que recibimos multiples (en este caso 3) cada con su nombre
app.post('/uploadTodo/:id', uploadd2.fields([{ name: 'imagen1', maxCount: 1 }, { name: 'imagen2', maxCount: 1 },{name:'imagen3',maxCount: 1}]), function (req, res, next) {
  const imagen1 = req.files['imagen1'][0].buffer.toString('base64');
  const imagen2 = req.files['imagen2'][0].buffer.toString('base64');
  const imagen3 = req.files['imagen3'][0].buffer.toString('base64');
  const idusuario = req.params.id
  const query = 'INSERT INTO imagenes (usuarioId,nombre, datos,datos1,datos2) VALUES (? ,?, ?, ?, ?)';
  connection.query(query, [idusuario,"Producto", imagen1,imagen2,imagen3], (err, result) => {
    if (err) {
      console.error('Error al guardar la imagen en la base de datos:', err);
      res.status(500).send('Error interno del servidor');
      return;
    }
    console.log('Imagen guardada en la base de datos');
    res.send('Imagen guardada exitosamente');
  });



  // req.body contendrá los campos de texto, si los hubiera
})

//este es para mostrar una imagen ya mapeada en base 64 (checar el archivo /views/imagen.ejs para ver como se recive )
app.get('/imagen/:id', (req, res) => {
  // Consultar la imagen desde la base de datos
  const query = 'SELECT * FROM imagenes WHERE id = ?';
  connection.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error al consultar la imagen en la base de datos:', err);
      res.status(500).send('Error interno del servidor');
      return;
    }
    console.log(results[0])
    // Renderizar la plantilla EJS y pasar la imagen como variable
    res.render('imagen.ejs', { imagenBase64: results[0].datos });
  });
});
// Ruta para mostrar las  3 imagen (consultar el archivo /views/imagentodas.ejs )
app.get('/imagenTodas/:id', (req, res) => {
  // Consultar la imagen desde la base de datos
  const query = 'SELECT * FROM imagenes WHERE id = ?';
  connection.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error al consultar la imagen en la base de datos:', err);
      res.status(500).send('Error interno del servidor');
      return;
    }
    console.log(results[0])
    // Renderizar la plantilla EJS y pasar la imagen como variable en este caso son 3 se mandan como propiedad valor
    res.render('imagentodas.ejs', { imagen1: results[0].datos,imagen2: results[0].datos1, imagen3 : results[0].datos2 });
  });
});

// Iniciar el servidor
const PORT = 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor Express iniciado en el puerto ${PORT}`);
  });
});
