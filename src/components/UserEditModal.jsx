import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';

export function UserEditModal({ user, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    username: '',
    email: '', // Campo de e-mail adicionado
    group_id: '',
    password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '', // Campo de e-mail adicionado
        group_id: user.group === 'Admin' ? 1 : (user.group === 'Guest' ? 3 : 2),
        password: '',
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
    onError: (error) => {
      console.error("Failed to update user:", error);
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
        username: formData.username,
        email: formData.email, // Campo de e-mail adicionado ao payload
        group_id: parseInt(formData.group_id, 10),
    };

    if (formData.password) {
        payload.password = formData.password;
    }

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
        <h2 className="text-2xl font-bold mb-6">Edit User: <span className="text-red-400">{user.username}</span></h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-2">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              required
            />
          </div>

          {/* Campo de E-mail Adicionado */}
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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">New Password <span className="text-xs">(optional)</span></label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Leave blank to keep current password"
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            />
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
