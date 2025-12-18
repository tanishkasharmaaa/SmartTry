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

function App() {
  return (
    <>
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
      </Routes>
      
    </>
  );
}

export default App;
