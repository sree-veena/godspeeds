const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(bodyParser.json());

const dbPath = path.join(__dirname, 'restaurants.db');

const initializeDBAndServer = async () => {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS Owner (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        name TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS Restaurant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        name TEXT,
        since DATETIME,
        isOpen BOOLEAN DEFAULT 0,
        opsStartTime DATETIME,
        opsEndTime DATETIME,
        ownerId INTEGER,
        slug TEXT UNIQUE,
        description TEXT,
        location TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS Category (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS MenuItems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        price INTEGER,
        couponcode TEXT,
        restaurant_id INTEGER,
        FOREIGN KEY(restaurant_id) REFERENCES Restaurant(id) ON DELETE CASCADE
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS Orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fromRestaurant TEXT,
        order_status TEXT DEFAULT 'NOT_INITIATED',
        placedAt DATETIME,
        fulfilledAt DATETIME,
        orderItem TEXT
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS OrderItem (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        menuItemId INTEGER,
        quantity INTEGER,
        orderId INTEGER,
        FOREIGN KEY (menuItemId) REFERENCES MenuItems (id) ON DELETE CASCADE,
        FOREIGN KEY (orderId) REFERENCES Orders (id) ON DELETE CASCADE
      )
    `);

    app.listen(3000, () => {
      console.log('Server started on port 3000');
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post('/menuitems', async (req, res) => {
    try {
      const menuItemsDetails = req.body;
      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
    
      const { name, description, price, couponcode, restaurant_id } = menuItemsDetails;
  
      const addMenuItemDetails = `
        INSERT INTO MenuItems (name, description, price, couponcode, restaurant_id)
        VALUES (?, ?, ?, ?, ?)  
      `;
  
      await db.run(addMenuItemDetails, [name, description, price, couponcode, restaurant_id]);
  
      console.log('Menu item details inserted successfully');
      res.send({ data: 'Successfully posted' });
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: 'An error occurred' });
    }
  });

  app.get('/menuitems', async (req, res) => {
    try {
      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
  
      const restaurants = await db.all('SELECT * FROM MenuItems');
      res.send({ data: restaurants });
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: 'An error occurred' });
    }
  });


app.post('/restaurantdetails', async (req, res) => {
  try {
    const RestaurantDetails = req.body;
    const {
      createdAt,
      name,
      since,
      isOpen,
      opsStartTime,
      opsEndTime,
      ownerId,
      slug,
      description,
      location,
    } = RestaurantDetails;

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const addRestaurantDetails = `
      INSERT INTO Restaurant (
        createdAt,
        name,
        since,
        isOpen,
        opsStartTime,
        opsEndTime,
        ownerId,
        slug,
        description,
        location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.run(addRestaurantDetails, [
      createdAt,
      name,
      since,
      isOpen,
      opsStartTime,
      opsEndTime,
      ownerId,
      slug,
      description,
      location,
    ]);

    console.log('Restaurant details inserted successfully');
    res.send({ data: 'Successfully posted' });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ error: 'An error occurred' });
  }
});

app.get('/restaurants', async (req, res) => {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const restaurants = await db.all('SELECT * FROM Restaurant');
    res.send({ data: restaurants });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ error: 'An error occurred' });
  }
});

app.get('/restaurants/:id', async (req, res) => {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const { id } = req.params;
    const restaurant = await db.get('SELECT * FROM Restaurant WHERE id = ?', id);
    res.send({ data: restaurant });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ error: 'An error occurred' });
  }
});

app.put('/restaurant/:restaurantId', async (req, res) => {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const { restaurantId } = req.params;
    const restaurantDetails = req.body;
    const {
      createdAt,
      name,
      since,
      isOpen,
      opsStartTime,
      opsEndTime,
      ownerId,
      slug,
      description,
      location,
    } = restaurantDetails;

    const updateRestaurantDetails = `
      UPDATE Restaurant SET 
        createdAt = ?,
        name = ?,
        since = ?,
        isOpen = ?,
        opsStartTime = ?,
        opsEndTime = ?,
        ownerId = ?,
        slug = ?,
        description = ?,
        location = ?
      WHERE id = ?
    `;

    await db.run(updateRestaurantDetails, [
      createdAt,
      name,
      since,
      isOpen,
      opsStartTime,
      opsEndTime,
      ownerId,
      slug,
      description,
      location,
      restaurantId,
    ]);

    res.send({ data: 'Restaurant details updated successfully' });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ error: 'An error occurred' });
  }
});

app.delete('/restaurant/:restaurantId', async (req, res) => {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const { restaurantId } = req.params;

    const deleteRestaurant = `DELETE FROM Restaurant WHERE id = ?`;

    await db.run(deleteRestaurant, restaurantId);
    res.send({ data: 'Data deleted successfully' });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ error: 'An error occurred' });
  }
});

app.post('/search/', async (req, res) => {
    try {
      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
  
      const { couponCode, location } = req.body;
  
      const query = `
        SELECT * FROM MenuItems
        INNER JOIN Restaurant ON MenuItems.restaurant_id = Restaurant.id
        WHERE MenuItems.couponcode = ?
        OR Restaurant.location LIKE '%' || ? || '%'
      `;
  
      const responseData = await db.all(query, couponCode, location);
      res.send({ data: responseData });
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: 'An error occurred' });
    }
  });
  
  
