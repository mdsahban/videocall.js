
# VideoCall

VideoCall.js is a simple library to enable real-time video calling using WebRTC. It's lightweight and easy to integrate into your web projects.

## Features

- **Real-time Video and Audio Call**: Built using WebRTC.
- **Easy Integration**: Plug and play integration with minimal setup.
- **Cross-Browser Support**: Works on most modern browsers.

## Installation

To get started with VideoCall.js, you can either download the code directly or use npm to install it.

### Using npm

```bash
npm install videocall.js
```

### Or Download the Files

You can also download the latest version of the library directly from the repository:

```html
<script src="path/to/videocall.js"></script>
```

## Usage

1. Initialize the VideoCall instance in your script:

```javascript
const videoCall = new VideoCall();
```

2. To start a call:

```javascript
videoCall.startCall();
```

3. To end the call:

```javascript
videoCall.endCall();
```

Make sure to check the full documentation for more advanced configuration options and integration details.

## Files

- `index.html`: Main HTML file for setting up the video call interface.
- `styles.css`: The CSS file to style the video call interface.
- `script.js`: Contains the main logic for starting and ending calls using WebRTC.
- `lobby.html`: Additional file for the lobby interface before the call starts.
- `lobby.css`: Styling for the lobby interface.

## Contributing

We welcome contributions! If you'd like to help improve this project, please fork the repository and submit a pull request.

### Steps to contribute:

1. Fork the repository.
2. Clone your fork locally.
3. Create a new branch for your feature or fix.
4. Commit your changes and push them to your fork.
5. Open a pull request to the main repository.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

You can adjust the details based on your project’s specific features or usage instructions.
