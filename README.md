# Ganga Narayan Shrestha Portfolio — Web

Bilingual (Nepali / English) portfolio site for a sitting member of Nepal's
Bagmati Province Assembly — his articles, books, interviews, and songs, with an
admin panel for managing it all.

**Live:** https://www.ganganarayanshrestha.com.np
&nbsp;·&nbsp; **API repository:** [github.com/aayushshres/Ganga-Narayan-Shrestha-Portfolio-Server](https://github.com/aayushshres/Ganga-Narayan-Shrestha-Portfolio-Server)

<!-- Add a screenshot to make this pop, e.g.:
![Home page](docs/screenshot.png)
-->

## About

This is the front-end: a React single-page app that powers both the public site
and the authenticated admin panel. It talks to a separate Express + MongoDB API
over REST.

## Features

- Bilingual content with light and dark themes
- Articles and literature, with a rich-text reading experience
- Books with an in-browser PDF reader (paginated, zoomable, swipeable)
- Interviews and songs played in an embedded YouTube viewer
- Admin panel to create, edit, reorder, and delete every kind of content
- Rich link previews when pages are shared on social media

## Built with

React 19 · TypeScript · Vite · React Router · TipTap · pdfjs-dist

## Highlights

- Crawler prerendering via Vercel Edge Middleware gives correct Open Graph link
  previews even though the site is a client-rendered SPA.
- The PDF reader is code-split, so its weight loads only when a book is opened.
- Article HTML is sanitized with DOMPurify before rendering, and the app ships
  JSON-LD structured data and a generated sitemap for SEO.
