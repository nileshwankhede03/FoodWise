const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const axios = require("axios");

// Load environment variables
dotenv.config();

// Models
const user = require("./models/user");
const post = require("./models/post");
const foodItem = require("./models/foodItem");
const donation = require("./models/donation");

// Middleware setup
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const { GoogleGenerativeAI } = require("@google/generative-ai");


// Recipe generation route
app.get("/recipes", async (req, res) => {
  try {
    const items = req.query.items ? req.query.items.split(",") : [];
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const recipes = await Promise.all(
      items.map(async (productName) => {
        try {
          const prompt = `Create a detailed recipe using ${productName}. 
                         Include:
                         1. Recipe name
                         2. Ingredients list with quantities
                         3. Step by step cooking instructions
                         4. Cooking time
                         5. Difficulty level (Easy/Medium/Hard)
                         6. Serving size`;

          const result = await model.generateContent(prompt);
          const generatedText = result.response.text();

          return {
            productName,
            recipe: generatedText
          };
        } catch (error) {
          console.error(`Error generating recipe for ${productName}:`, error);
          return {
            productName,
            recipe: "Unable to generate recipe at this time."
          };
        }
      })
    );

    res.render("recipes", { 
      recipes,
      title: "Recipes for Expiring Items"
    });

  } catch (error) {
    console.error("Recipe generation error:", error);
    res.status(500).render("error", {
      message: "Failed to generate recipes"
    });
  }
});

// Middleware for checking expiring items
app.use(async (req, res, next) => {
  try {
    // Skip token verification for public routes
    if (!req.cookies.token) {
      return next();
    }

    const today = moment().startOf("day");
    const expirationThreshold = moment().add(2, "days").endOf("day");
    const user_id = jwt.verify(req.cookies.token, "Secret")._id;
    
    const expiringItems = await foodItem.find({
      userId: user_id,
      expiryDate: { $gte: today.toDate(), $lte: expirationThreshold.toDate() },
      status: "active",
    });

    if (expiringItems.length > 0) {
      res.locals.expiryWarning = {
        message: `These items will expire in 2 days: ${expiringItems
          .map((item) => item.name)
          .join(", ")}`,
        items: expiringItems.map((item) => item.name),
      };
    } else {
      res.locals.expiryWarning = null;
    }
    next();
  } catch (error) {
    console.error("Error checking expiring items:", error);
    next();
  }
});

app.get('/signup',function(req,res){
  res.render('signup')
})

app.get("/", (req, res) => {
  res.render("landing", { message: "" });
});

app.post("/create", async (req, res) => {
  const {
    name,
    email,
    password,
    cpassword,
    userType,
    contact,
    street,
    city,
    state,
    pincode,
  } = req.body;

  try {
    if (password !== cpassword) {
      return res.render("createinventorylist", { message: "Passwords don't match" });
    }

    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.render("createinventorylist", {
        message: "User Already Exists, Login to continue",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await user.create({
      name,
      email,
      password: hashedPassword,
      userType: userType || "individual",
      contact,
      address: { street, city, state, pincode },
      donationPoints: 0,
    });

    const token = jwt.sign(
      { email: createdUser.email, user_id: createdUser._id },
      "Secret"
    );

    res.cookie("token", token);
    res.render("login", { message: "User Created Successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.render("createinventorylist", { message: "Failed to Register" });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { message: false });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const check = await user.findOne({ email });
    if (!check)
      return res.render("login", { message: "Email or Password is incorrect" });

    const match = await bcrypt.compare(password, check.password);
    if (!match)
      return res.render("login", { message: "Email or Password is incorrect" });

    const token = jwt.sign(
      { email: email, name: check.name, user_id: check._id },
      "Secret"
    );

    res.cookie("token", token);
    res.redirect("/add/inventory");
  } catch (error) {
    console.error("Login error:", error);
    res.render("login", { message: "Login failed, try again" });
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("info");
  res.redirect("/login");
});

// Middleware to check if user is logged in


// Inventory Routes
app.get('/add/inventory',async (req,res)=>{
  const userinfo = jwt.verify(req.cookies.token, "Secret");
  res.render('writepost',{userinfo:userinfo})
})
app.post('/add/inventory', async (req, res) => {
  const userinfo = jwt.verify(req.cookies.token, "Secret");
    
  try {
        const {
            
            name,
            category,
            quantity,
            unit,
            purchaseDate,
            expiryDate,
            status,
            price
        } = req.body;
        const userinfo = jwt.verify(req.cookies.token, "Secret");
        
const userdata=await user.findOne({email:userinfo.email})
        // Create new food item
        
        const newFoodItem = await foodItem.create({
            userId:userdata._id,
            name,
            category,
            quantity,
            unit,
            purchaseDate,
            expiryDate,
            status,
            price,
            createdAt: new Date()
        });

userdata.foodItem.push(newFoodItem._id);
userdata.save()
        // Save to database
        res.redirect('/read/inventory');

    } catch (error) {
        console.error('Error adding food item:', error);
        res.render('createInventorylist', {
            message: 'Error adding food item. Please try again.',
            userinfo: userinfo
        });
    }
});


app.get("/read/inventory", isLogin, async (req, res) => {
  try {
    const userinfo = await user
      .findOne({ email: req.user.email })
      .populate("foodItem");
      console.log(userinfo)
    res.render("readinventory", { userinfo });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.get("/edit/inventory/:inventory_id", isLogin, async (req, res) => {
  const userinfo = jwt.verify(req.cookies.token, "Secret");
  try {
    const editInventory = await foodItem.find({_id:req.params.inventory_id});
    res.render("editinventory", { inventory: editInventory,userinfo:userinfo });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.post("/edit/inventory/:inventory_id", isLogin, async (req, res) => {
   const userinfo = jwt.verify(req.cookies.token, "Secret");
  try {
    const {
      name,
      category,
      quantity,
      unit,
      purchaseDate,
      expiryDate,
      status,
      price,
    } = req.body;
    await foodItem.findByIdAndUpdate(
      req.params.inventory_id,
      {
        name,
        category,
        quantity,
        unit,
        purchaseDate,
        expiryDate,
        status,
        price,
      },
      { new: true }
    );

    res.redirect("/read/inventory");
  } catch (error) {
    console.error("Error updating inventory:", error);
    res.status(500).send("There was an error updating the inventory item.");
  }
});

app.get("/delete/inventory/:inventory_id", isLogin, async (req, res) => {
  try {
    await foodItem.findByIdAndDelete(req.params.inventory_id);
    res.redirect("/read/inventory");
  } catch (error) {
    console.error("Error deleting inventory:", error);
    res.status(500).send("Server Error");
  }
});

// GET route for the donation page
app.get("/donate", (req, res) => {
  const userinfo = jwt.verify(req.cookies.token, "Secret");
  res.render("donationForm",{userinfo});
});

// POST route to handle donation form submission
app.post("/donate", async (req, res) => {
  try {
    const { foodName, quantity, unit, latitude, longitude, note } = req.body;

    // Verify token and get user details
    const userinfo = jwt.verify(req.cookies.token, "Secret");
    const userdetail = await user.findOne({ email: userinfo.email });

    // Ensure required fields are present
    if (!foodName || !quantity || !unit) {
      throw new Error("Missing required fields");
    }

    // Convert `amount` and `quantity` to numbers if they are provided as strings

    // Create a donation record
    const donationcreated = await donation.create({
      donorName: userdetail.name,
      userType: userdetail.userType,
      email: userinfo.email,
      contactno: userinfo.contact,
      foodName,
      quantity: quantity,
      unit: String(unit), // Ensures unit is stored as a string
      address: userdetail.address,

      coordinates: { latitude: Number(latitude), longitude: Number(longitude) },
      note,
      status: "active", // Default status
    });
    userdetail.donationPoints += 120;
    userdetail.save();

    res.redirect("/donations");
  } catch (error) {
    console.error("Error processing donation:", error);
    res
      .status(500)
      .send("There was an error processing your donation. Please try again.");
  }
});

app.get("/donations", async (req, res) => {
  try {
    const userinfo = jwt.verify(req.cookies.token, "Secret");
    // Fetch all donations from the database
    const donations = await donation.find();
    res.render("donations", { donations,userinfo }); // Pass the donations to the view
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).send("Error fetching donations. Please try again.");
  }
});
app.get("/mydonations", async (req, res) => {
  try {
    const userinfo = jwt.verify(req.cookies.token, "Secret");
    // Query the user and populate the foodItem references
    const userdetail = await user
      .findOne({ email: userinfo.email })
      .populate("foodItem")
      .exec();
    console.log(userdetail);
    // Pass the populated user data to the EJS template
    res.render("mydonations", {
      user: userdetail,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});

// Route to handle food reservation
app.post("/reserve/:id", async (req, res) => {
  try {
    const donationId = req.params.id;
    const donationreserve = await donation.findOneAndUpdate(
      { _id: donationId },
      { status: "reserved" }
    );

    if (!donationreserve) {
      return res.status(404).send("Donation not found");
    }

    res.redirect("/donations"); // Redirect to the donations page after reservation
  } catch (error) {
    console.error("Error reserving food:", error);
    res.status(500).send("Error reserving food. Please try again.");
  }
});
app.get("/profile/:userId", async (req, res) => {
  try {
    // Fetch user data from the database based on userId
    const userinfo = await user
      .findById(req.params.userId)
      .populate("foodItem");

    if (!userinfo) {
      return res.status(404).send("User not found");
    }

    // Render the profile page with the fetched data
    res.render("profile", { userinfo });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});
// Optional: PUT route to update donation status
app.put("/donate/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const donationupdated = await donation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!donationupdated) {
      return res.status(404).send("Donation not found");
    }

    res.status(200).json({ message: "Status updated successfully", donation });
  } catch (error) {
    console.error("Error updating donation status:", error);
    res.status(500).send("There was an error updating the donation status.");
  }
});
function isLogin(req, res, next) {
  try {
    if (!req.cookies.token) {
      return res.render("login", { message: "You need to login" });
    }
    req.user = jwt.verify(req.cookies.token, "Secret");
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.redirect("/login");
  }
}

// Listen on configured port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
