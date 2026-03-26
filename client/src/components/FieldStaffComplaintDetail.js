import React, { useState } from 'react';
import { getImageURL } from '../utils/apiConfig';
import {
  FiMapPin, FiCalendar, FiUser, FiImage, FiMessageSquare,
  FiCheckCircle, FiClock, FiXCircle, FiEye, FiEdit3, FiFlag,
  FiActivity, FiCopy, FiPlay, FiCheck, FiNavigation, FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Loaded in its own chunk to avoid leaflet module-level init issues
const TaskLocationMap = React.lazy(() => import('./TaskLocationMap'));

const FieldStaffComplaintDetail = ({ complaint, onClose, onStatusUpdate, onWorkComplete }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCompletingWork, setIsCompletingWork] = useState(false);
  const [showWorkCompletionForm, setShowWorkCompletionForm] = useState(false);
  const [workCompletionNotes, setWorkCompletionNotes] = useState('');
  const [selectedProofImages, setSelectedProofImages] = useState([]);
  const [progressNotes, setProgressNotes] = useState('');
  const [showProgressForm, setShowProgressForm] = useState(false);

  const hasLocation =
    complaint.location?.coordinates?.length >= 2 &&
    (complaint.location.coordinates[0] !== 0 || complaint.location.coordinates[1] !== 0);

  const lat = hasLocation ? complaint.location.coordinates[1] : null;
  const lng = hasLocation ? complaint.location.coordinates[0] : null;

  const getStatusColor = (status) => {
    const c = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      assigned: 'bg-orange-100 text-orange-800 border-orange-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      work_completed: 'bg-purple-100 text-purple-800 border-purple-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return c[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const c = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200',
    };
    return c[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryIcon = (cat) => {
    const icons = {
      road_issues: '🛣️', water_supply: '💧', electricity: '⚡',
      waste_management: '🗑️', public_transport: '🚌', parks_recreation: '🌳',
      street_lighting: '💡', drainage: '🌊', noise_pollution: '🔊',
      air_pollution: '🌫️', safety_security: '🛡️', other: '📋',
    };
    return icons[cat] || '📋';
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const handleStartWork = async () => {
    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(complaint._id, 'in_progress', 'Started working on the complaint');
      toast.success('Work started');
    } catch (e) {
      toast.error(`Failed: ${e.message || 'Unknown error'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!progressNotes.trim()) { toast.error('Please provide progress notes'); return; }
    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(complaint._id, 'in_progress', progressNotes);
      toast.success('Progress updated');
      setProgressNotes('');
      setShowProgressForm(false);
    } catch { toast.error('Failed to update progress'); }
    finally { setIsUpdatingStatus(false); }
  };

  const handleCompleteWork = async () => {
    if (!workCompletionNotes.trim()) { toast.error('Please provide completion notes'); return; }
    setIsCompletingWork(true);
    try {
      await onWorkComplete(complaint._id, workCompletionNotes, selectedProofImages);
      toast.success('Work completed');
      setWorkCompletionNotes('');
      setSelectedProofImages([]);
      setShowWorkCompletionForm(false);
    } catch { toast.error('Failed to complete work'); }
    finally { setIsCompletingWork(false); }
  };

  const openGoogleMapsNav = () => {
    if (!hasLocation) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const copyCoords = () => {
    if (!hasLocation) return;
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    toast.success('Coordinates copied');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 overflow-y-auto">
      {/* Full-width panel — no side margins */}
      <div className="relative w-full min-h-screen bg-white md:min-h-0 md:max-w-4xl md:mx-auto md:my-6 md:rounded-2xl md:shadow-2xl overflow-hidden">

        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0">{getCategoryIcon(complaint.category)}</span>
            <div className="min-w-0">
              <h2 className="text-base md:text-xl font-bold text-gray-900 truncate leading-tight">
                {complaint.title}
              </h2>
              <p className="text-xs text-gray-400 font-mono">{complaint.complaintId}</p>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 ml-3 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <FiXCircle className="h-6 w-6" />
          </button>
        </div>

        {/* ── Badges ── */}
        <div className="flex flex-wrap gap-2 px-4 pt-4 md:px-6">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(complaint.status)}`}>
            <FiClock className="h-3.5 w-3.5" />
            {complaint.status.replace(/_/g, ' ')}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(complaint.priority)}`}>
            <FiFlag className="h-3.5 w-3.5" />
            {complaint.priority} priority
          </span>
        </div>

        {/* ── Map Section (full-width, prominent) ── */}
        <div className="mt-4 mx-0">
          {hasLocation ? (
            <div className="relative">
              <React.Suspense fallback={<div style={{ height: '260px' }} className="w-full bg-gray-100 flex items-center justify-center text-sm text-gray-500">Loading map...</div>}>
                <TaskLocationMap lat={lat} lng={lng} title={complaint.title} address={complaint.address} />
              </React.Suspense>

              {/* Navigate button overlaid on map */}
              <button
                onClick={openGoogleMapsNav}
                className="absolute bottom-3 right-3 z-[1000] flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-colors"
              >
                <FiNavigation className="h-4 w-4" />
                Navigate
              </button>
            </div>
          ) : (
            <div className="mx-4 md:mx-6 h-32 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex flex-col items-center justify-center gap-2">
              <FiMapPin className="h-7 w-7 text-gray-400" />
              <p className="text-sm text-gray-500">Location not available</p>
            </div>
          )}
        </div>

        {/* ── Address + quick actions ── */}
        {hasLocation && (
          <div className="flex items-start justify-between gap-3 px-4 py-3 md:px-6 bg-gray-50 border-b border-gray-100">
            <div className="flex items-start gap-2 min-w-0">
              <FiMapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{complaint.address}</p>
                <p className="text-xs text-gray-500">{complaint.city}{complaint.pincode ? ` – ${complaint.pincode}` : ''}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{lat?.toFixed(5)}, {lng?.toFixed(5)}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={copyCoords}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
              >
                <FiCopy className="h-3.5 w-3.5" />
                Copy
              </button>
              <button
                onClick={openGoogleMapsNav}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiExternalLink className="h-3.5 w-3.5" />
                Maps
              </button>
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <div className="px-4 py-4 md:px-6 space-y-4">

          {/* Description */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FiMessageSquare className="h-4 w-4 text-blue-500" /> Description
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {/* Reporter */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
              <FiUser className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Reported by</p>
              <p className="text-sm font-semibold text-gray-900">{complaint.citizenName}</p>
              {!complaint.isAnonymous && <p className="text-xs text-gray-500">{complaint.citizenEmail}</p>}
              {complaint.isAnonymous && <p className="text-xs text-gray-400 italic">Anonymous</p>}
            </div>
          </div>

          {/* Images */}
          {complaint.images?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FiImage className="h-4 w-4 text-green-500" /> Photos ({complaint.images.length})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {complaint.images.map((img, i) => (
                  <div key={i} className="relative cursor-pointer group rounded-lg overflow-hidden aspect-square"
                    onClick={() => setSelectedImage(img)}>
                    <img src={getImageURL(img.url)} alt={`img-${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-25 transition-all flex items-center justify-center">
                      <FiEye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work Proof Images */}
          {complaint.workProofImages?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FiCheckCircle className="h-4 w-4 text-green-500" /> Work Proof ({complaint.workProofImages.length})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {complaint.workProofImages.map((img, i) => (
                  <div key={i} className="relative cursor-pointer group rounded-lg overflow-hidden aspect-square"
                    onClick={() => setSelectedImage(img)}>
                    <img src={getImageURL(img.url)} alt={`proof-${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-25 transition-all flex items-center justify-center">
                      <FiEye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work Completion Notes */}
          {complaint.workCompletionNotes && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                <FiCheckCircle className="h-4 w-4" /> Completion Notes
              </h3>
              <p className="text-green-800 text-sm leading-relaxed">{complaint.workCompletionNotes}</p>
              {complaint.workCompletedAt && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <FiCalendar className="h-3 w-3" /> {formatDate(complaint.workCompletedAt)}
                </p>
              )}
            </div>
          )}

          {/* Activity Timeline */}
          {complaint.adminNotes?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FiActivity className="h-4 w-4 text-purple-500" /> Activity
              </h3>
              <div className="space-y-3">
                {complaint.adminNotes.map((note, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <FiUser className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-sm text-gray-800">{note.note}</p>
                      <p className="text-xs text-gray-400 mt-1">{note.addedBy?.name} · {formatDate(note.addedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Action Buttons ── */}
          <div className="pt-2 pb-6 space-y-3">
            {complaint.status === 'assigned' && (
              <button onClick={handleStartWork} disabled={isUpdatingStatus}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                <FiPlay className="h-5 w-5" />
                {isUpdatingStatus ? 'Starting...' : 'Start Work'}
              </button>
            )}

            {complaint.status === 'in_progress' && (
              <>
                <button onClick={() => setShowProgressForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors">
                  <FiEdit3 className="h-5 w-5" /> Update Progress
                </button>
                <button onClick={() => setShowWorkCompletionForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
                  <FiCheck className="h-5 w-5" /> Complete Work
                </button>
              </>
            )}

            {complaint.status === 'work_completed' && (
              <div className="text-center py-4 bg-purple-50 border border-purple-200 rounded-xl">
                <FiCheckCircle className="h-8 w-8 text-purple-500 mx-auto mb-1" />
                <p className="text-sm font-semibold text-purple-800">Work Submitted</p>
                <p className="text-xs text-purple-500">Awaiting admin approval</p>
              </div>
            )}

            {complaint.status === 'resolved' && (
              <div className="text-center py-4 bg-green-50 border border-green-200 rounded-xl">
                <FiCheckCircle className="h-8 w-8 text-green-500 mx-auto mb-1" />
                <p className="text-sm font-semibold text-green-800">Resolved</p>
                <p className="text-xs text-green-500">Admin approved your work</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Progress Form Modal ── */}
      {showProgressForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end md:items-center justify-center z-[60] p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Update Progress</h3>
            <textarea value={progressNotes} onChange={(e) => setProgressNotes(e.target.value)}
              rows={4} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the progress made..." />
            <div className="flex gap-3">
              <button onClick={() => setShowProgressForm(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleUpdateProgress} disabled={isUpdatingStatus}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {isUpdatingStatus ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Work Completion Modal ── */}
      {showWorkCompletionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end md:items-center justify-center z-[60] p-0 md:p-4">
          <div className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Complete Work</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Completion Notes *</label>
              <textarea value={workCompletionNotes} onChange={(e) => setWorkCompletionNotes(e.target.value)}
                rows={4} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Describe what was done, materials used, time taken..." />
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Proof Images (optional)</label>
              <input type="file" multiple accept="image/*" onChange={(e) => setSelectedProofImages(Array.from(e.target.files))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" />
              {selectedProofImages.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">{selectedProofImages.length} file(s) selected</p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowWorkCompletionForm(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleCompleteWork} disabled={isCompletingWork}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                {isCompletingWork ? 'Submitting...' : 'Complete Work'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Lightbox ── */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[70] p-4"
          onClick={() => setSelectedImage(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300">
            <FiXCircle className="h-9 w-9" />
          </button>
          <img src={getImageURL(selectedImage.url)} alt="Full view"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default FieldStaffComplaintDetail;
