import { useState } from "react";
import AuthContext from "./authContext";

const AuthProvider = ({children}) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("userInfo");
        return saved ? JSON.parse(saved):null;
    })
    const [authenticated, setAuthenticated] = useState(!!user);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch("")
            } catch (error) {
                
            }
        }
    })
    return(
        <AuthContext.Provider>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthProvider;