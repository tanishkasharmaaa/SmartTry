import { useState } from "react";
import AuthContext from "./authContext";

const AuthProvider = ({children}) => {
    const [authenticated, setAuthenticated] = useState()
    return(
        <AuthContext.Provider>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthProvider;