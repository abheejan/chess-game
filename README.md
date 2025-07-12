# Chess 3D - Modern Chess Platform

A full-featured React chess application with 3D graphics, multiplayer functionality, and modern UI.

## Features

- 🎮 **Play vs Bot**: Challenge AI with multiple difficulty levels (Easy, Medium, Hard)
- 🌐 **Multiplayer Online**: Create rooms and play with friends in real-time
- 🎨 **3D Chessboard**: Beautiful 3D chess pieces with realistic graphics
- 🔐 **Authentication**: Google Sign-In and email/password registration
- 💬 **Real-time Chat**: Built-in chat for multiplayer games
- 📊 **Game History**: Track your games and statistics
- 🎨 **Modern UI**: Material-UI design with dark/light theme support
- 📱 **Responsive**: Works on desktop, tablet, and mobile devices

## Live Demo

Visit the live application: [Chess 3D App](https://chess-app-20717.firebaseapp.com)

## Tech Stack

- **Frontend**: React 19, Material-UI, React Router
- **3D Graphics**: Three.js, React Three Fiber
- **Backend**: Firebase (Authentication, Firestore, Analytics)
- **Chess Logic**: chess.js
- **Styling**: Emotion, CSS-in-JS

## Getting Started

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Firebase Setup

This project uses Firebase for authentication, database, and hosting. The Firebase configuration is already set up in `src/firebase.js`.

### Firestore Rules

Deploy the Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

### Authentication

Enable the following authentication methods in your Firebase Console:
- Google Sign-In
- Email/Password

### Database

The app uses Firestore collections:
- `users`: User profiles and data
- `rooms`: Multiplayer game rooms
- `games`: Game history and statistics

## Deployment

Deploy to Firebase Hosting:

```bash
npm run build
firebase deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Author

**Abheejan Lal Shrestha**
- GitHub: [@abheejan](https://github.com/abheejan)
- LinkedIn: [Abheejan Lal Shrestha](https://www.linkedin.com/in/abheejan-lal-shrestha-5b9919313/)
- Email: abheejanlal@gmail.com
