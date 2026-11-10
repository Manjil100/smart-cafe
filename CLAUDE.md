# Smart Café Ordering and Management System
COMP.6207 Special Topic project (Toi Ohomai). Prototype only, fictional café data.

## Stack
React (Vite), JavaScript, Supabase (Postgres, Auth, Realtime), react-router-dom, deployed on Vercel.

## MVP features
1. Customer menu browsing  2. Cart and order submission
3. Staff order dashboard  4. Order status tracking (pending → preparing → ready → completed)
5. Order history and basic sales info

## Database
categories, menu_items (with prep_time_minutes), orders (UUID id + short order_number,
customer_name, status, total), order_items (stores unit_price), staff_profiles (linked to Supabase Auth).
Customers order as guests and track orders via a link containing the order UUID. Staff log in.

## How to work with me
This is assessed coursework. Explain what you change and why, keep code simple and readable,
and work in small steps so I understand and can explain every part.
