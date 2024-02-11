const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const bodyParser = require('body-parser');
let randomColor = require('randomcolor');
const bcrypt = require("bcryptjs");
const { QueryTypes } = require('sequelize');

const app = express();
const httpServer = require('http').createServer(app);

const io = require('socket.io')(httpServer, {
  cors: {
    origin: "http://localhost:4200",
    // methods: ["GET", "POST"],
    transports: ['websocket', 'polling'],
    // credentials: true
  },
  allowEIO3: true
});

//middlewares
app.use(express.static('dist'));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// app.use(cors());
/* for Angular Client (withCredentials) */
// app.use(
//   cors({
//     credentials: true,
//     origin: ["http://localhost:4200"],
//   })
// );

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://100.99.99.3:8080');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "bezkoder-session",
    keys: ["COOKIE_SECRET"], // should use as secret environment variable
    httpOnly: true,
    sameSite: 'strict'
  })
);

// database
const db = require("./app/models");
const Role = db.role;
const User = db.user;
const Computer = db.computer;
const Call = db.call;

db.sequelize.sync();
// // force: true will drop the table if it already exists
// db.sequelize.sync({force: true}).then(() => {
//   console.log('Drop and Resync Database with { force: true }');
//   initial();
// });

// simple route
//routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/dist/index.html');
});

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/call.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;

io.on('connection', (socket) => {
  // console.log("user connnected!");

  //Disconnect
  socket.on('disconnect', data => {
    // console.log("user disconnect")
    socket = null;

  })

  socket.on('getStates', async data => {
    const selectedComputers = []
    const computers = await Computer.findAll({
    });
    for (var i = computers.length - 1; i >= 0; i--) {
      const users = await computers[i].getUsers()
      for (var j = users.length - 1; j >= 0; j--) {
        const roles = await users[j].getRoles()
        for (var k = roles.length - 1; k >= 0; k--) {
          if (roles[k].name == "admin") continue;
          selectedComputers.push(computers[i])
        }
      }
    }
    socket.emit('getStates', selectedComputers)
  });


  socket.on('service', async data => {


    data = JSON.parse(data);
    console.log("%%%%%%%%%%%-Monitor-%%%%%%%%%%%%" + data.id + ", " + data.status_dev)
    Computer.update({
      resp: Date.now(),
      status_s: data.status,
      status_d: data.status_dev
    }, {
      where: {
        name: data.id
      }
    }).catch(function (err) {
      console.error(err.message);
    });
  })

  socket.on('addHistory', datas => {
    let flg = 0;
    const data = JSON.parse(datas);
    Call.findOrCreate({
      where: {
        name: data.name,
        with: data.with,
        fromtime: data.fromtime,
        duration: data.duration,
        file: data.file
      },
      defaults: {
        name: data.name,
        with: data.with,
        fromtime: data.fromtime,
        duration: data.duration,
        file: data.file
      }
    });
  })



  //Login User
  socket.on('login', async data => {
    data = JSON.parse(data);
    try {
      const user = await User.findOne({
        where: {
          username: data.id,
        },
      });


      if (!user) {
        return socket.emit('loginCallback', 'No User');
      }

      if (user.check == 0) {
        return socket.emit('loginCallback', "User Not Active");
      }

      const passwordIsValid = await bcrypt.compareSync(
        data.password,
        user.password
      );

      if (!passwordIsValid) {
        return socket.emit('loginCallback', "Invalid Password");
      }

      return socket.emit('loginCallback', "Success");
    }
    catch (error) {
      return socket.emit('loginCallback', 'No User');
    }
  });

});

httpServer.listen(PORT, () => console.log(`listening on port ${PORT}`));

function initial() {
  Role.create({
    id: 1,
    name: "user",
  });

  Role.create({
    id: 2,
    name: "moderator",
  });

  Role.create({
    id: 3,
    name: "admin",
  });
}
