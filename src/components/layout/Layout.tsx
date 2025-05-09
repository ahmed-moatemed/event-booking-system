import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import "../../styles/layout.css";

const Layout = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-content">
          <p>
            &copy; {new Date().getFullYear()} EventHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
