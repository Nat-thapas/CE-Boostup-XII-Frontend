# CE Boostup XII Secondary Frontend
This frontend server is built with SvelteKit with a focus on speed and responsive design on laptop and tablets. The source code is in the `src` folder with the `src/routes` folder containing most of the pages and the `src/lib` folder containing most of the shared codes and components.


## Running a Development Server

### Intalling Dependencies
If this is the first time you're running the server, first install the dependencies using the command `pnpm install`

### Starting the Server
Use the command `pnpm run dev` to start a development server, the server will automatically reload when it detects a file change

You can also use the command `pnpm run preview` to start a development server in production mode, this allow to test code that may behave differently in development and production mode, so far this code base does not contains code with such behavior


## Deployment
After configuring the application, simply run `docker compose up -d --build` to start the application. Docker compose may raise an error about orphan containers, this is due to this and the backend compose having the same name, this is intentional, as the 2 are intended to be run together.


## Configurations

### .env
The .env file for development is loaded by Vite, refer to [Vite's documentation](https://vite.dev/guide/env-and-mode) on how they're loaded. The .env file for deployment must be named `.env.production` to be loaded correctly.

key : description (type)
  - ORIGIN : The origin URL for the application, this is used by SvelteKit for CSRF prevention (string)
  - HOST : The host/address the server will listen on, set to `0.0.0.0` to listen on all available addresses (string)
  - PORT : The port the server will listen on (number)
  - BODY_SIZE_LIMIT : The maximum body size that NodeJS will accept and process in bytes (number)
  - PUBLIC_ORIGIN : The origin URL for the application, this is used for sending links to user via emails and parsing URL on the clinet side (string)
  - PRIVATE_API_URL : The URL of the API server for the server to connect to, this can be a private IP address if the server is on the same network (string)
  - PUBLIC_API_URL : The URL of the API server for the client to connect to (string)
  - PUBLIC_ACCEPTED_IMAGE_TYPES : The MIME types that can be used as images, comma separated (string)
