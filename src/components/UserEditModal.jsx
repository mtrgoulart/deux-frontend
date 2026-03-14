import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';

function formatWalletAddress(addr) {
  if (!addr) return 'Not linked';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export function UserEditModal({ user, onClose }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    group_id: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || user.username || '',
        email: user.email || '',
        group_id: user.group === 'Admin' ? 1 : (user.group === 'Guest' ? 3 : 2),
      });
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: (updatedUser) => apiFetch(`/admin/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      onClose();
    },
    onError: async (error) => {
    const errorData = await error.response.json();
    setError(errorData.error || 'Failed to update user.');
  }
});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
        display_name: formData.display_name,
        email: formData.email,
        group_id: parseInt(formData.group_id, 10),
    };

    updateUserMutation.mutate(payload);
  };

  const availableGroups = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'User' },
    { id: 3, name: 'Guest' },
  ];

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-fast">
      <div className="bg-gray-900 border border-red-500/30 rounded-lg shadow-xl p-8 w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-6">Edit User: <span className="text-red-400">{user.display_name || user.username}</span></h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Wallet Address</label>
            <div className="w-full bg-gray-800/50 border border-gray-700 rounded-md p-2 text-gray-400 font-mono text-sm">
              {formatWalletAddress(user.wallet_address)}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            />
          </div>

          <div>
            <label htmlFor="group_id" className="block text-sm font-medium text-gray-400 mb-2">Group</label>
            <select
              id="group_id"
              name="group_id"
              value={formData.group_id}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              required
            >
              {availableGroups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 font-semibold text-gray-400 bg-transparent border-2 border-gray-700 rounded-md hover:bg-gray-800 hover:border-gray-700 hover:text-white transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateUserMutation.isLoading}
              className="py-2 px-5 font-semibold text-white bg-red-600 border-2 border-red-600 rounded-md hover:bg-red-700 hover:border-red-700 transition-all duration-300 disabled:opacity-50"
            >
              {updateUserMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
