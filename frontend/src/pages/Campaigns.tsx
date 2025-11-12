import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignsApi } from '../api/campaigns';
import { Campaign } from '../types';
import toast from 'react-hot-toast';
import { Plus, Send, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await campaignsApi.getAll({ limit: 100 });
      setCampaigns(data.campaigns);
    } catch (error) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm('Are you sure you want to send this campaign?')) return;
    try {
      await campaignsApi.send(id);
      toast.success('Campaign is being sent');
      loadCampaigns();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send campaign');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await campaignsApi.delete(id);
      toast.success('Campaign deleted');
      loadCampaigns();
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <button
          onClick={() => navigate('/campaigns/new')}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus size={20} />
          New Campaign
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td className="px-6 py-4 font-medium">{campaign.name}</td>
                <td className="px-6 py-4">{campaign.subject}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    campaign.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'SENDING' ? 'bg-blue-100 text-blue-800' :
                    campaign.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {format(new Date(campaign.createdAt), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View analytics"
                    >
                      <Eye size={18} />
                    </button>
                    {campaign.status === 'DRAFT' && (
                      <button
                        onClick={() => handleSend(campaign.id)}
                        className="text-green-600 hover:text-green-800"
                        title="Send campaign"
                      >
                        <Send size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete campaign"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
