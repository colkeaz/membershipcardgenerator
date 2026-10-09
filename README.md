# Official SSC-AL Membership Portal

The **Official Membership Portal of the Supreme Student Council, Alangilan Campus, BatStateU** is a digital platform designed to provide students with a verifiable digital membership card and allow them to access exclusive perks and benefits from our partners.

This README is intended for **Officers and Administrators** who are setting up or maintaining the portal.

## Tech Stack
- **Frontend Framework**: React
- **Build Tool**: Vite
- **Backend/Database**: Firebase (Firestore, Authentication, Hosting)
- **Styling**: Tailwind CSS (or standard CSS depending on configuration)
- **Icons**: Lucide React

## Local Development Setup

To run this project locally for development or testing:

1. **Clone the repository** (if you haven't already).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up Firebase configuration**:
   Ensure you have your Firebase project set up. You need to create an `.env` file based on `.env.example` and fill in your specific Firebase API keys:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```

## Firebase Database Management (Firestore)

As an admin, you will manage two primary collections in Firestore:

- `students`: Contains verified student data (Name, SR-Code, Department). This is used to validate against user input when generating a card.
- `benefits` or `partners`: Contains the active partnerships and discounts offered to the students.

Make sure your Firestore rules (`firestore.rules`) allow appropriate read access for students to generate their cards, while write access should be restricted to administrators.

## Deployment

This app is designed to be hosted on **Firebase Hosting**. 
To deploy updates:

1. Build the production application:
   ```bash
   npm run build
   ```
2. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting
   ```

## Additional Guides
- For Students and Members, see [STUDENT_GUIDE.md](./STUDENT_GUIDE.md).
- For Business Partners, see [PARTNER_GUIDE.md](./PARTNER_GUIDE.md).
