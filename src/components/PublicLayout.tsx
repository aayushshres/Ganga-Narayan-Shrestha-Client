import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

// Wraps all public pages so the navbar (site-wide navigation) and footer
// (contact section) are available everywhere, not just the homepage.
export default function PublicLayout() {
  return (
    <>
      {/* Keyboard/screen-reader users can jump past the navbar straight to content. */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
