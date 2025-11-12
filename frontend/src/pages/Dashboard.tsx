import { useEffect, useState } from 'react';
import { analyticsApi } from '../api/analytics';
import { DashboardAnalytics } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Mail, Users, MousePointerClick, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await analyticsApi.getDashboard();
      setData(result);
    } catch (error) {
      console.error('Failed to load dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Campaigns</p>
              <p className="text-3xl font-bold mt-2">{data.summary.totalCampaigns}</p>
            </div>
            <Mail className="text-primary-600" size={40} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Contacts</p>
              <p className="text-3xl font-bold mt-2">{data.summary.totalContacts}</p>
            </div>
            <Users className="text-green-600" size={40} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Open Rate</p>
              <p className="text-3xl font-bold mt-2">{data.summary.openRate}%</p>
            </div>
            <TrendingUp className="text-blue-600" size={40} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Click Rate</p>
              <p className="text-3xl font-bold mt-2">{data.summary.clickRate}%</p>
            </div>
            <MousePointerClick className="text-purple-600" size={40} />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Engagement Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.engagementOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="opens" stroke="#3b82f6" name="Opens" />
            <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" name="Clicks" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Recent Campaigns</h2>
          <div className="space-y-3">
            {data.recentCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{campaign.name}</p>
                  <p className="text-sm text-gray-600">{campaign.recipientsCount} recipients</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  campaign.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'SENDING' ? 'bg-blue-100 text-blue-800' :
                  campaign.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-4">Top Engaged Contacts</h2>
          <div className="space-y-3">
            {data.topContacts.map((contact) => (
              <div key={contact.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{contact.name || contact.email}</p>
                  <p className="text-sm text-gray-600">{contact.email}</p>
                </div>
                <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {contact.eventCount} events
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
