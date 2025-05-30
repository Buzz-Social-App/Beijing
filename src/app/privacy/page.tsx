import React from 'react';

const PrivacyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy - Buzz Social</h1>
      <p className="text-sm text-gray-600 mb-8">Effective Date: 28th May 2025</p>

      <div className="prose prose-lg">
        <p className="mb-6">
          Welcome to Buzz Social - your curated guide to the best fashion, music, and art events.
          This Privacy Policy explains how we collect, use, and share your personal information when you
          use our mobile app ("Buzz Social", "we", "us", or "our"). We comply with the UK General Data
          Protection Regulation (UK GDPR), the EU GDPR, and App Store regulations (as of May 2025).
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Who Can Use Buzz Social</h2>
          <p className="mb-4">
            Buzz Social is intended only for users aged 18 and over. By using the app, you confirm that
            you meet this requirement. We may use your date of birth to verify your eligibility and
            personalise your experience.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. What Information We Collect</h2>
          <p className="mb-4">We collect the following types of personal data:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Personal Identifiers: Name, email address, profile photo.</li>
            <li>Date of Birth: Used to verify age eligibility and tailor content.</li>
            <li>Location Data: We use third-party services to estimate your location (city-level only); we do not collect or track your precise location in-app.</li>
            <li>Device & Usage Data: IP address, device type, session activity, app usage patterns, and crash logs.</li>
            <li>App Activity: Events you like, follow, save, or interact with; user-generated content; profile preferences.</li>
            <li>Linked Social Accounts: If you connect accounts like Instagram, we may collect publicly available profile data.</li>
            <li>Optional Demographics: Gender, interests, etc., if provided by you.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="mb-4">We process your data to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Personalize your feed, recommendations, and event content.</li>
            <li>Build your user profile and in-app presence.</li>
            <li>Communicate with you via notifications or email.</li>
            <li>Analyze and improve app performance, features, and support.</li>
            <li>Comply with legal obligations and ensure platform security.</li>
          </ul>
          <p className="mt-4">
            Legal bases for processing include: consent, legitimate interest, contract performance, and
            compliance with legal obligations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Sharing Your Information</h2>
          <p className="mb-4">We may share your information with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Third-party service providers (e.g., hosting, analytics, customer support, location services) that help us run the app.</li>
            <li>Marketing and analytics partners to improve outreach and promotions.</li>
            <li>Event and brand partners for content collaboration or recommendations, based on legitimate interest or your consent.</li>
            <li>Regulatory or legal authorities, if required to comply with legal obligations or protect user safety and platform integrity.</li>
          </ul>
          <p className="mt-4">
            We do not sell your personal data. If our data sharing practices materially change, we will
            update this policy and notify you, seeking new consent where required.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
          <p className="mb-4">Under UK and EU data protection laws, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal data.</li>
            <li>Correct inaccurate or incomplete data.</li>
            <li>Delete your data ("right to be forgotten").</li>
            <li>Withdraw consent at any time.</li>
            <li>Object to or restrict processing under certain conditions.</li>
            <li>Data portability, allowing you to receive a copy of your data in a usable format.</li>
          </ul>
          <p className="mt-4">
            Contact us at <a href="mailto:team@buzzsocialapp.com" className="text-blue-600 hover:underline">team@buzzsocialapp.com</a> to exercise any of these rights.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Data Transfers Outside the UK/EU</h2>
          <p>
            Your data may be processed in countries outside the UK or EEA. Where this happens, we
            ensure adequate safeguards are in place, such as Standard Contractual Clauses and the UK
            International Data Transfer Addendum.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
          <p>
            We retain your personal data only for as long as necessary to fulfil the purposes described
            above or comply with legal requirements. If you delete your account, we will delete or
            anonymize your data, unless required to retain it for legal or operational reasons.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
          <p>
            Buzz Social is strictly for users 18 years and older. We do not knowingly collect data from
            individuals under 18. If we learn that we have collected data from someone under 18, we will
            promptly delete it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
          <p>
            We may occasionally update this Privacy Policy. Material changes will be communicated
            through the app or email. Continued use of the app means you accept the updated terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p className="mb-2">Buzz Social - Data Protection</p>
          <a href="mailto:team@buzzsocialapp.com" className="text-blue-600 hover:underline">
            team@buzzsocialapp.com
          </a>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. App Store Compliance</h2>
          <p className="mb-4">Buzz Social complies with Apple App Store and Google Play privacy rules:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We clearly disclose all data collection purposes and third-party usage.</li>
            <li>We request user consent for marketing and analytics sharing (where required).</li>
            <li>This policy is linked from the app store listing and in-app settings.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
