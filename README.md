# KalaCart

**Discover Art. Own What You Love.**

KalaCart is a marketplace for handmade art from Nepal. Artists list drawings, paintings, crochet and sculptures, and buyers can browse, save favorites, and send purchase requests. One account can both buy and sell.

**Live site:** 

## Features

- Sign up and login with email and password
- One account works as both buyer and artist
- Upload artworks with photos, price and category
- Gallery with search, category filters, sorting and an "available only" option
- Artwork pages with inquiry form and WhatsApp contact
- Public artist profiles with photo, bio and their artworks
- My Shop: artists accept, decline and mark requests as sold
- My Orders: buyers track their requests
- Notification badges for new requests and order updates
- Favorites list
- Edit and delete your own artworks
- Responsive design for phones and desktop

## Tech stack

- **Frontend:** React, Vite, React Router
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Security:** Row Level Security policies, so users can only change their own data
- **Hosting:** Vercel

## What I learned

- Designing a relational database (profiles, artworks, orders, favorites)
- Writing Row Level Security rules and database constraints
- Building reusable React hooks (`useNotifications`, `useFavorites`)
- Handling image uploads with Supabase Storage
- Form validation on both the client and the database

## Run it locally

1. Clone the repository
2. Run `npm install`
3. Create a `.env` file with:
4. Run `npm run dev`

## Planned features

- Multiple photos per artwork
- Reviews and ratings
- Built-in chat

## Author

[Rabina Sijakhwa] · [Sijakhworabina@gmail.com]