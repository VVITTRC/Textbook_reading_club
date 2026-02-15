import { useState, useEffect } from 'react';
import {
    getAdminStats,
    getCohorts,
    createCohort,
    uploadCohortPdf,
    getCohortMembers,
    getCohortActivity,
} from '../services/api';

function AdminDashboard({ userId, onLogout }) {
    const [stats, setStats] = useState(null);
    const [cohorts, setCohorts] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCohort, setNewCohort] = useState({ name: '', description: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [selectedCohort, setSelectedCohort] = useState(null);
    const [cohortDetails, setCohortDetails] = useState(null);

    const username = localStorage.getItem('username') || 'Admin';

    useEffect(() => {
        loadDashboardData();
    }, [userId]);

    const loadDashboardData = async () => {
        try {
            const [statsRes, cohortsRes] = await Promise.all([
                getAdminStats(userId),
                getCohorts(),
            ]);
            setStats(statsRes.data);
            setCohorts(cohortsRes.data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            alert('Failed to load admin dashboard. You may not have admin privileges.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCohort = async () => {
        if (!newCohort.name.trim()) {
            alert('Please enter a cohort name');
            return;
        }

        setCreating(true);
        try {
            // Create cohort
            const cohortRes = await createCohort({
                name: newCohort.name,
                description: newCohort.description,
                created_by: userId,
            });

            // Upload PDF if selected
            if (selectedFile) {
                await uploadCohortPdf(cohortRes.data.id, selectedFile);
            }

            alert('Cohort created successfully!');
            setShowCreateModal(false);
            setNewCohort({ name: '', description: '' });
            setSelectedFile(null);
            await loadDashboardData();
        } catch (error) {
            console.error('Error creating cohort:', error);
            alert('Failed to create cohort. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const handleViewCohort = async (cohort) => {
        setSelectedCohort(cohort);
        try {
            const [membersRes, activityRes] = await Promise.all([
                getCohortMembers(cohort.id),
                getCohortActivity(cohort.id, userId),
            ]);
            setCohortDetails({
                members: membersRes.data,
                activity: activityRes.data,
            });
        } catch (error) {
            console.error('Error loading cohort details:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-gray-500">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b-4 border-blue-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">🛡️ Admin Dashboard</h1>
                            <p className="text-sm text-gray-600 mt-1">VVIT TR Club - Welcome, {username}!</p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                                <p className="text-3xl font-bold mt-2">{stats?.total_users || 0}</p>
                            </div>
                            <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Total Cohorts</p>
                                <p className="text-3xl font-bold mt-2">{stats?.total_cohorts || 0}</p>
                            </div>
                            <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-100 text-sm font-medium">Total Notes</p>
                                <p className="text-3xl font-bold mt-2">{stats?.total_notes || 0}</p>
                            </div>
                            <div className="bg-yellow-400 bg-opacity-30 rounded-full p-3">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Total Messages</p>
                                <p className="text-3xl font-bold mt-2">{stats?.total_messages || 0}</p>
                            </div>
                            <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Create Cohort Button */}
                <div className="mb-8">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create New Cohort
                    </button>
                </div>

                {/* Cohorts List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">All Cohorts</h2>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {cohorts.length === 0 ? (
                            <div className="px-6 py-8 text-center text-gray-500">
                                No cohorts created yet. Create your first cohort to get started!
                            </div>
                        ) : (
                            cohorts.map((cohort) => (
                                <div
                                    key={cohort.id}
                                    className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => handleViewCohort(cohort)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900">{cohort.name}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{cohort.description || 'No description'}</p>
                                            <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                    {cohort.pdf_filename || 'No PDF'}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${cohort.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {cohort.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Create Cohort Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Cohort</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cohort Name *
                                </label>
                                <input
                                    type="text"
                                    value={newCohort.name}
                                    onChange={(e) => setNewCohort({ ...newCohort, name: e.target.value })}
                                    placeholder="e.g., Machine Learning Spring 2024"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newCohort.description}
                                    onChange={(e) => setNewCohort({ ...newCohort, description: e.target.value })}
                                    placeholder="Brief description of the reading group..."
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload PDF (Optional)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {selectedFile && (
                                    <p className="text-sm text-gray-600 mt-2">Selected: {selectedFile.name}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={handleCreateCohort}
                                disabled={creating}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                            >
                                {creating ? 'Creating...' : 'Create Cohort'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewCohort({ name: '', description: '' });
                                    setSelectedFile(null);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cohort Details Modal */}
            {selectedCohort && cohortDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">{selectedCohort.name}</h2>
                            <button
                                onClick={() => {
                                    setSelectedCohort(null);
                                    setCohortDetails(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Activity Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-600">{cohortDetails.activity.members}</p>
                                    <p className="text-sm text-gray-600">Members</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-green-600">{cohortDetails.activity.notes}</p>
                                    <p className="text-sm text-gray-600">Notes</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-purple-600">{cohortDetails.activity.messages}</p>
                                    <p className="text-sm text-gray-600">Messages</p>
                                </div>
                            </div>

                            {/* Members List */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Members</h3>
                                <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                                    {cohortDetails.members.length === 0 ? (
                                        <p className="px-4 py-3 text-gray-500 text-center">No members yet</p>
                                    ) : (
                                        cohortDetails.members.map((member) => (
                                            <div key={member.id} className="px-4 py-3 flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">{member.username}</p>
                                                    <p className="text-sm text-gray-500">{member.email}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${member.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {member.role}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;