import React, { useState } from 'react';
import SurveyBuilder from '../components/SurveyBuilder'; // Your existing component
import SignupModal from '../components/SignupModal'; // Your existing auth modal

const Sandbox = () => {
  const [showSignup, setShowSignup] = useState(false);

  // This function replaces your normal API "save" call
  const handleFakeSave = (surveyData) => {
    console.log("User created a survey in demo mode:", surveyData);
    
    // Instead of axios.post('/api/surveys'), we open the modal
    setShowSignup(true);
  };

  return (
    <div className="sandbox-mode relative">
      {/* Optional: Add a banner so they know it's a demo */}
      <div className="bg-indigo-600 text-white text-center py-2 text-sm font-bold">
        You are in Live Demo Mode. <span className="opacity-80">Changes are not saved until you login.</span>
      </div>

      {/* Pass a 'isDemo' prop to your builder if needed to hide certain pro features */}
      <SurveyBuilder 
        isDemo={true} 
        onSave={handleFakeSave} 
      />

      {/* The Modal appears only when they try to 'finish' the action */}
      {showSignup && (
        <SignupModal 
          message="Your survey looks great! Create a free account to save and publish it."
          onClose={() => setShowSignup(false)}
        />
      )}
    </div>
  );
};

export default Sandbox;