
// Importing required library
const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser');
const weaviate = require("weaviate-client");
const e = require('express');
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.static(path.join(__dirname, 'views')));
// let initial_path = path.join(__dirname, "views");

// Importing query functions from query.js
let { get_filtered_results } = require('./query')

// Setting up client.
const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
  });

// variable storing the searched text
let text = "";

// rendering the home page, i.e. what we're actually going to see in the browser. This information is defined in 
// search.ejs
app.get('/', (req, res) => {
  res.render("search.ejs", { book_info: {} });
})

// Here, we perform a query for searched text
app.get('/search', (req, res) => {
    // stores the searched text in variable "text"
    text = req.query['searched_data'].toLowerCase();
    let get_results = get_filtered_results(text);
    get_results.then(results => {
      //console.log(results.data.Get) // Commented out, but useful for debugging. If everything is working properly, 
      // you should see actual JSON objects with information from the 'Book' data structure, which was returned when 
      // we used a search string to search over our books data.
      res.render("search.ejs", { book_info: results.data.Get.Book }) });
    
})

// Tells the app where to listen. You'll view http://localhost:3000/ in a browser to get your results.
app.listen(process.env.PORT || 3000,
    () => console.log(`The app is running on: http://localhost:${process.env.PORT || 3000}`)
  )