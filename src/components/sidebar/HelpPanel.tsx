import React, { useState } from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { Send, CheckCircle } from 'lucide-react';

export function HelpPanel() {
  // Initialize Formspree with the same endpoint as the landing page
  const [state, handleFormspreeSubmit] = useForm("manjkjbk");
  
  // Local form state for controlled inputs
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    description: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Add system info to the form data before submitting
    const systemInfo = {
      version: '1.0.0',
      build: '2024.01.15',
      platform: 'Electron',
      userAgent: navigator.userAgent
    };
    
    // Create a hidden input for system info
    const formElement = e.currentTarget;
    const systemInfoInput = document.createElement('input');
    systemInfoInput.type = 'hidden';
    systemInfoInput.name = 'systemInfo';
    systemInfoInput.value = JSON.stringify(systemInfo, null, 2);
    formElement.appendChild(systemInfoInput);
    
    // Submit to Formspree
    await handleFormspreeSubmit(e);
    
    // Clean up the hidden input
    formElement.removeChild(systemInfoInput);
    
    // Reset form on successful submission
    if (state.succeeded) {
      setFormData({
        name: '',
        email: '',
        subject: '',
        description: ''
      });
    }
  };



  // Show success message if form was submitted successfully
  if (state.succeeded) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <CheckCircle className="mr-2 h-6 w-6 text-emerald-400" />
            <h3 className="text-lg font-bold text-emerald-400">
              Thank You!
            </h3>
          </div>
          <p className="text-xs text-slate-300 mb-4">
            Your bug report has been submitted successfully. We'll investigate the issue and get back to you soon.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-purple-500 hover:from-emerald-600 hover:to-purple-600 text-white text-sm font-semibold rounded-md transition-all duration-200 neon-glow-fusion"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Bug Report Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          {/* <h3 className="text-lg font-bold text-gradient-emerald-purple">
            Report a Bug
          </h3> */}
        </div>
        <p className="text-xs text-slate-400">
          Found an issue? Help the product level up by reporting bugs.
        </p>
      </div>

      {/* Bug Report Form */}
      <div className="glass-panel rounded-xl p-4 border border-slate-700/50 neon-glow-fusion">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-md text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="Your name"
                required
              />
              <ValidationError 
                prefix="Name" 
                field="name"
                errors={state.errors}
                className="text-red-400 text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-md text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="your@email.com"
                required
              />
              <ValidationError 
                prefix="Email" 
                field="email"
                errors={state.errors}
                className="text-red-400 text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white">Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-md text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="Brief description of the issue"
                required
              />
              <ValidationError 
                prefix="Subject" 
                field="subject"
                errors={state.errors}
                className="text-red-400 text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-md text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                placeholder="Describe the bug or issue you encountered..."
                required
              />
              <ValidationError 
                prefix="Description" 
                field="description"
                errors={state.errors}
                className="text-red-400 text-xs"
              />
            </div>
          </div>

          {/* Display general form errors */}
          {state.errors && Object.keys(state.errors).length > 0 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-red-400 text-xs">
                There was an error submitting your form. Please try again.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={state.submitting}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-purple-500 hover:from-emerald-600 hover:to-purple-600 text-white text-sm font-semibold rounded-md transition-all duration-200 neon-glow-fusion disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            <span>{state.submitting ? "Submitting..." : "Submit Bug Report"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

