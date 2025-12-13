
import './App.css'
import Navbar from './components/navbar'
import {Route, Routes} from "react-router-dom"
import About from './pages/About'
import Home from './pages/Home'
import Mens from './pages/Mens'
import Women  from './pages/Women'
import Unisex from './pages/Unisex'
import SingleProd from './pages/SingleProd'

function App() {

  return (
    <>
      <Navbar/>
      <Routes>
         <Route path='/' element={<Home/>}/>
         <Route path='/men' element={<Mens/>}/>
         <Route path='/women' element={<Women/>}/> 
         <Route path="/unisex" element={<Unisex/>}/>
         <Route path="/about" element={<About/>}/>
         <Route path="/product/:id" element={<SingleProd/>}/>
      </Routes>
    </>
  )
}

export default App
