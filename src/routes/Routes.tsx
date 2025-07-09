import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/LoginPage";
import Dashboard from "../pages/Dashboard";
import SelecionarLocal from "../pages/SelecionarLocal";

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/selecionar-local" element={<SelecionarLocal />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
