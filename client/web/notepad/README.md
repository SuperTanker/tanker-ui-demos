# Notepad example application

## Description

This is a simple web application written in [React](https://reactjs.org/) and [Bootstrap](https://react-bootstrap.github.io/).

It allows each user to have exactly one note they can edit and share.

Here is the list of features implemented:

- authenticated access (signup, login, password reset, account settings, logout)
- send the note to a server to be saved
- retrieve the note from the server
- select a list of users to share the note with
- list and view all notes shared with the user

All this features use the Tanker SDK, it implements:
- open a session
- register a new device, if needs be
- encrypt text
- decrypt text
- share access to encrypted text

## How to

### Run the server

Please check that [the server is started](../../../README.md) as this example application will rely on it.

### Run the application

In a new terminal, run:

```bash
yarn start:web:notepad
```

The application should open in a new browser tab. If not, go to http://127.0.0.1:3000/ manually.
