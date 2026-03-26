import React, { useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FaTimes, FaPlus, FaCalendarAlt, FaRupeeSign, FaMapMarkerAlt,
  FaFileAlt, FaUpload, FaTrash, FaCheckCircle, FaArrowRight, FaArrowLeft,
  FaFilePdf, FaFileImage, FaExclamationCircle
} from 'react-icons/fa';

const DOCUMENT_TYPES = [
  { value: 'authorization_letter', label: 'Authorization Letter', required: true, description: 'Official letter authorizing the campaign' },
  { value: 'budget_breakdown', label: 'Budget Breakdown', required: true, description: 'Detailed breakdown of how funds will be used' },
  { value: 'project_proposal', label: 'Project Proposal', description: 'Detailed project plan and objectives' },
  { value: 'ngo_registration', label: 'NGO / Organization Registration', description: 'Registration certificate of the organization' },
  { value: 'bank_details', label: 'Bank Account Proof', description: 'Bank statement or cancelled cheque' },
  { value: 'other', label: 'Other Supporting Document', description: 'Any other relevant proof or document' },
];

const REQUIRED_DOC_TYPES = ['authorization_letter', 'budget_breakdown'];

const STEPS = ['Basic Info', 'Documentation & Proofs', 'Review & Submit'];

const CreateCampaignModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultEnd = new Date(tomorrow);
  defaultEnd.setDate(defaultEnd.getDate() + 30);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    category: 'infrastructure',
    startDate: tomorrow.toISOString().split('T')[0],
    endDate: defaultEnd.toISOString().split('T')[0],
    location: { address: '' },
    tags: '',
    isUrgent: false,
  });

  const [documents, setDocuments] = useState([]);
  const fileInputRef = useRef(null);
  const [pendingDocType, setPendingDocType] = useState('authorization_letter');

  const categories = [
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'education', label: 'Education' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'environment', label: 'Environment' },
    { value: 'social_welfare', label: 'Social Welfare' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'other', label: 'Other' },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('location.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({ ...prev, location: { ...prev.location, [key]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be under 10MB');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.mimetype || file.type)) {
      toast.error('Only JPG, PNG, WebP, or PDF files are allowed');
      return;
    }

    const docTypeInfo = DOCUMENT_TYPES.find(d => d.value === pendingDocType);
    setDocuments(prev => [...prev, {
      file,
      type: pendingDocType,
      name: docTypeInfo?.label || file.name,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      isPdf: file.type === 'application/pdf',
    }]);

    e.target.value = '';
  };

  const removeDocument = (index) => {
    setDocuments(prev => {
      const updated = [...prev];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const validateStep0 = () => {
    if (!formData.title.trim() || formData.title.length < 5) return 'Title must be at least 5 characters';
    if (!formData.description.trim() || formData.description.length < 20) return 'Description must be at least 20 characters';
    if (!formData.targetAmount || parseFloat(formData.targetAmount) < 1000) return 'Target amount must be at least ₹1,000';
    if (!formData.startDate || !formData.endDate) return 'Start and end dates are required';
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end <= start) return 'End date must be after start date';
    const days = (end - start) / (1000 * 60 * 60 * 24);
    if (days < 7) return 'Campaign must run for at least 7 days';
    return null;
  };

  const validateStep1 = () => {
    const uploadedTypes = documents.map(d => d.type);
    const missing = REQUIRED_DOC_TYPES.filter(t => !uploadedTypes.includes(t));
    if (missing.length > 0) {
      const labels = missing.map(t => DOCUMENT_TYPES.find(d => d.value === t)?.label).join(' and ');
      return `Required documents missing: ${labels}`;
    }
    if (documents.length < 2) return 'Please upload at least 2 documents';
    return null;
  };

  const goNext = () => {
    if (step === 0) {
      const err = validateStep0();
      if (err) { toast.error(err); return; }
    }
    if (step === 1) {
      const err = validateStep1();
      if (err) { toast.error(err); return; }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    const err0 = validateStep0();
    const err1 = validateStep1();
    if (err0 || err1) { toast.error(err0 || err1); return; }

    try {
      setLoading(true);
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('description', formData.description.trim());
      data.append('targetAmount', formData.targetAmount);
      data.append('category', formData.category);
      data.append('startDate', formData.startDate);
      data.append('endDate', formData.endDate);
      data.append('location', JSON.stringify(formData.location));
      data.append('tags', formData.tags);
      data.append('isUrgent', formData.isUrgent);

      documents.forEach((doc, i) => {
        data.append('documents', doc.file);
        data.append('documentTypes', doc.type);
        data.append('documentNames', doc.name);
      });

      await axios.post('/fundraising/campaigns', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Campaign submitted for review. It will go live once approved.');
      onSuccess();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const uploadedTypes = documents.map(d => d.type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FaPlus className="mr-2 text-blue-500" />
              Create New Campaign
            </h2>
            <p className="text-sm text-gray-500 mt-1">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center px-6 pt-4 pb-2">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                  ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i < step ? <FaCheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-xs mt-1 ${i === step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {/* STEP 0: Basic Info */}
          {step === 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title *</label>
                <input
                  type="text" name="title" value={formData.title} onChange={handleInputChange}
                  placeholder="Enter campaign title" maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-400">{formData.title.length}/200</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  name="description" value={formData.description} onChange={handleInputChange}
                  placeholder="Describe the campaign, its goals, and why it matters..." rows={4} maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="mt-1 text-xs text-gray-400">{formData.description.length}/2000</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount * <FaRupeeSign className="inline text-xs" /></label>
                  <input
                    type="number" name="targetAmount" value={formData.targetAmount} onChange={handleInputChange}
                    placeholder="10000" min="1000" step="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.targetAmount && (
                    <p className="mt-1 text-xs text-green-600">Goal: {formatCurrency(formData.targetAmount)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select name="category" value={formData.category} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date * <FaCalendarAlt className="inline text-xs" /></label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date * <FaCalendarAlt className="inline text-xs" /></label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange}
                    min={formData.startDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>

              {formData.startDate && formData.endDate && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  Duration: {Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))} days
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location <FaMapMarkerAlt className="inline text-xs" /></label>
                <input type="text" name="location.address" value={formData.location.address} onChange={handleInputChange}
                  placeholder="Enter project location (optional)" maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input type="text" name="tags" value={formData.tags} onChange={handleInputChange}
                  placeholder="roads, safety, community (comma separated)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div className="flex items-center">
                <input type="checkbox" name="isUrgent" checked={formData.isUrgent} onChange={handleInputChange}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                <label className="ml-2 text-sm text-gray-700">Mark as urgent campaign</label>
              </div>
            </>
          )}

          {/* STEP 1: Documentation */}
          {step === 1 && (
            <>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <FaExclamationCircle className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Documentation Required</p>
                  <p>To ensure transparency and accountability, campaigns require official documentation before going live. Marked items (<span className="text-red-600">*</span>) are mandatory.</p>
                </div>
              </div>

              {/* Required docs checklist */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Required Documents</p>
                {DOCUMENT_TYPES.filter(d => d.required).map(docType => {
                  const uploaded = uploadedTypes.includes(docType.value);
                  return (
                    <div key={docType.value} className={`flex items-center justify-between p-3 rounded-lg border ${uploaded ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-center gap-2">
                        {uploaded
                          ? <FaCheckCircle className="text-green-500" />
                          : <FaExclamationCircle className="text-red-400" />}
                        <div>
                          <p className="text-sm font-medium text-gray-800">{docType.label} <span className="text-red-500">*</span></p>
                          <p className="text-xs text-gray-500">{docType.description}</p>
                        </div>
                      </div>
                      {uploaded && <span className="text-xs text-green-600 font-medium">Uploaded</span>}
                    </div>
                  );
                })}
              </div>

              {/* Upload section */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Upload Document</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Document Type</label>
                    <select value={pendingDocType} onChange={e => setPendingDocType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                      {DOCUMENT_TYPES.map(d => (
                        <option key={d.value} value={d.value}>{d.label}{d.required ? ' *' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm">
                      <FaUpload size={12} /> Choose File
                    </button>
                    <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileSelect} className="hidden" />
                  </div>
                </div>
                <p className="text-xs text-gray-400">Accepted: JPG, PNG, WebP, PDF — Max 10MB per file</p>
              </div>

              {/* Uploaded documents list */}
              {documents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Uploaded Documents ({documents.length})</p>
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        {doc.isPdf
                          ? <FaFilePdf className="text-red-500 text-xl flex-shrink-0" />
                          : doc.preview
                            ? <img src={doc.preview} alt="" className="w-10 h-10 object-cover rounded" />
                            : <FaFileImage className="text-blue-500 text-xl flex-shrink-0" />}
                        <div>
                          <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                          <p className="text-xs text-gray-500">{DOCUMENT_TYPES.find(d => d.value === doc.type)?.label}</p>
                        </div>
                      </div>
                      <button onClick={() => removeDocument(i)} className="text-red-400 hover:text-red-600 p-1">
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* STEP 2: Review */}
          {step === 2 && (
            <>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <p className="font-semibold mb-1">Review Before Submitting</p>
                <p>The campaign will be created in <span className="font-semibold">pending review</span> status. It will go live only after document verification.</p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Title</p>
                    <p className="font-medium text-gray-900 mt-0.5">{formData.title}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Category</p>
                    <p className="font-medium text-gray-900 mt-0.5 capitalize">{formData.category.replace('_', ' ')}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Target Amount</p>
                    <p className="font-medium text-gray-900 mt-0.5">{formatCurrency(formData.targetAmount)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Duration</p>
                    <p className="font-medium text-gray-900 mt-0.5">
                      {formData.startDate} → {formData.endDate}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="text-gray-500 text-xs mb-1">Description</p>
                  <p className="text-gray-800">{formData.description}</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="text-gray-500 text-xs mb-2">Documents Attached ({documents.length})</p>
                  <div className="space-y-1">
                    {documents.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-700">
                        {doc.isPdf ? <FaFilePdf className="text-red-400" /> : <FaFileImage className="text-blue-400" />}
                        <span>{doc.name}</span>
                        <span className="text-gray-400 text-xs">({DOCUMENT_TYPES.find(d => d.value === doc.type)?.label})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {formData.isUrgent && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                    Marked as Urgent Campaign
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            {step === 0 ? <><FaTimes size={14} /> Cancel</> : <><FaArrowLeft size={14} /> Back</>}
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              Next <FaArrowRight size={14} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><FaFileAlt size={14} /> Submit for Review</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignModal;
