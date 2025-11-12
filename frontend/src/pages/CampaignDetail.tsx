import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { analyticsApi } from '../api/analytics';
import { CampaignAnalytics } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const result = await analyticsApi.getCampaign(id!);
      setData(result);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await analyticsApi.exportCampaign(id!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-${id}-report.csv`;
      a.click();
      toast.success('Report exported');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{data.campaign.name}</h1>
          <p className="text-gray-600 mt-1">Campaign Analytics</p>
        </div>
        <button onClick={handleExport} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2">
          <Download size={20} />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Sent</p>
          <p className="text-2xl font-bold mt-1">{data.metrics.sent}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Opens</p>
          <p className="text-2xl font-bold mt-1">{data.metrics.uniqueOpens}</p>
          <p className="text-sm text-green-600">{data.metrics.openRate}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Clicks</p>
          <p className="text-2xl font-bold mt-1">{data.metrics.uniqueClicks}</p>
          <p className="text-sm text-blue-600">{data.metrics.clickRate}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Bounce Rate</p>
          <p className="text-2xl font-bold mt-1">{data.metrics.bounceRate}%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Engagement Timeline</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.engagementTimeline}>
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
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Opens by Hour</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.opensByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Devices</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.deviceStats} dataKey="count" nameKey="device" cx="50%" cy="50%" outerRadius={80} label>
                {data.deviceStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Top Countries</h2>
          <div className="space-y-2">
            {data.countryStats.slice(0, 5).map((stat) => (
              <div key={stat.country} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{stat.country}</span>
                <span className="font-semibold">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Most Clicked Links</h2>
          <div className="space-y-2">
            {data.clickedLinks.slice(0, 5).map((link, i) => (
              <div key={i} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                <span className="text-sm truncate flex-1">{link.url}</span>
                <span className="font-semibold ml-2">{link.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
