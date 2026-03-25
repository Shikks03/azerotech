# 📱 Repair Shop Website System -- Project README

## Overview

This project is a **simple and modern website for a local repair shop**
that offers:

-   Cellphone repair services
-   Laptop/Desktop reformat services
-   Mobile and computer accessories

The goal of the system is to help customers **easily find the shop,
schedule repair checkups, and view available accessories**, while
maintaining a **simple and accessible interface** for customers of all
ages.

Because many customers are **older individuals**, the system avoids
complicated features such as accounts, complex checkout systems, or
online payments.

Instead, the website focuses on **clear navigation, minimal steps, and
practical functionality**.

------------------------------------------------------------------------

# 🎯 Project Goals

1.  Allow customers to **easily locate the shop**.
2.  Provide a **simple appointment system** for device checkups.
3.  Display **available accessories** for in-store pickup.
4.  Reduce waiting time by allowing customers to **schedule visits**.
5.  Maintain a **minimal and modern user interface**.

------------------------------------------------------------------------

# 👥 Target Users

### Primary Users

-   Local customers
-   Walk-in repair customers
-   Individuals looking for accessories
-   Older customers who prefer simple interfaces

### User Characteristics

Users typically prefer:

-   Clear instructions
-   Large clickable buttons
-   Simple navigation
-   Minimal form inputs

Because of this, the system prioritizes **simplicity and usability**.

------------------------------------------------------------------------

# 🌐 Website Structure

The website will contain **five main pages**:

-   Home
-   Services
-   Book Appointment
-   Accessories
-   Contact

------------------------------------------------------------------------

# 🏠 Homepage

The homepage serves as the **main landing page** and should immediately
answer three questions:

-   What services does the shop offer?
-   Where is the shop located?
-   How can customers contact the shop?

### Sections

**1. Shop Introduction**

Short description of the shop and services.

Example:

> "We repair phones, reformat laptops and computers, and offer
> affordable accessories."

------------------------------------------------------------------------

**2. Quick Service Overview**

-   Cellphone Repair
-   Laptop/Desktop Reformat
-   Accessories

------------------------------------------------------------------------

**3. Call-to-Action Buttons**

Large and simple buttons:

-   Book Appointment
-   Call Shop
-   Message via Messenger

------------------------------------------------------------------------

**4. Shop Locations**

The shop currently has **two locations**:

Location 1\
`9WCC+FG Imus, Cavite`

Location 2\
`Address available but not yet listed on Google Maps`

Future update:\
Once the second location becomes available on Google Maps, it can be
added to the map embed.

------------------------------------------------------------------------

**5. Map**

Embedded Google Map showing the **Imus Cavite location**.

------------------------------------------------------------------------

# 🔧 Services Page

This page lists all the services offered by the shop.

Customers often search based on **their device problem**, so the
services should be listed clearly.

------------------------------------------------------------------------

## 📱 Cellphone Repair

Available repair services:

-   LCD Replacement
-   Reformat
-   Reprogram
-   Hang Logo Fix
-   Auto Shutdown Fix
-   Auto Restart Fix
-   Not Charging Repair
-   Volume Button Repair
-   Power Button Repair

------------------------------------------------------------------------

## 💻 Laptop / Desktop Services

-   Reformat

------------------------------------------------------------------------

## 🛍 Accessories

The shop sells various accessories including:

-   Charger
-   Data Cable
-   Memory Card
-   Earphones
-   Keyboard
-   Mouse
-   Tempered Glass

------------------------------------------------------------------------

# 📅 Appointment Booking System

The **appointment system** allows customers to schedule a time to visit
the shop for device checkups.

This helps reduce long wait times and allows the shop to manage
customers efficiently.

------------------------------------------------------------------------

## Appointment Flow

### Step 1 -- Select Service

Options include:

-   Phone Repair
-   Laptop/Desktop Repair
-   Device Checkup

------------------------------------------------------------------------

### Step 2 -- Select Date

Customers choose the date they want to visit.

------------------------------------------------------------------------

### Step 3 -- Select Time Slot

Appointments are available **every 30 minutes**.

Example time slots:

-   10:00 AM
-   10:30 AM
-   11:00 AM
-   11:30 AM
-   1:00 PM
-   1:30 PM

Unavailable slots will automatically be hidden or disabled.

------------------------------------------------------------------------

### Step 4 -- Customer Information

Customers fill in a simple form:

-   Name
-   Phone Number
-   Device Brand
-   Device Type
-   Description of Problem

Example:

Device Brand: Samsung\
Device Type: Phone\
Problem: Screen not responding

------------------------------------------------------------------------

### Step 5 -- Confirmation

After submission, the system displays a confirmation message:

> "Your appointment has been confirmed. Please arrive at your selected
> time."

Future improvements may include **SMS or Messenger confirmation**.

------------------------------------------------------------------------

# 🛍 Accessories Catalog

The accessories page displays **products available in the shop**.

This is **not a full online store**. Customers can **reserve items and
pick them up at the shop**.

------------------------------------------------------------------------

## Product Categories

Examples:

-   Chargers
-   Data Cables
-   Memory Cards
-   Earphones
-   Keyboard
-   Mouse
-   Tempered Glass

------------------------------------------------------------------------

## Product Card

Each item shows:

-   Product image
-   Product name
-   Price
-   Reserve button

Example:

Samsung Charger\
₱250

\[Reserve for Pickup\]

------------------------------------------------------------------------

## Reservation Form

When a customer reserves an item, they fill out:

-   Name
-   Phone Number
-   Pickup Date
-   Pickup Time

Example:

Pickup Date: March 20\
Pickup Time: 3:00 PM

The shop will prepare the item for **in-store pickup**.

------------------------------------------------------------------------

# 📞 Contact Page

The contact page allows customers to quickly reach the shop.

### Contact Information

-   Phone number
-   Messenger link
-   Shop locations
-   Store hours

------------------------------------------------------------------------

## Store Hours

The shop is open:

**Monday -- Sunday**

Operating hours can be displayed depending on the final schedule.

------------------------------------------------------------------------

# ⚙ Repair Status Checker (Future Feature)

Customers may check the progress of their device repair.

### Input

Customers enter:

-   Phone number\
    or\
-   Repair receipt number

------------------------------------------------------------------------

### Repair Status Stages

-   Device Received
-   Waiting for Parts
-   Fixing
-   Ready for Pickup

This helps reduce repeated inquiries about repair progress.

------------------------------------------------------------------------

# 🚫 Features to Avoid

To maintain simplicity, the system will **not include**:

-   User accounts
-   Online payments
-   Complex shopping carts
-   AI chatbots
-   Overly complicated navigation

The goal is to keep the system **fast, clear, and easy to use**.

------------------------------------------------------------------------

# 🎨 UI / UX Design Principles

The website will follow a **modern minimal design** while remaining
accessible.

### Design Style

-   Modern minimal layout
-   Clean spacing
-   Smooth animations
-   Seamless page transitions

The design should feel **modernized**, not like traditional outdated
business websites.

------------------------------------------------------------------------

### Animation Guidelines

Animations should be subtle and smooth:

Examples:

-   Fade-in sections when scrolling
-   Smooth button hover effects
-   Simple page transitions

Animations should **enhance the experience without distracting users**.

------------------------------------------------------------------------

### Color Style

The color palette should be:

-   Soft and relaxing
-   Low contrast
-   Easy on the eyes

Avoid:

-   Extremely bright colors
-   High contrast color combinations

The goal is a **calm and professional appearance**.

------------------------------------------------------------------------

# 🧰 Technology Stack

The system will be built using modern web technologies.

### Frontend

-   Next.js
-   React

### Backend

-   Node.js

### Database

-   Vercel Postgres

### Deployment

-   Vercel

Benefits of this stack:

-   Easy deployment
-   Built-in scalability
-   Fast global hosting
-   Integrated database support

------------------------------------------------------------------------

# 🗄 Basic Database Structure

## Appointments Table

appointments\
id\
name\
phone_number\
device_brand\
device_type\
problem_description\
appointment_date\
appointment_time\
status\
created_at

------------------------------------------------------------------------

## Products Table

products\
id\
name\
price\
image_url\
category\
stock\
created_at

------------------------------------------------------------------------

## Reservations Table

reservations\
id\
product_id\
customer_name\
phone_number\
pickup_date\
pickup_time\
status\
created_at

------------------------------------------------------------------------

# 🚀 Possible Future Improvements

Future upgrades may include:

-   Admin dashboard
-   Repair tracking panel for staff
-   Inventory management system
-   SMS notifications
-   Customer repair history
-   Multi-branch management

------------------------------------------------------------------------

# 📌 System Summary

The website focuses on **three main functions**:

1.  Help customers **find and contact the repair shop**
2.  Allow customers to **schedule repair checkups**
3.  Show **available accessories for reservation and pickup**

The system is designed to be **simple, modern, and accessible**,
ensuring that customers of all ages can easily interact with the shop
online.
