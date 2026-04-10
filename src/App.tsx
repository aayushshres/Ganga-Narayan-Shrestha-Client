import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Timeline from "./components/Timeline";
import Footer from "./components/Footer";

import Works from "./components/Works";
import Discover from "./components/Discover";
import ArticleDetail from "./components/ArticleDetail";
import BookDetail from "./components/BookDetail";
import AllArticles from "./components/AllArticles";
import AllBooks from "./components/AllBooks";
import AllInterviews from "./components/AllInterviews";
import AllSongs from "./components/AllSongs";

import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./admin/LoginPage";
import AdminLayout from "./admin/AdminLayout";
import DashboardPage from "./admin/DashboardPage";
import ArticlesPage from "./admin/ArticlesPage";
import BooksPage from "./admin/BooksPage";
import InterviewsPage from "./admin/InterviewsPage";
import SongsPage from "./admin/SongsPage";

function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <hr className="section-divider" />
      <Timeline />
      <hr className="section-divider" />
      <Works />
      <hr className="section-divider" />
      <Discover />
      <Footer />
    </>
  );
}

function AppInner() {
  const { lang } = useAppContext();

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    if (lang === "np") {
      body.classList.add("lang-np");
      html.setAttribute("lang", "ne");
    } else {
      body.classList.remove("lang-np");
      html.setAttribute("lang", "en");
    }
  }, [lang]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/all-articles" element={<AllArticles />} />
      <Route path="/articles/:id" element={<ArticleDetail />} />
      <Route path="/all-books" element={<AllBooks />} />
      <Route path="/books/:id" element={<BookDetail />} />
      <Route path="/all-interviews" element={<AllInterviews />} />
      <Route path="/all-songs" element={<AllSongs />} />

      {/* Admin routes */}
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="books" element={<BooksPage />} />
        <Route path="interviews" element={<InterviewsPage />} />
        <Route path="songs" element={<SongsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
      </AuthProvider>
    </AppProvider>
  );
}
