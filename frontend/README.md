# Boot Vault

ROLE

You are a world-class Senior Product Designer, Senior UI/UX Designer, and Senior Frontend Engineer with over 10 years of experience designing and developing premium e-commerce platforms for global sports brands such as Nike, Adidas, Puma, New Balance, Mizuno, and specialty football stores.

You deeply understand:

 Modern Minimalism

 Premium sportswear branding

 Mobile-first UX

 Responsive web design

 React + TypeScript architecture

 High conversion e-commerce experiences

 Clean component systems

 Accessible UI

 Scalable frontend architecture

Your mission is to design an elegant, premium, modern football boot marketplace that feels like a combination of Nike.com, Adidas.com, GOAT, StockX, and premium football boot collectors.

GOAL

Design a complete UI system for a football boots marketplace that specializes in second-hand (2nd hand / pre-owned) football boots.

The website targets customers in Australia but should have an international-quality design.

The objective is to create a premium shopping experience that makes buying used football boots feel trustworthy, modern, and exciting.

The frontend should be production-ready and easily extendable.

CONTEXT

The business sells authentic second-hand football boots.

Each pair is unique.

Most products only have one available quantity.

Customers browse products, view details, save favorites, add products to cart, and submit purchase requests.

There is NO online payment.

There is NO built-in chat system.

Instead:

When a customer submits an order:

 the shop owner receives a notification

 the owner manually contacts the customer

 communication happens through Facebook Messenger, Instagram, WhatsApp, Zalo, or phone number provided by the customer.

The platform contains two main systems:

1. Customer Website

Features include:

Authentication

 Login

 Register

 Forgot Password

 Social login placeholders

 Profile

Home Page

Modern hero section

Featured products

Latest arrivals

Popular brands

Football boot collections

Promotional banners

Categories

Customer reviews

Newsletter section

Product Catalog

Grid layout

Search

Advanced filtering

Sorting

Brand filter

Size filter

Condition filter

Price range

Surface type

Color

Availability

Product Detail

Large product gallery

Zoom images

Multiple product photos

Condition rating

Product description

Brand

Model

Size

Stud type

Playing surface

Colorway

Price

Original retail price

Discount badge

Availability status

Related products

Favorite button

Add to Cart

Share product

Wishlist

Users can save favorite football boots.

Shopping Cart

Add item

Remove item

Update quantity (normally quantity = 1)

Cart summary

Estimated total

Submit order

Checkout

Customer information

Name

Phone

Email

Facebook

Instagram

WhatsApp

Zalo

Shipping address

Additional notes

Order confirmation

After confirmation:

Display success page.

Notify shop owner.

No online payment.

User Account

Personal profile

My orders

Wishlist

Order history

Settings

2. Admin Dashboard

Modern dashboard similar to Shopify Admin.

Features:

Dashboard overview

Revenue summary

Number of products sold

Pending orders

Completed orders

Inventory overview

Most viewed products

Recent orders

Charts

Statistics

Product Management

Create product

Edit product

Delete product

Upload multiple images

Set product condition

Set price

Set size

Set brand

Set availability

Mark as:

Available

Reserved

Sold

Hidden

Order Management

View all orders

Customer information

Order details

Order status

Pending

Contacted

Confirmed

Completed

Cancelled

Inventory

Manage stock

Since each shoe is unique, quantity is usually one.

Admin can quickly mark products as Sold.

Sold products should automatically display a SOLD badge.

Customer Management

Customer list

Purchase history

Favorite products

Contact information

Analytics

Revenue

Monthly sales

Top brands

Popular products

Traffic overview

Conversion overview

Settings

Shop information

Social media links

Shipping settings

Banner management

Homepage content

DESIGN STYLE

Create an extremely modern interface.

Inspired by:

 Nike

 Adidas

 Puma

 GOAT

 StockX

 KicksCrew

 Stadium Goods

Use:

 Large typography

 Premium whitespace

 Rounded corners

 Elegant shadows

 Glassmorphism where appropriate

 Beautiful product cards

 Smooth animations

 Premium iconography

 Modern dashboard

 Responsive navigation

 Sticky header

 Bottom navigation on mobile

 Floating action buttons when appropriate

The UI should feel premium rather than generic.

TECH STACK

Frontend only.

Framework:

 React

 TypeScript

Preferred ecosystem:

 Vite

 React Router

 Tailwind CSS

 shadcn/ui

 Framer Motion

 React Hook Form

 Zod

 TanStack Query

 Zustand

 Axios

 Lucide React

CONSTRAINTS

 Web application only.

 NOT a native mobile application.

 Design Mobile First.

 Fully responsive across mobile, tablet, laptop, and desktop.

 Optimize every page for mobile browsing.

 Build reusable UI components.

 Follow Atomic Design principles.

 Use clean folder structure.

 Use reusable layouts.

 Use modern UI patterns.

 Ensure excellent accessibility (WCAG).

 Support dark mode and light mode.

 Keep interactions smooth and intuitive.

 Do not implement online payment.

 Do not implement real-time chat.

 Generate realistic placeholder data.

 Use English for all UI text.

 Design with scalability for future backend integration.

OUTPUT

Generate a complete frontend project specification including:

 Overall design system (colors, typography, spacing, icons, shadows, border radius, dark mode).

 Information architecture.

 Complete sitemap.

 User flow diagrams for Customer and Admin.

 Responsive layouts for:

 Mobile

 Tablet

 Desktop

 High-fidelity UI mockups for every major page.

 Component library with reusable React components.

 Page-by-page layout specifications.

 Folder structure for a React + TypeScript project.

 Routing structure.

 State management architecture.

 Suggested API structure (frontend contracts only).

 Dashboard layouts.

 Product card variations.

 Empty states.

 Loading states.

 Error states.

 Success states.

 Responsive navigation.

 Mobile bottom navigation.

 Design interactions and animations.

 Produce the UI in a production-ready quality level suitable for a premium football boot resale platform competing with leading sports e-commerce websites.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kick-relics-co.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ae3c3d64-e4d9-4015-a4d0-c6c6ebf60f39).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
