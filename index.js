const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { default: axios } = require("axios");
const SSLCommerzPayment = require("sslcommerz-lts");

const app = express();
const port = process.env.PORT || 5000;

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false; //true for live, false for sandbox

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
    store_id: store_id,
    store_passwd: store_passwd,
    total_amount: paymentinfo.amount,
    currency: "USD",
    tran_id: TrxId,
    success_url: 'http://localhost:5000/success-payment',
    fail_url: "http://localhost:5000/fail-payment",
    cancel_url: "http://localhost:5000/cancel-payment",
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
  console.log(initiate_data);

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
  const query = { paymentId: successData.tran_id };
  const update = {
    $set: {
      status: "Success",
    },
  };
  try {
    const updateData = await PaymentCollection.updateOne(query, update);
    console.log("successdata:", successData);
    console.log("updateData:", updateData);
    res.redirect('http://localhost:3000/success-payment');
    // res.send({ message: "Payment updated successfully" });
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).send("Error updating payment");
  }
});
// Fail Payment:
app.post('/fail-payment',async(req,res)=>{
  res.redirect('http://localhost:3000/fail-payment');
})
// cancel Payment:
app.post('/cancel-payment',async(req,res)=>[
  res.redirect('http://localhost:3000/cancel-payment')
])




app.get("/", (req, res) => {
  res.send("SSl commerz is running");
});

app.listen(port, () => {
  console.log(`SSl commerz running on port: ${port}`);
});
