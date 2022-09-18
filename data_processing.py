
import weaviate
import pandas as pd
import math

book_df = pd.read_csv("books.csv", sep=';', error_bad_lines=False, encoding='latin-1')
book_df = book_df.head(1000)

book_df.drop(columns=['ISBN', 'Image-URL-S', 'Image-URL-M', 'Image-URL-L'], inplace=True)
book_df.rename(columns={'Book-Title': 'book_title',
                        'Book-Author': 'book_author',
                        'Year-Of-Publication': 'year_of_publication',
                        'Publisher': 'publisher'}, inplace=True)

print(book_df.columns)

client = weaviate.Client("http://localhost:8080")

# Checking to see if Book schema already exists, then deleting it. Without this step you can only run the script once,
# and afterwards it'll tell you that the schema already exists. 
current_schemas = client.schema.get()['classes']
for schema in current_schemas:
    if schema['class']=='Book':
        client.schema.delete_class('Book')

# Creating the schema
book_class_schema = {
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

client.schema.create_class(book_class_schema)

# We're telling the client how to upload the data into the schema.
client.batch.configure(
  batch_size=10, 
  # dynamically update the `batch_size` based on import speed
  dynamic=True,
  timeout_retries=3,
)


for i in range (0,len(book_df)):
    item = book_df.iloc[i]
    # print(i, item)
    # print()
    book_object = {

        # Using all lowercases to resolve early pattern-matching issues.
        'book_title': str(item['book_title']).lower(),
        'book_author': str(item['book_author']).lower(),
        'year_of_publication': str(item['year_of_publication']).lower(),
        'publisher': str(item['publisher']).lower()
    }

    try:
        # This is where the magic happens. We're effectively 'uploading' the formatted data into the schema.
        # Think of the schema like an empty library, the data as actual books, and this next line of code 
        # as the process of putting the books on the shelf in the pre-defined order.
        client.batch.add_data_object(book_object, "Book")
    except BaseException as error:
        print("Import Failed at: ",i)
        print("An exception occurred: {}".format(error))
        # Stop the import on error
        break

    #print("Status: ", str(i)+"/"+str(len(book_df)))

client.batch.flush()