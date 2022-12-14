# Book Search Engine
This project involves the creation of a simple tool for doing text-based search over a database of books. 

## Getting Started

### Data
The raw data can be downloaded from [Kaggle](https://www.kaggle.com/datasets/saurabhbagchi/books-dataset). The zip file contains three CSVs--one with information on the books, one with user ratings, and one with user information, all of it pulled from Amazon.

For the purposes of this PoC, I've elected to only use the `books.csv` file.

In the opening lines of `data_processing.py` this file has been loaded and lightly processed (renaming and standardizing the columns, etc.) to make it suitable for populating the schema (more on this momentarily.) And in order to speed up testing and development, I've only used the first 1000 rows from `books.csv` via `book_df = book_df.head(1000)` on line 7. 

## Working with Weaviate
Weaviate is an open source ​​vector database and search engine. Vectors are arrays (i.e. lists) of numbers, and they are ubiquitous in machine learning. Computers only operate on numbers, so before an algorithm can be trained to generate captions, answer questions, or translate a language, the inputs must be represented mathematically.

The most common way to do this is turn the inputs into vectors. 

For this reason, a SaaS platform which can store and search over vector representations could find applications in domains as far-flung as NLP, protein folding, and image processing.

Fully detailing the process of setting up Weaviate is beyond the scope of this tutorial, but interested parties are referred to their [excellent documentation](https://weaviate.io/developers/weaviate/current/getting-started/index.html). 

To follow along you'll need to install Weaviate's command line tools and figure out how to run Weaviate locally off a Docker image. The rest is detailed below.

If you're new to Docker, it's considered a best practice to shut down containers after you're done with them. If you don't and you start moving files around you could end up with strange errors (see e.g. my resolving a port conflict stemming from this exact situation [here](https://www.loom.com/share/2cc130ee18254a0a96aff2b5e97712a4)). 

If your computer restarts you'll have to re-run `docker-compose up` as well as `npm start`.

## Defining the Schema

The `data_processing.py` file accomplishes three things: processing the input data so it'll fit snugly into a schema, defining that schema, and then populating that schema.

The first of these is discussed in the `Data` section above, and it is to the other steps that we now turn. 

A schema is a logical 'description' of the data an application can expect to send and receive, along with its properties and relationships.

Just as there is a protocol for picking up packages, loading them in a truck, and depositing them at their destination, there is a protocol for loading data, transporting it across a network, and depositing it at its destination. 

A warehouse wouldn't let you drop boxes off any way you want to, and neither will an application. 

A schema is not the entire protocol, but it's an important part. It says, "When I send you a packet of data you can expect it to be shaped like this and to contain these pieces of information, and I expect the same when you send me a packet of data."

Not unlike vectors, schemas are everywhere. They are particularly important in databases, and as a vector database, Weaviate is no exception. 

After the data processing is finished, the following bit of code checks to see if our schema already exists and deletes it if does:

```
current_schemas = client.schema.get()['classes']
for schema in current_schemas:
    if schema['class']=='Book':
        client.schema.delete_class('Book')
```

This is useful because once you've defined a schema you can't define another one with the same name. That means if you define a schema called `'Files'`, correct a typo, and then try to define `'Files'` again, it'll throw an error unless you have this code snippet in your file. 

The actual schema definition is handled with JSON notation:

```book_class_schema = {
    "class": "Book",
    "description": "A collection of books with title, author, year of publication, and publisher",
    "properties": [
        {
            "name": "book_title",
            "dataType": ["string"],
            "description": "The title of the book", 
        },
        {
            "name": "book_author",
            "dataType": ["string"],
            "description": "The author of the book", 
        },        
        {
            "name": "year_of_publication",
            "dataType": ["string"],
            "description": "The year in which the book was published", 
        },
        {
            "name": "publisher",
            "dataType": ["string"],
            "description": "The publisher of the book", 
        }
    ]
}
```

The naming convention here is pretty intuitive. The `class` is what we call the schema throughout the rest of the code, each of the properties are properties of the underlying data, the `dataType` is the type of data contained in each property, and so on. 

The following line, `client.schema.create_class(book_class_schema)`, actually creates the schema. Once this is executed we have the schema, but it does not yet contain any data. 

The `for` loop on line 65 is where the magic happens. We've loaded and pre-processed our data, defined our schema, and now we're essentially 'uploading' the formatted data into the schema.

It's easy to grasp the steps involved here by analogizing them to building a library. First, we have to create plans for the library, covering where the shelves go, how many bathrooms there are, etc. Then, we'd pass those plans to a construction firm that would actually build the structure. Then, we'd fill the empty shelves with books. 

Defining the schema in JSON on line `27` is like creating the plans, creating the schema with `client.schema.create_class(book_class_schema)` is like building the library, and the `for` loop on line 65 is line walking in with boxes of books and putting them on the shelves.  

### Querying the schema

So having filled our metaphorical library with data, how do we go about accessing it?

The answer is simple: we use queries. 

As its name implies, a query is a request for information--and since we're talking about computers, those requests have to be structured in a certain way.

Weaviate uses GraphQL to query all databases. GraphQL is an open-source tool for interacting with APIs that was developed by Facebook. 

GraphQL has a JSON-like structure, and in the `query.js` file you can find our query:

```
async function get_filtered_results(text){
    let data = await client.graphql
        .get()
        .withClassName('Book')
        .withSort([{ path: ['year_of_publication'], order: 'desc' }])
        .withFields(['book_title', 'book_author', 'year_of_publication', 'publisher'])
        .withWhere({
            operator: 'Or',
            operands: [{
                path: ["book_title"],
                operator: "Like",
                valueString: "*" + text + "*"
            },
            {
                path: ["book_author"],
                operator: "Like",
                valueString: "*" + text + "*"
            },
            {
                path: ["year_of_publication"],
                operator: "Like",
                valueString: "*" + text + "*"
            }
                ,
            {
                path: ["publisher"],
                operator: "Like",
                valueString: "*" + text + "*"
            }]
        })
        .withLimit(10)
        .do()
        .then(info => {
            return info
        })
        .catch(err => {
            console.error(err)
        })
        // console.log(data)
    return data;
}
```

(NOTE: The vanilla GraphQL starts with `client.graphql` and ends at `return info`, but the query is wrapped in a javascript function so another file can later call it and display the returned data on a webpage.)

This function takes a search string and uses it to search over the database via the `client.graphql` functionality. As before, I think if you read this code slowly you should be able to puzzle out what each part of it does based on its name, even with little coding experience. 

For example, `.withSort()` sorts our results on a certain value (`'year_of_publication'`) and in a certain way (`'desc'` means 'descending).

`.withWhere()` gives us considerable power in modulating how our search is performed. If you remember college math, the `Or` operator is permissive, and we could tighten it up by using `And` instead. Because we've included all the properties in our schema (title, author, publication year, and publisher), the search string will match on all those fields. 

The final line in this file is `module.exports = { get_filtered_results }`, and it's important. It makes this function available for the next file, `index.js`. 

### Defining a lightweight app and webpage.

In `index.js`, we're essentially using javascript to define a super-simple application. 

After importing some libraries, we import the function from `query.js` on line 14.

The first `app.get` statement on line 27 renders what we're actually going to see in the browser by referencing the information defined in `search.ejs`. It'll pass whatever is in `book_info` to the `search.ejs` file, which will then display it according to the specifications in `search.ejs`. 

On line 34 we accept a search string, on line 35 we pass it to the `get_filtered_results` function, then we get the results and pass them (as `book_info`) to `search.ejs`.

Finally, on the last lines we tell the app which port to listen on. I've used port 3000, but others can work as well. 

`search.ejs` contains a lot of HTML and a smattering of javascript which renders the contents of `book_info`. I think a tutorial on HTML would take us too far afield, you need only understand that this gathers the contents of `book_info` from the function in `index.js` and then offers instructions for the browser as to how to display the results.

### Actually running the application.

With this context established, actually running the application couldn't be simpler. 

You should already have Docker going from the Weaviate documentation (if Docker is powered down try `docker-compose up` in the command line). Booting up the book searcher simply requires running `npm start` in the command line, which should return this:

```
> book-search-weaviate@1.0.0 start
> node index.js

The app is running on: http://localhost:3000
```

`npm` stands for 'Node Package Manager', and it is a way of managing or using any of the thousands of packages built with the Node.js framework. Node.js, in turn, is an synchronous event-driven JavaScript runtime which let's you build performant network applications. ([more](https://nodejs.org/en/about/))

Running `npm start` prompts Node.js to look in the `package.json` file and do whatever it finds in the `start` field--in this example, that's `"node index.js"` on line 7. This translates to 'run `index.js` as a node file', and we've already covered what `index.js` does. 

If all this works and you get back the `The app is running on: http://localhost:3000` message, you can navigate to `http://localhost:3000` and you should see something like this default page:

![War results](views/default.png)

As with Google, your search query goes in the box in the middle.

Here are the results for the string 'war':

![War results](views/war.png)

Here are the results for the string 'love':

![Love results](views/love.png)

And there you have it! A simple way of using Weaviate as a backend search engine.

### Summary and conclusion.

Let's pause for a moment and recap. In `data_processing.py` we pulled in a books dataset and did some basic pre-processing on it, then we defined, created, and populated the schema. In `query.js` we defined a GraphQL query which would let us ask this schema for information, and we exported the function so that `index.js` could access it. In `index.js` we set up a lightweight application that could use the query in `query.js` to get data from the schema and pass it to `search.ejs`, which renders the result in a webpage. 

What comes out of all this is a simple web-based application which can take a search string and return any book record containing that string in any of its fields.

To find out more about the future of vector search and what it can do for your enterprise, visit us at [weaviate.io](weaviate.io)

Thank you.

