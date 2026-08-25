'use client';

import { useState, useEffect, useMemo } from 'react';
import SystemShell from '../../components/SystemShell';
import { INITIAL_MONTHLY_CAMPAIGNS } from '../../lib/mediaMonthlyData';
import CampaignWizardStepper from '../../components/media/CampaignWizardStepper';
import Step1MonthSetup from '../../components/media/steps/Step1MonthSetup';
import Step2ContentSchedule from '../../components/media/steps/Step2ContentSchedule';
import Step3DirectorScriptStudio from '../../components/media/steps/Step3DirectorScriptStudio';
import Step4PlatformCopy from '../../components/media/steps/Step4PlatformCopy';
import Step5VideographerCallSheet from '../../components/media/steps/Step5VideographerCallSheet';
import NewMonthModal from '../../components/media/NewMonthModal';
import NewConceptModal from '../../components/media/NewConceptModal';

const CAMPAIGNS_STORAGE_KEY = 'daralhay.social_media_campaigns_v4';
const ACTIVE_MONTH_STORAGE_KEY = 'daralhay.social_media_active_month_v4';

export default function MediaCornerPage() {
  const [campaigns, setCampaigns] = useState({});
  const [selectedMonthId, setSelectedMonthId] = useState('2026-08');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedConceptId, setSelectedConceptId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
  const [isNewConceptModalOpen, setIsNewConceptModalOpen] = useState(false);
  const [newConceptInitialData, setNewConceptInitialData] = useState(null);

  // Load state from localStorage or default
  useEffect(() => {
    try {
      const storedCampaigns = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
      const storedActiveMonth = localStorage.getItem(ACTIVE_MONTH_STORAGE_KEY);

      if (storedCampaigns) {
        const parsed = JSON.parse(storedCampaigns);
        setCampaigns(parsed);
        if (storedActiveMonth && parsed[storedActiveMonth]) {
          setSelectedMonthId(storedActiveMonth);
        } else {
          setSelectedMonthId(Object.keys(parsed)[0] || '2026-08');
        }
      } else {
        setCampaigns(INITIAL_MONTHLY_CAMPAIGNS);
        localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(INITIAL_MONTHLY_CAMPAIGNS));
        setSelectedMonthId('2026-08');
      }
    } catch {
      setCampaigns(INITIAL_MONTHLY_CAMPAIGNS);
      setSelectedMonthId('2026-08');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCampaigns = (newCampaigns) => {
    setCampaigns(newCampaigns);
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(newCampaigns));
  };

  const handleResetCampaign = () => {
    if (!window.confirm('Reset all campaigns to master template (12 posts/month)?')) return;
    setCampaigns(INITIAL_MONTHLY_CAMPAIGNS);
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(INITIAL_MONTHLY_CAMPAIGNS));
    setSelectedMonthId('2026-08');
    setSelectedConceptId(null);
    setCurrentStep(1);
  };

  const handleSelectMonth = (monthId) => {
    setSelectedMonthId(monthId);
    localStorage.setItem(ACTIVE_MONTH_STORAGE_KEY, monthId);
    setSelectedConceptId(null);
  };

  const activeCampaign = campaigns[selectedMonthId] || INITIAL_MONTHLY_CAMPAIGNS['2026-08'] || {};
  const currentConcepts = activeCampaign.concepts || [];

  const availableMonths = useMemo(() => {
    return Object.values(campaigns).map((c) => ({
      monthId: c.monthId,
      monthName: c.monthName,
    })).sort((a, b) => a.monthId.localeCompare(b.monthId));
  }, [campaigns]);

  // Update Campaign Level properties (Theme, Goal, KPIs)
  const handleUpdateCampaignSetup = (setupData) => {
    const updatedCampaign = { ...activeCampaign, ...setupData };
    const updatedCampaigns = { ...campaigns, [selectedMonthId]: updatedCampaign };
    saveCampaigns(updatedCampaigns);
  };

  // Update or Save a Concept Script / Copy
  const handleSaveConcept = (conceptData) => {
    const exists = currentConcepts.some((c) => c.id === conceptData.id);
    let updatedConcepts = [];
    if (exists) {
      updatedConcepts = currentConcepts.map((c) => (c.id === conceptData.id ? conceptData : c));
    } else {
      updatedConcepts = [...currentConcepts, conceptData];
    }
    const updatedCampaign = { ...activeCampaign, concepts: updatedConcepts };
    const updatedCampaigns = { ...campaigns, [selectedMonthId]: updatedCampaign };
    saveCampaigns(updatedCampaigns);
    setSelectedConceptId(conceptData.id);
    setIsNewConceptModalOpen(false);
  };

  // Create Brand New Month
  const handleCreateNewMonth = (newMonthData) => {
    let newConcepts = [];
    if (newMonthData.cloneFromMonthId && newMonthData.cloneFromMonthId !== 'none' && campaigns[newMonthData.cloneFromMonthId]) {
      const sourceConcepts = campaigns[newMonthData.cloneFromMonthId].concepts || [];
      newConcepts = sourceConcepts.map((c, idx) => ({
        ...c,
        id: Date.now() + idx,
        status: 'idea',
      }));
    }

    const newCampaign = {
      monthId: newMonthData.monthId,
      monthName: newMonthData.monthName,
      themeTitle: newMonthData.themeTitle,
      strategicGoal: newMonthData.strategicGoal,
      targetKpi: newMonthData.targetKpi,
      pillarDistribution: { pillar_authority: 20, pillar_engineering: 25, pillar_workshop: 20, pillar_projects: 20, pillar_leadgen: 15 },
      concepts: newConcepts,
    };

    const updatedCampaigns = { ...campaigns, [newMonthData.monthId]: newCampaign };
    saveCampaigns(updatedCampaigns);
    setSelectedMonthId(newMonthData.monthId);
    setSelectedConceptId(null);
    setCurrentStep(1);
    setIsNewMonthModalOpen(false);
  };

  // Delete a concept from current campaign
  const handleDeleteConcept = (conceptId) => {
    if (!window.confirm('Delete this content package from the campaign?')) return;
    const updatedConcepts = currentConcepts.filter((c) => c.id !== conceptId);
    const updatedCampaign = { ...activeCampaign, concepts: updatedConcepts };
    const updatedCampaigns = { ...campaigns, [selectedMonthId]: updatedCampaign };
    saveCampaigns(updatedCampaigns);
    if (selectedConceptId === conceptId) {
      setSelectedConceptId(updatedConcepts[0]?.id || null);
    }
  };

  // Trigger from Step 2 directly to Step 3
  const handleSelectConceptToScript = (concept) => {
    setSelectedConceptId(concept.id);
    setCurrentStep(3);
  };

  const handleOpenAddConceptModal = (initialData = null) => {
    setNewConceptInitialData(initialData);
    setIsNewConceptModalOpen(true);
  };

  return (
    <SystemShell
      activePath="/media"
      eyebrow="Dar Al Hay Media & Creative"
      title="Campaign Studio & Videographer Hand-Off"
      description="5-step guided wizard: set monthly strategy, organize weekly releases, write director scripts, and export call sheets for your videographer."
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Stepper Header with Month Selector */}
        <CampaignWizardStepper
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          availableMonths={availableMonths}
          selectedMonthId={selectedMonthId}
          onSelectMonth={handleSelectMonth}
          onOpenNewMonthModal={() => setIsNewMonthModalOpen(true)}
          onResetCampaign={handleResetCampaign}
        />

        {/* STEP 1: MONTH SETUP */}
        {currentStep === 1 && (
          <Step1MonthSetup
            campaign={activeCampaign}
            onUpdateCampaign={handleUpdateCampaignSetup}
            onNextStep={() => setCurrentStep(2)}
          />
        )}

        {/* STEP 2: 4-WEEK SCHEDULE */}
        {currentStep === 2 && (
          <Step2ContentSchedule
            campaign={activeCampaign}
            onSelectConceptToScript={handleSelectConceptToScript}
            onAddNewConcept={handleOpenAddConceptModal}
            onDeleteConcept={handleDeleteConcept}
            onPrevStep={() => setCurrentStep(1)}
            onNextStep={() => setCurrentStep(3)}
          />
        )}

        {/* STEP 3: DIRECTOR'S SCRIPT STUDIO */}
        {currentStep === 3 && (
          <Step3DirectorScriptStudio
            campaign={activeCampaign}
            selectedConceptId={selectedConceptId}
            onSelectConcept={setSelectedConceptId}
            onSaveConceptScript={handleSaveConcept}
            onDeleteConcept={handleDeleteConcept}
            onPrevStep={() => setCurrentStep(2)}
            onNextStep={() => setCurrentStep(4)}
            onJumpToCallSheet={() => setCurrentStep(5)}
          />
        )}

        {/* STEP 4: MULTI-PLATFORM COPY */}
        {currentStep === 4 && (
          <Step4PlatformCopy
            campaign={activeCampaign}
            selectedConceptId={selectedConceptId}
            onSelectConcept={setSelectedConceptId}
            onSaveConceptCopy={handleSaveConcept}
            onPrevStep={() => setCurrentStep(3)}
            onNextStep={() => setCurrentStep(5)}
          />
        )}

        {/* STEP 5: VIDEOGRAPHER CALL SHEET */}
        {currentStep === 5 && (
          <Step5VideographerCallSheet
            campaign={activeCampaign}
            selectedConceptId={selectedConceptId}
            onSelectConcept={setSelectedConceptId}
            onPrevStep={() => setCurrentStep(4)}
          />
        )}
      </div>

      {/* New Month Modal */}
      {isNewMonthModalOpen && (
        <NewMonthModal
          availableMonths={availableMonths}
          onSave={handleCreateNewMonth}
          onClose={() => setIsNewMonthModalOpen(false)}
        />
      )}

      {/* New / Edit Concept Modal */}
      {isNewConceptModalOpen && (
        <NewConceptModal
          initialData={newConceptInitialData}
          onSave={handleSaveConcept}
          onClose={() => {
            setIsNewConceptModalOpen(false);
            setNewConceptInitialData(null);
          }}
        />
      )}
    </SystemShell>
  );
}
