// components/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
    const token = JSON.parse(localStorage.getItem('authToken'));
    const role = JSON.parse(localStorage.getItem("authRole"));

    console.log("Protected route token is :",token);
    console.log("Protected route role is :",role);

    if (!token) return <Navigate to="/login" />;
    if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" />;

    return children;
};

export default PrivateRoute;
