# 💱 Smart Currency Converter

## 🌐 Live Demo
You can try the application here:
👉 https://sabithulla-16.github.io/Currency-Converter/

## 📌 Overview
Smart Currency Converter is a modern, fast, and reliable web-based currency conversion application. It allows users to convert currencies instantly using real-time exchange rates. The app is built with performance, offline usability, and accessibility in mind and works as a Progressive Web App (PWA).

The application automatically caches exchange rates so users can continue converting currencies even when offline. It also supports installation on mobile and desktop devices, giving a native app–like experience.

## ✨ Key Features
• ⚡ Real-time currency conversion using Frankfurter API  
• 📡 Offline currency conversion using cached exchange rates  
• 📲 Progressive Web App (PWA) support  
• 🖥️📱 Installable on mobile and desktop  
• 🚀 Fast loading and optimized performance  
• 🎨 Clean and responsive UI  
• 💾 Auto-save last used amount and currency pair  
• 🌍 Works seamlessly on GitHub Pages  
• ♿ Accessibility-friendly markup  
• 🔍 SEO optimized  

## 🛠️ Technologies Used
• 🌐 HTML5  
• 🎨 CSS3  
• ⚙️ JavaScript (Vanilla JS)  
• 💱 Frankfurter Currency API  
• 🧩 Service Workers  
• 📄 Web App Manifest  
• 💾 LocalStorage  

## ⚙️ How It Works
When the app loads with an active internet connection, it fetches available currencies and current exchange rates from the Frankfurter API. These exchange rates are cached locally using LocalStorage and Service Worker caching.

If the user goes offline, the app automatically switches to offline mode and continues converting currencies using the last cached exchange rates without throwing errors.

The Service Worker ensures that the app shell (HTML, CSS, JavaScript, icons) loads correctly even when the network is unavailable.

## 📴 Offline Support
The app supports offline usage by:
• 📦 Caching the app shell (HTML, CSS, JS, icons)
• 💾 Storing exchange rates locally
• 🔄 Automatically switching to cached rates when offline

## 📲 PWA Support
The application is fully PWA-ready:
• ✅ Includes a valid manifest.json
• 🔧 Registers a Service Worker
• 📴 Supports offline mode
• 📥 Can be installed on devices
• 🔒 Works over HTTPS (GitHub Pages)

## ⬇️ Installation
You don’t need to install anything manually.

To install as an app:
1️⃣ Open the live site in Chrome or Edge  
2️⃣ Click “Install App” from the address bar or browser menu  
3️⃣ The app will be added to your device like a native application  

## 📁 Project Structure
```
Currency-Converter/
├── index.html
├── style.css
├── script.js
├── sw.js
├── manifest.json
├── icon-192.png
├── icon-512.png
├── favicon.ico
└── README.md
```

## 🔗 API Used
Frankfurter Exchange Rates API  
https://www.frankfurter.app/

## 🌐 Browser Support
• 🟢 Chrome  
• 🔵 Edge  
• 🟠 Firefox  
• 📱 Mobile browsers with PWA support  

## 🚧 Future Improvements
• 🌗 Manual theme toggle (light/dark)
• 📊 Historical exchange rate charts
• ⭐ Favorite currency pairs
• 🌍 Multi-language support
• 📴 Better offline indicators

## 👨‍💻 Author
Developed by Sabithulla

## 📜 License
This project is open-source and free to use for learning and personal projects.
