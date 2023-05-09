const express = require('express');
const bodyParser = require('body-parser');
const path = require("path");

const {open} = require("sqlite");
const sqlite3 = require('sqlite3').verbose();

const app =express()
app.use(express.json());

const db = new sqlite3.Database('restaurants.db',(err)=>{
    if(!err){
        console.log('Db Connected Successfully.')
    }else{
        console.log(err.message);
    }
});


const OwnerTable = `CREATE TABLE Owner (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT
  )`;

db.run(OwnerTable, (err)=>{
    if(!err){
        console.log('table successfully created');
    }else{
        console.log(err.message);
    }
})


const Restaurants = `
CREATE TABLE Restaurant (
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
)`;


db.run(Restaurants, (err)=>{
    if(!err){
        console.log('restaurants table created');
    }else{
        console.log(err.message);
    }
})


const Category = `CREATE TABLE Category(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name String
)`;

db.run(Category, (err)=>{
    if(!err){
        console.log('category table created');
    }else{
        console.log(err.message);
    }
})


const MenuItems =`CREATE TABLE MenuItems(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name String,
    description Strin,
    price INTEGER,
    couponcode String,
    restaurant_id INTEGER,
    FOREIGN KEY(restaurant_id) REFERENCES Restaurant(id) ON DELETE CASCADE
    )`;

db.run(MenuItems, (err)=>{
    if(!err){
        console.log('Menu Items table created');
    }else{
        console.log(err.message);
    }
})

const Orders = `CREATE TABLE Orders(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fromRestaurent String,
    order_status TEXT DEFAULT 'NOT_INITIATED',
    placedAt DATETIME,
    fulfilledAt DATETIME,
    orderItem TEXT
    )`;

db.run(Orders, (err)=>{
    if(!err){
        console.log('table created orders');
    }else{
        console.log(err.message);
    }
})


const orderitems = `CREATE TABLE OrderItem(
    id INTEGER PRIMARY KEY,
    menuItemId INTEGER,
    quantity INTEGER,
    orderId INTEGER,
    FOREIGN KEY(orderId) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY(menuItemId) REFERENCES MenuItems(id) ON DELETE CASCADE
);`;

db.run(orderitems, (err)=>{
    if(!err){
        console.log('order items table created');
    }else{
        console.log(err.message);
    }
})
db.close();


const dbPath = path.join(__dirname,'restaurants.db');

let dbdata = null;

const initializeDBAndServer = async () =>{
    try{
        dbdata = await open({
            filename:dbPath,
            driver: sqlite3.Database
        })
        app.listen('4000',(err)=>{
            if(!err){
                console.log('db connected successfully');
            }else{
                console.log(err.message);
            }
        })
    }catch(e){
        console.log(e.message);
        process.exit(1);
    }
}

initializeDBAndServer();


app.post('/reataurantdetails', async(req,res)=>{
    // const {RestaurantDetails} = ;
    // console.log(RestaurantDetails);
    const{
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
    } = req.body;
    const addRestaurantDetails = `INSERT INTO Restaurant(createdAt,name,since,isOpen,opsStartTime,opsEndTime,ownerId,slug,description,
        location) VALUES ('${createdAt}',
        '${name}',
        '${since}',
        '${isOpen}',
        '${opsStartTime}',
        '${opsEndTime}',
        ${ownerId},
        '${slug}',
        '${description}',
        '${location}');`;
    
const dbResponse = await db.run(addRestaurantDetails);
res.json({data:'successfully post'});
})

app.get('/restaurants', async (req,res)=>{
    const restaurants = `SELECT *FROM Restaurant;`;
    const responsedb = await db.all(restaurants) ;
    res.send({data:responsedb});
})

app.get('/restaurants/:id', async (req,res)=>{
    const restaurants = `SELECT *FROM Restaurant WHERE id = ${id}`;
    const responsedb = await db.get(restaurants) ;
    res.send({data:responsedb});
})

app.put('/reataurant/:restaurantId', async(req, res)=>{
const {restaurantId} = body.params;
const restaurantDetails = req.body;
const{
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

const UpdateRestaurantDetails = `UPDATE Restaurant SET 
createdAt = '${createdAt}',
name ='${name}',
since = '${since}',
isOpen = '${isOpen}',
opsStartTime = '${opsStartTime}',
opsEndTime = '${opsEndTime}',
ownerId = ${ownerId},
slug = '${slug}',
description = '${description}',
location = '${location}' WHERE id = '${restaurantId}';
`;

const responseupdate = await db.run(UpdateRestaurantDetails);
res.send({data:'restaurant details updated successfully'});
})

app.delete('restaurant/:restaurantId', async (req,res)=>{
    const {delete_id}=  request.params;

    const deleteRestaurant = `DELETE *From restaurant WHERE id =${delete_id};`;

    await db.run(deleteRestaurant);
    res.send({data:'data deleted successfully'});
})

app.post(`restaurant/search`, async (req,res)=>{
    const searchCriteria = req.body;

    const query = `
    SELECT * FROM Restaurant
    WHERE name LIKE '%${searchCriteria.name}%'
    OR location LIKE '%${searchCriteria.location}%'
  `;

    const responseData = await db.all(query);
    res.send({data:responseData});
})