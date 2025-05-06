# Post Writing Project

An inventory and donation management system that allows users to handle inventory items, donations, and notifications efficiently. This project integrates real-time map tracking and secure user authentication.

## Table of Contents
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Dependencies](#dependencies)
- [API Documentation](#api-documentation)

## Features
- **Inventory Management**: Track items, set expiry notifications, and manage stock.
- **Donation Management**: View, reserve, and complete donations with user authentication.
- **Real-time Map Integration**: Display real-time location tracking using Mapbox and Socket.io.
- **User Authentication**: Secure user login with token-based authentication.
- **Notification System**: Alerts for expiring products and reserved donations.
  
## Requirements
To run this project, you need:
- Node.js `v14.x` or higher
- MongoDB (local or cloud-based)
- A `.env` file with the following keys:
  - `JWT_SECRET`: Secret key for JWT tokens
  - `DB_URI`: MongoDB connection URI
  - `MAPBOX_TOKEN`: API token for Mapbox services

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/SanketGadhe/FoodChain.git
   cd FoodChain
