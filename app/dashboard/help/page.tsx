'use client';

import { useState } from 'react';
import { Search, HelpCircle, Book, MessageCircle, Mail, Phone, Video, FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I add a new vehicle to my fleet?',
      answer: 'Go to Settings > Fleet tab and click the "Add Vehicle" button. Fill in the vehicle details including name, plate number, driver, and other information. The vehicle will be added to your fleet immediately.'
    },
    {
      question: 'How can I export trip reports?',
      answer: 'Navigate to the Reports section, select the report type (Trip Details, Fleet Summary, etc.), choose your vehicle and date range, then click the "Export" button. Reports are downloaded as CSV files.'
    },
    {
      question: 'What do the different vehicle statuses mean?',
      answer: 'Moving: Vehicle is currently in motion. Idle: Vehicle is stationary with engine on. Offline: No GPS signal received. Maintenance: Vehicle is under maintenance.'
    },
    {
      question: 'How often is location data updated?',
      answer: 'Location data is updated every 30 seconds by default. You can adjust this in Settings > Tracking > Location Update Frequency. More frequent updates consume more data.'
    },
    {
      question: 'Can I set up geofence alerts?',
      answer: 'Yes! Go to Settings > Notifications and enable "Geofence Alerts". You can define custom zones and receive notifications when vehicles enter or exit these areas.'
    },
    {
      question: 'How do I change my password?',
      answer: 'Go to Settings > Profile tab, scroll to the "Change Password" section, enter your current password and new password, then click "Save Changes".'
    },
    {
      question: 'What is the data retention period?',
      answer: 'By default, tracking data is retained for 90 days. You can adjust this in Settings > Tracking > Data Retention Period based on your subscription plan.'
    },
    {
      question: 'How do I view historical routes?',
      answer: 'Click on any vehicle card to view its details. Select a date from the calendar to view the route for that specific day. Use the playback controls to replay the journey.'
    }
  ];

  const quickLinks = [
    { icon: Book, title: 'User Guide', description: 'Complete documentation', color: 'from-blue-500 to-indigo-600' },
    { icon: Video, title: 'Video Tutorials', description: 'Step-by-step guides', color: 'from-purple-500 to-pink-600' },
    { icon: FileText, title: 'API Documentation', description: 'For developers', color: 'from-green-500 to-emerald-600' },
    { icon: MessageCircle, title: 'Community Forum', description: 'Ask questions', color: 'from-orange-500 to-red-600' }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
          Help & Support
        </h1>
        <p className="text-gray-600 text-lg">Find answers, guides, and get assistance</p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            placeholder="Search for help articles, FAQs, or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg shadow-sm"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickLinks.map((link, index) => {
          const Icon = link.icon;
          return (
            <button
              key={index}
              className="group bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-300 transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${link.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">{link.title}</h3>
              <p className="text-sm text-gray-600">{link.description}</p>
              <div className="flex items-center gap-2 mt-3 text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Learn more</span>
                <ExternalLink className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>

      {/* FAQs Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b-2 border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
              <p className="text-sm text-gray-600 mt-1">Find quick answers to common questions</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-blue-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-left">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 py-4 bg-white border-t-2 border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold">No FAQs found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Support */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-2">Email Support</h3>
          <p className="text-sm text-gray-600 mb-4">Get help via email within 24 hours</p>
          <a
            href="mailto:support@fleetzi.in"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            support@fleetzi.in
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Phone className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-2">Phone Support</h3>
          <p className="text-sm text-gray-600 mb-4">Talk to our support team</p>
          <a
            href="tel:+911234567890"
            className="inline-flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
          >
            +91 123 456 7890
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-2">Live Chat</h3>
          <p className="text-sm text-gray-600 mb-4">Chat with us in real-time</p>
          <button className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700 transition-colors">
            Start Chat
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Still need help?</h2>
          <p className="text-blue-200 mb-6">
            Our support team is available 24/7 to assist you with any questions or issues you may have.
          </p>
          <button className="bg-white text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl">
            Contact Support Team
          </button>
        </div>
      </div>
    </div>
  );
}
