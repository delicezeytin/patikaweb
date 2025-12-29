# Backend Requirement Report for Patika Çocuk Yuvası

## Current Status
**System Type:** Static Frontend (Single Page Application - React)
**Hosting:** Static File Hosting (RunCloud/Nginx)

The application currently has the **Visual Interface (UI)** for several forms but **NO functional backend** to process them. This means when a user clicks "Submit", the data is lost or simply logged to the browser console.

### Affected Areas
1.  **Contact Form** (`/contact`) - Messages are not sent.
2.  **Personnel Application** (`/apply-personnel`) - Applications are not saved.
3.  **Student Registration** (`/apply-student`) - Registrations are not saved.
4.  **Admin Panel** (`/admin`) - Changes made here (like updating text/images) are saved to **Browser LocalStorage** only. They will NOT be visible to other visitors.

---

## Recommendations for "Backend" Support

To make these forms work and allow you to manage the site content, here are the three best options ranging from easiest to most robust.

### Option 1: Third-Party Form Services (Easiest)
Use external services to handle form emails. No server code required.
*   **Tools:** [Formspree](https://formspree.io/), [EmailJS](https://www.emailjs.com/).
*   **Pros:** Setup takes 10 minutes. Free tier available.
*   **Cons:** Limited customization. Doesn't store data in a database (mostly just emails).
*   **Best for:** Contact forms.

### Option 2: Serverless Database (Modern Standard)
Connect the React app directly to a "Database as a Service".
*   **Tools:** [Firebase](https://firebase.google.com/) (Google), [Supabase](https://supabase.com/).
*   **Pros:** Free tier is generous. Real-time database. Authentication included (Login system).
*   **Cons:** Requires updating React code to use their SDKs.
*   **Best for:** Application forms, Student lists, Admin panel authentication.

### Option 3: Custom Backend API (Most Control)
Build a separate API application running on your Ubuntu server.
*   **Tools:** Node.js (Express), Python (Django/FastAPI), or PHP (Laravel).
*   **Pros:** Full control. You own the data. Can run on the same RunCloud server.
*   **Cons:** High maintenance. Requires security updates, database management, and more development time.
*   **Best for:** Complete custom CRM or School Management System.

## Immediate Suggestion
Since you asked to "handle structure later" (`o yapıyı sonra halledeceğiz`), I recommend:
1.  **Deploy the static site now** so it is visible.
2.  **Phase 2:** Integrate **EmailJS** or **Formspree** for the Contact form so you at least get emails.
3.  **Phase 3:** Create a simple **Node.js/Express API** on your server to save Applications to a SQLite or MongoDB database.

---

## Technical Next Steps
If you want to proceed with a Custom Backend (Option 3) on RunCloud:
1.  Create a **Node.js Web App** in RunCloud.
2.  We will write a simple `server.js` to handle `/api/contact` and `/api/apply`.
3.  Connect this React app to send requests to that API.
