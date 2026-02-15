import { useState, useEffect } from 'react';
import PdfViewer from '../components/PdfViewer';
import Sidebar from '../components/Sidebar';

function Reader({ userId, cohort, onBack, onLogout }) {
    const [currentPage, setCurrentPage] = useState(1);
    const username = localStorage.getItem('username') || 'User';

    // Fix PDF URL construction - handle various path formats
    let pdfUrl = null;

    if (cohort.pdf_path) {
        // Extract filename from path
        const filename = cohort.pdf_path.includes('\\')
            ? cohort.pdf_path.split('\\').pop()
            : cohort.pdf_path.split('/').pop();

        pdfUrl = `http://localhost:8000/uploads/${filename}`;
    }

    console.log('Cohort:', cohort);
    console.log('PDF Path from DB:', cohort.pdf_path);
    console.log('Constructed PDF URL:', pdfUrl);

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold">VVIT TR Club</h1>
                            <p className="text-sm text-blue-100">{cohort.name} • {username}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Split Screen Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: PDF Viewer or Empty State */}
                <div className="flex-1 overflow-hidden">
                    {pdfUrl ? (
                        <PdfViewer pdfUrl={pdfUrl} onPageChange={setCurrentPage} />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <div className="text-center p-8 max-w-md">
                                <div className="bg-blue-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                    <svg
                                        className="w-12 h-12 text-blue-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">No PDF Yet</h3>
                                <p className="text-gray-600 mb-4">
                                    The admin hasn't uploaded a textbook for this cohort yet.
                                </p>
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4 text-left">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Meanwhile:</strong> You can still use the sidebar to take notes and chat with your group!
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Sidebar */}
                <div className="w-96 overflow-hidden">
                    <Sidebar cohortId={cohort.id} userId={userId} currentPage={currentPage} />
                </div>
            </div>
        </div>
    );
}

export default Reader;