# MedVoice AI Agency - Next.js App

A modern Next.js application for clinical automation and voice AI services.

## 🚀 Getting Started

**Prerequisites:** Node.js 18+ 

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env.local` file with:
   ```
   RESEND_API_KEY=re_gumzyD9j_D3zZPLR6NBBW7a17bh6VhLhv
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🚢 Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variable:
   - `RESEND_API_KEY=re_gumzyD9j_D3zZPLR6NBBW7a17bh6VhLhv`
4. Deploy!

## 📧 Contact Form Setup

The contact form is integrated with Resend for email delivery.

**Important:** Before using in production:
1. Update the `from` email address in `app/api/contact/route.ts` with your verified domain in Resend
2. Update the `to` email address in `app/api/contact/route.ts` with your actual receiving email address
3. Verify your domain in Resend dashboard to send from a custom domain

## 🛠️ Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Resend** - Email delivery
- **Lucide React** - Icons
# MedVoice-AI
