
# Firebase Studio - Perfectly Styled

This is a Next.js application built with Firebase Studio. It provides a style questionnaire and generates a personalized style report directly for the user.

## Getting Started

1.  **Set up Environment Variables:**
    *   Create a `.env.local` file in the root directory by copying `.env.local.example`.
    *   Add your Firebase project configuration keys (prefixed with `NEXT_PUBLIC_FIREBASE_`). See `.env.local.example` for the required variable names.
    *   For deployment, ensure these environment variables are set in your Firebase Hosting/Functions environment.

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9003` (or the port specified in `package.json`).

## Key Features

*   **Style Questionnaire:** A multi-step form to gather user input on body line, scale, and shape.
*   **Logic-Based Recommendations:** Generates basic style advice based on questionnaire answers.
*   **Direct Report Flow:** Users complete the questionnaire, provide an email, and receive their report in the browser and (simulated) via email. No user accounts are required.
*   **Styling:** Uses ShadCN UI components and Tailwind CSS.

## Deployment to Firebase

1.  **Build the Application:**
    ```bash
    npm run build
    ```
2.  **Deploy:**
    Ensure your Firebase CLI is configured and you are logged in.
    ```bash
    firebase deploy
    ```
    Make sure your Firebase environment has all necessary environment variables set (see Step 1 of "Getting Started").

