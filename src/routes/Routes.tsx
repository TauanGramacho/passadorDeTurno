import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/LoginPage";
import Dashboard from "../pages/Dashboard";

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
