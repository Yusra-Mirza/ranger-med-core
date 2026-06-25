/**
 * Symptom Checker Page - MorphSync Med-Station
 * Operation Overdrive Medical Analysis System
 * AI-powered symptom analysis and condition suggestions
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SymptomChecker.css';
import axiosInstance from '../../api/axiosInstance';

function SymptomChecker() {
  const navigate = useNavigate();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customDescription, setCustomDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  // Comprehensive symptom categories
  const symptomCategories = {
    'General': [
      { id: 'fatigue', name: 'Fatigue/Tiredness', severity: 'common' },
      { id: 'fever', name: 'Fever', severity: 'moderate' },
      { id: 'chills', name: 'Chills', severity: 'moderate' },
      { id: 'weakness', name: 'General Weakness', severity: 'common' },
      { id: 'sweating', name: 'Night Sweats', severity: 'common' },
      { id: 'weight-loss', name: 'Unexplained Weight Loss', severity: 'serious' }
    ],
    'Head & Neurological': [
      { id: 'headache', name: 'Headache', severity: 'common' },
      { id: 'migraine', name: 'Migraine', severity: 'moderate' },
      { id: 'dizziness', name: 'Dizziness', severity: 'moderate' },
      { id: 'vertigo', name: 'Vertigo', severity: 'moderate' },
      { id: 'confusion', name: 'Confusion', severity: 'serious' },
      { id: 'memory-loss', name: 'Memory Loss', severity: 'serious' }
    ],
    'Respiratory': [
      { id: 'cough', name: 'Cough', severity: 'common' },
      { id: 'shortness-breath', name: 'Shortness of Breath', severity: 'serious' },
      { id: 'wheezing', name: 'Wheezing', severity: 'moderate' },
      { id: 'chest-pain', name: 'Chest Pain', severity: 'serious' },
      { id: 'sore-throat', name: 'Sore Throat', severity: 'common' },
      { id: 'runny-nose', name: 'Runny Nose', severity: 'common' }
    ],
    'Musculoskeletal': [
      { id: 'muscle-pain', name: 'Muscle Pain', severity: 'common' },
      { id: 'joint-pain', name: 'Joint Pain', severity: 'moderate' },
      { id: 'back-pain', name: 'Back Pain', severity: 'common' },
      { id: 'stiffness', name: 'Stiffness', severity: 'common' },
      { id: 'swelling', name: 'Swelling', severity: 'moderate' },
      { id: 'numbness', name: 'Numbness/Tingling', severity: 'moderate' }
    ],
    'Digestive': [
      { id: 'nausea', name: 'Nausea', severity: 'common' },
      { id: 'vomiting', name: 'Vomiting', severity: 'moderate' },
      { id: 'diarrhea', name: 'Diarrhea', severity: 'moderate' },
      { id: 'constipation', name: 'Constipation', severity: 'common' },
      { id: 'abdominal-pain', name: 'Abdominal Pain', severity: 'moderate' },
      { id: 'bloating', name: 'Bloating', severity: 'common' }
    ],
    'Skin': [
      { id: 'rash', name: 'Rash', severity: 'moderate' },
      { id: 'itching', name: 'Itching', severity: 'common' },
      { id: 'redness', name: 'Redness', severity: 'common' },
      { id: 'swelling-skin', name: 'Swelling', severity: 'moderate' },
      { id: 'bruising', name: 'Easy Bruising', severity: 'moderate' },
      { id: 'lesions', name: 'Skin Lesions', severity: 'serious' }
    ]
  };

  const handleSymptomToggle = (symptomId) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
    setAnalysisComplete(false);
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0 && !customDescription.trim()) {
      alert('Please select at least one symptom or describe your symptoms');
      return;
    }

    setAnalyzing(true);

    try {
      // 1. Map the selected checkbox IDs to the format our backend expects
      const symptomsPayload = selectedSymptoms.map(id => {
        const details = Object.values(symptomCategories)
          .flat()
          .find(s => s.id === id);
          
        return {
          name: details ? details.name : id,
          severity: details && details.severity === 'serious' ? 'severe' :
                    details && details.severity === 'moderate' ? 'moderate' : 'mild',
          duration: "recent",
          bodyPart: "General"
        };
      });

      // 2. If no checkboxes were ticked but description is typed, provide a dummy symptom to pass backend validation
      if (symptomsPayload.length === 0 && customDescription.trim()) {
        symptomsPayload.push({
          name: customDescription.trim().slice(0, 50),
          severity: "moderate",
          duration: "recent",
          bodyPart: "General"
        });
      }

      // 3. Combine checkboxes with custom typed description
      const checkboxesText = selectedSymptoms.map(id => {
        const details = Object.values(symptomCategories).flat().find(s => s.id === id);
        return details ? details.name : id;
      }).join(", ");

      let finalDescription = "";
      if (customDescription.trim()) {
        finalDescription = `User description: "${customDescription.trim()}". ${checkboxesText ? `Selected checkboxes: ${checkboxesText}.` : ""}`;
      } else {
        finalDescription = checkboxesText;
      }

      // 4. Call our real backend API (which calls Google Gemini!)
      const response = await axiosInstance.post("/symptom-analysis/analyze", {
        symptoms: symptomsPayload,
        customPromptText: finalDescription, // send description
        age: 25, // test age
        gender: "other"
      });

      const realAnalysis = response.data.analysis;

      // 5. Frontend Adaptor: Map backend fields to match what the UI expects
      const uiResults = {
        riskLevel: realAnalysis.possibleConditions[0]?.severity === 'high' ? 'high' :
                   realAnalysis.possibleConditions[0]?.severity === 'medium' ? 'moderate' : 'low',
        possibleConditions: realAnalysis.possibleConditions.map(cond => ({
          name: cond.name,
          probability: cond.probability || 85,
          description: cond.description,
          recommendations: realAnalysis.recommendations || []
        })),
        urgencyLevel: realAnalysis.urgencyLevel === 'emergency' || realAnalysis.urgencyLevel === 'urgent' ? 'urgent' :
                      realAnalysis.urgencyLevel === 'soon' ? 'soon' : 'routine',
        nextSteps: realAnalysis.selfCareAdvice || [],
        doctorConsultation: response.data.followUpRequired ? 'recommended' : 'optional'
      };

      // 6. Save to React state to draw on the screen
      setAnalysisResults(uiResults);
      setAnalysisComplete(true);

    } catch (err) {
      console.error("AI Analysis failed:", err);
      alert(err.response?.data?.message || "Failed to analyze symptoms using Gemini AI.");
    } finally {
      setAnalyzing(false);
    }
  };

  const generateAnalysis = (symptoms) => {
    // Mock AI analysis results
    return {
      riskLevel: symptoms.length > 5 ? 'high' : symptoms.length > 2 ? 'moderate' : 'low',
      possibleConditions: [
        {
          name: 'Overdrive Energy Depletion',
          probability: 75,
          description: 'Common condition among Rangers after extended missions',
          severity: 'moderate',
          recommendations: [
            'Rest for 24-48 hours',
            'Increase fluid intake',
            'Monitor Morphin Grid connection',
            'Schedule check-up with Dr. Hartford'
          ]
        },
        {
          name: 'Morphin Grid Stress Response',
          probability: 60,
          description: 'Physiological reaction to intense morphing sequences',
          severity: 'mild',
          recommendations: [
            'Practice meditation and relaxation',
            'Reduce morphing frequency',
            'Consult with Zordon about grid stabilization',
            'Monitor vital signs daily'
          ]
        },
        {
          name: 'Combat-Related Strain',
          probability: 45,
          description: 'Physical stress from battle and training',
          severity: 'mild',
          recommendations: [
            'Physical therapy sessions',
            'Adjust training intensity',
            'Apply ice to affected areas',
            'Take prescribed Zord Energy supplements'
          ]
        }
      ],
      urgencyLevel: symptoms.length > 5 ? 'urgent' : symptoms.length > 3 ? 'soon' : 'routine',
      nextSteps: [
        'Monitor symptoms for the next 24 hours',
        'Log any changes in the Symptom Tracker',
        'Maintain adequate hydration and rest',
        'Avoid strenuous missions until symptoms improve'
      ],
      doctorConsultation: symptoms.length > 4 ? 'recommended' : 'optional'
    };
  };

  const getSeverityColor = (severity) => {
    const colors = {
      common: '#00ff00',
      moderate: '#ffcc00',
      serious: '#ff0000'
    };
    return colors[severity] || '#00ffff';
  };

  const getRiskColor = (risk) => {
    const colors = {
      low: '#00ff00',
      moderate: '#ffcc00',
      high: '#ff0000'
    };
    return colors[risk] || '#00ffff';
  };

  const handleConnectToDoctor = () => {
    navigate('/appointments');
  };

  return (
    <div className="symptom-checker-page">
      {/* Background */}
      <div className="space-background"></div>
      <div className="stars"></div>
      <div className="stars2"></div>
      <div className="stars3"></div>

      {/* Header */}
      <div className="checker-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <div className="header-content">
          <h1>🔬 SYMPTOM CHECKER</h1>
          <p>OPERATION OVERDRIVE - AI MEDICAL ANALYSIS SYSTEM</p>
        </div>
      </div>

      <div className="checker-container">
        {/* Symptom Selection */}
        <div className="selection-section">
          <div className="section-header">
            <h2>Select Your Symptoms</h2>
            <div className="selected-count">
              {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} selected
            </div>
          </div>

          <div className="symptom-categories">
            {Object.entries(symptomCategories).map(([category, symptoms]) => (
              <div key={category} className="symptom-category">
                <h3 className="category-title">{category}</h3>
                <div className="symptom-grid">
                  {symptoms.map(symptom => (
                    <button
                      key={symptom.id}
                      className={`symptom-btn ${selectedSymptoms.includes(symptom.id) ? 'selected' : ''}`}
                      onClick={() => handleSymptomToggle(symptom.id)}
                      style={{
                        borderColor: selectedSymptoms.includes(symptom.id) 
                          ? getSeverityColor(symptom.severity)
                          : 'rgba(0, 255, 255, 0.3)'
                      }}
                    >
                      <span className="symptom-name">{symptom.name}</span>
                      {selectedSymptoms.includes(symptom.id) && (
                        <span className="check-icon">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Description Textarea */}
          <div className="custom-description-section" style={{ marginTop: '20px', marginBottom: '20px' }}>
            <h3 className="category-title" style={{ fontSize: '1.2rem', color: '#ff8800', fontFamily: 'Orbitron, sans-serif', marginBottom: '10px' }}>Describe Symptoms in Your Own Words</h3>
            <textarea
              className="cyber-textarea"
              placeholder="Or describe how you feel in detail (e.g. 'I have a throbbing headache, feeling dizzy and a bit nauseous since morning training session')..."
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                backgroundColor: 'rgba(26, 31, 58, 0.6)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '8px',
                color: '#fff',
                padding: '12px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'none',
                outline: 'none',
                boxShadow: 'inset 0 0 10px rgba(0, 255, 255, 0.1)'
              }}
            />
          </div>

          <div className="action-section">
            <button 
              className="analyze-btn"
              onClick={handleAnalyze}
              disabled={(selectedSymptoms.length === 0 && !customDescription.trim()) || analyzing}
            >
              {analyzing ? (
                <>
                  <span className="spinner"></span>
                  <span>ANALYZING...</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">🔬</span>
                  <span>ANALYZE SYMPTOMS</span>
                </>
              )}
            </button>
            <button 
              className="clear-btn"
              onClick={() => {
                setSelectedSymptoms([]);
                setCustomDescription('');
                setAnalysisComplete(false);
                setAnalysisResults(null);
              }}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Analysis Results */}
        {analysisComplete && analysisResults && (
          <div className="results-section">
            <div className="results-header">
              <h2>🔍 ANALYSIS RESULTS</h2>
              <div 
                className="risk-badge"
                style={{
                  backgroundColor: getRiskColor(analysisResults.riskLevel) + '20',
                  borderColor: getRiskColor(analysisResults.riskLevel),
                  color: getRiskColor(analysisResults.riskLevel)
                }}
              >
                {analysisResults.riskLevel.toUpperCase()} RISK
              </div>
            </div>

            {/* Possible Conditions */}
            <div className="conditions-section">
              <h3>Possible Conditions</h3>
              <div className="conditions-list">
                {analysisResults.possibleConditions.map((condition, index) => (
                  <div key={index} className="condition-card">
                    <div className="condition-header">
                      <div className="condition-info">
                        <h4>{condition.name}</h4>
                        <p className="condition-desc">{condition.description}</p>
                      </div>
                      <div className="probability-circle">
                        <svg viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,255,255,0.1)" strokeWidth="8" />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="45" 
                            fill="none" 
                            stroke="#00ffff" 
                            strokeWidth="8"
                            strokeDasharray={`${condition.probability * 2.827} 282.7`}
                            strokeDashoffset="70.675"
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div className="probability-text">{condition.probability}%</div>
                      </div>
                    </div>
                    <div className="recommendations">
                      <strong>Recommendations:</strong>
                      <ul>
                        {condition.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="next-steps-section">
              <h3>📋 Next Steps</h3>
              <div className="steps-list">
                {analysisResults.nextSteps.map((step, index) => (
                  <div key={index} className="step-item">
                    <span className="step-number">{index + 1}</span>
                    <span className="step-text">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor Consultation */}
            {analysisResults.doctorConsultation === 'recommended' && (
              <div className="doctor-consultation-alert">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <h4>Medical Consultation Recommended</h4>
                  <p>Based on your symptoms, we recommend scheduling an appointment with a medical professional.</p>
                  <button className="connect-doctor-btn" onClick={handleConnectToDoctor}>
                    📅 Schedule Appointment
                  </button>
                </div>
              </div>
            )}

            {/* Urgency Indicator */}
            <div className={`urgency-indicator urgency-${analysisResults.urgencyLevel}`}>
              <span className="urgency-icon">
                {analysisResults.urgencyLevel === 'urgent' ? '🚨' : 
                 analysisResults.urgencyLevel === 'soon' ? '⚠️' : 'ℹ️'}
              </span>
              <span className="urgency-text">
                {analysisResults.urgencyLevel === 'urgent' 
                  ? 'Seek medical attention within 24 hours'
                  : analysisResults.urgencyLevel === 'soon'
                  ? 'Schedule appointment within 3-5 days'
                  : 'Monitor and log symptoms regularly'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Cockpit Frame */}
      <div className="cockpit-frame"></div>
    </div>
  );
}

export default SymptomChecker;
