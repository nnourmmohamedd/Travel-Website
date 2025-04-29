require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb'); 
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express();


app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false
}));


let db;
const client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
client.connect()
    .then(() => {
        db = client.db('myDB'); 
        console.log('Connected to MongoDB');
    })
    .catch(err => console.error(err));


app.get('/', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Username:', username); 
    console.log('Password:', password); 
  
    if (!username || !password) {
      return res.render('login', { error: 'Both username and password are required.' });
    }
  
    db.collection('myCollection').findOne({ username })
      .then(user => {
        if (!user || !bcrypt.compareSync(password, user.password)) {
          console.log('Invalid credentials');
          return res.render('login', { error: 'Invalid credentials.' });
        }
  
        req.session.user = user;
        res.redirect('/home');
      })
      .catch(err => {
        console.error('Error during login:', err);
        res.status(500).send('Internal server error');
      });
  }); 

  


app.get('/registration', (req, res) => {
  res.render('registration');
});


app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.send('Fields cannot be empty!');
    }

    const existingUser = await db.collection('myCollection').findOne({ username });
    if (existingUser) {
        return res.send('Username already taken!');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = { username, password: hashedPassword, wantToGoList: [] };

    await db.collection('myCollection').insertOne(newUser);
    res.redirect('/');
});


app.get('/home', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.render('home');
});
app.get('/hiking', (req, res) => {
    res.render('hiking');
});

app.get('/cities', async (req, res) => {
    const cities = await db.collection('cities').find().toArray();
    res.render('cities', { cities });
});

app.get('/islands', async (req, res) => {
    const islands = await db.collection('islands').find().toArray();
    res.render('islands', { islands });
});
app.get('/inca', async (req, res) => {
    const trek = await db.collection('treks').findOne({ name: "Inca Trail to Machu Picchu" });
    res.render('inca', { trek });
});

app.get('/annapurna', async (req, res) => {
    const trek = await db.collection('treks').findOne({ name: "Annapurna Circuit" });
    res.render('annapurna', { trek });
});


app.get('/paris', async (req, res) => {
    const city = await db.collection('cities').findOne({ name: "Paris" });
    res.render('paris', { city });
});


app.get('/rome', async (req, res) => {
    const city = await db.collection('cities').findOne({ name: "Rome" });
    res.render('rome', { city });
});

app.get('/bali', async (req, res) => {
    const city = await db.collection('cities').findOne({ name: "Bali" });
    res.render('bali', { city });
});



app.get('/santorini', async (req, res) => {
    const city = await db.collection('cities').findOne({ name: "Santorini" });
    res.render('santorini', { city });
});



app.get('/category/:type', async (req, res) => {
    const { type } = req.params;
    const destinations = await db.collection('destinations').find({ category: type }).toArray();
    res.render(type, { destinations });
});






client.connect()
    .then(async () => {
       db = client.db('myDB');
        console.log('Connected to MongoDB');
        await initializeDestinations();
    })
    .catch(err => console.error(err));



async function initializeDestinations() {
    try {
        const collectionName = 'destinations';

        
        const collections = await db.listCollections({ name: collectionName }).toArray();
        if (collections.length > 0) {
            await db.collection(collectionName).drop();
            console.log(`Existing '${collectionName}' collection dropped.`);
        }

    
        const destinations = [
            { name: 'Paris', category: 'city' },
            { name: 'Bali', category: 'island' },
            { name: 'Annapurna Circuit', category: 'mountain' },
            { name: 'Inca Trail to Machu Picchu', category: 'hiking trail' },
            { name: 'Rome', category: 'city' },
            { name: 'Santorini', category: 'island' }
        ];


        const result = await db.collection(collectionName).insertMany(destinations);
        console.log(`${result.insertedCount} destinations were inserted.`);
    } catch (err) {
        console.error('Error initializing destinations:', err);
    }
}

const fs = require('fs');
const path = require('path');
app.get('/destination/:name', (req, res) => {
    const { name } = req.params;
    const viewPath = path.join(__dirname, 'views', `${name}.ejs`); 

    fs.access(viewPath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(`EJS file for ${name} not found:`, err);
            return res.status(404).send('Page not found');
        }

        res.render(name);
    });
});




app.get('/wanttogo', (req, res) => {
    
    const destinations = req.session.destinations || [];  
    res.render('wanttogo', { destinations });
});


app.post('/destination/:destination/add', (req, res) => {
    const destination = req.params.destination;
    
    req.session.destinations = req.session.destinations || [];
    
    if (!req.session.destinations.includes(destination)) {
        req.session.destinations.push(destination);
    }
    
    res.redirect('/wanttogo');
});

app.post('/destination/:destination/remove', (req, res) => {
    const destination = req.params.destination;
    
    req.session.destinations = req.session.destinations || [];
    
    
    req.session.destinations = req.session.destinations.filter(dest => dest !== destination);
    
    res.redirect('/wanttogo');
});






// Search Functionality
app.get("/search", async (req, res) => {
    res.render("searchResults");
  });
  
  const destinations1 = [
    "annapurna circuit",
    "bali",
    "inca trail to machu picchu",
    "paris",
    "rome",
    "santorini island",
  ];
  
  app.post("/search", async (req, res) => {
    try {
      const { Search } = req.body;
      const searchQuery = Search.trim().toLowerCase();
  
      console.log("Search Query:", searchQuery);
      const result = [];
      destinations1.forEach((v) => {
        if (v.includes(Search)) result.push(v);
      });
  
      console.log("Found Destinations:", result);
  
      res.render("searchResults", {
        results: result,
        message: result.length ? null : "No matching destinations found.",
      });
    } catch (error) {
      console.error("Search Error:", error);
      res.status(500).send("An error occurred while processing your search.");
    }
  });



// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
