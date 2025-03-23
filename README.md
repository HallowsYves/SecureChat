# Getting Started 🦝
### Quick info 
SecureChat is a secure, real-time messaging platform built with Node.js, Express, and MongoDB. It uses WebSockets for instant message delivery, and includes features like input sanitization to prevent XSS attacks, secure authentication for protected access, and activity logging for transparency. Messages are stored safely using Mongoose models, and the app follows clean code practices with a modular backend and a lightweight, interactive frontend.

### Features
 * Register & Log In – Create an account and securely authenticate

 * Real-Time Messaging – Chat instantly with other users using WebSockets

 * Input Sanitization – Messages are cleaned to protect against XSS and injection attacks

 * Activity Logging – Keeps track of user events for better visibility

 * Secure Communication – Built with modern security practices to protect user data

### Prerequisites
* Node.js
  
* MongoDB - Install and get your localhost of the database, and insert it in `app.mjs`.
  
* Find  your IP address since the sites run on your local network. Since the sites are found at `https://YOUR_IP_ADDRESS:3500/____.html`

## Installing Dependencies
* This part is easy! just run `npm install`

## Database Models
* user.model.js – handles user info and credentials
* Message.js – stores chat messages
* Activity.js – logs user actions or system events



## Run the App
* To do so, Navigate to the server folder and run `node app.mjs`!
* Afterwards, you are able to sign up at `register.html`, Login with `auth.html` and start talking with others at `chat.html`!
