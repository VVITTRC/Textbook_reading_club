import { useState, useEffect } from 'react';
import { getUserCohorts, getCohorts, addCohortMember } from '../services/api';

function CohortSelection({ userId, onCohortSelected, onLogout }) {
    const [userCohorts, setUserCohorts] = useState([]);
    const [allCohorts, setAllCohorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(null);
    const username = localStorage.getItem('username') || 'User';

    useEffect(() => {
        loadCohorts();
    }, [userId]);

    const loadCohorts = async () => {
        try {
            const [userCohortsRes, allCohortsRes] = await Promise.all([
                getUserCohorts(userId),
                getCohorts()
            ]);
            setUserCohorts(userCohortsRes.data);
            setAllCohorts(allCohortsRes.data);
        } catch (error) {
            console.error('Error loading cohorts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinCohort = async (cohortId) => {
        setJoining(cohortId);
        try {
            await addCohortMember({ user_id: userId, cohort_id: cohortId });
            await loadCohorts();
            alert('Successfully joined the cohort!');
        } catch (error) {
            console.error('Error joining cohort:', error);
            alert('Failed to join cohort. You may already be a member.');
        } finally {
            setJoining(null);
        }
    };

    const handleSelectCohort = (cohort) => {
        onCohortSelected(cohort);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading cohorts...</div>
            </div>
        );
    }

    const userCohortIds = userCohorts.map(c => c.id);
    const availableCohorts = allCohorts.filter(c => !userCohortIds.includes(c.id));

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">VVIT TR Club</h1>
                            <p className="text-sm text-gray-600">Welcome back, {username}!</p>
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
                {/* My Cohorts */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">My Reading Groups</h2>
                    {userCohorts.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <p className="text-gray-500">You haven't joined any reading groups yet.</p>
                            <p className="text-gray-400 text-sm mt-2">Browse available groups below to get started!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {userCohorts.map((cohort) => (
                                <div
                                    key={cohort.id}
                                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
                                    onClick={() => handleSelectCohort(cohort)}
                                >
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                                        <h3 className="text-xl font-bold mb-2">{cohort.name}</h3>
                                        <p className="text-blue-100 text-sm">Click to enter</p>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-gray-600 text-sm mb-4">
                                            {cohort.description || 'No description available'}
                                        </p>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                            {cohort.pdf_filename || 'No PDF uploaded yet'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Cohorts */}
                {availableCohorts.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Join New Reading Groups</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {availableCohorts.map((cohort) => (
                                <div
                                    key={cohort.id}
                                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                                >
                                    <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-6 text-white">
                                        <h3 className="text-xl font-bold mb-2">{cohort.name}</h3>
                                        <p className="text-gray-200 text-sm">Available to join</p>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-gray-600 text-sm mb-4">
                                            {cohort.description || 'No description available'}
                                        </p>
                                        <button
                                            onClick={() => handleJoinCohort(cohort.id)}
                                            disabled={joining === cohort.id}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                                        >
                                            {joining === cohort.id ? 'Joining...' : 'Join Group'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CohortSelection;