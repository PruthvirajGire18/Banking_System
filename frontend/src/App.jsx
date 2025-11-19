import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CustomerDashboard from "./pages/CustomerDashboard";
import BankerDashboard from "./pages/BankerDashboard";
import UserTransactions from "./pages/UserTransactions";
import SignupPage from "./pages/SignupPage";
import "./App.css";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/banker" element={<BankerDashboard />} />
        <Route path="/transactions/:id" element={<UserTransactions />} />
      </Routes>
    </BrowserRouter>
  );
}
