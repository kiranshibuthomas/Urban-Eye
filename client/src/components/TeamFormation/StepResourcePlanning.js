import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiTool, FiPackage, FiDollarSign, FiPlus, FiX, FiAlertCircle } from 'react-icons/fi';

const StepResourcePlanning = ({ teamConfig, setTeamConfig }) => {
  const [newEquipment, setNewEquipment] = useState({ equipment: '', quantity: 1, critical: false });
  const [newMaterial, setNewMaterial] = useState({ material: '', quantity: 1, unit: 'kg' });
  const [newSkill, setNewSkill] = useState('');

  const commonSkills = [
    'Electrical Work', 'Plumbing', 'Carpentry', 'Welding', 'Heavy Machinery',
    'First Aid', 'Safety Management', 'Project Management', 'Technical Drawing'
  ];

  const addEquipment = () => {
    if (newEquipment.equipment.trim()) {
      setTeamConfig({
        ...teamConfig,
        requiredEquipment: [...teamConfig.requiredEquipment, newEquipment]
      });
      setNewEquipment({ equipment: '', quantity: 1, critical: false });
    }
  };

  const removeEquipment = (index) => {
    setTeamConfig({
      ...teamConfig,
      requiredEquipment: teamConfig.requiredEquipment.filter((_, i) => i !== index)
    });
  };

  const addMaterial = () => {
    if (newMaterial.material.trim()) {
      setTeamConfig({
        ...teamConfig,
        requiredMaterials: [...teamConfig.requiredMaterials, { ...newMaterial, estimated: true }]
      });
      setNewMaterial({ material: '', quantity: 1, unit: 'kg' });
    }
  };

  const removeMaterial = (index) => {
    setTeamConfig({
      ...teamConfig,
      requiredMaterials: teamConfig.requiredMaterials.filter((_, i) => i !== index)
    });
  };

  const addSkill = (skill) => {
    if (!teamConfig.requiredSkills.includes(skill)) {
      setTeamConfig({
        ...teamConfig,
        requiredSkills: [...teamConfig.requiredSkills, skill]
      });
    }
  };

  const removeSkill = (skill) => {
    setTeamConfig({
      ...teamConfig,
      requiredSkills: teamConfig.requiredSkills.filter(s => s !== skill)
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      {/* Required Skills */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Required Skills
        </label>
        
        {/* Selected Skills */}
        {teamConfig.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {teamConfig.requiredSkills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                <span>{skill}</span>
                <button
                  onClick={() => removeSkill(skill)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <FiX className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        
        {/* Common Skills */}
        <div className="flex flex-wrap gap-2">
          {commonSkills.filter(s => !teamConfig.requiredSkills.includes(s)).map((skill, index) => (
            <button
              key={index}
              onClick={() => addSkill(skill)}
              className="px-3 py-1 border-2 border-gray-200 rounded-full text-sm hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              + {skill}
            </button>
          ))}
        </div>
        
        {/* Custom Skill */}
        <div className="mt-3 flex space-x-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newSkill.trim()) {
                addSkill(newSkill);
                setNewSkill('');
              }
            }}
            placeholder="Add custom skill..."
            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => {
              if (newSkill.trim()) {
                addSkill(newSkill);
                setNewSkill('');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            <FiPlus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Required Equipment */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <FiTool className="inline h-4 w-4 mr-2" />
          Required Equipment
        </label>
        
        {/* Equipment List */}
        {teamConfig.requiredEquipment.length > 0 && (
          <div className="space-y-2 mb-3">
            {teamConfig.requiredEquipment.map((eq, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <FiTool className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{eq.equipment}</p>
                    <p className="text-sm text-gray-600">Quantity: {eq.quantity}</p>
                  </div>
                  {eq.critical && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      Critical
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeEquipment(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Equipment */}
        <div className="grid grid-cols-12 gap-2">
          <input
            type="text"
            value={newEquipment.equipment}
            onChange={(e) => setNewEquipment({ ...newEquipment, equipment: e.target.value })}
            placeholder="Equipment name"
            className="col-span-6 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="number"
            min="1"
            value={newEquipment.quantity}
            onChange={(e) => setNewEquipment({ ...newEquipment, quantity: parseInt(e.target.value) })}
            className="col-span-2 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <label className="col-span-3 flex items-center space-x-2 px-3 py-2 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={newEquipment.critical}
              onChange={(e) => setNewEquipment({ ...newEquipment, critical: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Critical</span>
          </label>
          <button
            onClick={addEquipment}
            className="col-span-1 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            <FiPlus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Required Materials */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <FiPackage className="inline h-4 w-4 mr-2" />
          Required Materials
        </label>
        
        {/* Materials List */}
        {teamConfig.requiredMaterials.length > 0 && (
          <div className="space-y-2 mb-3">
            {teamConfig.requiredMaterials.map((mat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <FiPackage className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{mat.material}</p>
                    <p className="text-sm text-gray-600">
                      {mat.quantity} {mat.unit}
                      {mat.estimated && <span className="text-yellow-600 ml-2">(Estimated)</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeMaterial(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Material */}
        <div className="grid grid-cols-12 gap-2">
          <input
            type="text"
            value={newMaterial.material}
            onChange={(e) => setNewMaterial({ ...newMaterial, material: e.target.value })}
            placeholder="Material name"
            className="col-span-6 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="number"
            min="1"
            value={newMaterial.quantity}
            onChange={(e) => setNewMaterial({ ...newMaterial, quantity: parseInt(e.target.value) })}
            className="col-span-2 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={newMaterial.unit}
            onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
            className="col-span-3 px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="kg">kg</option>
            <option value="liters">liters</option>
            <option value="meters">meters</option>
            <option value="pieces">pieces</option>
            <option value="bags">bags</option>
          </select>
          <button
            onClick={addMaterial}
            className="col-span-1 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            <FiPlus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Estimated Budget */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <FiDollarSign className="inline h-4 w-4 mr-2" />
          Estimated Budget
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
            $
          </span>
          <input
            type="number"
            min="0"
            step="100"
            value={teamConfig.estimatedBudget}
            onChange={(e) => setTeamConfig({ ...teamConfig, estimatedBudget: parseInt(e.target.value) || 0 })}
            className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
            placeholder="0"
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <FiAlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-1">Resource Planning Tips</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Mark critical equipment to ensure availability</li>
              <li>• Material quantities are estimates and can be adjusted</li>
              <li>• Budget helps with resource allocation and approval</li>
              <li>• Required skills help match the right team members</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StepResourcePlanning;
