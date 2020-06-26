const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const _ = require("lodash");

//connecting to database "/todolistDB"
mongoose.connect("mongodb+srv://fomachka:Seoulny!!@3@cluster0-1iijr.mongodb.net/todolistDB?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
});

// parameters that items will have
const itemSchema = {
    name: String,
}
// model to be based one
const Item = mongoose.model("item", itemSchema);


const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item",
});
const item3 = new Item({
    name: "<--- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemSchema],
}

const List = mongoose.model("List", listSchema);




app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

app.set('view engine', 'ejs');

//function that recieves values 
app.get("/", function (req, res) {

    // If there are no items found or array is empty, we add our three items
    Item.find({}, function (error, results) {

        if (results.length === 0) {
            //Inserting items in database
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully added items to the database!")
                }
            });
            // This will redirect back to app.get("/"...") and execute else statement since items were added already
            res.redirect("/");
        } else {
            // "Today" will replace listTitle marker in list.ejs 
            res.render('list', {
                listTitle: "Today",
                newListItems: results,
            });
        }
    });
});

// Creates a custom link name such as localhost:3000/anyname    
app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({
        name: customListName
    }, function (err, foundList) {
        if (!err) {
            if (!foundList) { // If results are not found...
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });

                list.save();
                res.redirect("/" + customListName);
            } else {
                // Show an existing list

                res.render('list', {
                    listTitle: foundList.name,
                    newListItems: foundList.items,
                });

                console.log("Doesn't exist!");
            }
        } else {
            console.log(err);
        }

    });

});

// function that posts things on webpage
app.post("/", function (req, res) {

    // item retrieves the value from newItem input in html
    var itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName,
    });

    // If listname is Today redirect to a main page
    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        // Finds a customlist and adds a new item to that list.
        List.findOne({
            name: listName
        }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }

});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Removed Successsfully!")
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({
            name: listName
        }, {
            $pull: {
                items: {
                    _id: checkedItemId
                }
            }
        }, function (err, foundItem) {
            if (!err) {
                res.redirect("/" + listName);
                console.log("Found and Updated the Item!")
            }
        });
    }
});



// ---------------------about page--------------------
app.get("/about", function (req, res) {
    res.render("about");
});



app.listen(3000, function () {
    console.log("Server is running on port 3000");
});