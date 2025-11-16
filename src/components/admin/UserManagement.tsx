'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  username?: string | null;
  email?: string | null;
  role: string;
  loginCount?: number;
  createdAt?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [homes, setHomes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRoleOptions, setShowRoleOptions] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchHomes();
  }, []);

  const fetchHomes = async () => {
    try {
      const response = await fetch('/api/admin/homes');
      const data = await response.json();
      
      if (data.success) {
        setHomes(data.homes || []);
      }
    } catch (error) {
      console.error('Error fetching homes:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
      } else {
        showMessage('Failed to fetch users', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setMessage('');

    try {
      if (formData.password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
      }

      if (!formData.role) {
        showMessage('Please select a role', 'error');
        return;
      }

      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('User created successfully!', 'success');
        setFormData({ username: '', password: '', role: '' });
        setShowForm(false);
        fetchUsers();
      } else {
        showMessage(data.error || 'Failed to create user', 'error');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showMessage('Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('User role updated successfully!', 'success');
        fetchUsers();
      } else {
        showMessage(data.error || 'Failed to update user role', 'error');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      showMessage('Failed to update user role', 'error');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('User deleted successfully!', 'success');
        fetchUsers();
      } else {
        showMessage(data.error || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showMessage('Failed to delete user', 'error');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const availableRoles = ['admin', ...homes];

  function userCreateForm() {
    return (
    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
    <h4 className="text-lg font-medium text-gray-900 mb-4">Add New User</h4>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          type="text"
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter username"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Email will be: {formData.username || 'username'}@example.com
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter password (minimum 6 characters)"
          required
          minLength={6}
        />
        {formData.password.length > 0 && formData.password.length < 6 && (
          <p className="mt-1 text-xs text-red-600">
            Password must be at least 6 characters
          </p>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowRoleOptions(true)}
              className="text-xs text-black  bg-gray-200 px-2 py-1 rounded-md"
              style={{
                backgroundColor: showRoleOptions ? '#0cc7ed' : '#d1d5db',
              }}
            >
              Select Existing
            </button>

            <button
              type="button"
              onClick={() => setShowRoleOptions(false)}
              className="text-xs text-black bg-gray-200 px-2 py-1 rounded-md"
              style={{
                backgroundColor: !showRoleOptions ? '#0cc7ed' : '#d1d5db',
              }}
            >
              Create New
            </button>
          </div>
        </div>
        {showRoleOptions ? (
          <select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a role</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
            placeholder="Enter new role"
          />
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setFormData({ username: '', password: '', role: '' });
          }}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || formData.password.length < 6 || !formData.role}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating...' : 'Create User'}
        </button>
      </div>
    </form>
  </div>)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">User Management</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Add New User
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          messageType === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
        }`}>
          {message}
        </div>
      )}

      {showForm && userCreateForm()}

      <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Users</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Login Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.username || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email || 'N/A'}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        {availableRoles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.loginCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {users.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Total Users:</span> {users.length}
          </div>
        </div>
      )}
    </div>
  );
}

