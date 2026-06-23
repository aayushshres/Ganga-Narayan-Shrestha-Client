import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

// Wraps all public pages so the navbar (site-wide navigation) and footer
// (contact section) are available everywhere, not just the homepage.
export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}
