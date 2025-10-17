import { useAuth } from "@getmocha/users-service/react";
import { useState, useEffect } from "react";
import { Plus, Zap, Mail, MessageCircle, Play, Pause, Edit, Trash2 } from "lucide-react";
import Navbar from "@/react-app/components/Navbar";
import EmptyState from "@/react-app/components/EmptyState";
import type { Campaign, Template } from "@/shared/types";

interface CampaignWithTemplate extends Campaign {
  template_name?: string;
}

export default function Campaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignWithTemplate[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    inactive_days: 7,
    channel: 'email' as 'email' | 'discord',
    template_id: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCampaigns();
      fetchTemplates();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const result = await response.json();
      
      if (result.success) {
        setCampaigns(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const result = await response.json();
      
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingCampaign ? `/api/campaigns/${editingCampaign.id}` : '/api/campaigns';
      const method = editingCampaign ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          template_id: parseInt(formData.template_id)
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchCampaigns();
        resetForm();
      } else {
        console.error('Failed to save campaign:', result.error);
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      inactive_days: 7,
      channel: 'email',
      template_id: '',
      is_active: true
    });
    setShowForm(false);
    setEditingCampaign(null);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      inactive_days: campaign.inactive_days,
      channel: campaign.channel,
      template_id: campaign.template_id.toString(),
      is_active: campaign.is_active
    });
    setShowForm(true);
  };

  const toggleCampaignStatus = async (campaign: Campaign) => {
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !campaign.is_active
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchCampaigns();
      }
    } catch (error) {
      console.error('Error toggling campaign status:', error);
    }
  };

  const availableTemplates = templates.filter(t => 
    formData.channel ? t.channel === formData.channel : true
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to manage campaigns.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Retention Campaigns</h1>
            <p className="text-gray-600 mt-1">Create automated campaigns to re-engage inactive members</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-shadow"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 7-Day Inactive Outreach"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inactive Days Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.inactive_days}
                    onChange={(e) => setFormData({ ...formData, inactive_days: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="7"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Target members inactive for this many days or more
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel
                  </label>
                  <select
                    value={formData.channel}
                    onChange={(e) => {
                      const newChannel = e.target.value as 'email' | 'discord';
                      setFormData({ 
                        ...formData, 
                        channel: newChannel,
                        template_id: '' // Reset template selection when channel changes
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="email">Email</option>
                    <option value="discord">Discord</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Template
                  </label>
                  <select
                    required
                    value={formData.template_id}
                    onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a template...</option>
                    {availableTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {availableTemplates.length === 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      No templates available for {formData.channel}. Create one first.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Activate campaign immediately
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={saving || availableTemplates.length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No campaigns yet."
            subtitle="Once you create one, RetainPing will automatically reach inactive members."
            buttonText="+ New Campaign"
            onButtonClick={() => setShowForm(true)}
            gradient="from-purple-100 to-pink-100"
          />
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-3 rounded-lg ${
                      campaign.channel === 'email' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {campaign.channel === 'email' ? (
                        <Mail className="w-6 h-6 text-blue-600" />
                      ) : (
                        <MessageCircle className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{campaign.name}</h3>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            campaign.is_active ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            campaign.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {campaign.is_active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Target:</strong> Members inactive for {campaign.inactive_days}+ days
                        </p>
                        <p>
                          <strong>Channel:</strong> {campaign.channel}
                        </p>
                        <p>
                          <strong>Template:</strong> {campaign.template_name || 'Unknown template'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleCampaignStatus(campaign)}
                      className={`p-2 transition-colors ${
                        campaign.is_active 
                          ? 'text-orange-600 hover:text-orange-700' 
                          : 'text-green-600 hover:text-green-700'
                      }`}
                      title={campaign.is_active ? 'Pause campaign' : 'Activate campaign'}
                    >
                      {campaign.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(campaign)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit campaign"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {templates.length === 0 && campaigns.length === 0 && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-blue-800">
              <strong>Tip:</strong> Create message templates first, then you can use them in your campaigns.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
