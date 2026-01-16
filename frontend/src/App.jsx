import "./App.css";
import Navbar from "./components/navbar";
import { Route, Routes } from "react-router-dom";
import About from "./pages/About";
import Home from "./pages/Home";
import Mens from "./pages/Mens";
import Women from "./pages/Women";
import Unisex from "./pages/Unisex";
import SingleProd from "./pages/SingleProd";
import { Card } from "@chakra-ui/react";
import PrivateRoute from "./routes/privateRoute";
import Cart from "./pages/Cart";
import Order from "./pages/Order";
import Settings from "./pages/Settings";
import CheckoutPage from "./pages/Checkout";
import ChatWidget from "./components/ChatWidget";
import { useContext } from "react";
import AuthContext from "./context/authContext";
import OrderHistory from "./pages/OrderHistory";
import OrderDetails from "./pages/OrderDetail";
import SEO from "./components/SEO";

function App() {
  const {authenticated} = useContext(AuthContext);
  return (
    <>
    <SEO
        title="SmartTry – Try Products Virtually Before You Buy"
        description="SmartTry helps users try products virtually using AI before purchasing."
        keywords="smarttry, virtual try on, ecommerce ai"
        url="https://smarttry.ai/"
        image="https://smarttry.ai/og-image.png"
      />
      <Navbar />
     
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/men" element={<Mens />} />
        <Route path="/women" element={<Women />} />
        <Route path="/unisex" element={<Unisex />} />
        <Route path="/about" element={<About />} />
        <Route path="/products/:slug" element={<SingleProd />} />
        <Route path="/order" element={<Order />} />
        <Route
          path="/cart"
          element={
            <PrivateRoute>
              <Cart />
            </PrivateRoute>
          }
        />
        <Route path="/settings" element={<PrivateRoute><Settings/></PrivateRoute>}/>
        <Route path="/checkout" element={<PrivateRoute><CheckoutPage/></PrivateRoute>}/>
        <Route path="/order" element={<PrivateRoute><Order/></PrivateRoute>}/>
        <Route path="/orderhistory" element={<PrivateRoute><OrderHistory/></PrivateRoute>}/>
        <Route path="/orderDetails/:orderId" element={<PrivateRoute><OrderDetails/></PrivateRoute>}/>
      </Routes>
     {
      authenticated&&<ChatWidget/>
     }
      
      
    </>
  );
}

export default App;
