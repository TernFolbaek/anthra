# Anthra
## Accessible at: https://anthra.dk

Platform where you create a profile based on your "Stage of life", a Professional, Student or Self Studying, list your academic interests, amongst other properties. Connect with other users, chat, create groups across your connections and have 
the opportunity to study together or work on projects that interest the both of you. I believe many would find studying and work to be more enjoyable when its done alongside someone that shares your passion and discipline.

# Steps to Run the Project Locally

1. **Install Prerequisites:**
   - Install **Docker** from [here](https://www.docker.com/get-started).
   - Install **Docker Compose** from [here](https://docs.docker.com/compose/install/).

2. **Clone the Repository:**
   - Run the following command to clone the project:
     ```bash
     git clone <your-repository-url>
     cd <your-repository-folder>
     ```

3. **Configure Environment Variables:**
   - Open the `docker-compose.yml` file and replace placeholders with your own values:
     - **POSTGRES_USER**: Set your PostgreSQL username.
     - **POSTGRES_PASSWORD**: Set your PostgreSQL password.
     - **POSTGRES_DB**: Set your PostgreSQL database name.
     - **networks**: Set a name for the network or leave it as `anthra-network`.

4. **Build and Start the Services:**
   - Run the following command to build and start all services:
     ```bash
     docker-compose up --build
     ```
   - Docker will download the necessary images and start the containers for PostgreSQL (`db`), the backend, frontend, and Nginx.

5. **Access the Services:**
   - **Frontend**: Open [http://localhost:3000](http://localhost:3000) in your browser.
   - **Backend**: Open [http://localhost:5000](http://localhost:5000) to access the backend API.
   - **PostgreSQL Database**: The database is available at `localhost:5433`. Use the credentials from step 3 to connect.

6. **Stop the Services:**
   - When you're done, stop the services by running:
     ```bash
     docker-compose down
     ```
