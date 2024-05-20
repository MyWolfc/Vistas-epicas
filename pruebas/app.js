const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const multer = require('multer');
const base64 = require('base-64');
const mysql = require('mysql2');

const base64String = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA'; // Your base64 image string
const base64Image = base64String.split(';base64,').pop();
const pathe = './iman/kyo.jpg';

fs.writeFile(pathe, base64Image, { encoding: 'base64' }, (err) => {
    if (err) {
        console.error('Error writing the image file:', err);
    } else {
      console.log(base64Image)
        console.log('Image file created successfully:', pathe);
    }
});

const storage = multer.memoryStorage();

const storages = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './temps') // Directorio donde se guardarán las imágenes
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // Nombre del archivo en el servidor
  }
});
const uploadd = multer({ storage: storages });

const uploadd2 = multer({ storage: storage });

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

app.post('/agregarImagen', uploadd.single('inputFile'), async (req, res) => 
  {

    res.send('Imagen guardada exitosamente');
  })



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
function renderImagen(data) {
  
  return base64.encode(btoa(unescape(encodeURIComponent(data))));
}
function renderImagen2(data) {
  if (data)
    return base64.encode(btoa(unescape(encodeURIComponent(data))));
  
}



// Configuración de multer para subir archivos
const upload = multer();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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
// Ruta para mostrar la imagen
app.get('/displayimage', async (req, res) => {
  try {
    console.log(req.body.user_id)
    const searchImage = await Imagen.findOne({ where: { usuarioId: req.body.user_id} });

    console.log(searchImage)
    if (searchImage) {
      console.log(searchImage.nombre)
      console.log(searchImage.datos); // Registro para imprimir los datos de la imagen
      //let buff = new Buffer(searchImage.datos, 'base64');
      const imageBase64 = renderImagen2(searchImage.datos);
      // Renderizar la vista 'displayimage.ejs' y pasar la imagen en base64 a la plantilla
      res.render('perfilusuario', { imagen: imageBase64 });
    } else {
      res.json({ message: 'no image' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Ruta para subir la imagen
app.post('/uploadperfil/:id', upload.single('inputFile'), async (req, res) => {
  try {
    console.log(req.params.id)
    console.log("chechpoint :D")
    const usuario_idd = req.params.id; // Asegúrate de declarar esta variable con const
    const searchImage = await Imagen.findOne({ where: { usuarioId: usuario_idd } });
    const data = req.file.buffer;
    const renderFile = renderImagen(data);

    if (searchImage) {
      searchImage.rendered_data = renderFile;
      searchImage.data = data;
      await searchImage.save();
      res.json({ message: 'imagen actualizada' });
    } else {
      const newFile = new Imagen({
        nombre: req.file.originalname,
        datos: data,
        usuarioId: usuario_idd, // Utiliza 'usuarioId' en lugar de 'usuario_id'
      });
      
      await newFile.save();
      res.json({ message: 'Imagen agregada' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Ruta para actualizar la imagen en la base de datos
app.put('/actualizar-imagen/:id', async (req, res) => {
  const id = req.params.id;
  const imagePath = 'ruta_a_tu_imagen.jpg'; // Ruta a tu imagen .jpg
  
  try {
    // Leer el archivo de la imagen
    const imageData = fs.readFileSync(imagePath);

    // Buscar la imagen por ID
    const image = await Image.findByPk(id);
    if (!image) {
      return res.status(404).send('Imagen no encontrada');
    }

    // Actualizar la imagen en la base de datos
    image.filename = path.basename(imagePath);
    image.data = imageData;
    await image.save();

    // Enviar una respuesta indicando que la imagen ha sido actualizada
    res.send(`Imagen con ID ${id} actualizada correctamente.`);
  } catch (error) {
    console.error('Error al actualizar la imagen:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Iniciar el servidor
const PORT = 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor Express iniciado en el puerto ${PORT}`);
  });
});
