"use client";

import { useState } from "react";
import { User } from "@prisma/client";

type AdminStats = {
  totalUsers: number;
  newUsersToday: number;
  activeUsers: number;
};

export default function AdminDashboard() {
  // In a real app, these would come from API
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 156,
    newUsersToday: 12,
    activeUsers: 48,
  });
  
  const [recentUsers, setRecentUsers] = useState<Partial<User>[]>([
    { id: "1", name: "John Doe", email: "john@example.com", role: "USER" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "USER" },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "ADMIN" },
    { id: "4", name: "Alice Brown", email: "alice@example.com", role: "USER" },
    { id: "5", name: "Charlie Wilson", email: "charlie@example.com", role: "USER" },
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase">Total Users</h2>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalUsers}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase">New Users Today</h2>
          <p className="mt-2 text-3xl font-semibold text-green-600">{stats.newUsersToday}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm font-medium uppercase">Active Users</h2>
          <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.activeUsers}</p>
        </div>
      </div>
      
      {/* Recent Users */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            Add New User
          </button>
          <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
            Export Users
          </button>
          <button className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700">
            Send Announcement
          </button>
        </div>
      </div>
    </div>
  );
}