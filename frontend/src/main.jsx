import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {ChakraProvider,} from "@chakra-ui/react"
import App from './App.jsx'
import theme from './theme.js'
import {BrowserRouter} from "react-router-dom"
import AuthProvider from './context/authProvider.jsx'
import ThemeProvider from './context/themeProvider.jsx'
import { ToastProvider } from './context/toastProvider.jsx'
import CartContext, { CartProvider } from './context/cartContext.jsx'
import { RecommendationProvider } from './context/reccomendationContext.jsx'

createRoot(document.getElementById('root')).render(
  <ChakraProvider theme={theme}>
    <ThemeProvider>
     <ToastProvider>
   <BrowserRouter>
   <AuthProvider>
    <RecommendationProvider>
    <CartProvider>
    <App />
    </CartProvider>
    </RecommendationProvider>
    </AuthProvider>
  </BrowserRouter>
  </ToastProvider> 
  </ThemeProvider>
  </ChakraProvider>,
)
