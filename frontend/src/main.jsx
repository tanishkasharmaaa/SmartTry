import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {ChakraProvider, ThemeProvider} from "@chakra-ui/react"
import App from './App.jsx'
import theme from './theme.js'
import {BrowserRouter} from "react-router-dom"

createRoot(document.getElementById('root')).render(
  <ChakraProvider theme={theme}>
   <BrowserRouter>
    <App />
  </BrowserRouter>
  </ChakraProvider>,
)
