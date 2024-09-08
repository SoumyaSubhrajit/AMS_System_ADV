import React from 'react';
import { NavLink } from 'react-router-dom';
import "../CssFiles/Navbar.css"

const Navbar = () => {

  return (
    <nav className="navbar">
      <div className="navbar-brand">Advanze</div>
      <div className="navbar-links">
      <NavLink 
          to="/assets" 
          className={({ isActive }) => (isActive ? 'active' : '')}
        >   
          Assets
        </NavLink>
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          Dashboard
        </NavLink>
        <NavLink 
          to="/logout" 
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          Logout
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
