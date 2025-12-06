const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const connectDb = require("./config/db")
const session = require("express-session")
const passport = require("passport")
const reviewsRouter = require("./routes/reviews.route")
const cartRouter = require("./routes/cart.route")
const orderRouter = require("./routes/order.route")
const {v4:uuid4} = require("uuid");
const Websocket = require("ws")

dotenv.config()

require("./config/passportSetup")
require("./cron/orderTracker")

const app = express()

app.use(cors())
app.use(express.json())
app.use(session({
    secret:process.env.SESSION_SECRET||"mysecret",
    resave:false,
    saveUninitialized:true
}))

app.use(passport.initialize())
app.use(passport.session())

// ----------------Express Routes-----------------------

app.get("/",(req,res)=>{
    res.send(`<h1>SmartTry API is running...</h1>
        <a href="/auth/google">Login with Google</a>
        `);
})

app.use("/auth",require("./routes/auth.route"))

app.use("/api/users",require("./routes/users.route"))
app.use("/api/login",require("./routes/login.route"))
app.use("/api/products",require("./routes/products.route"))
app.use("/api/stock",require("./routes/stock.route"))
app.use("/api/reviews",reviewsRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order",orderRouter)
app.use("/api/rules",require("./routes/rules.route"))
app.use("/api/askAI",require("./routes/askAI.route"))

// --------------------------- Start Server ----------------------------------

const port = process.env.PORT || 5000

const server = app.listen(port,async()=>{
    try {
    await connectDb()    
    console.log(`Server is running on port : ${port}`)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
    
})

// ------------------------------ Websocket Server -------------------------------------
const wss = new Websocket.Server({server})

const sessions = new Map();

wss.on("connection", (ws) => {
    const sessionId = uuid4();
    sessions.set(sessionId,ws);

    console.log(`✨ New WS connection: ${sessionId}`)
    ws.send(JSON.stringify({type:"connected",sessionId}));

    ws.on("message", async(message) => {
        try {
            const data = JSON.parse(message);
            if(data.type==="askAI"){
                const askAI = require("./utils/askAI");
                const req = {body:data}
                const res = {
                    status:(code) => ({
                        json: (obj) => ws.send(JSON.stringify(obj))
                    })
                }
                await askAI(req,res,ws)
            }
        } catch (error) {
            console.error("WS message error:",err)
            ws.send(JSON.stringify({success:false, message:"Invalid message format"}))
        }
    })

    ws.on("close", () => {
        console.log(`❌ WS connection closed: ${sessionId}`);
        sessions.delete(sessionId)
    })

    ws.on("error",(err) => {
    
    })
})
