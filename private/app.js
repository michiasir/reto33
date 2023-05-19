const port = 3000;

const express = require('express');

const app = express();

const mongoose = require('mongoose');

const bodyParser = require('body-parser');

const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

const cookieParser = require('cookie-parser');

const xml2js = require('xml2js');

const fs = require('fs');

const mqtt = require('mqtt');

var sensor = require('node-dht-sensor')

const Gpio = require('pigpio').Gpio;

const http = require('http');

const server = http.createServer(app);

const socketIO = require('socket.io');

const io = socketIO(server);


let collection;

const temp = {
    temp: Number,
    hum: Number
};

const user = {
    user: String,
    pass: String,
    admin: Boolean
};

const url = 'mongodb+srv://admin:Almi123@cluster0.tzdlcwe.mongodb.net/?retryWrites=true&w=majority';

const path = require('path');

const { resourceLimits } = require('worker_threads');

const Temperatura = mongoose.model('temperaturas', temp);

const Usuario = mongoose.model('users', user);

async function findTemp() {
    const temperaturas = await Temperatura.find();
    //console.log(temperaturas);
};
findTemp().catch(err => console.log(err));

//MIDDLEWARE PARA VERIFICAR TOKENS
function authMiddleware(req, res, next) {
    // Verificar si existe el token en las cookies o en los encabezados de la solicitud
    const token = req.cookies.token || req.headers['x-access-token'];
  
    if(!token) {
      return res.redirect('/login'); // Si no hay token, redirige al usuario al formulario de inicio de sesión
    }
  
    // Verificar y decodificar el token
    jwt.verify(token, 'Almi123', (err, decoded) => {
        if(err) {
            return res.redirect('/login'); // Si el token no es válido, redirige al usuario al formulario de inicio de sesión
        }
        // Guardar la información del usuario en el objeto de solicitud para usarlo en las rutas posteriores
        req.user = decoded;

        req.isAdmin = decoded.admin === true;

        req.hasToken = true;

      next();
    });
}

//CONEXIÓN CON MONGOOSE
mongoose.connect(url)
    .then(() => {
        console.log('Connected to database');
    })
  .catch((err) => {
    console.log('Error connecting to database', err);
});
//MOSTRAR MENSAJE DEL PUERTO


//BODY PARSER Y CAMBIAR RUTA PRINCIPAL 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

//COOKIE PARSER
app.use(cookieParser());


//EJS    
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public/views'));

//PÁGINAS PRINCIPALES
app.get('/', authMiddleware, (req, res) => {
    res.render('index', { isAdmin: req.isAdmin, hasToken: req.hasToken, username: req.user.username });
});

app.get('/datacenter', authMiddleware, (req, res) => {
    res.render('datacenter', { isAdmin: req.isAdmin, hasToken: req.hasToken, username: req.user.username });
});

app.get('/login', (req, res) => {
    const token = req.cookies.token || req.headers['x-access-token'];
    const hasToken = !!token;
    const username = req.user ? req.user.username : '';

    if (token) {
        return res.redirect('/');
    }

    const error = req.query.error; // Obtiene el mensaje de error de la consulta
    res.render('login', { error: error, hasToken: hasToken, username: username }); // Pasa el mensaje de error a la vista
});

app.get('/logout', authMiddleware, (req, res) => {
    // Eliminar la cookie que contiene el token
    res.clearCookie('token');
  
    // Redirigir al usuario a la página de inicio de sesión u otra página de tu elección
    res.redirect('/login');
});

app.get('/register', authMiddleware, (req, res) => {
    const error = req.query.error; // Obtiene el mensaje de error de la consulta
    if(req.isAdmin === true) {
        res.render('register', { error: error, isAdmin: req.isAdmin, hasToken: req.hasToken, username: req.user.username  });
    } else {
        res.redirect('/');
    }
});

app.get('/registered', authMiddleware, (req, res) => {
    res.render('registered');
});

app.get('/statistics', authMiddleware, (req, res) => {
    res.render('statistics', { isAdmin: req.isAdmin, hasToken: req.hasToken, username: req.user.username });
});

app.get('/xml', authMiddleware, (req, res) => {
    res.render('xml', { isAdmin: req.isAdmin, hasToken: req.hasToken, username: req.user.username });
});

app.get('/showXML', (req, res) => {
    // Obtener los datos del XML desde la base de datos
    collection.findOne({}, (err, xmlData) => {
        if (err) {
            // Manejar el error
            return res.status(500).send('Error al obtener los datos del XML.');
        }
        // Renderizar la página 'showXML' con los datos del XML
        res.render('showXML', { xmlData });
    });
});
  

//NOT FOUND
app.get('*', (req, res) => {
    res.render('notfound');
});

//LOGIN
app.post('/auth', upload.none(), (req, res) => {
    var username = req.body.user;
    var password = req.body.pass;
    //console.log(`User: ${username}, Pass: ${password}`);

    Usuario.findOne({ user: username })
        .then((user) => {
            if (!user) {
                // Si el usuario no existe.
                return res.redirect('/login?error=User or password is incorrect');
            };

            const userToken = {
                username: username,
                admin: user.admin
            }
            
            bcrypt.compare(password, user.pass, function(err, result) {
                if (result) {
                    // Si los datos coinciden, genera un token JWT
                    const token = jwt.sign(userToken, 'Almi123');
                    // Establece una cookie con el token
                    res.cookie('token', token, { httpOnly: true });
                    // Redirige al usuario a la ruta "/"
                    return res.redirect('/');
                } else {
                    //Si la contraseña es incorrecta.
                    return res.redirect('/login?error=User or password is incorrect');
                }
            });
        })
        .catch((error) => {
            return res.send(error);
        });
});



//REGISTER
app.post('/registration', (req, res) => {
    let newUsername = req.body.user;
    let newPassword = req.body.pass;
    let newPasswordConfirm = req.body.repeatPass;
    let newAdmin;

    if (req.body.admin === undefined || req.body.admin === "") {
        newAdmin = false;
    } else {
        newAdmin = true;
    }

    //Comprobar contraseñas
    if (newPassword !== newPasswordConfirm) {
        return res.redirect('/register?error=Passwords do not match');
    }
    
    Usuario.findOne({ user: newUsername })
        .then((user) => {
            // Si no se encuentra el usuario, añade un nuevo documento a mongodb.
            if (!user) {
                //ENCRIPTAR CONTRASEÑA  
                // Genera un salt aleatorio
                bcrypt.genSalt(10, function(err, salt) {
                    bcrypt.hash(newPassword, salt, function(err, hash) {
                        let newUser = new Usuario({
                            user: newUsername,
                            pass: hash,
                            admin: newAdmin
                        });
                        newUser.save();
                        //console.log(newUsername + ', ' + newPassword + ', ' + newAdmin);   
                        return res.redirect('/registered');
                    });
                });
            } else {
                // Si ya existe el usuario, devuelve un error
                return res.redirect('/register?error=User already exists');
            }
        });
});

// Ruta para subir el archivo XML y guardar los datos en la base de datos
/*app.post('/uploadXML', upload.single('xmlFile'), (req, res) => {
    const filePath = req.file.path;
  
    // Parseo del archivo XML
    const parser = new xml2js.Parser();
    parser.parseString(fs.readFileSync(filePath, 'utf8'), (err, result) => {
        if (err) {
            console.error('Error al parsear el archivo XML:', err);
            res.status(500).send('Error al procesar el archivo XML.');
        } else {
            // Conexión a la base de datos
            mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => {
                console.log('Connected to database');
                const collection = mongoose.connection.db.collection('xml');
    
                // Insertar los datos en la base de datos
                collection.insertOne(result, (err) => {
                if (err) {
                    console.error('Error al insertar los datos en la base de datos:', err);
                    res.status(500).send('Error al insertar los datos en la base de datos.');
                } else {
                    console.log('Datos insertados correctamente en la base de datos.');
                    res.status(200).send('Datos insertados correctamente en la base de datos.');
                }
    
                // Cerrar la conexión a la base de datos
                mongoose.connection.close();
                });

                // Redirigir a la página que muestra el XML convertido
                res.redirect('/showXML');
            })
            .catch((err) => {
                console.log('Error connecting to database', err);
                res.status(500).send('Error al conectar a la base de datos.');
            });
        }
    });
});  

*/



//MOSTRAR LOS DATOS DE MONGO
/*
app.get('/data', async (req, res) => {
    const temperaturas = await Temperatura.find();
    const datosLimpios = JSON.stringify(temperaturas);
    res.status(200).json(datosLimpios);
});
app.get('/actualdata', async (req, res) => {
    const temperaturas = await Temperatura.find({}, {_id: 0, temp: 1, hum: 1}).sort({_id: -1}).limit(1);
    const datosLimpios = JSON.stringify(temperaturas);
    res.status(200).json(datosLimpios);
});
*/


//MQTT

const client = mqtt.connect('mqtt://23.23.161.31:1883', {
  username: 'josu',
  password: '1',
  debug: true
});

client.on('connect', function () {
  console.log('Conectado al servidor MQTT');
});

client.on('error', function (error) {
  console.log('Error de conexión:', error);
});

client.on('message', function (topic, message) {
  console.log('Mensaje recibido:', message.toString());
});

client.subscribe('test');

// SENSOR AWS


  function readSensor() {
    return new Promise((resolve, reject) => {
      sensor.read(11, 4, (err, temperature, humidity) => {
        if (err) {
          reject(err);
        } else {
          resolve({ temperature, humidity });
        }
      });
    });
  }
  
  setInterval(() => {
    readSensor()
      .then(({ temperature, humidity }) => {
        const data = `temp: ${temperature}ºC, humidity: ${humidity}%`;
        client.publish('test', data);


      })
      .catch((err) => {
        console.error(err);
      });
  }, 5000); // se ejecuta cada 1 segundo (1000 milisegundos)
  
 // SENSOR MONGO

const test = {
  temp: Number,
  hum: Number
};


const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  bufferCommands: false, // set bufferCommands to false
};
/*
mongoose.connect(url, options)
  .then(() => {
    console.log('Connected to database');
    //aqui la peticion
    

    setInterval(() => {
      readSensor()
        .then(({ temperature, humidity }) => {
          let newTemperatura = new Temperatura({
            temp: temperature,
            hum: humidity,
          })
          newTemperatura.save();
          console.log(newTemperatura)
        })
        .catch((err) => {
          console.error(err);
        });
    }, 5000); 

    //fin de la peticion
  })
  .catch((err) => {
    console.log('Error connecting to database', err);
  });
  

(async () => {
  await mongoose.connect(url, options);
})();
*/


//Servos

    // PATA 1 s1 s2 
      const motor1 = new Gpio(10, {mode: Gpio.OUTPUT});
      const motor2 = new Gpio(3, {mode: Gpio.OUTPUT});

    // PATA 2 s3 s4 

    const motor3 = new Gpio(14, {mode: Gpio.OUTPUT});
    const motor4 = new Gpio(15, {mode: Gpio.OUTPUT});

    // PATA 3 s5 s6 

    const motor5 = new Gpio(13, {mode: Gpio.OUTPUT});
    const motor6 = new Gpio(19, {mode: Gpio.OUTPUT});

    // PATA 4 s7 s8 

    const motor7 = new Gpio(23, {mode: Gpio.OUTPUT});
    const motor8 = new Gpio(24, {mode: Gpio.OUTPUT});


    const sleep = async (milliseconds) => {
        await new Promise(resolve => {
            return setTimeout(resolve, milliseconds)
        });
    };


    const Andar2 = async () => {
      await sleep(300);
      motor1.servoWrite(900);
      motor2.servoWrite(900)
      await sleep(300);
      motor1.servoWrite(700);
      motor2.servoWrite(1100)
  }

    const Andar1 = async () => {
      motor3.servoWrite(1100);
      motor4.servoWrite(600);
      await sleep(300);
      motor3.servoWrite(1300);
      motor4.servoWrite(800);
    }

    const Andar3 = async () => {
      motor5.servoWrite(1100);
      motor6.servoWrite(1200);
      await sleep(300);
      motor5.servoWrite(1400);
      motor6.servoWrite(900);
    }

    const Andar4 = async () => {
      await sleep(300);
      //motor7.servoWrite(1000);
      motor8.servoWrite(600);
      await sleep(300);
      //motor7.servoWrite(1300);
      motor8.servoWrite(800);
    }                                                                


// SOCKET

app.get('/datacenter', (req, res) => {
  const indexPath = path.join(__dirname, '../public/views/datacenter.ejs');
  res.sendFile(indexPath);
});

  // SOCKET
  io.on('connection', (socket) => {
      console.log('Un cliente se ha conectado');
    
      // Maneja el evento de presionar un botón o una tecla
      socket.on('presionar_boton', () => {
        // Aquí puedes llamar a la función que deseas enviar
        Andar1();
        Andar2();
        Andar3();
        Andar4();
      });
    
      // Maneja el evento de desconexión
      socket.on('disconnect', () => {
        console.log('Un cliente se ha desconectado');
      });

     
    });

    server.listen(port, () => {
        console.log('Nuevo test' + port);
    });