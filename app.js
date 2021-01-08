const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

// ---------------------------------------------------Database codes stasts from here------------------------------------------------------

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const todoSchema = new mongoose.Schema({
  fieldName: String,
});

const Todo = mongoose.model("Todo", todoSchema);

const buy = new Todo({
  fieldName: "Buy Food",
});

const cook = new Todo({
  fieldName: "Cook Food",
});

const eat = new Todo({
  fieldName: "Eat Food",
});

const defItems = [buy, cook, eat];

const listSchema = new mongoose.Schema({
  name: String,
  items: [todoSchema],
});

const List = mongoose.model("List", listSchema);
// ---------------------------------------------------Database codes ends from here------------------------------------------------------

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function (req, res) {
  Todo.find(function (err, results) {
    if (results.length === 0) {
      Todo.insertMany(defItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Success");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", items: results });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.item;
  const listName = req.body.list;

  const item = new Todo({
    fieldName: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.get("/:name", function (req, res) {
  const reqName = _.capitalize(req.params.name);

  List.findOne({ name: reqName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: reqName,
          items: defItems,
        });

        list.save();
        res.redirect("/" + reqName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          items: foundList.items,
        });
      }
    }
  });
});

app.post("/delete", function (req, res) {
  const checkedId = req.body.checkbox;
  const listView = req.body.listView;

  if (listView === "Today") {
    Todo.findByIdAndRemove(checkedId, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listView },
      { $pull: { items: { _id: checkedId } } },
      { useFindAndModify: false },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listView);
        }
      }
    );
  }
});
app.listen(process.env.PORT || 3000, function () {
  console.log("The server is running");
});
