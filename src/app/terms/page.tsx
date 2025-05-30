import React from 'react';

const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Terms & Conditions: Buzz Social</h1>
      <p className="text-sm text-gray-600 mb-8">Effective Date: 30th May 2025</p>

      <div className="prose prose-lg">
        <p className="mb-6">
          {`Welcome to Buzz Social! These Terms & Conditions ("Terms") govern your access to and use of our mobile application (the "App"), operated by Buzz Social Ltd. ("Buzz Social", "we", "us", or "our"). By creating an account or using the App, you agree to be legally bound by these Terms.
          If you do not agree to these Terms, do not use the App.`}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Who Can Use Buzz Social</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must be 18 years or older to use Buzz Social.</li>
            <li>You must provide accurate information during signup (including your date of birth) and keep your profile up to date.</li>
            <li>By using the App, you confirm that you are legally able to enter into a binding agreement.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Your Account</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are responsible for keeping your account credentials secure.</li>
            <li>You agree not to impersonate others, use fake profiles, or share your account.</li>
            <li>We may suspend or terminate accounts that violate these Terms or our Community Guidelines.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Content and Use</h2>
          <p className="font-medium mb-2">You may:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>View, save, and interact with events.</li>
            <li>Post or share content (e.g., comments, likes, interests).</li>
            <li>Customize your profile with preferences.</li>
          </ul>
          <p className="font-medium mb-2">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Post unlawful, harmful, hateful, or misleading content.</li>
            <li>Infringe on intellectual property rights.</li>
            <li>Scrape, reverse-engineer, or disrupt the platform.</li>
            <li>Use the app to promote illegal activities or spam.</li>
          </ul>
          <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic">
            Buzz Social reserves the right to remove content or suspend accounts at our discretion.
          </blockquote>
        </section>

        {/* Additional sections follow the same pattern */}
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
          <p className="mb-4">If you have questions or concerns, contact us at:</p>
          <p className="font-medium">Buzz Social LLP</p>
          <a href="mailto:team@buzzsocialapp.com" className="text-blue-600 hover:underline">
            team@buzzsocialapp.com
          </a>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
