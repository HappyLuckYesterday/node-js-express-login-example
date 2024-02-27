const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const bodyParser = require('body-parser');
let randomColor = require('randomcolor');
const bcrypt = require("bcryptjs");
const { QueryTypes } = require('sequelize');
const mqtt = require('mqtt')
// require and configure in your code
require('dotenv').config()

const app = express();
const httpServer = require('http').createServer(app);

const io = require('socket.io')(httpServer, {
  cors: {
    origin: "http://localhost:4200",
    // origin: process.env.endpoint,
    // methods: ["GET", "POST"],
    transports: ['websocket', 'polling'],
    // credentials: true
  },
  allowEIO3: true
});

const aedes = require('aedes')()
const server = require('net').createServer(aedes.handle)

server.listen(1883, function () {
  console.log('server started and listening on port 1883')
})

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
  res.header('Access-Control-Allow-Origin', "http://localhost:4200");
  // res.header('Access-Control-Allow-Origin', process.env.endpoint);
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
// force: true will drop the table if it already exists
// db.sequelize.sync({force: true}).then(() => {
//   console.log('Drop and Resync Database with { force: true }');
//   initial();
// });

Role.findAll({}).then(roles => {
  if (roles.length == 0) {
    initial();
  }

}).catch((error) => {
  console.log("error: ", error);
})
// 



// initial();//flg

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
        if (users[j].check == 0) continue;
        const roles = await users[j].getRoles()
        for (var k = roles.length - 1; k >= 0; k--) {
          if (roles[k].name == "admin") continue;
          selectedComputers.push(computers[i])
        }
      }
    }
    console.log("-------------------------------------------------------------")
    console.log(computers.length)
    console.log("-------------------------------------------------------------")
    socket.emit('getStates', { selectedComputers: selectedComputers, count: computers.length })
  });
  socket.on('getAllStates', async data => {
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
    console.log(selectedComputers)

    console.log(selectedComputers.length)
    socket.emit('getAllStates', selectedComputers)
  });

  socket.on('getOtherStates', async data => {
    console.log("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")
    const selectedComputers = []
    const computers = await Computer.findAll({
    });
    for (var i = computers.length - 1; i >= 0; i--) {
      const users = await computers[i].getUsers()
      for (var j = users.length - 1; j >= 0; j--) {
        if (users[j].check == 1) continue;
        const roles = await users[j].getRoles()
        for (var k = roles.length - 1; k >= 0; k--) {
          if (roles[k].name == "admin") continue;
          selectedComputers.push(computers[i])
        }
      }
    }
    socket.emit('getOtherStates', selectedComputers)
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

  socket.on('test', function (message, acknowledgement) {
    // do something with message...
    acknowledgement('success');  // send acknowledgement back to client
  });

  //Login User
  socket.on('login', async data => {
    console.log(data);
    data = JSON.parse(data);

    console.log("Login User: " + data.userid + ", " + data.password)
    try {
      const user = await User.findOne({
        where: {
          username: data.username,
        },
      });
      console.log("finduser: " + user)


      if (!user) {
        var resp = {
          machineid: "1",
          machinename: "2",
          message: 'No User'
        };
        var jsonResult = JSON.stringify(resp);
        return socket.emit('loginCallback', jsonResult);
      }


      if (user.check == 0) {
        var resp = {
          machineid: user.machineid,
          machinename: user.machinename,
          message: "User Not Active"
        };
        var jsonResult = JSON.stringify(resp);
        return socket.emit('loginCallback', jsonResult);
      }

      const passwordIsValid = await bcrypt.compareSync(
        data.password,
        user.password
      );

      if (!passwordIsValid) {
        var resp = {
          machineid: '',
          machinename: '',
          message: "Invalid Password"
        };
        var jsonResult = JSON.stringify(resp);
        return socket.emit('loginCallback', jsonResult);
      }

      var resp = {
        machineid: user.machineid,
        machinename: user.machinename,
        message: 'Success'
      };
      var jsonResult = JSON.stringify(resp);
      return socket.emit('loginCallback', jsonResult);
    }
    catch (error) {
      var resp = {
        machineid: "",
        machinename: "",
        message: 'No User'
      };
      var jsonResult = JSON.stringify(resp);
      return socket.emit('loginCallback', jsonResult);
    }
  });

});

httpServer.listen(PORT, () => console.log(`listening on port ${process.env.server_port}`));

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



const protocol = 'mqtt'
const host = '100.99.99.8'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

const connectUrl = `${protocol}://${host}:${port}`

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  // username: 'emqx',
  // password: 'public',
  reconnectPeriod: 1000,
})

client.on('connect', () => {
  console.log('Connected')
})

const topic = '/nodejs/mqtt'

client.on('connect', () => {
  console.log('Connected')
  client.subscribe([topic], async data => {
    console.log(`Subscribe to topic '${topic}'`)
  })
})
client.on('message', async (topic, payload) => {
  console.log('Received Message:', topic, payload.toString())
  console.log(payload);
  var data = payload.toString();
  console.log(data);
  data = JSON.parse(data);
  
  console.log("%%%%%%%%%%%-Monitor-%%%%%%%%%%%%" + data)//.id + ", " + data.status_dev)
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

client.on('connect', () => {

})