import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {ChakraProvider,} from "@chakra-ui/react"
import App from './App.jsx'
import theme from './theme.js'
import {BrowserRouter} from "react-router-dom"
import AuthProvider from './context/authProvider.jsx'
import ThemeProvider from './context/themeProvider.jsx'

createRoot(document.getElementById('root')).render(
  <ChakraProvider theme={theme}>
    <ThemeProvider>
   <BrowserRouter>
   <AuthProvider>
    <App />
    </AuthProvider>
  </BrowserRouter>
  </ThemeProvider>
  </ChakraProvider>,
)
