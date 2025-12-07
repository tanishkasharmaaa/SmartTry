import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
    styles:{
        global:{
            "*":{
                margin:0,
                padding:0,
                boxSizing:"border-box"
            },
            "body":{
                background:"white",
                color:"white"
            }
        }
    },

    components:{
        Button:{
            borderRadius:"0px",
            padding:"2px 8px",
            boxShadow:"none"
        }
    },
    Box:{
        baseStyle:{
            padding:0,
            margin:0
        }
    }
})

export default theme;