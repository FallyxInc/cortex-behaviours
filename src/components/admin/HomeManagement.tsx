'use client';

import { useState, useEffect } from 'react';

export default function HomeManagement() {
  const [homes, setHomes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHomes();
  }, []);

  const fetchHomes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/admin/homes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setHomes(data.homes || []);
      } else {
        setError(data.error || 'Failed to fetch homes');
      }
    } catch (err) {
      console.error('Error fetching homes:', err);
      setError('Failed to fetch homes');
    } finally {
      setLoading(false);
    }
  };

  if (loading && homes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Home Management</h3>
          <p className="mt-2 text-sm text-gray-600">
            View all behaviour-enabled homes
          </p>
        </div>
        <button
          onClick={fetchHomes}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Home Name
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {homes.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                      No behaviour-enabled homes found
                    </td>
                  </tr>
                ) : (
                  homes.map((home, index) => (
                    <tr key={home} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {home}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {homes.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Total Homes:</span> {homes.length}
          </div>
        </div>
      )}
    </div>
  );
}

