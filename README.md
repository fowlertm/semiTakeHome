# Book Search Engine
This project involves the creation of a simple tool for doing text-based search over a database of books. 

## Getting Started

### Data
The raw data can be downloaded from [Kaggle](https://www.kaggle.com/datasets/saurabhbagchi/books-dataset). The zip file contains three CSVs--one with information on the books, one with user ratings, and one with user information, all of it pulled from Amazon.

For the purposes of this PoC, I've elected only to use the `books.csv` file.

In the opening lines of `data_processing.py` this file has been loaded and lightly processed to make it suitable for populating the schema.

## Working with Weaviate
Weaviate is an open source ​​vector database and search engine. Vectors are arrays (i.e. lists) of numbers, and they are ubiquitous in machine learning. Computers only operate on numbers, so before an algorithm can be trained to generate captions, answer questions, or translate a language the inputs must be represented mathematically.

The most common way to do this is turn the inputs into vectors. 

For this reason, a SaaS platform which can store and search over vector representation could find applications in domains as far-flung as NLP, protein folding, and image processing.

Fully detailing the process of setting up Weaviate is beyond the scope of this tutorial, but interested parties are referred to their [excellent documentation](https://weaviate.io/developers/weaviate/current/getting-started/index.html). 

To follow along you'll need to install Weaviate's command line tools and figure out how to run Weaviate locally off a Docker image. The rest is detailed below.

## Defining the Schema

The `data_processing.py` file accomplishes three things: processing the input data so it'll fit snugly into a schema, defining that schema, and then populating that schema.

The first of these is discussed in the `Data` section above, and it is to the other steps that we now turn. 

A schema is a logical 'description' of the data an application can expect to send and receive, along with its properties and relationships.

Just as there is a protocol for picking up packages, loading them in a truck, and depositing them at their destination, there is a protocol for loading data, transporting it across a network, and depositing it at its destination. 

A warehouse wouldn't let you drop boxes off any way you want to, and neither will an application. 

A schema is not the entire protocol, but it's an important part. It says, "When I send you a packet of data you can expect it to be shaped like this and to contain these pieces of information, and I expect the same when you send me a packet of data."

Not unlike vectors, schemas are everywhere. They are particularly important in databases, and Weaviate is no exception. 

After the data processing is finished, the following bit of code checks to see if our schema already exists and deletes it if does:

```
current_schemas = client.schema.get()['classes']
for schema in current_schemas:
    if schema['class']=='Book':
        client.schema.delete_class('Book')
```

This is useful because once you've defined a schema you can't define another one with the same name. That means if you define a schema, correct a typo, and then run your code again, it'll throw an error, unless you have this code snippet in your file. 

The actual schema is defined with a JSON notation:

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
}```

The naming convention here is pretty intuitive. The `class` is what we call the schema throughout the rest of the code, each of the properties are properties of the underlying data, the `dataType` is the type of data contained in each property, and so on. 

The following line, `client.schema.create_class(book_class_schema)`, actually creates the schema. Once this is executed we have the schema, but it does not yet contain any data. 

The `for` loop on line 65 is where the magic happens. We've loaded and pre-processed our data, and now we're essentially 'uploading' the formatted data into the schema.

It's easy to grasp the steps involved here by analogizing them to building a library. First, we have to create plans for the library, covering where the shelves go, how many bathrooms there are, etc. Then, we'd pass those plans to a construction firm that would actually build the structure. Then, we'd fill the empty shelves with books. 

Defining the schema in JSON on line `27` is like creating the plans, creating the schema with `client.schema.create_class(book_class_schema)` is like building the library, and the `for` loop on line 65 is line walking in with boxes of books and putting them on the shelves.  