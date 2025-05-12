# Project Information
SecureChat is a secure, real-time messaging platform built with Node.js, Express, and MongoDB. It uses WebSockets for instant message delivery, and includes features like input sanitization to prevent XSS attacks, secure authentication for protected access, and activity logging for transparency. Messages are stored safely using Mongoose models, and the app follows clean code practices with a modular backend and a lightweight, interactive frontend.



### Features
 * Register & Log In – Create an account and securely authenticate
 * Real-Time Messaging – Chat instantly with other users using WebSockets
 * Input Sanitization – Messages are cleaned to protect against XSS and injection attacks
 * Activity Logging – Keeps track of user events for better visibility
 * Secure Communication – Built with modern security practices to protect user data



## Updated Changelog
* Can be connected to from any device, instead of having to use local network.
* Online | Offline Users are now displayed with 🟢|🔴 respectively.
* Switched from local DB hosting to online hosting.
* End to End Encryption implemented.
* Swapped older Emoji picker to newer, Old one was deprecated.
* File uploading is now hosted on Firebase, With file upload limitations and basic malware scanning.
* Supports basic Markdown functions such as __bold__ and _italics_