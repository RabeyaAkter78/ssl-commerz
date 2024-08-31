const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { default: axios } = require("axios");

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hwapsgs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let PaymentCollection;

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    PaymentCollection = client.db("PaymentDB").collection("Payment");
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (err) {
    console.error(err);
  }
}
run();

app.post("/create-payment", async (req, res) => {
  const paymentinfo = req.body;
  console.log(paymentinfo);

  const TrxId = new ObjectId().toString();

  const initiate_data = {
    store_id: "progr66d01c76ac5c3",
    store_passwd: "progr66d01c76ac5c3@ssl",
    total_amount: paymentinfo.amount,
    currency: "USD",
    tran_id: TrxId,
    success_url: "http://localhost:3000/success-payment",
    fail_url: "http://yoursite.com/fail.php",
    cancel_url: "http://yoursite.com/cancel.php",
    emi_option: "0",
    cus_name: "Customer Name",
    cus_email: "cust@yahoo.com",
    cus_add1: "Dhaka",
    cus_add2: "Dhaka",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: "01711111111",
    cus_fax: "01711111111",
    shipping_method: "NO",
    num_of_item: "1",
    weight_of_items: "0.5",
    logistic_pickup_id: "logistic_pickup_id",
    logistic_delivery_type: "logistic_delivery_type",
    product_name: "laptop",
    product_category: "Electronics",
    product_profile: "general",
    multi_card_name: "mastercard,visacard,amexcard",
    value_a: "ref001_A",
    value_b: "ref002_B",
    value_c: "ref003_C",
    value_d: "ref004_D",
  };

  const response = await axios({
    method: "POST",
    url: "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    data: initiate_data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const savedData = {
    cus_name: "test name",
    paymentId: TrxId,
    amount: paymentinfo.amount,
    status: "Pending",
  };

  if (PaymentCollection) {
    const result = await PaymentCollection.insertOne(savedData);
    if (result) {
      res.send({
        paymentUrl: response.data.GatewayPageURL,
      });
    }
  } else {
    res.status(500).send("Database connection not established");
  }

  console.log(response);
});

// Success payment
app.post("/success-payment", async (req, res) => {
  const successData = req.body;
  if (successData.status !== "VALID") {
    throw new Error("Invalid Payment");
  }
  // update the database:
  const query = { paymentId: successData.TrxId };
  const update = {
    $set: {
      status: "Success",
    },
  };
const updateData=await payments.updateOne(query,update)
  console.log("successdata:", successData);
  console.log("updateData:", updateData);
});

app.get("/", (req, res) => {
  res.send("SSl commerz is running");
});

app.listen(port, () => {
  console.log(`SSl commerz running on port: ${port}`);
});
