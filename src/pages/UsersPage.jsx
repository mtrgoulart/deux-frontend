import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import { TableSkeleton } from '../components/TableSkeleton';
import { UserEditModal } from '../components/UserEditModal';

function UsersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const tableHeaders = ["ID", "Username", "Email", "Group", "Actions"];

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiFetch('/admin/users');
      const json = await res.json();
      return json.users || [];
    },
  });
  
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => apiFetch(`/admin/users/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
    },
    onError: (error) => {
        console.error("Error deleting user:", error);
    }
  });

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action is irreversible.')) {
      deleteUserMutation.mutate(userId);
    }
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  }

  return (
    <div className="p-4 text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}>
          User Management
        </h2>
      </div>

      {isLoading ? <TableSkeleton rows={5} headers={tableHeaders} /> : (
        <div className="overflow-x-auto bg-black/50 rounded-lg border border-gray-800">
          <table className="min-w-full table-auto">
            <thead className='border-b border-red-500/30'>
              <tr className="text-left text-sm font-semibold text-gray-400 uppercase tracking-wider">
                {tableHeaders.map(header => <th key={header} className="px-6 py-4">{header}</th>)}
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {users && users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-800/50 hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{user.id}</td>
                    <td className="px-6 py-4">{user.username}</td>
                    <td className="px-6 py-4 text-gray-400">{user.email || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full
                        ${user.group === 'Admin' ? 'bg-red-500/30 text-red-300' : 'bg-sky-500/20 text-sky-300'}`
                      }>
                        {user.group}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <button onClick={() => handleEdit(user)} className="text-gray-400 hover:text-white transition-colors">
                          {/* Ícone de Edição alterado */}
                          <img src="/icons/config.svg" alt="Edit" className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                          {/* Ícone de Lixeira alterado */}
                          <img src="/icons/trash.svg" alt="Delete" className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-gray-800/50">
                  <td colSpan={tableHeaders.length} className="text-center py-10 text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {isModalOpen && (
        <UserEditModal 
            user={editingUser}
            onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default UsersPage;
