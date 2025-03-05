import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../context/SessionContext";

const AuthProtectedRoute = () => {
  const { session } = useSession();
  
  if (!session) {
    // Reindirizza alla pagina di login se non c'è una sessione
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

export default AuthProtectedRoute; 