const weaviate = require("weaviate-client");

const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
});

// async function get_filtered_results(text){
//     let data = await client.graphql
//         .get()
//         .withClassName('Book')
//         .withSort([{ path: ['year_of_publication'], order: 'desc' }])
//         .withFields(['book_title', 'book_author', 'year_of_publication', 'publisher'])
//         .withWhere({
//             operator: 'Or',
//             operands: [{
//                 path: ["book_title"],
//                 operator: "Like",
//                 valueString: "*" + text + "*"
//             },
//             {
//                 path: ["book_author"],
//                 operator: "Like",
//                 valueString: "*" + text + "*"
//             },
//             {
//                 path: ["year_of_publication"],
//                 operator: "Like",
//                 valueString: "*" + text + "*"
//             }
//                 ,
//             {
//                 path: ["publisher"],
//                 operator: "Like",
//                 valueString: "*" + text + "*"
//             }]
//         })
//         .withLimit(10)
//         .do()
//         .then(info => {
//             return info
//         })
//         .catch(err => {
//             console.error(err)
//         })
//         // console.log(data)
//     return data;
// }

//Query to fetch recommended movies
async function get_recommended_books(book_isbn) {
    let data = await client.graphql
        .get()
        .withClassName('Book')
        .withFields('book_title book_author year_of_publication publisher book_isbn')
        .withNearObject({ id : book_isbn, certainty: 0.85 })
        .withLimit(10)
        .do()
        .then(info => {
            return info;
        })
        .catch(err => {
            console.error(err)
        });
    console.log(data)
    return data
}

module.exports = { get_recommended_books }